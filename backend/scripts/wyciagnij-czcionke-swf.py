"""
Wyciaga czcionke gry z pliku SWF i zapisuje jako WOFF do uzycia na stronie.

Gra jest napisana czcionka **Komika Text**, osadzona w pliku SWF jako
znacznik DefineFont3. Bez niej napisy nigdy nie beda wygladac jak
w oryginale — a to widac od razu, bo Komika ma charakterystyczny,
komiksowy krok.

SWF trzyma ksztalty liter jako wlasne "shape records": ciag krawedzi
prostych i kwadratowych krzywych Beziera, kodowanych bitowo. TrueType
uzywa dokladnie tych samych krzywych kwadratowych, wiec przeliczenie
jest wierne — nie ma tu zadnej utraty jakosci ani przyblizania.

Uruchomienie:
    python3 scripts/wyciagnij-czcionke-swf.py <plik.swf> <plik.woff>
"""

import struct
import sys
import zlib

from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen

# DefineFont3 opisuje glify na kwadracie 1024 jednostek, ale same
# wspolrzedne zapisuje w twipach — czyli 20 razy wiekszych liczbach.
# Bez podzielenia przez 20 litery wychodza dwudziestokrotnie za duze
# i strona pokazuje zolte klaksy zamiast napisow.
JEDNOSTKI_EM = 1024
SKALA_TWIPOW = 20


class CzytnikBitow:
    """SWF koduje ksztalty bitowo, bez wyrownania do bajtow."""

    def __init__(self, dane, poczatek=0):
        self.dane = dane
        self.bajt = poczatek
        self.bit = 0

    def bity(self, ile):
        wynik = 0
        for _ in range(ile):
            if self.bajt >= len(self.dane):
                return wynik
            b = (self.dane[self.bajt] >> (7 - self.bit)) & 1
            wynik = (wynik << 1) | b
            self.bit += 1
            if self.bit == 8:
                self.bit = 0
                self.bajt += 1
        return wynik

    def bity_ze_znakiem(self, ile):
        if ile == 0:
            return 0
        wartosc = self.bity(ile)
        if wartosc & (1 << (ile - 1)):
            wartosc -= 1 << ile
        return wartosc

    def wyrownaj(self):
        if self.bit:
            self.bit = 0
            self.bajt += 1


def czytaj_ksztalt(dane):
    """
    Zamienia zapis ksztaltu SWF na liste konturow.

    Kontur to lista punktow: ('m', x, y) poczatek, ('l', x, y) odcinek,
    ('q', kx, ky, x, y) krzywa kwadratowa z jednym punktem sterujacym.
    """
    c = CzytnikBitow(dane)
    bitow_wypelnienia = c.bity(4)
    bitow_linii = c.bity(4)

    kontury = []
    biezacy = []
    x = y = 0

    while True:
        typ = c.bity(1)

        if typ == 0:
            nowy_styl = c.bity(1)
            styl_linii = c.bity(1)
            wypelnienie1 = c.bity(1)
            wypelnienie0 = c.bity(1)
            przesuniecie = c.bity(1)

            if not (nowy_styl or styl_linii or wypelnienie1 or wypelnienie0 or przesuniecie):
                break  # koniec ksztaltu

            if przesuniecie:
                bitow = c.bity(5)
                x = c.bity_ze_znakiem(bitow)
                y = c.bity_ze_znakiem(bitow)
                if biezacy:
                    kontury.append(biezacy)
                biezacy = [('m', x, y)]

            if wypelnienie0:
                c.bity(bitow_wypelnienia)
            if wypelnienie1:
                c.bity(bitow_wypelnienia)
            if styl_linii:
                c.bity(bitow_linii)
            if nowy_styl:
                # Nowe style w srodku ksztaltu — dla czcionek sie nie zdarza.
                break
        else:
            prosta = c.bity(1)
            bitow = c.bity(4) + 2

            if prosta:
                ogolna = c.bity(1)
                if ogolna:
                    dx = c.bity_ze_znakiem(bitow)
                    dy = c.bity_ze_znakiem(bitow)
                else:
                    pionowo = c.bity(1)
                    if pionowo:
                        dx, dy = 0, c.bity_ze_znakiem(bitow)
                    else:
                        dx, dy = c.bity_ze_znakiem(bitow), 0
                x += dx
                y += dy
                if not biezacy:
                    biezacy = [('m', 0, 0)]
                biezacy.append(('l', x, y))
            else:
                kx = x + c.bity_ze_znakiem(bitow)
                ky = y + c.bity_ze_znakiem(bitow)
                x = kx + c.bity_ze_znakiem(bitow)
                y = ky + c.bity_ze_znakiem(bitow)
                if not biezacy:
                    biezacy = [('m', 0, 0)]
                biezacy.append(('q', kx, ky, x, y))

    if biezacy:
        kontury.append(biezacy)
    return kontury


def znaczniki(tresc, przesuniecie):
    while przesuniecie < len(tresc) - 1:
        (naglowek,) = struct.unpack('<H', tresc[przesuniecie:przesuniecie + 2])
        przesuniecie += 2
        kod = naglowek >> 6
        dlugosc = naglowek & 0x3F
        if dlugosc == 0x3F:
            (dlugosc,) = struct.unpack('<I', tresc[przesuniecie:przesuniecie + 4])
            przesuniecie += 4
        yield kod, tresc[przesuniecie:przesuniecie + dlugosc]
        przesuniecie += dlugosc
        if kod == 0:
            return


def main():
    if len(sys.argv) < 3:
        raise SystemExit(__doc__)

    plik_swf, plik_woff = sys.argv[1], sys.argv[2]

    dane = open(plik_swf, 'rb').read()
    tresc = zlib.decompress(dane[8:]) if dane[:3] == b'CWS' else dane[8:]
    nb = tresc[0] >> 3
    off = (5 + nb * 4 + 7) // 8 + 4

    najlepsza = None
    for kod, blok in znaczniki(tresc, off):
        if kod == 75 and len(blok) > 10_000:      # DefineFont3 z pelnym krojem
            if najlepsza is None or len(blok) > len(najlepsza):
                najlepsza = blok

    if najlepsza is None:
        raise SystemExit('nie znalazlem osadzonej czcionki w tym pliku SWF')

    glify, znaki, szerokosci, nazwa = rozbierz_czcionke(najlepsza)
    print(f'czcionka: {nazwa}, glifow: {len(glify)}, przypisanych znakow: {len(znaki)}')

    zbuduj_woff(glify, znaki, szerokosci, nazwa, plik_woff)
    print(f'zapisano {plik_woff}')


def rozbierz_czcionke(blok):
    (_nr,) = struct.unpack('<H', blok[:2])
    flagi = blok[2]
    szerokie_przesuniecia = bool(flagi & 0x08)   # FontFlagsWideOffsets
    ma_uklad = bool(flagi & 0x80)                # FontFlagsHasLayout

    dl_nazwy = blok[4]
    nazwa = blok[5:5 + dl_nazwy].decode('latin1').rstrip('\x00')
    poz = 5 + dl_nazwy

    (liczba_glifow,) = struct.unpack('<H', blok[poz:poz + 2])
    poz += 2

    rozmiar = 4 if szerokie_przesuniecia else 2
    format_ = '<I' if szerokie_przesuniecia else '<H'
    baza = poz

    przesuniecia = []
    for i in range(liczba_glifow + 1):
        (wartosc,) = struct.unpack(format_, blok[poz + i * rozmiar:poz + (i + 1) * rozmiar])
        przesuniecia.append(wartosc)

    glify = []
    for i in range(liczba_glifow):
        poczatek = baza + przesuniecia[i]
        koniec = baza + przesuniecia[i + 1]
        glify.append(czytaj_ksztalt(blok[poczatek:koniec]))

    # Tablica kodow znakow idzie zaraz za ksztaltami.
    poz = baza + przesuniecia[liczba_glifow]
    znaki = {}
    for i in range(liczba_glifow):
        (kod,) = struct.unpack('<H', blok[poz + i * 2:poz + (i + 1) * 2])
        if kod and kod not in znaki:
            znaki[kod] = i
    poz += liczba_glifow * 2

    szerokosci = [JEDNOSTKI_EM // 2] * liczba_glifow
    if ma_uklad:
        poz += 6   # wysokosci: ascender, descender, leading
        for i in range(liczba_glifow):
            (sz,) = struct.unpack('<h', blok[poz + i * 2:poz + (i + 1) * 2])
            szerokosci[i] = sz
        poz += liczba_glifow * 2

    return glify, znaki, szerokosci, nazwa


def zbuduj_woff(glify, znaki, szerokosci, nazwa, plik_woff):
    nazwy_glifow = ['.notdef'] + [f'g{i}' for i in range(len(glify))]

    budowniczy = FontBuilder(JEDNOSTKI_EM, isTTF=True)
    budowniczy.setupGlyphOrder(nazwy_glifow)
    budowniczy.setupCharacterMap({kod: f'g{nr}' for kod, nr in znaki.items()})

    def skala(wartosc):
        return round(wartosc / SKALA_TWIPOW)

    def skala_y(wartosc):
        # SWF liczy os Y w dol, TrueType w gore. Bez odwrocenia znaku
        # cala czcionka wychodzi postawiona na glowie.
        return -round(wartosc / SKALA_TWIPOW)

    ksztalty = {'.notdef': TTGlyphPen(None).glyph()}
    for i, kontury in enumerate(glify):
        pioro = TTGlyphPen(None)
        for kontur in kontury:
            if len(kontur) < 2:
                continue
            _, x0, y0 = kontur[0]
            pioro.moveTo((skala(x0), skala_y(y0)))
            for punkt in kontur[1:]:
                if punkt[0] == 'l':
                    pioro.lineTo((skala(punkt[1]), skala_y(punkt[2])))
                else:
                    pioro.qCurveTo(
                        (skala(punkt[1]), skala_y(punkt[2])),
                        (skala(punkt[3]), skala_y(punkt[4])),
                    )
            pioro.closePath()
        ksztalty[f'g{i}'] = pioro.glyph()

    budowniczy.setupGlyf(ksztalty)

    miary = {'.notdef': (JEDNOSTKI_EM // 2, 0)}
    for i, sz in enumerate(szerokosci):
        miary[f'g{i}'] = (max(0, skala(sz)), 0)
    budowniczy.setupHorizontalMetrics(miary)

    budowniczy.setupHorizontalHeader(ascent=int(JEDNOSTKI_EM * 0.8), descent=-int(JEDNOSTKI_EM * 0.2))
    budowniczy.setupNameTable({'familyName': nazwa, 'styleName': 'Regular', 'psName': nazwa.replace(' ', '')})
    budowniczy.setupOS2(sTypoAscender=int(JEDNOSTKI_EM * 0.8), sTypoDescender=-int(JEDNOSTKI_EM * 0.2))
    budowniczy.setupPost()

    budowniczy.font.flavor = 'woff'
    budowniczy.save(plik_woff)


if __name__ == '__main__':
    main()
