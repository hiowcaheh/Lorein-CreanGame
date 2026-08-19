# Lorein — klient gry jako aplikacja webowa

Nowa wersja klienta. Bez Flasha, bez Ruffle, bez pliku SWF — zwykla
aplikacja webowa: React + TypeScript + Vite.

## Dlaczego od nowa

Stara wersja dzialala przez emulator Flasha i trzy rzeczy byly przez to
nie do naprawienia:

| Problem | Skad sie bral | Jak znika tutaj |
|---|---|---|
| Klawiatura na telefonie raz sie otwiera, raz nie | pola tekstowe byly rysowane na plotnie, wiec przegladarka ich nie widziala | pola to zwykle `<input>` |
| Gra nie wypelnia ekranu | sztywna scena 1280x800 | uklad w CSS, dopasowuje sie sam |
| Wolne przelaczanie zakladek | kazde klikniecie szlo przez emulator do serwera | zmiana widoku bez przeladowania |

Zostaje to, co w tej grze najlepsze: **cala oryginalna grafika**.
Portrety, przyciski ras i klas, tla ekranow — te same pliki co zawsze,
z `sf555/res`.

## Uruchomienie

```bash
npm install
npm run dev          # http://localhost:5173
```

Grafika nie jest kopiowana do `web/`. Serwer deweloperski podaje ja
wprost z `../sf555/res` (patrz wtyczka `zasoby-gry` w `vite.config.ts`),
a przy wdrozeniu robi to skrypt backendu. Dzieki temu `npm run build`
trwa sekunde zamiast kopiowac 96 MB przy kazdej zmianie.

Backend (API) stoi osobno, na porcie 8787 — Vite przekazuje do niego
wszystko spod `/api`.

## Portret postaci

Najciekawszy kawalek. Twarz sklada sie z dziesieciu warstw PNG:

```
cialo (zalezne od klasy) → usta → broda → nos → oczy → brwi
                          → uszy → wlosy → special → special2
```

Nazwy plikow powstaja wedlug reguly przepisanej z klienta Flash
(`getCharPrefix()` i `getCharSuffix()`):

```
char/{rasa} {m|f}/{rasa}_[female_]{warstwa}[_{kolor}_]{numer}.png
```

Kolor siedzi w setkach: wartosc `305` to kolor 3, wariant 5. Tak samo
jak w oryginale, bo te liczby leza juz w bazie w polach `face1..face10`.

Ile wariantow ma kazda warstwa u danej rasy i plci, wie tabela
`src/gra/postac-dane.ts` — **generowana**, nie pisana recznie:

```bash
cd ../backend && npm run gen:chardata
```

Skrypt wyciaga ja z `getCharImageBound()` w kodzie klienta (432 linie
zagniezdzonych `switch`). Test `test/portret.test.ts` sprawdza potem
kazda mozliwa kombinacje wobec plikow na dysku — z ~1900 kombinacji
brakuje 9 i to sa dziury w oryginalnej paczce grafik, nie blad reguly.

## Testy

```bash
npm test
```

## Przejscie calego toru w przegladarce

`e2e/przejscie.mjs` przechodzi gre tak, jak robi to gracz: zaklada
bohatera, oglada ekran postaci, odswieza strone, wylogowuje sie, loguje
ponownie i probuje zlego hasla.

```bash
cd ../backend && DATABASE_URL=postgres://... npm start   # port 8787
cd ../web     && npm run dev                              # port 5173
CHROMIUM=/sciezka/do/chrome node e2e/przejscie.mjs /katalog/na/zrzuty
```

Warto uruchamiac po zmianach w logowaniu. Zlapal juz blad, ktorego zaden
test jednostkowy nie widzial: menu zostawalo otwarte po wylogowaniu
i zaslanialo ekran logowania.
