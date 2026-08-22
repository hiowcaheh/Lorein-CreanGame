/**
 * Kupowanie punktow cech — strona ekranu.
 *
 * Serwer podaje gotowa cene kazdej cechy; tutaj zostaje tylko to, co
 * robil z nia klient Flash: rozbicie na zloto i srebro oraz obcinanie
 * koncowki przy cenach powyzej 9999.
 */

import { liczba } from './liczby';

/**
 * Ile punktow daje jeden zakup. Jeden — patrz `backend/src/game/cechy.ts`
 * i tabela odstepstw w CLAUDE.md.
 */
export const PUNKTOW_ZA_ZAKUP = 1;

/**
 * Cena tak, jak POKAZUJE ja klient.
 *
 *     if (boostPrice > 9999) boostPrice = int(int(boostPrice / 100) * 100);
 *
 * czyli powyzej 9999 srebra znika koncowka i widac same pelne zloto.
 * Pobierana jest i tak cena pelna — to samo dzialo sie w oryginale.
 */
export function cenaPokazywana(cena: number): number {
  return cena > 9999 ? Math.trunc(cena / 100) * 100 : cena;
}

/** Cena slowami — do dymka przy przycisku. */
export function opisCeny(cena: number): string {
  const pokazywana = cenaPokazywana(cena);
  const zloto = Math.trunc(pokazywana / 100);
  const srebro = pokazywana % 100;

  const czesci: string[] = [];
  if (zloto > 0) czesci.push(`${liczba(zloto)} złota`);
  if (srebro > 0 || zloto === 0) czesci.push(`${srebro} srebra`);
  return czesci.join(' ');
}

/*
 * Cennik punktow — ta sama tablica, ktora klient Flash liczyl u siebie
 * (`TrueAttPreis`), a serwer w `getStatCost()`. Obie strony mialy w
 * oryginale wlasna kopie i tak samo jest tutaj: ekran musi znac ceny
 * kolejnych zakupow, zeby pokazac koszt suwaka bez pytania serwera
 * o kazda pozycje. Prawda i tak jest po stronie serwera — to on liczy,
 * ile naprawde pobrac.
 */

const NAJWYZSZA_CENA = 1000000000;
const DLUGOSC_TABLICY = 15000;

let tablica: number[] | null = null;

function cennik(): number[] {
  if (tablica) return tablica;

  const krzywa = new Array<number>(DLUGOSC_TABLICY + 1).fill(0);
  krzywa[1] = 25;
  krzywa[2] = 50;
  krzywa[3] = 75;

  for (let i = 4; i <= DLUGOSC_TABLICY; i++) {
    const suma =
      (krzywa[i - 1] ?? 0) +
      Math.trunc((krzywa[Math.trunc(i / 2)] ?? 0) / 3) +
      Math.trunc((krzywa[Math.trunc(i / 3)] ?? 0) / 4);
    krzywa[i] = Math.trunc(suma / 5) * 5;
  }

  const ceny = new Array<number>(DLUGOSC_TABLICY + 1).fill(0);
  for (let i = 0; i <= DLUGOSC_TABLICY; i++) ceny[i] = krzywa[Math.trunc(1 + i / 5)] ?? 0;

  let poGranicy = false;
  for (let i = 0; i < DLUGOSC_TABLICY - 4; i++) {
    if (poGranicy) {
      ceny[i] = NAJWYZSZA_CENA;
      continue;
    }
    const suma =
      (ceny[i] ?? 0) + (ceny[i + 1] ?? 0) + (ceny[i + 2] ?? 0) + (ceny[i + 3] ?? 0) + (ceny[i + 4] ?? 0);
    ceny[i] = Math.trunc(Math.trunc(suma / 5) / 5) * 5;
    if ((ceny[i] ?? 0) > NAJWYZSZA_CENA) {
      ceny[i] = NAJWYZSZA_CENA;
      poGranicy = true;
    }
  }

  tablica = ceny;
  return ceny;
}

/** Cena zakupu przy `dokupione` punktach juz kupionych. */
export function cenaZakupu(dokupione: number): number {
  if (dokupione > DLUGOSC_TABLICY) return NAJWYZSZA_CENA;
  return cennik()[dokupione] ?? NAJWYZSZA_CENA;
}

/**
 * Ile kolejnych zakupow da sie zrobic za `srebro` i ile to razem
 * kosztuje. Kazdy nastepny jest drozszy, wiec liczy sie je po kolei.
 */
export function ileStac(dokupione: number, srebro: number, gornaGranica = 999): number {
  let koszt = 0;
  let ile = 0;
  let punkty = dokupione;

  while (ile < gornaGranica) {
    const cena = cenaZakupu(punkty);
    if (koszt + cena > srebro) break;
    koszt += cena;
    ile += 1;
    punkty += PUNKTOW_ZA_ZAKUP;
  }

  return ile;
}

/** Ile razem kosztuje `ile` kolejnych zakupow. */
export function kosztZakupow(dokupione: number, ile: number): number {
  let koszt = 0;
  let punkty = dokupione;
  for (let i = 0; i < ile; i++) {
    koszt += cenaZakupu(punkty);
    punkty += PUNKTOW_ZA_ZAKUP;
  }
  return koszt;
}

/*
 * Podpowiedzi z oryginalu — `TXT_ATTRIBHELP` i sasiedzi.
 *
 * Klient sklada je tak (petla po cechach w `ShowCharScreen`):
 *
 *   zawsze          txt[TXT_ATTRIBHELP + i]              (4530..4534)
 *   wojownik, i = 0 txt[TXT_ATTRIBHELP_WARRIOR]          (4540)
 *   lowca,    i = 1 txt[TXT_ATTRIBHELP_HUNTER]           (4541)
 *   mag,      i = 2 txt[TXT_ATTRIBHELP_MAGE]             (4542)
 *   inaczej, i <= 2 txt[TXT_ATTRIBHELP_EXT + i]          (4535..4537)
 */
const POMOC_OGOLNA = [
  'Siła jest najważniejszą cechą wojownika.',
  'Zręczność jest najważniejszą cechą zwiadowcy.',
  'Inteligencja jest najważniejszą cechą maga.',
  'Wytrzymałość zwiększa ilość posiadanych punktów życia.',
  'Szczęście zwiększa szansę zadania krytycznego ciosu.',
];

const POMOC_OBRONNA = [
  'Siła pomaga ci w walce z wojownikami.',
  'Zręczność pomaga ci w walce ze zwiadowcami.',
  'Inteligencja pomaga ci w walce z magami.',
];

const POMOC_OBRAZENIA = 'Zwiększa zadawane przez ciebie obrażenia.';

/** Dwa zdania o cesze: ogolne i to zalezne od klasy. */
export function pomocDoCechy(cecha: number, klasa: number): string[] {
  const i = cecha - 1;
  const wiersze = [POMOC_OGOLNA[i] ?? ''];

  const glowna = (klasa === 1 && i === 0) || (klasa === 3 && i === 1) || (klasa === 2 && i === 2);
  if (glowna) wiersze.push(POMOC_OBRAZENIA);
  else if (i <= 2) wiersze.push(POMOC_OBRONNA[i] ?? '');

  return wiersze.filter(Boolean);
}
