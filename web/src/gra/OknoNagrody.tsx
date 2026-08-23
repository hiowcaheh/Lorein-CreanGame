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

export const SZEROKOSC_OKNA_NAGRODY = 320;

/** Ile wierszy zmiesci okienko — z tego wychodzi jego wysokosc. */
export function wysokoscOknaNagrody(
  rodzaj: RodzajNagrody,
  premie: PremieNagrody | undefined,
): number {
  const skladniki = wierszePremii(premie);
  // Naglowek + „Razem" zawsze; dalej podstawa i premie albo srebro.
  const wierszy = rodzaj === 'exp' ? 2 + (skladniki.length > 0 ? 2 + skladniki.length : 0) : 3;
  return 16 + wierszy * 26;
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
      {rodzaj === 'exp' ? (
        <>
          <div className="nazwa">Doświadczenie</div>
          {skladniki.length > 0 && (
            <>
              <div className="wiersz">
                <span>Za samo zadanie</span>
                <span>{liczba(podstawa)}</span>
              </div>
              {skladniki.map((p) => (
                <div className={`wiersz ${p.klasa}`} key={p.klasa}>
                  <span>
                    {p.podpis} +{p.ile}%
                  </span>
                  <span>+{liczba(udzial(p.ile))}</span>
                </div>
              ))}
              <div className="wiersz odstep" />
            </>
          )}
          <div className="wiersz razem">
            <span>Razem</span>
            <span>{liczba(wartosc)}</span>
          </div>
        </>
      ) : (
        <>
          <div className="nazwa">Pieniądze</div>
          <div className="wiersz">
            <span>Złoto</span>
            <span>
              {liczba(Math.floor(wartosc / 100))}
              <img src="/res/sfgame/if/icon_gold.png" alt="złota" />
            </span>
          </div>
          <div className="wiersz">
            <span>Srebro</span>
            <span>
              {wartosc % 100}
              <img src="/res/sfgame/if/icon_silber.png" alt="srebra" />
            </span>
          </div>
          {skladniki.map((p) => (
            <div className={`wiersz ${p.klasa}`} key={p.klasa}>
              <span>
                {p.podpis} +{p.ile}%
              </span>
              <span>+{liczba(Math.floor(udzial(p.ile) / 100))}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
