/**
 * Rozbicie cechy — co sklada sie na liczbe stojaca w wierszu.
 *
 * Oryginal takiego okienka nie ma: klient dostaje osobno cechy wlasne
 * (pola 30..34) i dokladke z przedmiotow (35..39), ale pokazuje juz samą
 * SUME. Wlasciciel gry poprosil, zeby po klikniecu w cechę bylo widac,
 * ile z niej daje sama postac, ile zalozone przedmioty, a ile mikstury.
 * SWIADOME ODSTEPSTWO — patrz tabela w CLAUDE.md.
 */

import { liczba } from './liczby';
import type { NazwaCechy } from './typy';

export interface SkladnikiCechy {
  podstawa: number;
  przedmioty: number;
  mikstury: number;
}

const SZEROKOSC = 300;

export function RozbicieCechy({
  nazwa,
  skladniki,
  lewo,
  gora,
  onZamknij,
}: {
  /** Podpis cechy — taki sam, jak w wierszu („Siła", „Wytrzym."). */
  nazwa: string;
  skladniki: SkladnikiCechy;
  /** Lewa krawedz wiersza i jego gorna krawedz — okienko staje NAD nim. */
  lewo: number;
  gora: number;
  onZamknij: () => void;
}) {
  const razem = skladniki.podstawa + skladniki.przedmioty + skladniki.mikstury;

  // Trzy albo cztery wiersze plus naglowek — tyle wysokosci trzeba nad polem.
  const wierszy = 2 + (skladniki.przedmioty > 0 ? 1 : 0) + (skladniki.mikstury > 0 ? 1 : 0);
  const wysokosc = 16 + wierszy * 26;

  return (
    <div
      className="podpowiedz rozbicie-cechy"
      style={{
        left: Math.min(Math.max(0, lewo), 1000 - SZEROKOSC),
        top: Math.max(0, gora - wysokosc - 8),
        width: SZEROKOSC,
      }}
      onClick={onZamknij}
      role="dialog"
      aria-label={nazwa}
    >
      <div className="nazwa">{nazwa}</div>
      <div className="wiersz">
        <span>Z cech postaci</span>
        <span>{liczba(skladniki.podstawa)}</span>
      </div>
      {skladniki.przedmioty > 0 && (
        <div className="wiersz zPrzedmiotow">
          <span>Z przedmiotów</span>
          <span>+{liczba(skladniki.przedmioty)}</span>
        </div>
      )}
      {skladniki.mikstury > 0 && (
        <div className="wiersz zMikstur">
          <span>Z mikstur</span>
          <span>+{liczba(skladniki.mikstury)}</span>
        </div>
      )}
      <div className="wiersz razem">
        <span>Razem</span>
        <span>{liczba(razem)}</span>
      </div>
    </div>
  );
}

/** Nazwy cech w kolejnosci wierszy — do wskazania, ktora jest otwarta. */
export const CECHY_PO_KOLEI: readonly NazwaCechy[] = [
  'sila',
  'zrecznosc',
  'intelekt',
  'wytrzymalosc',
  'szczescie',
];
