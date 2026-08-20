/**
 * Ustawia rozmiar pisma proporcjonalnie do szerokosci ekranu gry.
 *
 * Probowalem to zrobic jednostkami kontenerowymi (`cqw`) i okazalo sie
 * zawodne: element nie moze odpytac sam siebie o wlasna szerokosc, a gdy
 * `container-type` siedzi wyzej, przelicznik lapie sie na inny wymiar niz
 * potrzebny. Efekt byl taki, ze czcionka rosla o kilkadziesiat procent za
 * duzo i nazwy cech nie miescily sie w kolumnach.
 *
 * Pomiar jest jednoznaczny: bierzemy prawdziwa szerokosc elementu i liczymy
 * z niej rozmiar pisma. Oryginal uzywal 15,5 px przy scenie szerokiej na
 * 1000 px, czyli dokladnie 1,55%.
 */

import { useEffect, useRef } from 'react';

const UDZIAL = 0.0155;

/*
 * Dolne ograniczenie musi byc NISKIE.
 *
 * Przy 8 px na waskim ekranie pismo bylo o jedna trzecia wieksze, niz
 * wynika z proporcji — a skoro kolumny sa ułozone dokladnie jak
 * w oryginale, tekst przestawal sie w nich miescic i nazwy cech zamienialy
 * sie w "Zr...", "Int...", "Obr...". Uklad jest wierna miniatura sceny
 * 1000 px, wiec pismo tez musi sie zmniejszac razem z nia.
 *
 * Na telefonie 6 px przy trzykrotnej gestosci ekranu to 18 pikseli
 * fizycznych — czyta sie to normalnie.
 */
const NAJMNIEJ = 5;
const NAJWIECEJ = 20;

export function useSkalaPisma<T extends HTMLElement>() {
  const uchwyt = useRef<T>(null);

  useEffect(() => {
    const element = uchwyt.current;
    if (!element) return;

    const przelicz = () => {
      const szerokosc = element.getBoundingClientRect().width;
      if (szerokosc <= 0) return;
      const pismo = Math.min(NAJWIECEJ, Math.max(NAJMNIEJ, szerokosc * UDZIAL));
      element.style.fontSize = `${pismo}px`;
    };

    przelicz();

    const obserwator = new ResizeObserver(przelicz);
    obserwator.observe(element);
    return () => obserwator.disconnect();
  }, []);

  return uchwyt;
}
