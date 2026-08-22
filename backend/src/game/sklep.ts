/**
 * Zasady sklepow — przepisane z `req.php`.
 *
 * Sklepy sa dwa i dzialaja identycznie: zbrojownia (`items_shakes`,
 * w oryginale „sklep 0") i gabinet magii (`items_fidget`, „sklep 1").
 * Rozni je tylko asortyment, ktory rozstrzyga sie w `genItem()`.
 *
 * Kazdy ma szesc miejsc, ponumerowanych od zera. Towar odnawia sie sam
 * o polnocy, a za grzyba mozna wymienic caly wystawiony komplet.
 */

/** Ile miejsc ma jeden sklep — `for ($a = 0; $a < 6; $a++)`. */
export const MIEJSC_W_SKLEPIE = 6;

/** Numery sklepow z oryginalu: `$SHOP_SHAKES` i `$SHOP_FIDGET`. */
export const ZBROJOWNIA = 0;
export const GABINET_MAGII = 1;

/** Wymiana calego towaru kosztuje jednego grzyba. */
export const KOSZT_WYMIANY_TOWARU = 1;

/**
 * Za ile sklep odkupuje rzecz, ktora sam sprzedal.
 *
 * Po zakupie oryginal nadpisuje cene przedmiotu:
 *
 *     $item['gold'] = round((int)$item['gold'] * 0.3);
 *     $item['mush'] = 0;
 *
 * Przedmiot w plecaku nosi wiec juz cene ODKUPU, a nie te, ktora gracz
 * zaplacil. Grzyby przepadaja — kupione za grzyby nie wracaja w grzybach.
 */
/**
 * Ile grzybow wraca za sprzedany przedmiot epicki.
 *
 * SWIADOME ODSTEPSTWO (patrz tabela w CLAUDE.md). Oryginal oddaje przy
 * sprzedazy dokladnie to, co stoi w kolumnie `mush` przedmiotu — a to
 * przy rzeczy kupionej w sklepie jest zero, bo zakup zeruje grzyby.
 * Tutaj epik oddaje dziesiec z pietnastu zaplaconych, zeby dalo sie
 * wymienic niepotrzebna czesc na nastepna.
 */
export const GRZYBY_ZA_SPRZEDAZ_EPIKA = 10;

export const CZESC_CENY_PRZY_ODKUPIE = 0.3;

/**
 * Kiedy towar odnowi sie sam.
 *
 * `rerollItems()` ustawia `shop_reroll_time` na `strtotime('tomorrow')`,
 * czyli najblizsza polnoc czasu serwera. Do tej chwili wejscie do sklepu
 * pokazuje to, co juz lezy na pólce.
 */
export function najblizszaPolnoc(teraz: number): number {
  const d = new Date(teraz * 1000);
  d.setUTCHours(24, 0, 0, 0);
  return Math.floor(d.getTime() / 1000);
}

/** Czy towar sie przeterminowal i trzeba go wylosowac od nowa. */
export function czasNaNowyTowar(teraz: number, terminOdnowienia: number): boolean {
  return teraz > terminOdnowienia;
}

/** Dlaczego zakup sie nie udal. */
export type OdmowaZakupu = 'zajete' | 'za-drogo' | 'brak-grzybow';

/**
 * Czy gracza stac i czy ma gdzie polozyc zakup.
 *
 * Kolejnosc sprawdzen jest z oryginalu i ma znaczenie: najpierw miejsce,
 * potem srebro, na koncu grzyby. Dzieki temu gracz z pustym mieszkiem
 * dowiaduje sie najpierw, ze slot jest zajety.
 */
export function sprawdzZakup(
  {
    cenaZloto,
    cenaGrzyby,
  }: { cenaZloto: number; cenaGrzyby: number },
  { srebro, grzyby, celZajety }: { srebro: number; grzyby: number; celZajety: boolean },
): OdmowaZakupu | null {
  if (celZajety) return 'zajete';
  if (srebro < cenaZloto) return 'za-drogo';
  if (grzyby < cenaGrzyby) return 'brak-grzybow';
  return null;
}

/** Cena, z jaka kupiony przedmiot lezy dalej w plecaku. */
export function cenaPoZakupie(cenaZloto: number): number {
  return Math.round(cenaZloto * CZESC_CENY_PRZY_ODKUPIE);
}
