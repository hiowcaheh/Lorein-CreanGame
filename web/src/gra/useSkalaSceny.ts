/**
 * Mnoznik sceny.
 *
 * Oryginal to sztywna scena 1280x800: panel menu 280x700 w punkcie (0,100)
 * i ekran gry 1000x700 tuz obok. Odtwarzamy ten uklad co do piksela, ale
 * na ekranach kazdego rozmiaru — wiec kazde polozenie w CSS jest podane
 * w pikselach ORYGINALU i przemnozone przez `--skala`.
 *
 * Ten mnoznik musi byc policzony z prawdziwego rozmiaru miejsca na gre.
 * Wczesniej dobieraly go progi `@media`, ktore patrza wylacznie na
 * szerokosc okna — i na telefonie w poziomie (844 px szerokosci, ale tylko
 * 390 px wysokosci) wychodzila scena wyzsza niz ekran. Stad przewijanie
 * i wielki ciemny prostokat obok gry.
 *
 * Bierzemy mniejszy z dwoch mnoznikow — z wysokosci i z szerokosci — wiec
 * scena zawsze miesci sie w calosci i nigdy nie ma czego przewijac.
 */

import { useEffect, useRef } from 'react';

/** Wysokosc panelu menu i ekranu gry w oryginale. */
const WYSOKOSC_SCENY = 700;
/** Szerokosc samego ekranu gry. */
const SZEROKOSC_EKRANU = 1000;
/** Szerokosc panelu menu. */
const SZEROKOSC_MENU = 280;

/**
 * @param zMenu czy panel menu stoi OBOK gry (szeroki ekran) i trzeba mu
 *              zarezerwowac miejsce, czy wjezdza na nia jako nakladka.
 */
export function useSkalaSceny<T extends HTMLElement>(zMenu: boolean) {
  const uchwyt = useRef<T>(null);

  useEffect(() => {
    const element = uchwyt.current;
    if (!element) return;

    const przelicz = () => {
      const { width, height } = element.getBoundingClientRect();
      if (width <= 0 || height <= 0) return;

      const potrzebnaSzerokosc = SZEROKOSC_EKRANU + (zMenu ? SZEROKOSC_MENU : 0);
      const skala = Math.min(height / WYSOKOSC_SCENY, width / potrzebnaSzerokosc);

      // Zaokraglenie w dol o pol piksela: bez tego suma szerokosci potrafi
      // wyjsc o setne czesci piksela poza okno i przegladarka pokazuje pasek.
      element.style.setProperty('--skala', String(Math.floor(skala * 1000) / 1000));
    };

    przelicz();

    const obserwator = new ResizeObserver(przelicz);
    obserwator.observe(element);
    return () => obserwator.disconnect();
  }, [zMenu]);

  return uchwyt;
}
