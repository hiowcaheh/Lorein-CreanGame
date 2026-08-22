import { describe, expect, it } from 'vitest';
import {
  GNIAZDA,
  GRANICE_DZIALOW,
  OSTATNIA_STRONA,
  POZYCJI_W_DZIALE,
  dzialBitu,
  odkodujKlaser,
  plikPrzedmiotu,
  policzDzialy,
  pozycjaNaStronie,
  przewin,
} from '../src/gra/klaser';
import { nazwaWKlaserze } from '../src/gra/przedmioty';

/** Wszystkie bity, ktore klaser potrafi narysowac, z podzialem na dzialy. */
function wszystkieBity(): { bity: number[]; wDziale: number[] } {
  const bity: number[] = [];
  const wDziale = [0, 0, 0, 0, 0];

  for (let dzial = 0; dzial < 5; dzial++) {
    for (let strona = 0; strona <= (OSTATNIA_STRONA[dzial] ?? 0); strona++) {
      for (let i = 0; i < 4; i++) {
        const p = pozycjaNaStronie(dzial, strona, i);
        if (p.rodzaj === 'pusta') continue;
        const ile = p.rodzaj === 'wzor' ? 5 : 1;
        for (let b = 0; b < ile; b++) {
          bity.push(p.bit + b);
          wDziale[dzial] = (wDziale[dzial] ?? 0) + 1;
        }
      }
    }
  }
  return { bity, wDziale };
}

describe('Klaser Dokladnosci', () => {
  describe('mapa stron', () => {
    it('kazdy dzial ma dokladnie tyle pozycji, ile mowi catMax', () => {
      // `catMax = [252, 246, 506, 348, 348]` z `ShowAlbumContent()`.
      expect(wszystkieBity().wDziale).toEqual([...POZYCJI_W_DZIALE]);
    });

    it('razem wychodzi 1700 roznych bitow — tyle, co contentMax', () => {
      const { bity } = wszystkieBity();
      expect(bity.length).toBe(1700);
      expect(new Set(bity).size).toBe(1700);
    });

    it('kazdy bit trafia do dzialu, w ktorym go narysowano', () => {
      for (let dzial = 0; dzial < 5; dzial++) {
        for (let strona = 0; strona <= (OSTATNIA_STRONA[dzial] ?? 0); strona++) {
          for (let i = 0; i < 4; i++) {
            const p = pozycjaNaStronie(dzial, strona, i);
            if (p.rodzaj === 'pusta') continue;
            expect(dzialBitu(p.bit)).toBe(dzial);
          }
        }
      }
    });

    it('potwory zajmuja poczatek zapisu', () => {
      expect(pozycjaNaStronie(0, 0, 0)).toEqual({ rodzaj: 'potwor', bit: 0 });
      expect(pozycjaNaStronie(0, 62, 3)).toEqual({ rodzaj: 'potwor', bit: 251 });
      expect(GRANICE_DZIALOW[0]).toBe(300);
    });

    it('bron wojownika i jej epiki stoja tam, gdzie w kliencie', () => {
      // strona 0 -> 792, strona 8 -> (1076 + 16) = 1092
      expect(pozycjaNaStronie(2, 0, 0)).toEqual({
        rodzaj: 'wzor', bit: 792, typ: 1, obrazek: 1, klasa: 1,
      });
      expect(pozycjaNaStronie(2, 8, 0)).toEqual({
        rodzaj: 'epik', bit: 1092, typ: 1, obrazek: 50, klasa: 1,
      });
    });

    it('mag i zwiadowca roznia sie jednym przesunieciem', () => {
      // hunterOffs = ((albumCat == 3) ? 0 : 696) + 16
      const mag = pozycjaNaStronie(3, 0, 0);
      const zwiadowca = pozycjaNaStronie(4, 0, 0);
      expect(mag).toEqual({ rodzaj: 'wzor', bit: 1804, typ: 1, obrazek: 1, klasa: 2 });
      expect(zwiadowca).toEqual({ rodzaj: 'wzor', bit: 2500, typ: 1, obrazek: 1, klasa: 3 });
    });

    it('niepelne strony maja puste gniazda', () => {
      // `if (albumPage < 5 || i <= 0)` — na piatej stronie bizuterii
      // zostaje sam pierwszy wzor.
      expect(pozycjaNaStronie(1, 5, 0).rodzaj).toBe('wzor');
      expect(pozycjaNaStronie(1, 5, 1).rodzaj).toBe('pusta');
    });

    it('strony zawijaja sie na obu koncach', () => {
      expect(przewin(0, 63)).toBe(0);
      expect(przewin(0, -1)).toBe(62);
      expect(przewin(1, 26)).toBe(0);
      expect(przewin(1, -1)).toBe(25);
    });
  });

  describe('zapis bitowy', () => {
    it('pusty klaser to same zera', () => {
      const bity = odkodujKlaser('A'.repeat(532));
      expect(bity.length).toBe(3192);
      expect(bity.some(Boolean)).toBe(false);
    });

    it('bity ida od najstarszego w bajcie', () => {
      // 0x80 0x00 -> pierwszy bit zapalony. base64 "gA" + wypelnienie.
      expect(odkodujKlaser('gAA=').slice(0, 9)).toEqual([
        true, false, false, false, false, false, false, false, false,
      ]);
    });

    it('licznik dzialow nie przekracza pojemnosci', () => {
      const bity = new Array(3192).fill(true);
      expect(policzDzialy(bity)).toEqual([...POZYCJI_W_DZIALE]);
    });
  });

  describe('rysowanie', () => {
    it('gniazda stoja na wspolrzednych z klienta', () => {
      // CNT_ALBUM_MONSTER + i: (420 albo 890, 170 albo 475) minus scena.
      expect(GNIAZDA[0]?.potwor).toEqual({ lewo: 140, gora: 70 });
      expect(GNIAZDA[1]?.potwor).toEqual({ lewo: 140, gora: 375 });
      expect(GNIAZDA[2]?.potwor).toEqual({ lewo: 610, gora: 70 });
      expect(GNIAZDA[3]?.potwor).toEqual({ lewo: 610, gora: 375 });
      // Piate miejsce wzoru: x + 180, y + 130 dla gniazda parzystego.
      expect(GNIAZDA[0]?.wzory[4]).toEqual({ lewo: 320, gora: 200 });
      expect(GNIAZDA[0]?.epik).toEqual({ lewo: 215, gora: 140 });
    });

    it('klasa schodzi o jeden dopiero w sciezce pliku', () => {
      // Wojownik (klasa 1) rysuje sie z katalogu `1-1`, mag (2) z `1-2`.
      expect(plikPrzedmiotu(1, 3, 0, 1)).toBe('/res/sfgame/itm/1-1/itm1-3-1-1.png');
      expect(plikPrzedmiotu(1, 3, 2, 2)).toBe('/res/sfgame/itm/1-2/itm1-3-3-2.png');
      // Epik barwy nie ma — zawsze pierwsza.
      expect(plikPrzedmiotu(1, 50, 4, 1)).toBe('/res/sfgame/itm/1-1/itm1-50-1-1.png');
      // Bizuteria nie ma klasy, talizman nie ma barwy.
      expect(plikPrzedmiotu(8, 2, 3, 0)).toBe('/res/sfgame/itm/8-1/itm8-2-4-1.png');
      expect(plikPrzedmiotu(10, 4, 0, 0)).toBe('/res/sfgame/itm/10-1/itm10-4-1.png');
    });

    it('nazwa pozycji bierze sie z klasy, a cytat epika idzie osobno', () => {
      expect(nazwaWKlaserze(1, 1, 1).nazwa).not.toBe('');
      const epik = nazwaWKlaserze(1, 50, 1);
      expect(epik.nazwa).not.toBe('');
      expect(epik.nazwa).not.toContain('|');
    });
  });
});
