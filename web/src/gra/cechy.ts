/**
 * Kupowanie punktow cech — strona ekranu.
 *
 * Serwer podaje gotowa cene kazdej cechy; tutaj zostaje tylko to, co
 * robil z nia klient Flash: rozbicie na zloto i srebro oraz obcinanie
 * koncowki przy cenach powyzej 9999.
 */

/** Ile punktow daje jeden zakup — `$newStatVal = 3 + $stat`. */
export const PUNKTOW_ZA_ZAKUP = 3;

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
  if (zloto > 0) czesci.push(`${zloto.toLocaleString('pl-PL')} złota`);
  if (srebro > 0 || zloto === 0) czesci.push(`${srebro} srebra`);
  return czesci.join(' ');
}
