import { describe, expect, it } from 'vitest';
import {
  boksy,
  nazwaWierzchowca,
  opisWierzchowca,
  portretWierzchowca,
  pozostalyCzas,
  tloStajni,
} from '../src/gra/stajnia';

/** Czlowiek to rasa 1 (stajnia dobra), ork to 5 (zla). */
const CZLOWIEK = 1;
const ORK = 5;

describe('stajnia', () => {
  it('ma dwie wersje sceny, po rasie', () => {
    expect(tloStajni(CZLOWIEK)).toContain('stall_gut');
    expect(tloStajni(4)).toContain('stall_gut');
    expect(tloStajni(ORK)).toContain('stall_boese');
    expect(tloStajni(8)).toContain('stall_boese');
  });

  it('w dobrej stajni tygrys stoi w pierwszym boksie', () => {
    /*
     * `ClickMount` przestawia trzy pierwsze boksy: GUT1 to wierzchowiec
     * numer 3, GUT2 numer 1, GUT3 numer 2. Na obrazie `stall_gut.jpg`
     * od lewej stoja wlasnie tygrys, krowa, kon i gryfosmok.
     */
    const b = boksy(CZLOWIEK);
    expect(b.map((x) => x.wierzchowiec)).toEqual([3, 1, 2, 4]);
    expect(b[0]!.podswietlenie).toContain('tiger2');
    expect(b[1]!.podswietlenie).toContain('kuh');
    expect(b[2]!.podswietlenie).toContain('horse');
    expect(b[3]!.podswietlenie).toContain('greif');
  });

  it('w zlej stajni numery ida po kolei', () => {
    const b = boksy(ORK);
    expect(b.map((x) => x.wierzchowiec)).toEqual([1, 2, 3, 4]);
    expect(b.map((x) => x.podswietlenie.split('/').pop())).toEqual([
      'pig_mouseover.jpg',
      'wolf_mouseover.jpg',
      'raptor_mouseover.jpg',
      'dragon_mouseover.jpg',
    ]);
  });

  it('boksy leza tam, gdzie mowia stale klienta', () => {
    // REL_STALL_BOX*_X/_Y i SIZE_STALL_BOX*_X/_Y.
    expect(boksy(CZLOWIEK).map((b) => b.ramka)).toEqual([
      { lewo: 0, gora: 50, szerokosc: 200, wysokosc: 480 },
      { lewo: 225, gora: 81, szerokosc: 183, wysokosc: 382 },
      { lewo: 585, gora: 78, szerokosc: 176, wysokosc: 392 },
      { lewo: 778, gora: 50, szerokosc: 218, wysokosc: 476 },
    ]);
  });

  it('nazwy i opisy zaleza od rasy', () => {
    // Pozycje 2420..2427 pliku jezykowego.
    expect([1, 2, 3, 4].map((n) => nazwaWierzchowca(n, CZLOWIEK))).toEqual([
      'Krowa',
      'Koń',
      'Tygrys',
      'Gryfosmok',
    ]);
    expect([1, 2, 3, 4].map((n) => nazwaWierzchowca(n, ORK))).toEqual([
      'Świnia',
      'Wilk',
      'Raptor',
      'Smokogryf',
    ]);
    expect(opisWierzchowca(1, CZLOWIEK)).toContain('mućka');
    expect(opisWierzchowca(1, ORK)).toContain('świnia');
    expect(nazwaWierzchowca(0, CZLOWIEK)).toBe('(brak)');
  });

  it('portret bierze drugi komplet dla ras zlych', () => {
    expect(portretWierzchowca(2, CZLOWIEK)).toContain('mount_portrait_2');
    expect(portretWierzchowca(2, ORK)).toContain('mount_portrait_6');
  });

  describe('pozostaly czas najmu', () => {
    const TERAZ = 1_000_000;

    it('powyzej doby liczy dni, i to o jeden wiecej', () => {
      // `WaitingTime`: `String(diffDays + 1) + " " + txt[TXT_TAGE]`.
      expect(pozostalyCzas(TERAZ + 14 * 86400, TERAZ)).toBe('15 Dni');
      expect(pozostalyCzas(TERAZ + 14 * 86400 - 1, TERAZ)).toBe('14 Dni');
      expect(pozostalyCzas(TERAZ + 86400, TERAZ)).toBe('2 Dni');
    });

    it('ponizej doby pokazuje zegar', () => {
      expect(pozostalyCzas(TERAZ + 3661, TERAZ)).toBe('1:01:01');
      expect(pozostalyCzas(TERAZ + 61, TERAZ)).toBe('01:01');
      expect(pozostalyCzas(TERAZ - 100, TERAZ)).toBe('00:00');
    });
  });
});
