import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import {
  RASY,
  liczbaKolorow,
  liczbaWariantow,
  losowyWyglad,
  warstwaKoloruje,
  warstwyPortretu,
} from '../src/gra/portret';
import type { Plec } from '../src/gra/postac-dane';

/**
 * Portret sklada sie z kilkunastu plikow PNG, a ich nazwy powstaja z regul
 * przepisanych z klienta Flash. Blad w regule niczego nie wywala — po prostu
 * jedna warstwa sie nie wczyta i postac wyglada dziwnie. Dlatego test siega
 * na dysk.
 *
 * Sprawdzenie jest WYCZERPUJACE, nie losowe: kazda rasa, plec, warstwa,
 * kolor i wariant. Losowanie dawalo wynik chwiejny — raz trafialo w dziury
 * w oryginalnym komplecie grafik, raz nie.
 */

const KATALOG = new URL('../../sf555/res/sfgame/char/', import.meta.url).pathname;

const NAZWY_WARSTW: Record<number, string> = {
  1: 'mund', 2: 'bart', 3: 'nase', 4: 'augen', 5: 'brauen',
  6: 'ohren', 7: 'haare', 8: 'special', 9: 'special2',
};

/**
 * Kombinacje, ktorych w oryginalnej paczce po prostu nie ma — np. brak
 * `human_bart_1_8.png` przy istniejacych `2_8`, `4_8` i `5_8`. Gra tez ich
 * nie miala; taka warstwa sie nie rysuje. Lista jest tu po to, zeby kazda
 * NOWA dziura oznaczala blad w regule budowania nazwy, a nie kolejny
 * wyjatek do zignorowania.
 */
const ZNANE_DZIURY = [
  'human m/human_bart_3_1.png',
  'human m/human_bart_5_2.png',
  'human m/human_bart_5_7.png',
  'human m/human_bart_1_8.png',
  'human m/human_bart_5_8.png',
  'human m/human_bart_1_13.png',
  'human m/human_bart_3_13.png',
  'human m/human_haare_1_6.png',
  'elf f/elf_female_brauen_2_6.png',
];

describe('portret — komplet warstw wobec plikow na dysku', () => {
  it('kazda kombinacja rasy, plci, warstwy i koloru ma swoj plik', () => {
    const braki: string[] = [];

    for (const plec of ['m', 'f'] as Plec[]) {
      for (const rasa of Object.keys(RASY).map(Number)) {
        const r = RASY[rasa as keyof typeof RASY];
        const przedrostek = `${r}_${plec === 'f' ? 'female_' : ''}`;
        const kolory = liczbaKolorow(rasa, plec);

        for (const [nr, warstwa] of Object.entries(NAZWY_WARSTW)) {
          const ile = liczbaWariantow(rasa, plec, Number(nr));
          if (ile === 0) continue;
          const koloruje = warstwaKoloruje(rasa, plec, Number(nr));

          for (let i = 1; i <= ile; i++) {
            for (let k = 1; k <= (koloruje ? kolory : 1); k++) {
              const nazwa = koloruje
                ? `${przedrostek}${warstwa}_${k}_${i}.png`
                : `${przedrostek}${warstwa}${i}.png`;
              const wzgledna = `${r} ${plec}/${nazwa}`;
              if (!existsSync(KATALOG + wzgledna)) braki.push(wzgledna);
            }
          }
        }
      }
    }

    expect(braki.sort()).toEqual([...ZNANE_DZIURY].sort());
  });

  it('cialo kazdej rasy, plci i klasy istnieje', () => {
    const braki: string[] = [];
    for (const plec of ['m', 'f'] as Plec[]) {
      for (const rasa of Object.keys(RASY).map(Number)) {
        for (const klasa of [1, 2, 3]) {
          const cialo = warstwyPortretu({ rasa, plec, klasa, czesci: [] })[0]!;
          if (!existsSync(KATALOG + cialo.replace('/res/sfgame/char/', ''))) braki.push(cialo);
        }
      }
    }
    expect(braki).toEqual([]);
  });
});

describe('portret — reguly skladania', () => {
  it('losowy wyglad daje warstwy, ktore prawie zawsze istnieja', () => {
    // 8 ras x 2 plcie x 200 losowan. Dziur jest 9 na ~1900 kombinacji,
    // wiec pudel musi byc znikomo malo.
    let wszystkie = 0;
    let pudla = 0;

    for (const plec of ['m', 'f'] as Plec[]) {
      for (const rasa of Object.keys(RASY).map(Number)) {
        for (let i = 0; i < 200; i++) {
          for (const adres of warstwyPortretu(losowyWyglad(rasa, plec, 1))) {
            wszystkie++;
            if (!existsSync(KATALOG + adres.replace('/res/sfgame/char/', ''))) pudla++;
          }
        }
      }
    }

    expect(pudla / wszystkie).toBeLessThan(0.01);
  });

  it('kobiety nie maja brody, mezczyzni maja', () => {
    expect(liczbaWariantow(1, 'f', 2)).toBe(0);
    expect(liczbaWariantow(1, 'm', 2)).toBeGreaterThan(0);
  });

  it('cialo zalezy od klasy', () => {
    const w = { rasa: 1, plec: 'm' as Plec, klasa: 2, czesci: [1, 101, 1, 1, 101, 1, 101, 1, 0] };
    expect(warstwyPortretu(w)[0]).toContain('body_mage');
    expect(warstwyPortretu({ ...w, klasa: 3 })[0]).toContain('body_hunter');
    expect(warstwyPortretu({ ...w, klasa: 1 })[0]).toContain('body_warrior');
  });

  it('kolor trafia do nazwy pliku jako osobny czlon', () => {
    const w = { rasa: 1, plec: 'm' as Plec, klasa: 1, czesci: [1, 305, 1, 1, 101, 1, 201, 1, 0] };
    const warstwy = warstwyPortretu(w);
    expect(warstwy.some((a) => a.endsWith('human_bart_3_5.png'))).toBe(true);
    expect(warstwy.some((a) => a.endsWith('human_haare_2_1.png'))).toBe(true);
  });
});
