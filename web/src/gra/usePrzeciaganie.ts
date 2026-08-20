/**
 * Przeciaganie przedmiotow.
 *
 * Oryginal lapal przedmiot mysza i ciagnal go po ekranie. Robimy to samo,
 * ale na zdarzeniach wskaznika (`pointer*`), a nie na `drag*` z HTML5:
 * te drugie na dotyku albo nie dzialaja wcale, albo wymagaja
 * przytrzymania i wygladaja jak zaznaczanie tekstu. Zdarzenia wskaznika
 * obsluguja mysz i palec tym samym kodem.
 *
 * Krotkie dotkniecie bez ruchu to nie przeciaganie, tylko klikniecie —
 * pokazuje podpowiedz przedmiotu.
 */

import { useCallback, useRef, useState } from 'react';
import type { Przedmiot } from './typy';

/**
 * Ile pikselow trzeba przesunac, zeby to bylo przeciaganie, a nie
 * klikniecie. Palec nigdy nie stoi idealnie w miejscu.
 */
const PROG_RUCHU = 6;

/** Rozmiar ekranu gry — polozenia liczymy w jego pikselach. */
const SZEROKOSC_EKRANU = 1000;
const WYSOKOSC_EKRANU = 700;

export interface StanPrzeciagania {
  przedmiot: Przedmiot;
  /** Polozenie kursora w pikselach ekranu gry. */
  x: number;
  y: number;
  /** Miejsce pod kursorem, albo `null` gdy kursor jest poza miejscami. */
  nad: number | null;
}

export function usePrzeciaganie({
  ekran,
  onUpusc,
  onKlik,
}: {
  /** Element ekranu gry — z niego liczymy przeliczik pikseli. */
  ekran: React.RefObject<HTMLElement | null>;
  /** `cel === null` znaczy „zaloz na wlasciwe miejsce". */
  onUpusc: (przedmiot: Przedmiot, cel: number | null) => void;
  onKlik: (przedmiot: Przedmiot) => void;
}) {
  const [stan, setStan] = useState<StanPrzeciagania | null>(null);
  const poczatek = useRef<{ x: number; y: number; ruszone: boolean } | null>(null);

  /**
   * Przelicza polozenie kursora na piksele ekranu gry.
   *
   * Cala scena jest przeskalowana `transform`em, i to NIEROWNOMIERNIE,
   * wiec nie da sie tu uzyc jednego mnoznika — kazda os ma swoj wlasny.
   */
  const naEkran = useCallback(
    (klientX: number, klientY: number) => {
      const el = ekran.current;
      if (!el) return { x: 0, y: 0 };
      const r = el.getBoundingClientRect();
      return {
        x: ((klientX - r.left) / r.width) * SZEROKOSC_EKRANU,
        y: ((klientY - r.top) / r.height) * WYSOKOSC_EKRANU,
      };
    },
    [ekran],
  );

  /** Miejsce pod kursorem — czyta je z atrybutu `data-slot`. */
  function slotPod(klientX: number, klientY: number): number | null {
    const pod = document.elementFromPoint(klientX, klientY);
    const miejsce = pod?.closest('[data-slot]');
    if (!miejsce) return null;
    const numer = Number(miejsce.getAttribute('data-slot'));
    return Number.isInteger(numer) ? numer : null;
  }

  function zacznij(e: React.PointerEvent, przedmiot: Przedmiot) {
    // Tylko lewy przycisk i dotyk; prawy zostawiamy przegladarce.
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    poczatek.current = { x: e.clientX, y: e.clientY, ruszone: false };
    setStan({ przedmiot, ...naEkran(e.clientX, e.clientY), nad: przedmiot.slot });
  }

  function ruch(e: React.PointerEvent) {
    const start = poczatek.current;
    if (!start) return;

    if (!start.ruszone) {
      const dystans = Math.hypot(e.clientX - start.x, e.clientY - start.y);
      if (dystans < PROG_RUCHU) return;
      start.ruszone = true;
    }

    setStan((s) =>
      s ? { ...s, ...naEkran(e.clientX, e.clientY), nad: slotPod(e.clientX, e.clientY) } : s,
    );
  }

  function koniec(e: React.PointerEvent) {
    const start = poczatek.current;
    const biezacy = stan;
    poczatek.current = null;
    setStan(null);
    if (!start || !biezacy) return;

    if (!start.ruszone) {
      onKlik(biezacy.przedmiot);
      return;
    }

    const cel = slotPod(e.clientX, e.clientY);
    if (cel === biezacy.przedmiot.slot) return;

    /*
     * Upuszczenie POZA miejscami znaczy „zaloz na wlasciwe miejsce" —
     * tak jak w oryginale, gdzie przeciagniecie przedmiotu na postac
     * zakladalo go tam, gdzie trzeba. Przedmiot juz zalozony nie ma sie
     * gdzie zalozyc drugi raz, wiec po prostu wraca.
     */
    if (cel === null) {
      if (biezacy.przedmiot.slot >= 10) onUpusc(biezacy.przedmiot, null);
      return;
    }

    onUpusc(biezacy.przedmiot, cel);
  }

  return {
    stan,
    /** Czy przedmiot jest naprawde ciagniety, a nie tylko przytrzymany. */
    ciagnie: stan !== null && poczatek.current?.ruszone === true,
    uchwyty: (przedmiot: Przedmiot) => ({
      onPointerDown: (e: React.PointerEvent) => zacznij(e, przedmiot),
      onPointerMove: ruch,
      onPointerUp: koniec,
      onPointerCancel: () => {
        poczatek.current = null;
        setStan(null);
      },
    }),
  };
}
