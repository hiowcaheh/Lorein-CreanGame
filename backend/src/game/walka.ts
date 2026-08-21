/**
 * Silnik walki — port `class Char`, `class Monster` i `SF_Calc::calculateWin`
 * z `req.php`.
 *
 * To jest serce gry: te same zasady rozstrzygaja zadania w karczmie, arene,
 * lochy i wieze. Dlatego port jest osobnym modulem bez zadnego dostepu
 * do bazy — dostaje gotowe dane, zwraca przebieg walki. Oryginal wykonywal
 * zapytania SQL w konstruktorze i w srodku petli walki, co czynilo go
 * niemozliwym do przetestowania inaczej niz przez cala aplikacje.
 *
 * Losowosc idzie przez `PhpMtRand`, wiec walke da sie powtorzyc z tego
 * samego ziarna — bez tego nie da sie napisac sensownego testu na cos,
 * co w kazdym przebiegu wypada inaczej.
 */

import { PhpMtRand } from '../compat/rng.js';
import { ceil, intval, round } from '../compat/php.js';

/** Wspolczynnik zycia zalezny od klasy: wojownik jest najtwardszy. */
const MNOZNIK_ZYCIA: Record<number, number> = { 1: 5, 2: 2, 3: 4 };

/** Ile pancerza wolno miec, zaleznie od klasy. */
const GORNY_PANCERZ: Record<number, number> = { 1: 50, 2: 10, 3: 25 };

export interface Przedmiot {
  slot: number;
  dmg_min: number;
  dmg_max: number;
  atr_type_1: number;
  atr_type_2: number;
  atr_type_3: number;
  atr_val_1: number;
  atr_val_2: number;
  atr_val_3: number;
}

/** Wojownik gotowy do walki — czlowiek albo potwor, bez roznicy. */
export interface Wojownik {
  nazwa: string;
  klasa: number;
  poziom: number;

  sila: number;
  zrecznosc: number;
  intelekt: number;
  wytrzymalosc: number;
  szczescie: number;

  zycie: number;
  zycieMaks: number;

  bronMin: number;
  bronMax: number;

  /**
   * Obrazenia broni PRZED przemnozeniem przez cecha glowna.
   *
   * Potrzebne, bo potwor na zadanie liczy swoje obrazenia wlasnie z surowej
   * broni gracza. Odtwarzanie tej liczby przez dzielenie wprowadzaloby blad
   * zaokraglenia i port przestalby zgadzac sie z oryginalem co do jedynki.
   */
  bronBazowaMin: number;
  bronBazowaMax: number;

  /** Suma pancerza z zalozonych czesci zbroi. */
  pancerz: number;
  /** Wartosc `dmg_min` tarczy; 0 oznacza brak tarczy. */
  tarcza: number;
}

/** Jedno uderzenie w zapisie walki. */
export interface Cios {
  /** Kto uderzyl: 1 albo 2. */
  kto: 1 | 2;
  obrazenia: number;
  /** 3 — trafienie krytyczne, 2 — unik, 1 — blok tarcza, 0 — zwykle. */
  rodzaj: 0 | 1 | 2 | 3;
  /** Zycie obronca po ciosie. */
  zycieObroncy: number;
}

export interface WynikWalki {
  wygral: 1 | 2;
  ciosy: Cios[];
}

// --------------------------------------------------------- budowanie --

/** Ktora cecha jest dla tej klasy najwazniejsza. */
export function cechaGlowna(w: Pick<Wojownik, 'klasa' | 'sila' | 'intelekt' | 'zrecznosc'>): number {
  if (w.klasa === 1) return w.sila;
  if (w.klasa === 2) return w.intelekt;
  if (w.klasa === 3) return w.zrecznosc;
  return 0;
}

/**
 * Sklada wojownika z wiersza gracza i jego przedmiotow.
 *
 * Odpowiednik konstruktora `Char`. Pominiete swiadomie: dopalacze
 * z mikstur, bonusy portalu i zaklecia wiedzmy — przyjda razem
 * z ekranami, ktore je wprowadzaja. Kazde z nich to dodatek do wartosci
 * bazowej, wiec dolozenie ich pozniej niczego tu nie przewraca.
 */
export function wojownikZGracza(
  wiersz: Record<string, unknown>,
  przedmioty: readonly Przedmiot[],
): Wojownik {
  const klasa = intval(wiersz['class'] ?? 1);
  const poziom = intval(wiersz['lvl'] ?? 1);

  // Przedmioty dodaja do cech: typ 1..5 to konkretna cecha, 6 to wszystkie.
  const zPrzedmiotow = [0, 0, 0, 0, 0, 0, 0];
  for (const p of przedmioty) {
    zPrzedmiotow[p.atr_type_1] = (zPrzedmiotow[p.atr_type_1] ?? 0) + p.atr_val_1;
    zPrzedmiotow[p.atr_type_2] = (zPrzedmiotow[p.atr_type_2] ?? 0) + p.atr_val_2;
    zPrzedmiotow[p.atr_type_3] = (zPrzedmiotow[p.atr_type_3] ?? 0) + p.atr_val_3;
  }
  const wszystkie = zPrzedmiotow[6] ?? 0;

  const sila = intval(wiersz['attr_str'] ?? 0) + (zPrzedmiotow[1] ?? 0) + wszystkie;
  const zrecznosc = intval(wiersz['attr_agi'] ?? 0) + (zPrzedmiotow[2] ?? 0) + wszystkie;
  const intelekt = intval(wiersz['attr_int'] ?? 0) + (zPrzedmiotow[3] ?? 0) + wszystkie;
  const wytrzymalosc = intval(wiersz['attr_wit'] ?? 0) + (zPrzedmiotow[4] ?? 0) + wszystkie;
  const szczescie = intval(wiersz['attr_luck'] ?? 0) + (zPrzedmiotow[5] ?? 0) + wszystkie;

  const bron = przedmioty.find((p) => p.slot === 8) ?? { dmg_min: 1, dmg_max: 2 };
  const tarcza = przedmioty.find((p) => p.slot === 9);

  // Zbroja to sloty 0-3 i 5; jej `dmg_min` znaczy punkty pancerza.
  const pancerz = przedmioty
    .filter((p) => [0, 1, 2, 3, 5].includes(p.slot))
    .reduce((suma, p) => suma + p.dmg_min, 0);

  const glowna = klasa === 1 ? sila : klasa === 2 ? intelekt : klasa === 3 ? zrecznosc : 0;
  const mnoznik = MNOZNIK_ZYCIA[klasa] ?? 1;
  const zycie = wytrzymalosc * mnoznik * (poziom + 1);

  return {
    nazwa: String(wiersz['user_name'] ?? 'Bohater'),
    klasa,
    poziom,
    sila,
    zrecznosc,
    intelekt,
    wytrzymalosc,
    szczescie,
    zycie,
    zycieMaks: zycie,
    bronMin: bron.dmg_min * (1 + glowna / 10),
    bronMax: bron.dmg_max * (1 + glowna / 10),
    bronBazowaMin: bron.dmg_min,
    bronBazowaMax: bron.dmg_max,
    pancerz: Math.max(0, pancerz),
    tarcza: tarcza?.dmg_min ?? 0,
  };
}

/**
 * Szesc potworow, ktore stawia rzadkie zadanie — `$ids` w
 * `getQuestMonster()`. Numery wskazuja i obrazek, i nazwe.
 */
const BOSSOWIE_RZADKIEGO_ZADANIA = [139, 145, 148, 152, 155, 157];

/**
 * Ktorym wzorem liczyc obrazenia potwora z wyprawy.
 *
 * `oryginalne` — dokladnie to, co robi `getQuestMonster()`:
 *
 *     $mindmg = ceil($dmgMin * $p->getPrimaryStatValue() / 50);   // wojownik
 *                                                        / 40    // mag
 *                                                        / 45    // lowca
 *
 * gdzie `$dmgMin` to bron GRACZA, a `getPrimaryStatValue()` to cecha
 * glowna GRACZA. Kazdy inny wojownik w `req.php` — gracz w konstruktorze
 * `Char`, przeciwnik z areny, kopia z wiezy — liczy natomiast tak:
 *
 *     $this->dmg->min_damage = $weapon['dmg_min'] * (1 + $primary / 10);
 *
 * Te dwa wzory nie schodza sie nigdzie. Ich iloraz to `P / (5 * (10 + P))`,
 * czyli przy kazdej sensownej cesze glownej okolo JEDNEJ PIATEJ. Zmierzone
 * na porcie: przy wzorze oryginalnym gracz wygrywa 300 walk na 300 i traci
 * srednio 7% zycia — na poziomie 7, 25 i 100 tak samo, wiec nie jest to
 * kwestia niskiego poziomu.
 *
 * `wzorGracza` — ten sam wzor, co u kazdego innego wojownika, ale z cecha
 * glowna POTWORA (juz obnizona, mniej wiecej 1/2,5 cechy gracza). Ubytek
 * zycia rosnie wtedy do 13-25%, a wyprawy dalej sa do wygrania.
 *
 * Wybor nalezy do wlasciciela gry; domyslnie stoi `wzorGracza`. Wzor
 * oryginalny zostaje w kodzie i to na nim pracuje test roznicowy, zeby
 * dalo sie w kazdej chwili sprawdzic, ze reszta portu nie odplynela.
 */
export type WzorObrazenPotwora = 'oryginalne' | 'wzorGracza';

/**
 * Potwor na zadanie — port `getQuestMonster()`.
 *
 * Potwor jest skrojony na miare gracza: jego cechy to cechy gracza
 * podzielone przez losowy wspolczynnik 2,00-3,00. Dlatego zadania sa
 * wykonalne na kazdym poziomie, ale nigdy pewne.
 *
 * JEDYNE ODSTEPSTWO OD `req.php` W CALYM SILNIKU WALKI dotyczy obrazen
 * potwora — patrz `WzorObrazenPotwora` nizej. Wszystko pozostale, razem
 * z kolejnoscia losowan, jest przepisane jeden do jednego i pilnuje tego
 * test roznicowy na wzorcach z prawdziwego PHP.
 */
export function potworNaZadanie(
  gracz: Wojownik,
  rng: PhpMtRand,
  opcje: { wzorObrazen?: WzorObrazenPotwora; rzadkieZadanie?: boolean } = {},
): Wojownik & { obrazek: number; bron: number } {
  const wzorObrazen = opcje.wzorObrazen ?? 'wzorGracza';
  const rzadkieZadanie = opcje.rzadkieZadanie ?? false;
  const poziom = gracz.poziom + rng.rand(0, 2);
  const klasa = rng.rand(1, 3);

  /** Wspolczynnik oslabienia: 2,00 do 3,00. */
  const dziel = () => rng.rand(200, 300) / 100;

  const glownaGracza = cechaGlowna(gracz);

  let sila: number;
  let zrecznosc: number;
  let intelekt: number;
  let dzielnikObrazen: number;
  let mnoznikZycia: number;
  /*
   * Z czego potwor bije. Oryginal wybiera z trzech mozliwosci zaleznie od
   * klasy (`$weapons` w `getQuestMonster`): ujemne numery to pazury, kly
   * i maczugi potworow, dodatni 1004 to prawdziwa rozdzka maga.
   */
  let dostepneBronie: number[];

  if (klasa === 1) {
    sila = ceil(glownaGracza / dziel());
    zrecznosc = ceil(gracz.zrecznosc / dziel() / 4);
    intelekt = ceil(gracz.intelekt / dziel() / 4);
    dzielnikObrazen = 50;
    mnoznikZycia = 4;
    dostepneBronie = [-4, -2, -1];
  } else if (klasa === 2) {
    sila = ceil(gracz.sila / dziel() / 4);
    zrecznosc = ceil(gracz.zrecznosc / dziel() / 4);
    intelekt = ceil(glownaGracza / dziel());
    dzielnikObrazen = 40;
    mnoznikZycia = 2;
    dostepneBronie = [-2, -1, 1004];
  } else {
    sila = ceil(gracz.sila / dziel() / 4);
    zrecznosc = ceil(glownaGracza / dziel());
    intelekt = ceil(gracz.intelekt / dziel() / 4);
    dzielnikObrazen = 45;
    mnoznikZycia = 3;
    dostepneBronie = [-4, -2, -1];
  }

  const wytrzymalosc = ceil(gracz.wytrzymalosc / dziel());
  const szczescie = ceil(gracz.szczescie / dziel());

  /*
   * Obrazenia potwora.
   *
   * Oba warianty biora SUROWA bron gracza (`$p->getWeapon()` w
   * `getQuestMonster`), bo potwor wlasnej broni w bazie nie ma — rozni
   * je tylko to, przez co ta bron jest przemnozona.
   */
  const glownaPotwora = klasa === 1 ? sila : klasa === 2 ? intelekt : zrecznosc;
  const mnoznik =
    wzorObrazen === 'oryginalne'
      ? glownaGracza / dzielnikObrazen
      : 1 + glownaPotwora / 10;
  const bronMin = ceil(gracz.bronBazowaMin * mnoznik);
  const bronMax = ceil(gracz.bronBazowaMax * mnoznik);

  let zycie = ceil(wytrzymalosc * mnoznikZycia * (poziom + 1));

  let bron = dostepneBronie[rng.rand(0, 2)] ?? -1;
  let obrazek = rng.rand(1, 158);

  /*
   * Rzadkie zadanie („czerwone", `quest_red_N == 145`).
   *
   * Jedyne miejsce w `getQuestMonster()`, gdzie potwor jest mocniejszy
   * niz zwykle — i jedyne, gdzie zalezy od SAMEGO ZADANIA, a nie tylko
   * od gracza:
   *
   *     $ids = [139, 145, 148, 152, 155, 157];
   *     $monster_id = $ids[rand(0, 5)];
   *     $OP_health  = ceil($OP_health * 1.5);
   *     $wpnid      = -2;
   *
   * Losowanie numeru potwora idzie PRZED tym sprawdzeniem, wiec przy
   * rzadkim zadaniu wynik `rand(1, 158)` jest wyrzucany, a generator
   * i tak go zuzyl. Bez tego dalszy przebieg walki rozjechalby sie
   * z oryginalem.
   */
  if (rzadkieZadanie) {
    obrazek = BOSSOWIE_RZADKIEGO_ZADANIA[rng.rand(0, 5)] ?? 139;
    zycie = ceil(zycie * 1.5);
    bron = -2;
  }

  return {
    nazwa: 'Potwór',
    klasa,
    poziom,
    sila,
    zrecznosc,
    intelekt,
    wytrzymalosc,
    szczescie,
    zycie,
    zycieMaks: zycie,
    bronMin: Math.max(1, bronMin),
    bronMax: Math.max(1, bronMax),
    bronBazowaMin: bronMin,
    bronBazowaMax: bronMax,
    pancerz: 0,
    tarcza: 0,
    bron,
    /*
     * Numer potwora 1..158 — decyduje o obrazku i o nazwie. Nazwa lezy
     * w pliku jezykowym pod `TXT_MONSTER_NAME + numer - 1`.
     */
    obrazek,
  };
}

// ------------------------------------------------------------ walka --

/** Czy cios jest krytyczny — mnoznik 2 albo 1. */
function czyKrytyk(atakujacy: Wojownik, poziomPrzeciwnika: number, rng: PhpMtRand): 1 | 2 {
  const los = rng.rand(0, 10000);
  let szansa = (atakujacy.szczescie * 5) / (Math.max(1, poziomPrzeciwnika) * 2);
  if (szansa > 50) szansa = 50;
  return los < szansa * 100 ? 2 : 1;
}

/**
 * O ile pancerz obroncy zmniejsza cios.
 *
 * Mag ignoruje pancerz — jego ataki sa magiczne. To dlatego wojownik
 * w ciezkiej zbroi wcale nie jest bezpieczny w starciu z magiem.
 */
function oslonaPancerza(obronca: Wojownik, atakujacy: Wojownik): number {
  if (atakujacy.klasa === 2) return 1;

  let pancerz = obronca.pancerz / Math.max(1, atakujacy.poziom);
  const gorny = GORNY_PANCERZ[obronca.klasa];
  if (gorny !== undefined && pancerz > gorny) pancerz = gorny;

  return 1 - pancerz / 100;
}

/** Losowe obrazenia broni. */
function losoweObrazenia(atakujacy: Wojownik, rng: PhpMtRand): number {
  const min = round(atakujacy.bronMin);
  const maks = round(atakujacy.bronMax);
  return Math.max(1, ceil(rng.rand(Math.min(min, maks), Math.max(min, maks))));
}

/**
 * Jedno uderzenie: unik lowcy, blok wojownika albo trafienie.
 *
 * Kolejnosc jest istotna. Lowca ma 50% na unik, wojownik z tarcza blokuje
 * z szansa rowna `dmg_min` tarczy (albo 25, gdy tarczy nie ma wcale —
 * dziwactwo oryginalu, ktore jednak dziala tylko przy zalozonej tarczy).
 * Mag nie daje sie ani unikac, ani blokowac.
 */
function zadajCios(
  atakujacy: Wojownik,
  obronca: Wojownik,
  kto: 1 | 2,
  rng: PhpMtRand,
): Cios {
  const krytyk = czyKrytyk(atakujacy, obronca.poziom, rng);
  let obrazenia = losoweObrazenia(atakujacy, rng) * krytyk * oslonaPancerza(obronca, atakujacy);
  let rodzaj: Cios['rodzaj'] = krytyk === 2 ? 3 : 0;

  /*
   * Kolejnosc jest tu wazna dla ZGODNOSCI LOSOWANIA, nie tylko dla wyniku.
   *
   * Oryginal (`setHit` w req.php) losuje ZAWSZE, gdy obronca jest lowca
   * albo wojownikiem — sprawdzenie tarczy stoi PO losowaniu:
   *
   *   if ($this->getClass() == 3)      { if (rand(0,100) > 50) ... }
   *   elseif ($this->getClass() == 1)  { if (rand(0,100) < $shield && $this->hasShield()) ... }
   *
   * Gdyby wojownik bez tarczy pomijal losowanie, kolejne liczby z generatora
   * przesunelyby sie o jedna i caly dalszy przebieg walki rozjechalby sie
   * z oryginalem.
   */
  if (atakujacy.klasa !== 2) {
    if (obronca.klasa === 3) {
      if (rng.rand(0, 100) > 50) {
        obrazenia = 0;
        rodzaj = 2;
      }
    } else if (obronca.klasa === 1) {
      // Brak tarczy daje w oryginale 25 — ale i tak nic nie blokuje, bo
      // `hasShield()` jest drugim warunkiem.
      const tarcza = obronca.tarcza === 0 ? 25 : obronca.tarcza;
      if (rng.rand(0, 100) < tarcza && obronca.tarcza !== 0) {
        obrazenia = 0;
        rodzaj = 1;
      }
    }
  }

  /*
   * Zaokraglenie jak w oryginale: `(int)round($hit)`.
   *
   * Zwykly cios nigdy nie wychodzi zerowy — `getRandomDPS` ma dolna
   * granice 1, a najsilniejsza oslona pancerza to polowa (limit 50 dla
   * wojownika), wiec najmniejszy mozliwy wynik to round(0,5) = 1. Zero
   * pojawia sie WYLACZNIE przy uniku i bloku, i wtedy nie jest to cios
   * za zero, tylko cios odbity — klient ma to pokazac slowem, nie liczba.
   */
  const zadane = rodzaj === 1 || rodzaj === 2 ? 0 : Math.max(1, round(obrazenia));
  obronca.zycie -= zadane;

  return { kto, obrazenia: zadane, rodzaj, zycieObroncy: Math.max(0, obronca.zycie) };
}

/**
 * Rozgrywa cala walke i zwraca jej zapis.
 *
 * Kto zaczyna, rozstrzyga rzut monetą — dokladnie jak w oryginale.
 * Walka toczy sie do skutku; przy skrajnie slabych obrazeniach moglaby
 * ciagnac sie w nieskonczonosc, wiec jest twardy limit rund.
 */
export function rozegrajWalke(
  pierwszy: Wojownik,
  drugi: Wojownik,
  rng: PhpMtRand,
  limitRund = 500,
): WynikWalki {
  const ciosy: Cios[] = [];
  let zaczynaPierwszy = rng.rand(0, 100) < 50;

  for (let runda = 0; runda < limitRund; runda++) {
    if (pierwszy.zycie <= 0 || drugi.zycie <= 0) break;

    if (zaczynaPierwszy) {
      ciosy.push(zadajCios(pierwszy, drugi, 1, rng));
    }
    if (drugi.zycie > 0) {
      ciosy.push(zadajCios(drugi, pierwszy, 2, rng));
    }

    zaczynaPierwszy = true;
  }

  return { wygral: drugi.zycie <= 0 ? 1 : 2, ciosy };
}
