"""
Wyciaga grafike interfejsu z pliku SWF.

Ozdobna rama, przyciski menu, banery i ikony NIE leza w `res/` — sa
zaszyte w samym pliku gry jako bitmapy. Bez nich nowa wersja nie ma
z czego zbudowac wygladu oryginalu.

Plik SWF przechowuje obrazy w kilku formatach naraz:

  DefineBitsJPEG2/3/4 — JPEG, przy czym wersje 3 i 4 dokladaja osobny
                        kanal przezroczystosci spakowany zlibem,
  DefineBitsLossless2 — surowa bitmapa RGBA spakowana zlibem,
  DefineBits          — JPEG bez wlasnej tablicy Huffmana; tablica lezy
                        osobno w znaczniku JPEGTables.

Znacznik SymbolClass wiaze numery obiektow z nazwami klas
(`interface_dragon1_png`), wiec pliki wychodza z sensownymi nazwami
zamiast numerkow.

Uruchomienie:
    python3 scripts/wyciagnij-grafike-swf.py <plik.swf> <katalog wyjsciowy>
"""

import io
import os
import struct
import sys
import zlib

from PIL import Image


def wczytaj_swf(sciezka):
    dane = open(sciezka, 'rb').read()
    sygnatura = dane[:3]
    tresc = dane[8:]

    if sygnatura == b'CWS':
        tresc = zlib.decompress(tresc)
    elif sygnatura == b'ZWS':
        import lzma
        tresc = lzma.decompress(tresc[4:], format=lzma.FORMAT_ALONE)
    elif sygnatura != b'FWS':
        raise SystemExit(f'nieznana sygnatura pliku: {sygnatura!r}')

    # Naglowek: prostokat sceny, klatki na sekunde, liczba klatek.
    liczba_bitow = tresc[0] >> 3
    bity = 5 + liczba_bitow * 4
    przesuniecie = (bity + 7) // 8 + 4
    return tresc, przesuniecie


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


def napraw_jpeg(dane):
    """SWF potrafi wstawic przed obraz zbedna pare znacznikow konca i poczatku."""
    if dane[:4] == b'\xff\xd9\xff\xd8':
        return dane[4:]
    return dane


def z_alfa(obraz, spakowana_alfa, szerokosc, wysokosc):
    """Docina kanal przezroczystosci na obraz JPEG."""
    try:
        alfa = zlib.decompress(spakowana_alfa)
    except zlib.error:
        return obraz
    if len(alfa) < szerokosc * wysokosc:
        return obraz
    maska = Image.frombytes('L', (szerokosc, wysokosc), alfa[: szerokosc * wysokosc])
    wynik = obraz.convert('RGBA')
    wynik.putalpha(maska)
    return wynik


# Numery obiektow rozpoznane recznie — po obejrzeniu wszystkiego, co
# skrypt wyciagnal. To jest kompletna oprawa interfejsu z oryginalu.
NAZWANE = {
    69: 'baner',              # 1280x100 — pas z tytulem i glowami smokow
    63: 'panel-boczny',       # 280x700  — tlo menu, ozdobna ramka
    66: 'ramka',              # 1000x700 — ramka tresci, srodek przezroczysty
    72: 'okno',               # 520x380  — okno dialogowe
    204: 'guzik',             # 180x50   — przycisk menu, stan zwykly
    207: 'guzik-najazd',      # 180x50   — pod kursorem
    210: 'guzik-wylaczony',   # 180x50   — nieczynny
    142: 'guzik-maly',        # 174x45
    145: 'guzik-maly-najazd',
    88: 'pasek',              # 255x49   — szeroki pas z kamiennymi koncami
    92: 'pasek-najazd',
    45: 'smok1',              # glowy smokow — ozdoba przy przyciskach menu
    48: 'smok2',
    51: 'smok3',
    54: 'smok4',
    57: 'smok5',
    60: 'smok6',
    194: 'krazek',            # okragly guzik, stan zwykly
    197: 'krazek-najazd',
    199: 'krazek-wybrany',
    293: 'ptaszek',           # znacznik wyboru
    254: 'plus',              # przycisk dodawania punktu cechy
    256: 'plus-najazd',
    258: 'plus-wcisniety',
    183: 'tarcza-ikona',      # ikona pancerza przy prawej polowie ekranu
}


def main():
    if len(sys.argv) < 3:
        raise SystemExit(__doc__)

    plik_swf, katalog = sys.argv[1], sys.argv[2]
    tylko_nazwane = '--tylko-nazwane' in sys.argv
    os.makedirs(katalog, exist_ok=True)

    tresc, przesuniecie = wczytaj_swf(plik_swf)

    tablice_jpeg = b''
    obrazy = {}
    nazwy = {}

    for kod, dane in znaczniki(tresc, przesuniecie):
        if kod == 8:                                   # JPEGTables
            tablice_jpeg = napraw_jpeg(dane)

        elif kod == 6:                                 # DefineBits
            (nr,) = struct.unpack('<H', dane[:2])
            surowy = tablice_jpeg[:-2] + napraw_jpeg(dane[2:])[2:]
            obrazy[nr] = ('jpeg', surowy, None)

        elif kod == 21:                                # DefineBitsJPEG2
            (nr,) = struct.unpack('<H', dane[:2])
            obrazy[nr] = ('jpeg', napraw_jpeg(dane[2:]), None)

        elif kod in (35, 90):                           # DefineBitsJPEG3 / 4
            (nr, koniec_obrazu) = struct.unpack('<HI', dane[:6])
            poczatek = 6 if kod == 35 else 8            # wersja 4 ma jeszcze deblocking
            obraz = napraw_jpeg(dane[poczatek:poczatek + koniec_obrazu])
            obrazy[nr] = ('jpeg', obraz, dane[poczatek + koniec_obrazu:])

        elif kod in (20, 36):                           # DefineBitsLossless / 2
            (nr, format_, szer, wys) = struct.unpack('<HBHH', dane[:7])
            obrazy[nr] = ('lossless', (format_, szer, wys, dane[7:]), kod)

        elif kod == 76:                                # SymbolClass
            (ile,) = struct.unpack('<H', dane[:2])
            poz = 2
            for _ in range(ile):
                (nr,) = struct.unpack('<H', dane[poz:poz + 2])
                poz += 2
                koniec = dane.index(b'\x00', poz)
                nazwy[nr] = dane[poz:koniec].decode('latin1')
                poz = koniec + 1

    zapisane, bledy = 0, 0

    for nr, (rodzaj, ladunek, dodatek) in sorted(obrazy.items()):
        nazwa = NAZWANE.get(nr) or nazwy.get(nr) or f'obraz{nr}'
        nazwa = nazwa.replace('.', '_').replace('/', '_')

        if tylko_nazwane and nr not in NAZWANE:
            continue

        try:
            if rodzaj == 'jpeg':
                obraz = Image.open(io.BytesIO(ladunek))
                obraz.load()
                if dodatek:
                    obraz = z_alfa(obraz, dodatek, obraz.width, obraz.height)
            else:
                format_, szer, wys, spakowane = ladunek
                rozpakowane = zlib.decompress(spakowane)
                if format_ == 5:                       # RGBA, po 4 bajty
                    obraz = Image.frombytes('RGBA', (szer, wys), rozpakowane[: szer * wys * 4])
                    # SWF trzyma to jako ARGB — trzeba przestawic kanaly.
                    a, r, g, b = obraz.split()
                    obraz = Image.merge('RGBA', (r, g, b, a))
                elif format_ == 4:                     # RGB555, wiersze wyrownane do 4 bajtow
                    obraz = Image.frombytes('RGB', (szer, wys), rozpakowane, 'raw', 'BGR;15')
                else:
                    bledy += 1
                    continue
        except Exception as blad:                       # noqa: BLE001
            print(f'  pomijam {nazwa} (nr {nr}): {blad}')
            bledy += 1
            continue

        docelowy = os.path.join(katalog, f'{nazwa}.png')
        obraz.convert('RGBA').save(docelowy)
        zapisane += 1

    print(f'zapisano {zapisane} obrazow do {katalog}')
    if bledy:
        print(f'pominieto {bledy}')

    if tylko_nazwane:
        brakujace = [nr for nr in NAZWANE if nr not in obrazy]
        if brakujace:
            raise SystemExit(f'w tym pliku SWF brakuje obiektow: {brakujace}')


if __name__ == '__main__':
    main()
