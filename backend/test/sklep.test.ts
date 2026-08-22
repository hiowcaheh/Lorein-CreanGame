import { describe, expect, it } from 'vitest';
import { czyEpicki } from '../src/game/grafikaPrzedmiotow.js';
import {
  CZESC_CENY_PRZY_ODKUPIE,
  GRZYBY_ZA_SPRZEDAZ_EPIKA,
  KOSZT_WYMIANY_TOWARU,
  MIEJSC_W_SKLEPIE,
  cenaPoZakupie,
  czasNaNowyTowar,
  najblizszaPolnoc,
  sprawdzZakup,
} from '../src/game/sklep.js';

describe('sklep', () => {
  it('ma szesc miejsc i wymiane za jednego grzyba', () => {
    // `for ($a = 0; $a < 6; $a++)` i `mushroom = mushroom - 1`.
    expect(MIEJSC_W_SKLEPIE).toBe(6);
    expect(KOSZT_WYMIANY_TOWARU).toBe(1);
  });

  it('oddaje dziesiec grzybow za epika i nic za zwykla rzecz', () => {
    /*
     * SWIADOME ODSTEPSTWO — oryginal oddaje kolumne `mush`, ktora przy
     * rzeczy kupionej w sklepie jest zerem. Tu liczy sie to, czym
     * przedmiot JEST, a nie ile za niego zaplacono.
     */
    expect(GRZYBY_ZA_SPRZEDAZ_EPIKA).toBe(10);

    // Numer obrazka od 50 w gore to epik — z klasa w tysiacach i bez.
    expect(czyEpicki(1, 50)).toBe(true);
    expect(czyEpicki(3, 1057)).toBe(true);
    expect(czyEpicki(1, 49)).toBe(false);
    expect(czyEpicki(1, 2007)).toBe(false);
    // Zwoje (typ 14) numerow epickich nie maja.
    expect(czyEpicki(14, 55)).toBe(false);
  });

  it('odkupuje za trzy dziesiate ceny', () => {
    // `$item['gold'] = round((int)$item['gold'] * 0.3);`
    expect(CZESC_CENY_PRZY_ODKUPIE).toBe(0.3);
    expect(cenaPoZakupie(1000)).toBe(300);
    expect(cenaPoZakupie(7279)).toBe(2184);
    // Zaokraglenie polowki w gore, jak `round()` w PHP.
    expect(cenaPoZakupie(5)).toBe(2);
    expect(cenaPoZakupie(15)).toBe(5);
  });

  describe('termin odnowienia towaru', () => {
    it('wypada o najblizszej polnocy', () => {
      // `strtotime('tomorrow')` — poczatek nastepnej doby.
      const poludnie = Date.UTC(2026, 0, 15, 12, 34, 56) / 1000;
      const polnoc = Date.UTC(2026, 0, 16, 0, 0, 0) / 1000;
      expect(najblizszaPolnoc(poludnie)).toBe(polnoc);
    });

    it('minute przed polnoca dalej wskazuje te sama polnoc', () => {
      const przed = Date.UTC(2026, 0, 15, 23, 59, 0) / 1000;
      expect(najblizszaPolnoc(przed)).toBe(Date.UTC(2026, 0, 16, 0, 0, 0) / 1000);
    });

    it('towar starcza dokladnie do terminu', () => {
      // `if ($time > $db_data['shop_reroll_time'])` — rowność jeszcze nie liczy.
      expect(czasNaNowyTowar(1000, 1001)).toBe(false);
      expect(czasNaNowyTowar(1001, 1001)).toBe(false);
      expect(czasNaNowyTowar(1002, 1001)).toBe(true);
    });
  });

  describe('warunki zakupu', () => {
    const towar = { cenaZloto: 500, cenaGrzyby: 2 };
    const bogaty = { srebro: 10000, grzyby: 10, celZajety: false };

    it('przepuszcza, kiedy jest miejsce i pieniadze', () => {
      expect(sprawdzZakup(towar, bogaty)).toBeNull();
    });

    it('nie zamienia przedmiotow — zajete miejsce to odmowa', () => {
      // Oryginal przy zajetym slocie po prostu przerywa i odsyla stan sklepu.
      expect(sprawdzZakup(towar, { ...bogaty, celZajety: true })).toBe('zajete');
    });

    it('odmawia przy zbyt malym mieszku i przy braku grzybow', () => {
      expect(sprawdzZakup(towar, { ...bogaty, srebro: 499 })).toBe('za-drogo');
      expect(sprawdzZakup(towar, { ...bogaty, grzyby: 1 })).toBe('brak-grzybow');
    });

    it('sprawdza miejsce PRZED cena', () => {
      // Kolejnosc jest z oryginalu: zajety slot konczy sprawe, zanim
      // w ogole dojdzie do liczenia srebra.
      expect(sprawdzZakup(towar, { srebro: 0, grzyby: 0, celZajety: true })).toBe('zajete');
    });

    it('darmowy przedmiot przechodzi przy pustym mieszku', () => {
      expect(
        sprawdzZakup({ cenaZloto: 0, cenaGrzyby: 0 }, { srebro: 0, grzyby: 0, celZajety: false }),
      ).toBeNull();
    });
  });
});
