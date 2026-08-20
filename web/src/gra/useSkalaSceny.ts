/**
 * Dopasowanie sceny do okna.
 *
 * Oryginal to sztywna scena 1280x800: pas z tytulem 1280x100 u gory, panel
 * menu 280x700 pod nim po lewej i ekran gry 1000x700 obok. Odtwarzamy ja
 * DOSLOWNIE — kazde polozenie w arkuszu stylow jest podane w pikselach
 * oryginalu — a do okna dopasowuje ja jedno `transform: scale()`.
 *
 * Skalowanie jest NIEROWNOMIERNE, i tak ma byc. Tak samo zachowywal sie
 * odtwarzacz Flasha rozciagniety na okno przegladarki: przy ekranie
 * szerszym niz 1,6:1 obraz robil sie odrobine szerszy, zamiast zostawiac
 * czarne pasy po bokach. Gra ma wypelniac ekran.
 *
 * Rozjazd proporcji jest jednak ograniczony. Bez tego telefon trzymany
 * pionowo rozciagnalby scene ponad trzykrotnie i postacie zrobilyby sie
 * plaskie jak nalesniki. Kiedy okno wychodzi poza te granice, scena
 * dostaje najwiekszy dopuszczalny rozmiar i jest wysrodkowana.
 */

import { useEffect, useRef } from 'react';

export const SZEROKOSC_SCENY = 1280;
export const WYSOKOSC_SCENY = 800;

/**
 * Dopuszczalny stosunek `skala pionowa / skala pozioma`.
 *
 * 0,78 znaczy: obraz moze byc najwyzej okolo 28% szerszy, niz wynika
 * z proporcji. Tyle wlasnie ma oryginal rozciagniety na ekran telefonu
 * w poziomie i wyglada dobrze.
 */
const NAJMNIEJ = 0.78;
const NAJWIECEJ = 1.25;

export function useSkalaSceny<T extends HTMLElement>() {
  const uchwyt = useRef<T>(null);

  useEffect(() => {
    const element = uchwyt.current;
    if (!element) return;

    const rodzic = element.parentElement;
    if (!rodzic) return;

    const przelicz = () => {
      const { width, height } = rodzic.getBoundingClientRect();
      if (width <= 0 || height <= 0) return;

      let sx = width / SZEROKOSC_SCENY;
      let sy = height / WYSOKOSC_SCENY;

      if (sy / sx < NAJMNIEJ) sx = sy / NAJMNIEJ;         // okno za szerokie
      else if (sy / sx > NAJWIECEJ) sy = sx * NAJWIECEJ;  // okno za wysokie

      element.style.setProperty('--sx', String(sx));
      element.style.setProperty('--sy', String(sy));
    };

    przelicz();

    const obserwator = new ResizeObserver(przelicz);
    obserwator.observe(rodzic);
    return () => obserwator.disconnect();
  }, []);

  return uchwyt;
}
