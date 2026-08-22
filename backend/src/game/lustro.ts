/**
 * Magiczne Lustro — port kolumny `magic_mirror` z `req.php`.
 *
 * Lustro sklada sie z TRZYNASTU kawalkow. Kolumna trzyma je jako trzynascie
 * znakow „0" albo „1" — po jednym na kawalek, w kolejnosci numerow
 * przedmiotu:
 *
 *     $user_data['magic_mirror'][$item['item_id'] - 30] = '1';
 *
 * Odlamki (rodzaj 11, numery 30-42) wypadaja z wypraw od piecdziesiatego
 * poziomu i tylko wtedy, gdy w plecaku nie lezy juz jeden.
 *
 * PO CO ONO JEST: dopoki lustro nie jest kompletne, wejscie na arene
 * i do lochow jest zamkniete, kiedy bohater jest zajety — pracuje na
 * warcie (`status == 1`) albo idzie na wyprawe (`status == 2`):
 *
 *     if ($status === 1 && $mirror < $fullMirror) { ... zajety ... }
 *     if ($status === 2 && $mirror < $fullMirror) { ... zajety ... }
 *
 * Komplet znosi ten warunek: z pelnym lustrem bije sie na arenie
 * i schodzi do lochow BEZ przerywania wyprawy. To cala jego moc —
 * do walki nic nie dodaje.
 */

/** Ile kawalkow ma lustro. */
export const KAWALKOW = 13;

/** Rodzaj przedmiotu, ktorym jest odlamek — ten sam, co klucz do lochu. */
export const RODZAJ_ODLAMKA = 11;

/** Numery przedmiotu: 30 to pierwszy kawalek, 42 ostatni. */
export const PIERWSZY_ODLAMEK = 30;
export const OSTATNI_ODLAMEK = PIERWSZY_ODLAMEK + KAWALKOW - 1;

/** Od tego poziomu odlamki w ogole wypadaja — `$lvl >= 50`. */
export const POZIOM_ODLAMKOW = 50;

/** Zapis pustego i kompletnego lustra. */
export const BEZ_LUSTRA = '0'.repeat(KAWALKOW);
export const PELNE_LUSTRO = '1'.repeat(KAWALKOW);

/** Zapis kolumny na trzynascie znacznikow; krotszy uzupelnia sie zerami. */
export function kawalkiLustra(zapis: unknown): boolean[] {
  const tekst = typeof zapis === 'string' ? zapis : '';
  return Array.from({ length: KAWALKOW }, (_, i) => tekst[i] === '1');
}

/** Czy lustro jest kompletne — `$magic_mirror == '1111111111111'`. */
export function maPelneLustro(zapis: unknown): boolean {
  return kawalkiLustra(zapis).every(Boolean);
}

/** Numery odlamkow, ktorych jeszcze brakuje — `$canGen` w `genItem()`. */
export function brakujaceOdlamki(zapis: unknown): number[] {
  return kawalkiLustra(zapis)
    .map((jest, i) => (jest ? 0 : PIERWSZY_ODLAMEK + i))
    .filter((numer) => numer > 0);
}

/** Czy ten numer przedmiotu to odlamek lustra. */
export function czyOdlamek(rodzaj: number, numer: number): boolean {
  return rodzaj === RODZAJ_ODLAMKA && numer >= PIERWSZY_ODLAMEK && numer <= OSTATNI_ODLAMEK;
}

/** Wstawia kawalek na jego miejsce i oddaje nowy zapis kolumny. */
export function dopiszKawalek(zapis: unknown, numer: number): string {
  const kawalki = kawalkiLustra(zapis);
  const miejsce = numer - PIERWSZY_ODLAMEK;
  if (miejsce >= 0 && miejsce < KAWALKOW) kawalki[miejsce] = true;
  return kawalki.map((jest) => (jest ? '1' : '0')).join('');
}
