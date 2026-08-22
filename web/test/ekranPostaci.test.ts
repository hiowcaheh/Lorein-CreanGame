import { describe, expect, it } from 'vitest';
import {
  pustaBron,
  pustaTarcza,
  wierszObrazen,
  wierszePochodnych,
} from '../src/gra/ekranPostaci';

/** Ten sam komplet liczb dla kazdej klasy — rozni je tylko `klasa`. */
function gracz(klasa: number) {
  return {
    klasa,
    obrazenia: { min: 100, max: 200, srednio: 150 },
    obrona: 50,
    unik: 40,
    odpornosc: 30,
    zycie: 17000,
    ciosKrytyczny: 6.06,
  };
}

describe('prawa kolumna ekranu postaci', () => {
  it('stawia obrazenia w wierszu cechy glownej klasy', () => {
    // `switch` w kliencie: wojownik podmienia SCHADEN (wiersz sily),
    // lowca KAMPFWERT (zrecznosci), mag LEBEN (inteligencji).
    expect(wierszObrazen(1)).toBe(0);
    expect(wierszObrazen(3)).toBe(1);
    expect(wierszObrazen(2)).toBe(2);
  });

  it('wojownik: obrazenia zamiast obrony', () => {
    const w = wierszePochodnych(gracz(1));
    expect(w.map((r) => r.nazwa)).toEqual([
      'Obrażenia',
      'Zdolność uniku',
      'Odporność',
      'Żywotność',
      'Cios krytyczny',
    ]);
    expect(w[0]!.wartosc).toBe('~150');
    expect(w[1]!.wartosc).toBe('40');
  });

  it('lowca: obrazenia zamiast zdolnosci uniku', () => {
    const w = wierszePochodnych(gracz(3));
    expect(w.map((r) => r.nazwa)).toEqual([
      'Obrona',
      'Obrażenia',
      'Odporność',
      'Żywotność',
      'Cios krytyczny',
    ]);
    expect(w[0]!.wartosc).toBe('50');
    expect(w[1]!.wartosc).toBe('~150');
  });

  it('mag: obrazenia zamiast odpornosci', () => {
    const w = wierszePochodnych(gracz(2));
    expect(w.map((r) => r.nazwa)).toEqual([
      'Obrona',
      'Zdolność uniku',
      'Obrażenia',
      'Żywotność',
      'Cios krytyczny',
    ]);
    expect(w[2]!.wartosc).toBe('~150');
  });

  it('podpowiedz zywotnosci podaje mnoznik klasy', () => {
    // `tmpLifeFactor`: wojownik 5, mag 2, lowca 4.
    expect(wierszePochodnych(gracz(1))[3]!.tytul).toContain('* 5 *');
    expect(wierszePochodnych(gracz(2))[3]!.tytul).toContain('* 2 *');
    expect(wierszePochodnych(gracz(3))[3]!.tytul).toContain('* 4 *');
  });
});


describe('puste miejsca na bron i tarcze', () => {
  it('sylwetka broni zalezy od klasy', () => {
    // `IMG_EMPTY_SLOT_9_1/_2/_3` — miecz, laska, luk.
    expect(pustaBron(1)).toBe('slot9_1.png');
    expect(pustaBron(2)).toBe('slot9_2.png');
    expect(pustaBron(3)).toBe('slot9_3.png');
  });

  it('sylwetke tarczy dostaje TYLKO wojownik', () => {
    /*
     * Oryginal podstawia obrazek pod dziesiate miejsce wylacznie przy
     * `ownerClass == 1`; magowi i zwiadowcy nie podstawia niczego, wiec
     * kwadrat zostaje pusty.
     */
    expect(pustaTarcza(1)).toBe('slot10.png');
    expect(pustaTarcza(2)).toBeNull();
    expect(pustaTarcza(3)).toBeNull();
  });
});
