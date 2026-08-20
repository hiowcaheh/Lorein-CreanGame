/**
 * Reguly ekwipunku — przepisane z oryginalnego serwera PHP
 * (`sf555/req.php`, akcja `$ACT_USE_ITEM` = 504) i z funkcji
 * `getSlotIndex()` w tym samym pliku.
 *
 * Postac ma dziesiec miejsc na zalozone przedmioty (sloty 0..9 w tabeli
 * `items`) i piecioelementowy plecak (sloty 10..14). Kazdy rodzaj
 * przedmiotu ma swoje jedno wlasciwe miejsce — nie da sie zalozyc butow
 * na glowe.
 */

/**
 * Ktory slot nalezy sie danemu rodzajowi przedmiotu.
 *
 * Wprost z `getSlotIndex()` w `req.php`. Numery slotow sa tam liczone od
 * zera i odpowiadaja kolejnym miejscom na ekranie postaci — lewa kolumna
 * od gory (0..3), prawa kolumna od gory (4..7), potem bron (8) i tarcza (9).
 * Sylwetki pustych miejsc (`slot1.png`..`slot10.png`) potwierdzaja to
 * przyporzadkowanie.
 */
export function slotDlaRodzaju(rodzaj: number): number {
  switch (rodzaj) {
    case 1: return 8;    // bron
    case 2: return 9;    // tarcza
    case 3: return 1;    // zbroja
    case 4: return 3;    // buty
    case 5: return 2;    // rekawice
    case 6: return 0;    // helm
    case 7: return 5;    // pas
    case 8: return 4;    // amulet
    case 9: return 6;    // pierscien
    case 10: return 7;   // talizman
    default: return 10;  // klucze, mikstury i reszta ida do plecaka
  }
}

/** Pierwszy slot plecaka. Nizsze numery to miejsca na zalozone rzeczy. */
export const PIERWSZY_SLOT_PLECAKA = 10;
/** Ile miejsc ma plecak. */
export const MIEJSC_W_PLECAKU = 5;
/** Ostatni slot plecaka. */
export const OSTATNI_SLOT_PLECAKA = PIERWSZY_SLOT_PLECAKA + MIEJSC_W_PLECAKU - 1;

/**
 * Rodzaje o numerze mniejszym niz 8 to bron, tarcza i czesci zbroi.
 *
 * Tylko one maja ograniczenia: musza trafic na swoje miejsce i musza byc
 * przeznaczone dla klasy gracza. Bizuteria (rodzaje 8, 9 i 10) zadnych
 * ograniczen nie ma — nosi ja kazdy.
 */
const PIERWSZY_RODZAJ_BEZ_OGRANICZEN = 8;

/** Przedmiot w postaci, w jakiej trzyma go tabela `items`. */
export interface PrzedmiotWBazie {
  id: number;
  item_type: number;
  item_id: number;
  slot: number;
}

/**
 * Dla ktorej klasy jest przedmiot.
 *
 * Numer przedmiotu koduje klase w tysiacach: 1001 to przedmiot maga
 * o numerze 1. Oryginalny PHP liczy to przez `round($item_id / 1000) + 1`,
 * ale klient Flash odejmuje tysiac w petli — co jest zwyklym dzieleniem
 * calkowitym. Przy numerach przedmiotow, ktore w tej grze nie przekraczaja
 * stu, wychodzi to samo, a dzielenie calkowite nie ma pulapki
 * z zaokraglaniem polowek w gore.
 */
export function klasaPrzedmiotu(numerPrzedmiotu: number): number {
  return Math.floor(numerPrzedmiotu / 1000) + 1;
}

/** Dlaczego przeniesienia nie da sie wykonac. */
export type Odmowa = 'zle-miejsce' | 'inna-klasa' | 'poza-zakresem';

export interface Przeniesienie {
  /** Slot, z ktorego przedmiot wychodzi. */
  zrodlo: number;
  /** Slot, do ktorego przedmiot wchodzi. */
  cel: number;
}

/**
 * Sprawdza, czy przedmiot moze lezec w danym slocie.
 *
 * Warunek jest dokladnie ten, ktory sprawdza `req.php` przed zamiana
 * miejsc: przedmiot rodzaju mniejszego niz 8 musi trafic na swoje
 * miejsce i musi byc przeznaczony dla klasy gracza. Miejsca w plecaku
 * (numer 10 i wyzej) przyjmuja wszystko.
 */
export function czyMozeLezec(
  przedmiot: PrzedmiotWBazie,
  slot: number,
  klasaGracza: number,
): Odmowa | null {
  if (slot >= PIERWSZY_SLOT_PLECAKA) return null;
  if (przedmiot.item_type >= PIERWSZY_RODZAJ_BEZ_OGRANICZEN) return null;

  if (slotDlaRodzaju(przedmiot.item_type) !== slot) return 'zle-miejsce';
  if (klasaPrzedmiotu(przedmiot.item_id) !== klasaGracza) return 'inna-klasa';
  return null;
}

/**
 * Ustala, co ma sie stac przy przeniesieniu przedmiotu.
 *
 * `cel === null` znaczy „zaloz na wlasciwe miejsce" — tak dziala
 * upuszczenie przedmiotu gdziekolwiek na postac. Oryginal robi to samo:
 * przy skrzynce docelowej numer 1 NADPISUJE podany slot wynikiem
 * `getSlotIndex()`, wiec nie da sie zalozyc przedmiotu w zle miejsce
 * nawet celujac.
 *
 * Zwraca parę slotow do zamiany albo powod odmowy. Zamiana jest zawsze
 * obustronna: to, co lezalo w celu, wraca na miejsce zrodla.
 */
export function zaplanujPrzeniesienie(
  wZrodle: PrzedmiotWBazie,
  wCelu: PrzedmiotWBazie | null,
  cel: number | null,
  klasaGracza: number,
): Przeniesienie | Odmowa {
  const docelowy = cel === null ? slotDlaRodzaju(wZrodle.item_type) : cel;

  if (docelowy < 0 || docelowy > OSTATNI_SLOT_PLECAKA) return 'poza-zakresem';
  if (docelowy === wZrodle.slot) return { zrodlo: wZrodle.slot, cel: docelowy };

  const odmowa = czyMozeLezec(wZrodle, docelowy, klasaGracza);
  if (odmowa) return odmowa;

  /*
   * Drugi kierunek zamiany.
   *
   * Kiedy w miejscu docelowym cos lezy, wroci ono na miejsce zrodla —
   * i tam tez musi pasowac. Oryginal sprawdza to samo (zmienna
   * `$changeItm` w `req.php`): bez tego dalo by sie zdjac helm,
   * podkladajac pod niego buty.
   */
  if (wCelu) {
    const odmowaWracajacego = czyMozeLezec(wCelu, wZrodle.slot, klasaGracza);
    if (odmowaWracajacego) return odmowaWracajacego;
  }

  return { zrodlo: wZrodle.slot, cel: docelowy };
}

/**
 * Rodzaj cechy 6 znaczy „wszystkie cechy naraz".
 *
 * `req.php` rozpisuje wtedy jedna wartosc na wszystkie piec pol
 * (`$ret[35 + $i] += $item['atr_val_1']`), zamiast dodawac ja do jednej
 * cechy.
 */
export const CECHA_WSZYSTKIE = 6;

/** Bonusy do cech z ZALOZONYCH przedmiotow, w kolejnosci 1..5. */
export function bonusyZPrzedmiotow(
  przedmioty: { slot: number; atrybuty: { rodzaj: number; wartosc: number }[] }[],
): [number, number, number, number, number] {
  const suma: [number, number, number, number, number] = [0, 0, 0, 0, 0];

  for (const przedmiot of przedmioty) {
    // Tylko zalozone. W oryginale odpowiada temu warunek `slot < 168`,
    // czyli indeks pola przed poczatkiem plecaka.
    if (przedmiot.slot >= PIERWSZY_SLOT_PLECAKA) continue;

    for (const atrybut of przedmiot.atrybuty) {
      if (atrybut.wartosc <= 0) continue;

      if (atrybut.rodzaj === CECHA_WSZYSTKIE) {
        suma[0] += atrybut.wartosc;
        suma[1] += atrybut.wartosc;
        suma[2] += atrybut.wartosc;
        suma[3] += atrybut.wartosc;
        suma[4] += atrybut.wartosc;
      } else if (atrybut.rodzaj >= 1 && atrybut.rodzaj <= 5) {
        const i = atrybut.rodzaj - 1;
        suma[i] = (suma[i] ?? 0) + atrybut.wartosc;
      }
    }
  }

  return suma;
}
