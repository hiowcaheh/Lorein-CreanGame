/**
 * Generator przedmiotow, sprawdzony wobec `genItem()` z req.php.
 *
 * Losowanie jest wstrzykiwane, wiec wyniki sa powtarzalne i mozna
 * porownac je z wzorami z oryginalu na kartce.
 */

import { describe, expect, it } from 'vitest';
import {
  POZIOM_EPIKOW,
  SKLEP_GABINET,
  wylosujPrzedmiot,
  type Losowanie,
} from '../src/game/generatorPrzedmiotow.js';

/** Losowanie, ktore zawsze zwraca dolna granice przedzialu. */
const NAJNIZEJ: Losowanie = (od) => od;

/** Losowanie z gory podanej listy wynikow, po kolei. */
function zListy(wyniki: number[]): Losowanie {
  let i = 0;
  return () => wyniki[i++] ?? 0;
}

describe('wylosujPrzedmiot', () => {
  it('koduje klase w tysiacach numeru przedmiotu', () => {
    const mag = wylosujPrzedmiot(1, 2, { rodzaj: 3, losuj: NAJNIZEJ });
    expect(mag.item_id).toBe(1001);

    const lowca = wylosujPrzedmiot(1, 3, { rodzaj: 3, losuj: NAJNIZEJ });
    expect(lowca.item_id).toBe(2001);
  });

  it('cecha nigdy nie schodzi ponizej jedynki', () => {
    // Na pierwszym poziomie wzor `(poziom - 1) * 3 + drgniecie` dalby
    // liczbe ujemna: (1-1)*3 + (5-10) = -5.
    const rzecz = wylosujPrzedmiot(1, 1, { rodzaj: 4, losuj: NAJNIZEJ });
    expect(rzecz.atr_val_1).toBe(1);
    expect(rzecz.atr_type_1).toBeGreaterThan(0);
  });

  it('pancerz rosnie z poziomem wedlug mnoznika klasy', () => {
    // Wojownik, buty (rodzaj 4): mnoznik 7. Poziom 10 -> 10*7 + 1.
    const buty = wylosujPrzedmiot(10, 1, { rodzaj: 4, losuj: NAJNIZEJ });
    expect(buty.dmg_min).toBe(71);

    // Mag w tych samych butach ma mnoznik 2.
    expect(wylosujPrzedmiot(10, 2, { rodzaj: 4, losuj: NAJNIZEJ }).dmg_min).toBe(21);
  });

  it('tarcza blokuje wedlug progow poziomu', () => {
    expect(wylosujPrzedmiot(1, 1, { rodzaj: 2, losuj: NAJNIZEJ }).dmg_min).toBe(10);
    expect(wylosujPrzedmiot(15, 1, { rodzaj: 2, losuj: NAJNIZEJ }).dmg_min).toBe(15);
    expect(wylosujPrzedmiot(30, 1, { rodzaj: 2, losuj: NAJNIZEJ }).dmg_min).toBe(25);
  });

  it('tarcza wojownika nigdy nie kosztuje grzybow', () => {
    // Nawet gdy wypadnie przedmiot o dwoch cechach (`dwieCechy`).
    const losuj = zListy([
      14, // cena z widelek
      30, // dodatek do ceny
      1, //  dwie cechy
      1, //  grzyby za zwykly przedmiot
      1, //  numer przedmiotu
      1, 2, 5, 5, // cechy
    ]);
    expect(wylosujPrzedmiot(1, 1, { rodzaj: 2, losuj }).mush).toBe(0);
  });

  it('mag nigdy nie dostaje tarczy', () => {
    // Pierwsze losowanie rodzaju daje tarcze, drugie helm.
    const losuj = zListy([2, 6, 50, 14, 30, 2, 1, 2, 1, 1, 1]);
    expect(wylosujPrzedmiot(1, 2, { losuj }).item_type).toBe(6);
  });

  it('co siodmy przedmiot ma dwie rozne cechy', () => {
    const losuj = zListy([
      50, //    daleko od progu epika
      14, 30, // cena
      1, //     dwie cechy
      1, //     mikstura zycia (dotyczy tylko gabinetu magii)
      2, //     bez dodatkowego grzyba
      1, //     numer
      12, //    pancerz
      3, 3, //  obie cechy wyszly te same
      10, 10, // drgniecia wartosci
    ]);
    const rzecz = wylosujPrzedmiot(1, 1, { rodzaj: 4, losuj });
    expect(rzecz.atr_type_1).toBe(3);
    // Ta sama cecha dwa razy nie ma sensu — oryginal przesuwa druga o jeden.
    expect(rzecz.atr_type_2).toBe(2);
    expect(rzecz.atr_val_2).toBeGreaterThan(0);
  });

  it('obrazenia broni rosna z mnoznikiem klasy', () => {
    // Poziom 21, wojownik (mnoznik 2) kontra mag (mnoznik 4,2).
    const wojownik = wylosujPrzedmiot(21, 1, { rodzaj: 1, losuj: NAJNIZEJ });
    const mag = wylosujPrzedmiot(21, 2, { rodzaj: 1, losuj: NAJNIZEJ });
    expect(mag.dmg_max).toBeGreaterThan(wojownik.dmg_max);
    expect(wojownik.dmg_max).toBeGreaterThan(wojownik.dmg_min);
  });

  it('zawsze wychodzi przedmiot ze zbrojowni', () => {
    for (let i = 0; i < 300; i++) {
      const rzecz = wylosujPrzedmiot(1 + (i % 40), 1 + (i % 3));
      expect(rzecz.item_type).toBeGreaterThanOrEqual(1);
      expect(rzecz.item_type).toBeLessThanOrEqual(7);
      expect(rzecz.gold).toBeGreaterThan(0);
      expect(rzecz.atr_val_1).toBeGreaterThanOrEqual(1);
      expect(Number.isInteger(rzecz.gold)).toBe(true);
    }
  });

  /*
   * Przedmioty epickie — `$epicRand` w `genItem()`.
   *
   *     elseif ($lvl >= 50 && $sanca <= $epic_chance_shop) $epicRand = 1;
   *
   * Ponizej piecdziesiatego poziomu nie ma ich wcale, i zadne odswiezanie
   * towaru tego nie zmieni.
   */
  describe('przedmioty epickie', () => {
    /** Losowanie, ktore trafia w epika: `sanca` = 1 przy progu 2. */
    function zEpikiem(numerEpika: number): Losowanie {
      let i = 0;
      return (od, doWlacznie) => {
        i++;
        if (i === 1) return 1; //  sanca — trafiony prog
        if (od === 50) return numerEpika; // numer epika
        return od === doWlacznie ? od : od;
      };
    }

    it('nie pojawiaja sie ponizej piecdziesiatego poziomu', () => {
      for (let poziom = 1; poziom < POZIOM_EPIKOW; poziom++) {
        for (let i = 0; i < 40; i++) {
          const p = wylosujPrzedmiot(poziom, 1);
          expect(p.item_id % 1000).toBeLessThan(50);
        }
      }
    });

    it('od piecdziesiatki trafiaja sie i maja numer 50 lub wyzszy', () => {
      const p = wylosujPrzedmiot(60, 1, { rodzaj: 3, losuj: zEpikiem(50) });
      expect(p.item_id % 1000).toBe(50);
      // `ITEMGEN_PMUSH_EPIC` i potrojona cena w zlocie.
      expect(p.mush).toBe(15);
    });

    it('numer decyduje o komplecie cech', () => {
      // 50 — trzy cechy: glowna klasy, wytrzymalosc i szczescie.
      const trzy = wylosujPrzedmiot(60, 1, { rodzaj: 3, losuj: zEpikiem(50) });
      expect([trzy.atr_type_1, trzy.atr_type_2, trzy.atr_type_3]).toEqual([1, 4, 5]);

      // 53 — wszystkie piec naraz (cecha numer 6).
      const wszystkie = wylosujPrzedmiot(60, 1, { rodzaj: 3, losuj: zEpikiem(53) });
      expect(wszystkie.atr_type_1).toBe(6);
      expect(wszystkie.atr_type_2).toBe(0);

      // 52 — samo szczescie.
      const szczescie = wylosujPrzedmiot(60, 1, { rodzaj: 3, losuj: zEpikiem(52) });
      expect(szczescie.atr_type_1).toBe(5);
    });

    it('bron maga i lowcy ma cechy podwojone', () => {
      const wojownik = wylosujPrzedmiot(60, 1, { rodzaj: 1, losuj: zEpikiem(53) });
      const mag = wylosujPrzedmiot(60, 2, { rodzaj: 1, losuj: zEpikiem(53) });
      // `$increasedStats` — dotyczy WYLACZNIE broni klas 2 i 3.
      expect(mag.atr_val_1).toBe(wojownik.atr_val_1 * 2);

      const helmMaga = wylosujPrzedmiot(60, 2, { rodzaj: 6, losuj: zEpikiem(53) });
      expect(helmMaga.atr_val_1).toBe(wojownik.atr_val_1);
    });
  });

  /*
   * Gabinet magii — „sklep 1". Rodzaje 8-13, bez obrazen i pancerza,
   * numery bez czlonu klasowego, bo amulety i mikstury sa wspolne dla
   * wszystkich klas.
   */
  describe('gabinet magii', () => {
    it('handluje rodzajami od 8 w gore i nigdy kluczem do lochu', () => {
      for (let i = 0; i < 300; i++) {
        const p = wylosujPrzedmiot(40, 2, { sklep: SKLEP_GABINET });
        expect(p.item_type).toBeGreaterThanOrEqual(8);
        expect(p.item_type).toBeLessThanOrEqual(13);
        // `if ($type == 11 && $option !== "tavern") $type = rand(8, 10);`
        expect(p.item_type).not.toBe(11);
        // `$item['dmg_min'] = 0;` — nic tu nie daje pancerza ani obrazen.
        expect(p.dmg_min).toBe(0);
        expect(p.dmg_max).toBe(0);
      }
    });

    it('nie koduje klasy w numerze przedmiotu', () => {
      for (const klasa of [1, 2, 3]) {
        for (let i = 0; i < 50; i++) {
          const p = wylosujPrzedmiot(40, klasa, { sklep: SKLEP_GABINET });
          expect(p.item_id).toBeLessThan(1000);
        }
      }
    });

    it('album trafia na pólke tylko wtedy, kiedy gracza jeszcze nie ma', () => {
      let zAlbumem = 0;
      for (let i = 0; i < 400; i++) {
        if (wylosujPrzedmiot(40, 1, { sklep: SKLEP_GABINET, maAlbum: true }).item_type === 13) {
          zAlbumem++;
        }
      }
      expect(zAlbumem).toBe(0);

      let bezAlbumu = 0;
      for (let i = 0; i < 400; i++) {
        if (wylosujPrzedmiot(40, 1, { sklep: SKLEP_GABINET, maAlbum: false }).item_type === 13) {
          bezAlbumu++;
        }
      }
      expect(bezAlbumu).toBeGreaterThan(0);
    });

    it('mikstura niesie czas dzialania i swoje dzialanie', () => {
      const p = wylosujPrzedmiot(40, 1, { sklep: SKLEP_GABINET, rodzaj: 12 });
      // Pierwsza cecha to zawsze czas — `$potionDur = 11` i `POTION_DUR`.
      expect(p.atr_type_1).toBe(11);
      expect(p.atr_val_1).toBeGreaterThanOrEqual(72);
      // Druga to cecha, ktora mikstura podnosi: 10, 15 albo 25 procent.
      expect([10, 15, 25]).toContain(p.atr_val_2);
      expect(p.item_id).toBeGreaterThanOrEqual(1);
      expect(p.item_id).toBeLessThanOrEqual(16);
    });

    it('mikstura zycia dziala o 96 godzin dluzej', () => {
      /*
       * Numer 16 wypada, kiedy losowanie z osmiu trafi w jedynke — ale
       * ta galaz istnieje TYLKO ponizej trzydziestego poziomu. Wyzej
       * oryginal losuje wprost `rand(1, 16)`.
       */
      const losuj: Losowanie = (od, doWlacznie) => (od === 1 && doWlacznie === 8 ? 1 : od);
      const p = wylosujPrzedmiot(20, 1, { sklep: SKLEP_GABINET, rodzaj: 12, losuj });
      expect(p.item_id).toBe(16);
      expect(p.atr_val_1).toBe(72 + 96);
      expect(p.atr_type_2).toBe(12);
    });
  });
});
