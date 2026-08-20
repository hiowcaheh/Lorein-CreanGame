/**
 * Podpowiedz przedmiotu — odpowiednik `ItemPopup` z oryginalu.
 *
 * Wyglad wprost z klienta Flash (`EnablePopup`): czarne tlo o
 * przezroczystosci 0,8, obwodka szerokosci 1 px w kolorze CLR_SFORANGE,
 * prostokat bez zaokraglen. Pierwszy wiersz to nazwa, dalej ida wartosci
 * przedmiotu, a na koncu cena.
 *
 * Roznica wobec oryginalu jest jedna i celowa: tam podpowiedz pokazywala
 * sie po najechaniu myszka, tutaj po klikNIECIU. Na telefonie nie ma
 * czego najezdzac, a gra ma dzialac na telefonie.
 */

import { cenaPrzedmiotu, cytatPrzedmiotu, nazwaPrzedmiotu, wierszeOpisu } from './przedmioty';
import type { Przedmiot } from './typy';

/** Szerokosc podpowiedzi w pikselach sceny. Kolumna wartosci na 137 px
 *  (REL_POPUP_TAB = 120 plus REL_POPUP_TAB_ADD = 17). */
const SZEROKOSC = 300;
const KOLUMNA_WARTOSCI = 137;

/** Rozmiar ekranu gry — podpowiedz nie moze z niego wyjsc. */
const SZEROKOSC_EKRANU = 1000;
const WYSOKOSC_EKRANU = 700;

export interface MiejscePodpowiedzi {
  /** Srodek miejsca, wzgledem lewego gornego rogu ekranu gry. */
  x: number;
  /** Gorna krawedz miejsca. */
  y: number;
}

export function PodpowiedzPrzedmiotu({
  przedmiot,
  miejsce,
  onZamknij,
}: {
  przedmiot: Przedmiot;
  miejsce: MiejscePodpowiedzi;
  onZamknij: () => void;
}) {
  const wiersze = wierszeOpisu(przedmiot);
  const cytat = cytatPrzedmiotu(przedmiot);
  const cena = cenaPrzedmiotu(przedmiot);

  // Wysokosc liczymy z liczby wierszy, zeby podpowiedz stanela NAD miejscem
  // i nie zaslanila samego przedmiotu.
  const wierszy = 1 + (cytat ? 1 : 0) + wiersze.length + 1;
  const wysokosc = 16 + wierszy * 26;

  const lewo = Math.min(
    Math.max(0, miejsce.x - SZEROKOSC / 2),
    SZEROKOSC_EKRANU - SZEROKOSC,
  );
  const gora = Math.min(Math.max(0, miejsce.y - wysokosc - 8), WYSOKOSC_EKRANU - wysokosc);

  return (
    <div
      className="podpowiedz"
      style={{ left: lewo, top: gora, width: SZEROKOSC }}
      onClick={onZamknij}
      role="dialog"
      aria-label={nazwaPrzedmiotu(przedmiot)}
    >
      <div className="nazwa">{nazwaPrzedmiotu(przedmiot)}</div>

      {cytat && <div className="cytat">{cytat}</div>}

      {wiersze.map((w) => (
        <div className="wiersz" key={w.etykieta}>
          <span>{w.etykieta}</span>
          <span style={{ left: KOLUMNA_WARTOSCI }}>{w.wartosc}</span>
        </div>
      ))}

      {/*
        Cena — w oryginale bez zadnego podpisu, sama liczba i ikona
        monety, zloto tylko wtedy, gdy jest go wiecej niz zero.
      */}
      <div className="wiersz cena">
        {cena.zloto > 0 && (
          <>
            {cena.zloto}
            <img src="/res/sfgame/if/icon_gold.png" alt="złota" />
          </>
        )}
        {cena.srebro}
        <img src="/res/sfgame/if/icon_silber.png" alt="srebra" />
      </div>
    </div>
  );
}
