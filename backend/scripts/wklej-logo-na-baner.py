"""
Wkleja logo gry w pas z tytulem.

Pas (`res/ui/baner.png`, 1280x100) wychodzi z pliku SWF razem z JUZ
NAMALOWANYM logo — to nie jest osobna warstwa, tylko czesc obrazu. Zeby
podmienic tytul, trzeba wiec nowe logo NALOZYC na stare; wymazac starego
nie da sie, bo pod nim jest krajobraz, ktorego nikt nigdzie nie zapisal.

Stare logo zajmuje na pasie prostokat ZMIERZONY na obrazie: zlote piksele
ramki siegaja od x = 412 do x = 858 i od y = 3 do y = 83. Nowe logo idzie
wiec na te sama szerokosc (447 px). Wysokosc wychodzi z jego wlasnych
proporcji i jest wieksza niz 81 px starego — inaczej nie przykryloby go
w calosci. Przy szerokosci 447 wypada rowno 100 px, czyli dokladnie
wysokosc pasa.

WYNIK MA NOWA NAZWE. Wdrozenie oddaje `/res/*` z naglowkiem
`max-age=31536000, immutable`, wiec podmieniona zawartosc pod stara nazwa
nie doszlaby do nikogo, kto raz otworzyl gre.

Uruchomienie:
    python3 scripts/wklej-logo-na-baner.py
"""

import os
import sys

from PIL import Image

TU = os.path.dirname(os.path.abspath(__file__))
KORZEN = os.path.dirname(os.path.dirname(TU))

PAS = os.path.join(KORZEN, 'sf555', 'res', 'ui', 'baner.png')
LOGO = os.path.join(TU, '..', 'assets', 'logo-gry.png')
WYNIK = os.path.join(KORZEN, 'sf555', 'res', 'ui', 'baner-lorein.png')

# Zmierzone na `baner.png`: zasieg zlotych pikseli starego logo.
STARE_LOGO_X = 412
STARE_LOGO_SZEROKOSC = 447

# Ponizej tej wartosci piksel logo uznajemy za przezroczysty. Samo
# `getbbox()` liczy nawet ledwie widoczna poswiate i daje ramke o kilka
# procent za duza.
PROG_ALFY = 32


def tresc(obraz):
    """Prostokat, w ktorym logo naprawde cos ma — bez przezroczystych marginesow."""
    piksele = obraz.load()
    szerokosc, wysokosc = obraz.size

    lewo, gora = szerokosc, wysokosc
    prawo, dol = 0, 0

    for y in range(wysokosc):
        for x in range(szerokosc):
            if piksele[x, y][3] <= PROG_ALFY:
                continue
            lewo = min(lewo, x)
            prawo = max(prawo, x)
            gora = min(gora, y)
            dol = max(dol, y)

    if prawo < lewo:
        raise SystemExit('logo jest calkiem przezroczyste')

    return obraz.crop((lewo, gora, prawo + 1, dol + 1))


def main():
    pas = Image.open(PAS).convert('RGBA')
    logo = tresc(Image.open(LOGO).convert('RGBA'))

    wysokosc = round(logo.height * STARE_LOGO_SZEROKOSC / logo.width)
    if wysokosc > pas.height:
        raise SystemExit(f'logo nie miesci sie w pasie: {wysokosc} > {pas.height}')

    # Do gory pasa, zeby dolna krawedz nie zjadla wiecej zlotej balustrady
    # niz musi. Stare logo i tak zaczynalo sie trzy piksele nizej.
    wynik = pas.copy()
    wynik.alpha_composite(
        logo.resize((STARE_LOGO_SZEROKOSC, wysokosc), Image.LANCZOS),
        (STARE_LOGO_X, 0),
    )
    wynik.save(WYNIK)

    print(f'{STARE_LOGO_SZEROKOSC}x{wysokosc} w punkcie ({STARE_LOGO_X}, 0) -> {WYNIK}')


if __name__ == '__main__':
    sys.exit(main())
