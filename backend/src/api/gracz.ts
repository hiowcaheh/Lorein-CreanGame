/**
 * Stan gracza w postaci, w ktorej rozumie go nowy klient.
 *
 * Stary protokol wysylal 511 pol sklejonych ukosnikami, a znaczenie
 * kazdego pola bylo zaszyte w numerze indeksu. Nowy klient jest nasz,
 * wiec nie ma powodu tego powtarzac — idzie zwykly JSON z nazwami.
 */

import { bonusyZPrzedmiotow } from '../game/ekwipunek.js';
import { barwaPrzedmiotu, plikIkony } from '../game/grafikaPrzedmiotow.js';
import {
  RODZAJ_MIKSTURY,
  bonusZycia,
  cechaMikstury,
  miksturyGracza,
  mnoznikiCech,
  wygasleMikstury,
  type MiejsceMikstury,
} from '../game/mikstury.js';
import { LEVELS } from '../protocol/gamedata.js';
import { intval } from '../compat/php.js';
import type { Sql } from '../db/client.js';

export interface Gracz {
  id: number;
  nick: string;
  poziom: number;
  klasa: number;
  rasa: number;
  plec: 'm' | 'f';
  /** face1..face9 — kolejne warstwy portretu. */
  wyglad: number[];

  srebro: number;
  grzyby: number;
  honor: number;

  doswiadczenie: number;
  doNastepnegoPoziomu: number;
  postepPoziomu: number;

  /** Cechy razem z tym, co dokladaja ZALOZONE przedmioty. */
  cechy: {
    sila: number;
    zrecznosc: number;
    intelekt: number;
    wytrzymalosc: number;
    szczescie: number;
  };

  /**
   * Ile z powyzszych cech pochodzi z zalozonych przedmiotow.
   *
   * Oryginal wysyla to osobnymi polami (30..34 to cechy wlasne postaci,
   * 35..39 dokladka z przedmiotow), zeby klient mogl pokazac, co gracz
   * zyska albo straci po zmianie ekwipunku.
   */
  bonusy: {
    sila: number;
    zrecznosc: number;
    intelekt: number;
    wytrzymalosc: number;
    szczescie: number;
  };

  zycie: number;

  /** Opis postaci wpisany przez gracza. */
  opis: string;

  /** Wartosci wyliczane — w oryginale liczyl je klient z pol odpowiedzi. */
  obrazenia: { min: number; max: number; srednio: number };
  unik: number;
  odpornosc: number;
  ciosKrytyczny: number;
  pancerz: number;
  wierzchowiec: number;

  ekwipunek: Przedmiot[];

  /**
   * Trzy miejsca na dzialajace mikstury — puste maja `rodzaj` rowny zeru.
   *
   * Cechy w polach `cechy` i `bonusy` sa juz o mikstury podniesione,
   * tak samo jak w oryginale. Ta lista jest po to, zeby ekran umial
   * pokazac, ktora mikstura dziala i do kiedy.
   */
  mikstury: Mikstura[];

  /**
   * Osiem odznak, kazda w stopniu 0..4.
   *
   * DO PRZENIESIENIA: oryginal wylicza stopnie z postepu w lochach,
   * arenie, zadaniach i zarobkach. Swieza postac ma wszystkie na zerze,
   * wiec dzis wynik jest poprawny — ale przy starszych kontach nie bedzie.
   */
  osiagniecia: number[];
}

/** Dzialajaca mikstura w jednym z trzech miejsc postaci. */
export interface Mikstura {
  /** Numer mikstury (`potion_id`), 0 gdy miejsce puste. */
  rodzaj: number;
  /** Sila dzialania w procentach. */
  wartosc: number;
  /** Ktora cechę podnosi: 1..5, albo 0 dla Eliksiru Niesmiertelnosci. */
  cecha: number;
  /** Kiedy przestanie dzialac — czas uniksowy. */
  koniec: number;
  /** Adres ikonki, albo pusty napis dla wolnego miejsca. */
  obrazek: string;
}

/** Przedmiot w ekwipunku albo w plecaku. */
export interface Przedmiot {
  /** Numer miejsca: 1..10 zalozone, wyzej plecak. */
  slot: number;
  typ: number;
  /** Klasa, dla ktorej przedmiot jest przeznaczony (1 wojownik, 2 mag, 3 lowca). */
  podtyp: number;
  /**
   * Numer w tablicy przedmiotow danego rodzaju.
   *
   * Klient sklada z niego nazwe: rodzaj i klasa wyznaczaja poczatek
   * zakresu w pliku jezykowym, a ten numer przesuniecie w zakresie
   * (`GetItemName` w oryginale). Bez niego nazwe trzeba byloby
   * wyciagac z nazwy pliku obrazka.
   */
  numer: number;
  /** Poziom ulepszenia — w nazwie pokazywany jako " (+N)". */
  ulepszenie: number;
  /** Adres obrazka w katalogu zasobow. */
  obrazek: string;
  obrazenia: { min: number; max: number };
  atrybuty: { rodzaj: number; wartosc: number }[];
  zloto: number;
  grzyby: number;
}

/**
 * Ile doswiadczenia trzeba na kolejny poziom.
 *
 * UWAGA na pulapke: kolumna `exp` NIE jest sumaryczna. Przy awansie
 * oryginal odejmuje od niej prog (`exp -= LEVELS[lvl]; lvl++`), wiec
 * trzyma postep W OBREBIE biezacego poziomu. Liczenie procentu jako
 * `(exp - prog_poprzedni) / (prog - prog_poprzedni)` dawaloby wynik
 * poprawny tylko na pierwszym poziomie, gdzie prog poprzedni wynosi zero.
 */
export function progPoziomu(poziom: number): number {
  return LEVELS[poziom] ?? LEVELS[LEVELS.length - 1] ?? 0;
}

/**
 * Punkty zycia. Odpowiednik wzoru z oryginalu: wytrzymalosc razy poziom,
 * ze wspolczynnikiem zaleznym od klasy — wojownik jest najtwardszy.
 */
function policzZycie(klasa: number, wytrzymalosc: number, poziom: number): number {
  // Wzor z klienta: wytrzymalosc * (mnoznik * 2) * (0,5 + poziom/2).
  // Na poziomie 1 daje to wytrzymalosc * mnoznik * 2 — dla wojownika
  // z 14 wytrzymalosci wychodzi 140, tak jak w oryginale.
  return Math.floor(wytrzymalosc * (mnoznikZycia(klasa) * 2) * (0.5 + poziom / 2));
}

/**
 * Glowna cecha klasy — od niej zalezy sila ciosu.
 *
 * Wojownik bije sila, mag intelektem, lowca zrecznoscia. W kodzie klienta
 * bylo to zapisane przesunieciami w tablicy (`+0`, `+2`, `+1`), a nazwy
 * zmiennych z dekompilatora sa mylace — sprawdzone na prawdziwej postaci:
 * wojownik 15 sily, bron 4-8, srednia 6 * (1 + 15/10) = 15 obrazen.
 */
function glownaCecha(klasa: number, cechy: Gracz['cechy']): number {
  if (klasa === 2) return cechy.intelekt;
  if (klasa === 3) return cechy.zrecznosc;
  return cechy.sila;
}

/** Mnoznik zycia zalezny od klasy: wojownik jest najtwardszy. */
function mnoznikZycia(klasa: number): number {
  return klasa === 1 ? 5 : klasa === 2 ? 2 : 4;
}

/**
 * Zamienia wiersz z tabeli `items` na przedmiot dla klienta.
 *
 * Sciezke do ikony sklada `plikIkony()` — port `GetItemFile()`. Sama para
 * typ i numer jej nie wyznacza: wchodzi jeszcze barwa, liczona z osmiu
 * pol statystyk przedmiotu.
 */
export function zbudujPrzedmiot(wiersz: Record<string, unknown>): Przedmiot {
  const typ = intval(wiersz['item_type'] ?? 0);
  const identyfikator = intval(wiersz['item_id'] ?? 0);

  // Numer przedmiotu koduje podtyp w tysiacach: 1001 to podtyp 2, numer 1.
  const podtyp = Math.floor(identyfikator / 1000) + 1;
  const numer = identyfikator % 1000;

  const barwa = barwaPrzedmiotu({
    dmg_min: intval(wiersz['dmg_min'] ?? 0),
    dmg_max: intval(wiersz['dmg_max'] ?? 0),
    atr_type_1: intval(wiersz['atr_type_1'] ?? 0),
    atr_type_2: intval(wiersz['atr_type_2'] ?? 0),
    atr_type_3: intval(wiersz['atr_type_3'] ?? 0),
    atr_val_1: intval(wiersz['atr_val_1'] ?? 0),
    atr_val_2: intval(wiersz['atr_val_2'] ?? 0),
    atr_val_3: intval(wiersz['atr_val_3'] ?? 0),
  });

  return {
    slot: intval(wiersz['slot'] ?? 0),
    typ,
    podtyp,
    numer,
    ulepszenie: intval(wiersz['upgrade_level'] ?? 0),
    obrazek: plikIkony(typ, identyfikator, barwa),
    obrazenia: { min: intval(wiersz['dmg_min'] ?? 0), max: intval(wiersz['dmg_max'] ?? 0) },
    atrybuty: [1, 2, 3]
      .map((n) => ({
        rodzaj: intval(wiersz[`atr_type_${n}`] ?? 0),
        wartosc: intval(wiersz[`atr_val_${n}`] ?? 0),
      }))
      .filter((a) => a.rodzaj > 0),
    zloto: intval(wiersz['gold'] ?? 0),
    grzyby: intval(wiersz['mush'] ?? 0),
  };
}

/**
 * Pobiera ekwipunek gracza i sklada z niego pelny stan postaci.
 *
 * Osobna funkcja, bo zapytanie o przedmioty musi isc do bazy, a
 * `zbudujGracza` jest czysta — dzieki temu da sie ja testowac bez bazy.
 */
export async function wczytajGracza(sql: Sql, wiersz: Record<string, unknown>): Promise<Gracz> {
  const przedmioty = await sql<Record<string, unknown>[]>`
    SELECT * FROM items WHERE owner_id = ${intval(wiersz['user_id'] ?? 0)}
  `;

  /*
   * Mikstury, ktorym uplynal czas, znikaja przy wczytaniu gracza —
   * tak samo jak w `loadDefaultData()` oryginalu. Samo liczenie i tak
   * ich nie doliczy (`miksturyGracza` je pomija), ale bez zapisu
   * zostawalyby w bazie na zawsze i wracaly przy kazdym odczycie.
   */
  const wygasle = wygasleMikstury(wiersz);
  const kolumny = Object.keys(wygasle);

  if (kolumny.length > 0) {
    Object.assign(wiersz, wygasle);
    await sql`
      UPDATE user_data SET ${sql(wygasle, ...kolumny)}
      WHERE user_id = ${intval(wiersz['user_id'] ?? 0)}
    `;
  }

  return zbudujGracza(wiersz, przedmioty.map(zbudujPrzedmiot));
}

export function zbudujGracza(
  wiersz: Record<string, unknown>,
  ekwipunek: Przedmiot[] = [],
): Gracz {
  const poziom = intval(wiersz['lvl'] ?? 1);
  const doswiadczenie = intval(wiersz['exp'] ?? 0);

  const progNastepny = Math.max(1, progPoziomu(poziom));

  const klasa = intval(wiersz['class'] ?? 1);

  /*
   * Cechy to suma tego, co ma sama postac, i tego, co dokladaja
   * ZALOZONE przedmioty. Przedmioty w plecaku nie licza sie do niczego —
   * w oryginale odpowiada temu warunek `slot < 168` przy skladaniu
   * odpowiedzi w `req.php`.
   */
  const [bs, bz, bi, bw, bsz] = bonusyZPrzedmiotow(ekwipunek);

  const bonusy = {
    sila: bs,
    zrecznosc: bz,
    intelekt: bi,
    wytrzymalosc: bw,
    szczescie: bsz,
  };

  const cechy = {
    sila: intval(wiersz['attr_str'] ?? 10) + bonusy.sila,
    zrecznosc: intval(wiersz['attr_agi'] ?? 10) + bonusy.zrecznosc,
    intelekt: intval(wiersz['attr_int'] ?? 10) + bonusy.intelekt,
    wytrzymalosc: intval(wiersz['attr_wit'] ?? 10) + bonusy.wytrzymalosc,
    szczescie: intval(wiersz['attr_luck'] ?? 10) + bonusy.szczescie,
  };

  /*
   * Mikstury podnosza cechę o procent i — tak jak w oryginale — caly
   * dodatek ladzie w DOKLADCE, nie w cesze wlasnej postaci:
   *
   *     $ret[35] += ($ret[35] + $ret[30]) * 0.10;
   *
   * czyli dokladka rosnie o procent CALEJ cechy. Dzieki temu ekran umie
   * pokazac, ile z widocznej liczby jest tymczasowe.
   */
  const mikstury = miksturyGracza(wiersz);
  const mnozniki = mnoznikiCech(mikstury);
  const CECHY_PO_KOLEI = ['sila', 'zrecznosc', 'intelekt', 'wytrzymalosc', 'szczescie'] as const;

  CECHY_PO_KOLEI.forEach((nazwa, i) => {
    const udzial = (mnozniki[i + 1] ?? 1) - 1;
    if (udzial === 0) return;
    const dodatek = Math.round(cechy[nazwa] * udzial);
    bonusy[nazwa] += dodatek;
    cechy[nazwa] += dodatek;
  });

  return {
    id: intval(wiersz['user_id'] ?? 0),
    nick: String(wiersz['user_name'] ?? ''),
    poziom,
    klasa,
    rasa: intval(wiersz['race'] ?? 1),
    plec: intval(wiersz['gender'] ?? 1) === 2 ? 'f' : 'm',
    wyglad: [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => intval(wiersz[`face${n}`] ?? 1)),

    srebro: intval(wiersz['silver'] ?? 0),
    grzyby: intval(wiersz['mushroom'] ?? 0),
    honor: intval(wiersz['honor'] ?? 0),

    doswiadczenie,
    doNastepnegoPoziomu: progNastepny,
    postepPoziomu: Math.min(1, Math.max(0, doswiadczenie / progNastepny)),

    cechy,
    bonusy,

    zycie:
      policzZycie(klasa, cechy.wytrzymalosc, poziom) +
      bonusZycia(mikstury, cechy.wytrzymalosc, mnoznikZycia(klasa), poziom),

    opis: odkodujOpis(String(wiersz['user_desc'] ?? '')),

    ...policzWartosci(klasa, cechy, poziom, ekwipunek),

    wierzchowiec: intval(wiersz['mount'] ?? 0),
    ekwipunek,
    mikstury: mikstury.map(opiszMiksture),
    osiagniecia: [0, 0, 0, 0, 0, 0, 0, 0],
  };
}

/**
 * Miejsce na miksture w postaci, w ktorej rozumie je ekran.
 *
 * Ikonka idzie przez `plikIkony()` tak samo jak kazdy inny przedmiot —
 * klient robi to samo: `GetItemID(12, potion_id, 0, 0)`.
 */
function opiszMiksture(m: MiejsceMikstury): Mikstura {
  return {
    rodzaj: m.numer,
    wartosc: m.wartosc,
    cecha: cechaMikstury(m.numer),
    koniec: m.koniec,
    obrazek: m.numer > 0 ? plikIkony(RODZAJ_MIKSTURY, m.numer, 0) : '',
  };
}

/**
 * Wartosci pochodne — te same wzory, ktore liczyl klient Flash.
 *
 * Sprawdzone na postaci z oryginalu (wojownik, poziom 1, cechy
 * 15/16/9/14/11, bron 4-8): obrazenia ~15, unik 8, odpornosc 4,
 * zywotnosc 140, cios krytyczny 27,5%.
 */
function policzWartosci(
  klasa: number,
  cechy: Gracz['cechy'],
  poziom: number,
  ekwipunek: Przedmiot[],
) {
  const bron = ekwipunek.find((p) => p.slot === SLOT_BRONI);
  const mnoznikObrazen = 1 + glownaCecha(klasa, cechy) / 10;

  const min = Math.floor((bron?.obrazenia.min ?? 1) * mnoznikObrazen);
  const max = Math.floor((bron?.obrazenia.max ?? 2) * mnoznikObrazen);

  // Krytyk rosnie ze szczesciem, ale spada z poziomem — i nigdy nie
  // przekracza 50%.
  const krytyk = Math.min(50, Math.max(0, Math.round(((cechy.szczescie * 25) / (poziom * 10)) * 100) / 100));

  return {
    obrazenia: { min, max, srednio: Math.floor((min + max) / 2) },
    unik: Math.trunc(cechy.zrecznosc / 2),
    odpornosc: Math.trunc(cechy.intelekt / 2),
    ciosKrytyczny: krytyk,
    pancerz: ekwipunek
      .filter((p) => SLOTY_PANCERZA.includes(p.slot))
      .reduce((suma, p) => suma + p.obrazenia.min, 0),
  };
}

/** Miejsce, w ktorym siedzi bron. */
const SLOT_BRONI = 8;

/** Miejsca liczone do pancerza — tak jak w `getRealArmor()` oryginalu. */
const SLOTY_PANCERZA = [0, 1, 2, 3, 5];

/**
 * Opis postaci jest w bazie zakodowany jak adres URL, ze spacjami
 * zamienionymi na plusy. Zly zapis nie moze wywracac calego ekranu.
 */
export function zakodujOpis(tekst: string): string {
  // Stary serwer trzyma opis przepuszczony przez `urlencode()`, wiec spacja
  // jest plusem, a nie `%20`. Zapisujemy tak samo — inaczej stary klient
  // pokazywalby opisy z plusami zamiast spacji.
  return encodeURIComponent(tekst).replaceAll('%20', '+');
}

function odkodujOpis(surowy: string): string {
  try {
    return decodeURIComponent(surowy.replaceAll('+', ' '));
  } catch {
    return surowy;
  }
}
