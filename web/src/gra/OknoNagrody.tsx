/**
 * Rozpisanie JEDNEJ nagrody — doswiadczenia albo pieniedzy.
 *
 * Odstepstwo od oryginalu (tabela w CLAUDE.md): oryginal podwiesza pod
 * doswiadczeniem sama podpowiedz z procentami (`EnablePopup(LBL_QO_REWARDEXP,
 * ...)`), a przy pieniadzach nie ma nic. Wlasciciel gry poprosil, zeby
 * kazda nagroda miala WLASNE okienko: klikniecie w doswiadczenie mowi
 * o doswiadczeniu, klikniecie w zloto — o zlocie.
 *
 * Tego samego okienka uzywa karczma PRZED wyprawa i ekran po walce.
 */

import { lacznaPremia, wierszePremii, type PremieNagrody } from './premie';
import { liczba } from './liczby';

export type RodzajNagrody = 'exp' | 'zloto';

export const SZEROKOSC_OKNA_NAGRODY = 350;

/** Ile wierszy zmiesci okienko — z tego wychodzi jego wysokosc. */
export function wysokoscOknaNagrody(
  _rodzaj: RodzajNagrody,
  premie: PremieNagrody | undefined,
): number {
  const skladniki = wierszePremii(premie);
  // Naglowek i „Razem" zawsze; przy premiach dochodzi podstawa, kazde
  // zrodlo i pusty wiersz oddzielajacy.
  const wierszy = 2 + (skladniki.length > 0 ? 2 + skladniki.length : 0);
  return 16 + wierszy * 26;
}

/**
 * Jedna liczba w wierszu. Doswiadczenie to gole punkty; pieniadze ida
 * w zlocie i srebrze, przy czym srebro pokazuje sie tylko wtedy, gdy
 * jakies zostalo — tak samo, jak w pasku zasobow.
 */
function kwota(wartosc: number, rodzaj: RodzajNagrody) {
  if (rodzaj === 'exp') return liczba(wartosc);

  const zlote = Math.floor(wartosc / 100);
  const srebrne = wartosc % 100;

  return (
    <>
      {liczba(zlote)}
      <img src="/res/sfgame/if/icon_gold.png" alt="złota" />
      {srebrne > 0 && (
        <>
          {srebrne}
          <img src="/res/sfgame/if/icon_silber.png" alt="srebra" />
        </>
      )}
    </>
  );
}

export function OknoNagrody({
  rodzaj,
  wartosc,
  premie,
  lewo,
  gora,
  onZamknij,
}: {
  rodzaj: RodzajNagrody;
  /** Doswiadczenie w punktach albo CALA kwota w srebrze. */
  wartosc: number;
  /** Premie, ktore juz siedza w tej liczbie. Brak, gdy nagroda ich nie ma. */
  premie: PremieNagrody | undefined;
  lewo: number;
  gora: number;
  onZamknij: () => void;
}) {
  const skladniki = wierszePremii(premie);
  const razem = lacznaPremia(premie);

  /*
   * Liczba przychodzi z serwera JUZ z premiami — tak samo, jak podaje ja
   * `req.php`. Zeby pokazac, ile dokłada kazde zrodlo, trzeba wiec cofnac
   * mnozenie: podstawa to `wartosc / (1 + premie)`, a udzial jednego
   * zrodla — `podstawa * jego procent`. Suma czlonow moze sie roznic
   * od calosci o jeden punkt, bo kazdy jest osobno zaokraglony.
   */
  const podstawa = razem > 0 ? Math.round(wartosc / (1 + razem / 100)) : wartosc;
  const udzial = (procent: number) => Math.round((podstawa * procent) / 100);

  return (
    <div
      className="podpowiedz okno-nagrody"
      style={{ left: lewo, top: gora, width: SZEROKOSC_OKNA_NAGRODY }}
      onClick={onZamknij}
      role="dialog"
      aria-label={rodzaj === 'exp' ? 'Doświadczenie' : 'Pieniądze'}
    >
      <div className="nazwa">{rodzaj === 'exp' ? 'Doświadczenie' : 'Pieniądze'}</div>

      {/*
        Rozpisanie jest to samo dla obu nagrod: najpierw ile bylo GOLE,
        potem co dolozylo kazde zrodlo, na koncu suma. Pieniadze roznia
        sie tylko tym, ze kazda liczba idzie w zlocie i srebrze.
      */}
      {skladniki.length > 0 && (
        <>
          <div className="wiersz">
            <span>{rodzaj === 'exp' ? 'Za samo zadanie' : 'Bez premii'}</span>
            <span>{kwota(podstawa, rodzaj)}</span>
          </div>
          {skladniki.map((p) => (
            <div className={`wiersz ${p.klasa}`} key={p.klasa}>
              <span>
                {p.podpis} +{p.ile}%
              </span>
              <span>+{kwota(udzial(p.ile), rodzaj)}</span>
            </div>
          ))}
          <div className="wiersz odstep" />
        </>
      )}

      <div className="wiersz razem">
        {/* „Razem" tylko wtedy, gdy naprawde jest co sumowac. */}
        <span>{skladniki.length > 0 ? 'Razem' : 'Nagroda'}</span>
        <span>{kwota(wartosc, rodzaj)}</span>
      </div>
    </div>
  );
}
