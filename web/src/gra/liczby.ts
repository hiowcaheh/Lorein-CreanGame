/**
 * Liczby na ekranie.
 *
 * SWIADOME ODSTEPSTWO (tabela w CLAUDE.md). Oryginal nie grupuje cyfr
 * wcale — klient sklada napisy zwyklym `String(liczba)`, wiec pokazuje
 * „155232". Wlasciciel gry poprosil o kropke co trzy cyfry: „155.232".
 *
 * Kropka, a nie odstep z `toLocaleString('pl-PL')`: odstep jest szerszy
 * i przy dluzszych nagrodach napis wchodzil pod ikone zdobyczy.
 */
const SEPARATOR = '.';

export function liczba(wartosc: number): string {
  const calkowita = Math.trunc(Math.abs(wartosc));
  const znak = wartosc < 0 ? '-' : '';
  return znak + String(calkowita).replace(/\B(?=(\d{3})+(?!\d))/g, SEPARATOR);
}

/*
 * Skrot dla wielkich liczb.
 *
 * SWIADOME ODSTEPSTWO (tabela w CLAUDE.md). Przy kilkunastu milionach
 * srebra pelny zapis („18.402.115") nie miescil sie juz w pasku zasobow
 * i wychodzil poza ramke panelu. Wlasciciel gry poprosil o skrot
 * w zapisie znanym z gier przegladarkowych: „k" to tysiac, „kk" milion,
 * „kkk" miliard.
 *
 * Skracamy dopiero OD MILIONA — do tego progu pelna liczba miesci sie
 * bez problemu, a gracz woli widziec dokladna kwote.
 */
const MILION = 1_000_000;
const MILIARD = 1_000_000_000;

export function skrocona(wartosc: number): string {
  const calkowita = Math.trunc(Math.abs(wartosc));
  if (calkowita < MILION) return liczba(wartosc);

  const znak = wartosc < 0 ? '-' : '';
  const [dzielnik, przyrostek] =
    calkowita >= MILIARD ? ([MILIARD, 'kkk'] as const) : ([MILION, 'kk'] as const);

  // Ponizej dziesieciu jednostek jedno miejsce po przecinku ma sens
  // („1,5kk"); wyzej samo by przeszkadzalo („155,3kk" zamiast „155kk").
  const ile = calkowita / dzielnik;
  const zaokraglona = ile < 10 ? Math.floor(ile * 10) / 10 : Math.floor(ile);

  return `${znak}${String(zaokraglona).replace('.', ',')}${przyrostek}`;
}

/**
 * Klasa koloru dla kwoty. Wlasciciel gry poprosil, zeby po samym
 * kolorze bylo widac rzad wielkosci: od miliona zielony, od dziesieciu
 * milionow czerwony. Odcienie z palety gry, nie jaskrawe — patrz
 * `--liczba-duza` i `--liczba-ogromna` w `style/gra.css`.
 */
export function klasaWielkosci(wartosc: number): string {
  const calkowita = Math.trunc(Math.abs(wartosc));
  if (calkowita >= 10 * MILION) return 'ogromna';
  if (calkowita >= MILION) return 'duza';
  return '';
}
