/**
 * Migotanie kawalkow Magicznego Lustra — port `MirrorAniFn` z klienta.
 *
 *     mirrorFadeAmount -= 0.002;   // zegar chodzi co 25 ms
 *     if (mirrorFadeAmount <= 0) { mirrorFadeAmount = 0; timer.stop(); }
 *     mirrorAniStep += 0.1;
 *     alpha[i] = 0.3 + sin(mirrorAniStep + (i / 13) * 2 * PI) * mirrorFadeAmount;
 *
 * Fala idzie wiec przez wszystkie trzynascie kawalkow i gasnie w okolo
 * stu tickach, czyli w dwie i pol sekundy. Oryginal odpala ja po kazdym
 * wprawionym odlamku (`RESP_SAVEGAME_SHARD`).
 */

import { useEffect, useRef, useState } from 'react';

/** `new Timer(25)`. */
const KROK_MS = 25;
/** `mirrorFadeAmount = 0.2` przy starcie. */
const SILA_STARTOWA = 0.2;
/** `mirrorFadeAmount -= 0.002` na tick. */
const GASNIE_O = 0.002;
/** `mirrorAniStep += 0.1` na tick. */
const KROK_FALI = 0.1;
/** `actor[...].alpha = 0.3` — spoczynek. */
export const PRZEZROCZYSTOSC_KAWALKA = 0.3;

export const KAWALKOW_LUSTRA = 13;

export interface StanLustra {
  /** Przezroczystosc kazdego z trzynastu kawalkow. */
  przezroczystosci: number[];
  /** Czy trwa blysk konczacy skladanie. */
  blysk: boolean;
}

/**
 * Ile kawalkow gracz ma wprawionych — po zmianie tej liczby rusza fala.
 * `zlozone` odpala osobny, jednorazowy blysk na pozegnanie kawalkow.
 */
export function useLustro(ile: number, zlozone: boolean): StanLustra {
  const [przezroczystosci, setPrzezroczystosci] = useState<number[]>(() =>
    Array.from({ length: KAWALKOW_LUSTRA }, () => PRZEZROCZYSTOSC_KAWALKA),
  );
  const [blysk, setBlysk] = useState(false);
  const poprzednie = useRef({ ile, zlozone });

  useEffect(() => {
    const bylo = poprzednie.current;
    poprzednie.current = { ile, zlozone };

    // Pierwsze wejscie na ekran niczego nie odpala — animacja nalezy sie
    // ZMIANIE, a nie samemu pokazaniu portretu.
    const przybylo = ile > bylo.ile;
    const wlasnieZlozone = zlozone && !bylo.zlozone;
    if (!przybylo && !wlasnieZlozone) return;

    setBlysk(wlasnieZlozone);

    let sila = SILA_STARTOWA;
    let faza = 0;

    const zegar = setInterval(() => {
      sila -= GASNIE_O;
      faza += KROK_FALI;

      if (sila <= 0) {
        clearInterval(zegar);
        setPrzezroczystosci(
          Array.from({ length: KAWALKOW_LUSTRA }, () => PRZEZROCZYSTOSC_KAWALKA),
        );
        setBlysk(false);
        return;
      }

      setPrzezroczystosci(
        Array.from(
          { length: KAWALKOW_LUSTRA },
          (_, i) =>
            PRZEZROCZYSTOSC_KAWALKA +
            Math.sin(faza + (i / KAWALKOW_LUSTRA) * 2 * Math.PI) * sila,
        ),
      );
    }, KROK_MS);

    return () => clearInterval(zegar);
  }, [ile, zlozone]);

  return { przezroczystosci, blysk };
}
