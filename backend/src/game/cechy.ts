/**
 * Kupowanie punktow cech — port `getStatCost()` i galezi `$ACT_BUY_STAT`
 * z `req.php` oraz tablicy `TrueAttPreis` z klienta Flash.
 *
 * Poziom NIE daje punktow. Wszystkie ponad startowe kupuje sie za
 * srebro, a cena zalezy wylacznie od tego, ile punktow danej cechy juz
 * sie DOKUPILO — nie od poziomu ani od pozostalych cech.
 */

import { loadDefaultStats } from './stats.js';

/**
 * Ile punktow daje jeden zakup.
 *
 * SWIADOME ODSTEPSTWO od `req.php` (tabela w CLAUDE.md): tamtejsze
 * `$newStatVal = 3 + $db_data['stat']` doklada TRZY punkty za jedna
 * cene. Cennik jest jednak indeksowany PUNKTEM, nie zakupem —
 * `TrueAttPreis[i] = GoldKurve[1 + i / 5]` i wygladzenie po piec
 * kolejnych — wiec przy skoku o trzy gracz przeskakuje dwie ceny za
 * darmo. Wlasciciel gry zdecydowal: jeden zakup to jeden punkt.
 */
export const PUNKTOW_ZA_ZAKUP = 1;

/** Numery cech, tak jak `getStatName()`: 1 sila ... 5 szczescie. */
export const LICZBA_CECH = 5;

/** Gorna granica ceny i zarazem dlugosc tablicy — obie z oryginalu. */
const NAJWYZSZA_CENA = 1000000000;
const DLUGOSC_TABLICY = 15000;

/**
 * Tablica cen, liczona raz.
 *
 * Powstaje w trzech przebiegach, dokladnie tak jak w `getStatCost()`
 * i w kliencie (obie strony licza ja identycznie):
 *
 *   1. `GoldKurve` — krzywa rosnaca rekurencyjnie: kazdy wyraz to
 *      poprzedni plus trzecia czesc wyrazu spod polowy indeksu i czwarta
 *      czesc spod jednej trzeciej, zaokraglone w dol do piatki,
 *   2. `TrueAttPreis[i] = GoldKurve[1 + i / 5]` — piec kolejnych punktow
 *      cechy kosztuje tyle samo,
 *   3. wygladzenie: kazdy wyraz zastepuje srednia z pieciu kolejnych,
 *      znowu przycieta do piatki. Po przekroczeniu miliarda cala reszta
 *      tablicy dostaje juz tylko miliard.
 */
let tablicaCen: number[] | null = null;

export function cennikPunktow(): number[] {
  if (tablicaCen) return tablicaCen;

  const krzywa = new Array<number>(DLUGOSC_TABLICY + 1).fill(0);
  krzywa[1] = 25;
  krzywa[2] = 50;
  krzywa[3] = 75;

  for (let i = 4; i <= DLUGOSC_TABLICY; i++) {
    const poprzedni = krzywa[i - 1] ?? 0;
    const polowa = krzywa[Math.trunc(i / 2)] ?? 0;
    const trzecia = krzywa[Math.trunc(i / 3)] ?? 0;
    const suma = poprzedni + Math.trunc(polowa / 3) + Math.trunc(trzecia / 4);
    krzywa[i] = Math.trunc(suma / 5) * 5;
  }

  const ceny = new Array<number>(DLUGOSC_TABLICY + 1).fill(0);
  for (let i = 0; i <= DLUGOSC_TABLICY; i++) {
    ceny[i] = krzywa[Math.trunc(1 + i / 5)] ?? 0;
  }

  let poGranicy = false;
  for (let i = 0; i < DLUGOSC_TABLICY - 4; i++) {
    if (poGranicy) {
      ceny[i] = NAJWYZSZA_CENA;
      continue;
    }

    // Czytamy pieciu kolejnych — te dalsze nie sa jeszcze nadpisane,
    // bo petla idzie w przod i zmienia tylko `i`.
    const suma =
      (ceny[i] ?? 0) + (ceny[i + 1] ?? 0) + (ceny[i + 2] ?? 0) + (ceny[i + 3] ?? 0) + (ceny[i + 4] ?? 0);
    ceny[i] = Math.trunc(Math.trunc(suma / 5) / 5) * 5;

    if ((ceny[i] ?? 0) > NAJWYZSZA_CENA) {
      ceny[i] = NAJWYZSZA_CENA;
      poGranicy = true;
    }
  }

  tablicaCen = ceny;
  return ceny;
}

/**
 * Ile punktow danej cechy gracz juz DOKUPIL.
 *
 * `getStatCost()` odejmuje od wartosci cechy tyle, ile dala rasa
 * i klasa przy tworzeniu postaci — cena zalezy tylko od tego, co gracz
 * dolozyl sam. Wartosc ponizej startowej (nie powinna sie zdarzyc)
 * liczy sie jako zero.
 */
export function dokupionePunkty(
  klasa: number,
  rasa: number,
  cecha: number,
  wartosc: number,
): number {
  const bazowe = loadDefaultStats(klasa, rasa)[cecha - 1] ?? 0;
  return Math.max(0, wartosc - bazowe);
}

/**
 * Ile srebra kosztuje kolejny zakup tej cechy.
 *
 * `$stat > 15000` wypada poza tablice i kosztuje od razu miliard —
 * oryginal nawet nie liczy wtedy krzywej.
 */
export function cenaPunktow(klasa: number, rasa: number, cecha: number, wartosc: number): number {
  const dokupione = dokupionePunkty(klasa, rasa, cecha, wartosc);
  if (dokupione > DLUGOSC_TABLICY) return NAJWYZSZA_CENA;
  return cennikPunktow()[dokupione] ?? NAJWYZSZA_CENA;
}

/**
 * Cena W POSTACI, W JAKIEJ POKAZUJE JA KLIENT.
 *
 * Powyzej 9999 srebra klient obcina koncowke do pelnych stu
 * (`boostPrice = int(int(boostPrice / 100) * 100)`), czyli przestaje
 * pokazywac srebro przy zlocie. SERWER pobiera pelna cene — i tak samo
 * jest w oryginale.
 */
export function cenaPokazywana(cena: number): number {
  const przycieta = cena > 9999 ? Math.trunc(cena / 100) * 100 : cena;
  return Math.min(przycieta, NAJWYZSZA_CENA);
}

export type OdmowaZakupu = 'nie-ma-takiej-cechy' | 'za-drogo';

export interface WynikZakupu {
  /** Nowa wartosc cechy. */
  wartosc: number;
  /** Ile srebra zostanie. */
  srebro: number;
  /** Ile kosztowaly wszystkie zakupy razem. */
  cena: number;
  /** Ile punktow naprawde doszlo do skutku. */
  zakupow: number;
}

/**
 * Czy da sie dokupic punkty i co z tego wyjdzie.
 *
 * `ile` to liczba punktow — kazdy kosztuje kolejna cene z cennika.
 * Odmowa przychodzi tylko wtedy, gdy nie starcza nawet na pierwszy.
 */
export function sprawdzZakupCechy(
  cecha: number,
  stan: { klasa: number; rasa: number; wartosc: number; srebro: number },
  ile = 1,
): OdmowaZakupu | WynikZakupu {
  if (!Number.isInteger(cecha) || cecha < 1 || cecha > LICZBA_CECH) return 'nie-ma-takiej-cechy';
  if (!Number.isInteger(ile) || ile < 1) return 'nie-ma-takiej-cechy';

  const { ile: zakupow, koszt } = ileStacNaZakupy(
    stan.klasa,
    stan.rasa,
    cecha,
    stan.wartosc,
    stan.srebro,
    ile,
  );

  if (zakupow === 0) return 'za-drogo';

  return {
    wartosc: stan.wartosc + PUNKTOW_ZA_ZAKUP * zakupow,
    srebro: stan.srebro - koszt,
    cena: koszt,
    zakupow,
  };
}

/**
 * Ile RAZY z rzedu da sie dokupic punkty za posiadane srebro.
 *
 * Oryginal nie zna zakupu hurtem — tam klika sie „+" tyle razy, ile
 * trzeba, i kazde klikniecie kosztuje wiecej. Zbiorczy zakup liczy
 * dokladnie to samo: kolejne ceny z cennika, jedna po drugiej.
 */
export function ileStacNaZakupy(
  klasa: number,
  rasa: number,
  cecha: number,
  wartosc: number,
  srebro: number,
  gornaGranica = 999,
): { ile: number; koszt: number } {
  const cennik = cennikPunktow();
  let dokupione = dokupionePunkty(klasa, rasa, cecha, wartosc);
  let koszt = 0;
  let ile = 0;

  while (ile < gornaGranica) {
    const cena = dokupione > DLUGOSC_TABLICY ? NAJWYZSZA_CENA : (cennik[dokupione] ?? NAJWYZSZA_CENA);
    if (koszt + cena > srebro) break;
    koszt += cena;
    ile += 1;
    dokupione += PUNKTOW_ZA_ZAKUP;
  }

  return { ile, koszt };
}

/** Nazwa kolumny w `user_data` — `getStatName()`. */
export function kolumnaCechy(cecha: number): string | null {
  switch (cecha) {
    case 1: return 'attr_str';
    case 2: return 'attr_agi';
    case 3: return 'attr_int';
    case 4: return 'attr_wit';
    case 5: return 'attr_luck';
    default: return null;
  }
}
