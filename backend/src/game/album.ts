/**
 * Klaser Dokladnosci — port klasy `Album` z `req.php`.
 *
 * Klaser to NIE jest przedmiot do zalozenia. Kupuje sie go w gabinecie
 * magii (rodzaj 13, od dziesiatego poziomu, i tylko dopoki gracz go nie
 * ma), a przeciagniecie na postac go OTWIERA: kolumna `album` przestaje
 * byc `-1`, w `album_data` laduje pusty zestaw bitow, a wszystko, co
 * gracz akurat ma na sobie i w plecaku, od razu sie w nim zapisuje.
 *
 * Zapisany klaser podnosi doswiadczenie z wypraw:
 *
 *     if ($album != -1) $albumbonus += round($album / 1700, 2);
 *     $exp += quest_exp * ($ebonus + $albumbonus + $rqbonus);
 *
 * czyli komplet (1700 pozycji) podwaja zdobywane doswiadczenie.
 */

/** Ile pozycji miesci klaser — `contentMax` w kliencie. */
export const POZYCJI_W_KLASERZE = 1700;

/** `album == -1` znaczy „gracz nie ma klasera". */
export const BEZ_KLASERA = -1;

/** Rodzaj przedmiotu, ktory jest klaserem. */
export const RODZAJ_KLASERA = 13;

/** Od tego poziomu gabinet magii moze go miec na pólce. */
export const POZIOM_KLASERA = 10;

/**
 * Pusty klaser — `Album::getDefaultData()`.
 *
 * Oryginal ma tam 532 znaki „A". Trzymamy dlugosc, a nie sam napis: tak
 * widac, skad sie bierze. Krotszy zapis NIE wystarczy — najdalsza pozycja
 * klasera to epicki miecz zwiadowcy pod bitem 3187 (`ShowAlbumContent()`,
 * dzial 4, strona 29), a 532 znaki daja 399 bajtow, czyli 3192 bity.
 */
const ZNAKOW_DANYCH = 532;
export const PUSTY_KLASER = 'A'.repeat(ZNAKOW_DANYCH);

/** Przedmiot w postaci, w jakiej trzyma go tabela `items`. */
export interface PrzedmiotKlasera {
  item_type: number;
  item_id: number;
  dmg_min: number;
  dmg_max: number;
  atr_type_1: number;
  atr_type_2: number;
  atr_type_3: number;
  atr_val_1: number;
  atr_val_2: number;
  atr_val_3: number;
}

/*
 * Zapis klasera to base64 w odmianie „url" (`+/` zamienione na `-_`),
 * a w srodku zwykle BAJTY — po osiem pozycji na bajt, od najstarszego
 * bitu. Idzie to przez bajty, a nie po szesc bitow na znak, bo tak robi
 * oryginal (`unpack('C*', base64_decode(...))`) i tylko wtedy zapis
 * zrobiony przez stary serwer da sie u nas odczytac.
 */

/** Ile pozycji miesci pusty zapis: 532 znaki to 399 bajtow, czyli 3192 bity. */
const BAJTOW = 399;

/** Zamienia zapis klasera na tablice bitow. */
export function odkodujKlaser(dane: string): boolean[] {
  const bajty = Buffer.from(dane.replaceAll('-', '+').replaceAll('_', '/'), 'base64');
  const bity: boolean[] = [];

  for (const bajt of bajty) {
    for (let b = 7; b >= 0; b--) bity.push(((bajt >> b) & 1) === 1);
  }

  while (bity.length < BAJTOW * 8) bity.push(false);
  return bity;
}

/** Zamienia tablice bitow z powrotem na zapis klasera. */
export function zakodujKlaser(bity: readonly boolean[]): string {
  const ile = Math.max(BAJTOW, Math.ceil(bity.length / 8));
  const bajty = Buffer.alloc(ile);

  for (let i = 0; i < bity.length; i++) {
    if (bity[i]) bajty[i >> 3]! |= 1 << (7 - (i % 8));
  }

  return bajty.toString('base64').replaceAll('+', '-').replaceAll('/', '_');
}

/**
 * Ktory bit klasera nalezy do tego przedmiotu — `Album::getItemIndex()`.
 *
 * Kazdy rodzaj i kazda klasa maja swoj zakres, a w nim po PIEC miejsc
 * na przedmiot — po jednym na barwe. Przedmiot epicki (numer od 50)
 * i talizman (rodzaj 10) barwy nie maja i zajmuja jedno miejsce.
 */
export function miejsceWKlaserze(p: PrzedmiotKlasera): number {
  const typ = p.item_type;
  if (typ < 1 || typ > 10) return 0;

  const barwaSurowa =
    (p.dmg_min + p.dmg_max + p.atr_type_1 + p.atr_type_2 + p.atr_type_3 + p.atr_val_1 + p.atr_val_2 + p.atr_val_3) % 5;

  // Rodzaje 8-10 (bizuteria) nie naleza do zadnej klasy.
  const dlaKlasy = typ >= 8 && typ <= 10 ? 0 : Math.floor(p.item_id / 1000) + 1;

  let numer = p.item_id;
  if (dlaKlasy === 2) numer -= 1000;
  if (dlaKlasy === 3) numer -= 2000;
  if (numer < 1 || numer > 57) return 0;

  const epicki = numer >= 50;
  const barwa = epicki || typ === 10 ? 0 : barwaSurowa;

  const POCZATKI: Record<number, Record<number, number>> = {
    0: { 8: 300, 9: 526, 10: 702 },
    1: { 1: 792, 2: 1108, 3: 1224, 4: 1340, 5: 1456, 6: 1572, 7: 1688 },
    2: { 1: 1804, 3: 1920, 4: 2036, 5: 2152, 6: 2268, 7: 2384 },
    3: { 1: 2500, 3: 2616, 4: 2732, 5: 2848, 6: 2964, 7: 3080 },
  };

  let miejsce = POCZATKI[dlaKlasy]?.[typ] ?? 0;

  if (epicki) {
    /*
     * Zwykle wzory kazdego rodzaju stoja przed epickimi, wiec epik
     * przeskakuje caly ich blok.
     *
     * PRZESUNIECIA SA Z KLIENTA, NIE Z `req.php`. Stary serwer PHP ma tu
     * kazda liczbe o 50 za mala (`+250/+50/+160/+110/+24`) i wpisuje
     * epiki w miejsca, ktorych `ShowAlbumContent()` NIGDY nie rysuje.
     * Klient czyta je tak:
     *
     *   rodzaj 8   strona 6  -> 510   (300 + 210)
     *   rodzaj 9   strona 12 -> 686   (526 + 160)
     *   rodzaj 10  strona 24 -> 776   (702 +  74)
     *   bron woj.  strona 8  -> 1092  (792 + 300)
     *   reszta     ...       -> baza + 100
     *
     * Ze suma sie zgadza, widac po `catMax = [252, 246, 506, 348, 348]`
     * z klienta: przy TYCH przesunieciach kazdy dzial wychodzi co do
     * jednego, a razem daje 1700, czyli `contentMax`.
     */
    if (typ === 1 && dlaKlasy === 1) miejsce += 300;
    else if (typ >= 1 && typ <= 7) miejsce += 100;
    else if (typ === 8) miejsce += 210;
    else if (typ === 9) miejsce += 160;
    else if (typ === 10) miejsce += 74;

    miejsce += numer - 50;
  } else if (typ === 10) {
    miejsce += numer - 1;
  } else {
    miejsce += (numer - 1) * 5 + barwa;
  }

  return miejsce;
}

export interface StanKlasera {
  dane: string;
  ile: number;
}

/**
 * Wpisuje przedmioty do klasera. Zwraca nowy stan; przedmioty spoza
 * rodzajow 1-10 i te juz wpisane niczego nie zmieniaja.
 */
export function dopiszDoKlasera(
  stan: StanKlasera,
  przedmioty: readonly PrzedmiotKlasera[],
): StanKlasera {
  const bity = odkodujKlaser(stan.dane);
  let ile = stan.ile;

  for (const p of przedmioty) {
    if (p.item_type > 10 || p.item_type < 1) continue;
    const miejsce = miejsceWKlaserze(p);
    if (miejsce <= 0 || miejsce >= bity.length) continue;
    if (bity[miejsce]) continue;
    bity[miejsce] = true;
    ile += 1;
  }

  return { dane: zakodujKlaser(bity), ile };
}

/**
 * Ile doswiadczenia dokłada klaser — `round($album / 1700, 2)`.
 * Bez klasera zero.
 */
export function premiaZKlasera(album: number): number {
  if (album === BEZ_KLASERA) return 0;
  return Math.round((album / POZYCJI_W_KLASERZE) * 100) / 100;
}

/**
 * Najwyzszy numer potwora, ktory klaser przyjmuje — `addMonster()`:
 *
 *     $id = abs($id) - 1;
 *     if (($id < 0) || ($id > 252)) return false;
 *
 * Potwory leza na samym poczatku zapisu, przed przedmiotami: bit `id-1`
 * to potwor o numerze `id`. Klient rysuje ich 252 (63 strony po cztery).
 */
export const NAJWYZSZY_POTWOR = 252;

/** Wpisuje pokonanego potwora. Numer liczy sie od jedynki, tak jak w bazie. */
export function dopiszPotworaDoKlasera(stan: StanKlasera, idPotwora: number): StanKlasera {
  const miejsce = Math.abs(idPotwora) - 1;
  if (miejsce < 0 || miejsce > NAJWYZSZY_POTWOR) return stan;

  const bity = odkodujKlaser(stan.dane);
  if (miejsce >= bity.length || bity[miejsce]) return stan;

  bity[miejsce] = true;
  return { dane: zakodujKlaser(bity), ile: stan.ile + 1 };
}
