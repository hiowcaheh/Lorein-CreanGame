import { describe, expect, it } from 'vitest';
import {
  KLUCZ_UZYTY,
  LOCHOW,
  POZIOMOW_W_LOCHU,
  PRZESZEDL,
  ZAMKNIETY,
  kolumnaLochu,
  kopiaGracza,
  opisPotwora,
  otwarty,
  potworZLochu,
  poziomZeStanu,
  zamknieteLochy,
} from '../src/game/lochy.js';
import { POTWORY } from '../src/game/lochy-dane.js';
import { PROGI_KLUCZY, wylosujPrzedmiot } from '../src/game/generatorPrzedmiotow.js';
import { PELNE_LUSTRO } from '../src/game/lustro.js';
import type { Wojownik } from '../src/game/walka.js';

describe('lochy', () => {
  describe('tablica potworow', () => {
    it('ma trzynascie lochow po dziesiec poziomow', () => {
      expect(POTWORY.length).toBe(LOCHOW);
      for (const loch of POTWORY) expect(loch.length).toBe(POZIOMOW_W_LOCHU);
    });

    it('jedyny brak to kopia gracza — dziewiaty loch, dziesiaty poziom', () => {
      const puste: string[] = [];
      POTWORY.forEach((loch, i) =>
        loch.forEach((p, j) => {
          if (!p) puste.push(`${i + 1}/${j + 1}`);
        }),
      );
      expect(puste).toEqual(['9/10']);
    });

    it('pierwszy potwor zgadza sie co do liczby z req.php', () => {
      // new Monster(10, 2, 48, 52, 104, 77, 470, 342, 513, 1694, 85, 129, 1287, -2, -1)
      expect(opisPotwora(1, 2)).toEqual({
        poziom: 10, klasa: 2, sila: 48, zrecznosc: 52, intelekt: 104,
        wytrzymalosc: 77, szczescie: 470, obrazeniaMin: 342, obrazeniaMaks: 513,
        zycie: 1694, pancerz: 85, numer: 129, doswiadczenie: 1287, bron: -2, tarcza: -1,
      });
    });

    it('zycie potwora zgadza sie z wzorem `wit * k * (lvl + 1)`', () => {
      // Mag ma mnoznik 2: 77 * 2 * 11 = 1694.
      const p = opisPotwora(1, 2)!;
      expect(p.zycie).toBe(p.wytrzymalosc * 2 * (p.poziom + 1));
    });
  });

  describe('stan lochu', () => {
    it('poziom liczy sie ze stanu przez odjecie jedynki', () => {
      // `$stage -= 1; if ($stage < 1) $stage = 1; else if ($stage > 10) $stage = 10;`
      expect(poziomZeStanu(ZAMKNIETY)).toBe(1);
      expect(poziomZeStanu(KLUCZ_UZYTY)).toBe(1);
      expect(poziomZeStanu(2)).toBe(1);
      expect(poziomZeStanu(11)).toBe(10);
      expect(poziomZeStanu(PRZESZEDL)).toBe(10);
    });

    it('walczyc da sie dopiero od dwojki i tylko do jedenastki', () => {
      expect(otwarty(ZAMKNIETY)).toBe(false);
      expect(otwarty(KLUCZ_UZYTY)).toBe(false);
      expect(otwarty(2)).toBe(true);
      expect(otwarty(11)).toBe(true);
      expect(otwarty(PRZESZEDL)).toBe(false);
    });

    it('zna swoje kolumny', () => {
      expect(kolumnaLochu(1)).toBe('dungeon_1');
      expect(kolumnaLochu(13)).toBe('dungeon_13');
      expect(kolumnaLochu(0)).toBeNull();
      expect(kolumnaLochu(14)).toBeNull();
    });

    it('zamkniete to te z zerem', () => {
      const wiersz: Record<string, unknown> = { dungeon_1: 5, dungeon_2: 0, dungeon_3: 12 };
      expect(zamknieteLochy(wiersz)).toEqual([2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
    });
  });

  describe('potwor w walce', () => {
    it('obrazenia ida wprost z tablicy, bez mnozenia przez ceche', () => {
      // `Monster::__construct` wpisuje `$dmg_min` bez `1 + glowna / 10`.
      const opis = opisPotwora(1, 2)!;
      const potwor = potworZLochu(opis, 'Zjawa');
      expect(potwor.bronMin).toBe(342);
      expect(potwor.bronMax).toBe(513);
      expect(potwor.pancerz).toBe(85);
      // `$shield_id == -1` znaczy „bez tarczy".
      expect(potwor.tarcza).toBe(0);
    });

    it('kopia gracza bije wedlug `glowna / 10`, a nie `1 + glowna / 10`', () => {
      const gracz: Wojownik = {
        nazwa: 'Ja', klasa: 1, poziom: 100,
        sila: 200, zrecznosc: 10, intelekt: 10, wytrzymalosc: 100, szczescie: 10,
        zycie: 5000, zycieMaks: 5000,
        bronMin: 999, bronMax: 999,
        bronBazowaMin: 100, bronBazowaMax: 200,
        pancerz: 500, tarcza: 0,
      };
      const kopia = kopiaGracza(gracz, 'Sobowtór');
      expect(kopia.bronMin).toBe(Math.round(100 * (200 / 10)));
      expect(kopia.bronMax).toBe(Math.round(200 * (200 / 10)));
      // `new Monster(..., 11, -1, ...)` — pancerz kopii jest sztywny.
      expect(kopia.pancerz).toBe(11);
    });
  });

  describe('klucze z wypraw', () => {
    /*
     * Rodzaj 11 to najpierw ODLAMEK lustra, a dopiero potem klucz —
     * wiec zeby dojsc do klucza, lustro musi byc juz kompletne.
     */
    const ZLOZONE_LUSTRO = { lustro: PELNE_LUSTRO } as const;

    it('progi poziomu sa te z req.php', () => {
      expect(PROGI_KLUCZY.map((p) => p.poziom)).toEqual([9, 19, 29, 39, 49, 69, 79, 94, 109]);
      expect(PROGI_KLUCZY.map((p) => p.loch)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    it('klucz idzie do PIERWSZEGO zamknietego lochu powyzej progu', () => {
      const klucz = wylosujPrzedmiot(50, 1, {
        rodzaj: 11,
        sklep: 1,
        wyprawa: true,
        ...ZLOZONE_LUSTRO,
        zamknieteLochy: [3, 5, 9],
        losuj: () => 1,
      });
      // Poziom 50: prog lochu 3 to 29, lochu 5 to 49 — pierwszy pasujacy to 3.
      expect(klucz?.item_type).toBe(11);
      expect(klucz?.item_id).toBe(3);
      expect(klucz?.gold).toBe(25000);
    });

    it('bez pasujacego lochu wyprawa nie ma nagrody', () => {
      // Poziom 20 otwiera tylko lochy 1 i 2, a oba sa juz otwarte.
      expect(
        wylosujPrzedmiot(20, 1, {
          rodzaj: 11,
          sklep: 1,
          wyprawa: true,
          ...ZLOZONE_LUSTRO,
          zamknieteLochy: [5, 6],
          losuj: () => 1,
        }),
      ).toBeNull();
    });

    it('prog jest ostry — na rownym poziomie klucz jeszcze nie wypada', () => {
      // `$lvl > $keyData[0]`, wiec loch 1 otwiera sie dopiero od dziesiatki.
      const na9 = wylosujPrzedmiot(9, 1, {
        rodzaj: 11, sklep: 1, wyprawa: true, ...ZLOZONE_LUSTRO, zamknieteLochy: [1], losuj: () => 1,
      });
      const na10 = wylosujPrzedmiot(10, 1, {
        rodzaj: 11, sklep: 1, wyprawa: true, ...ZLOZONE_LUSTRO, zamknieteLochy: [1], losuj: () => 1,
      });
      expect(na9).toBeNull();
      expect(na10?.item_id).toBe(1);
    });

    /*
     * Miedzy piatym a szostym lochem oryginal robi DWUKROTNIE wieksza
     * przerwe niz wszedzie indziej: 49, a potem od razu 69, zamiast 59.
     * Gracz z piecioma otwartymi lochami stoi wiec bez nowego klucza
     * przez dwadziescia poziomow i wyglada to na zepsuty drop.
     * `'dungeon_5' => [49, 5], 'dungeon_6' => [69, 6]` w `req.php`.
     */
    it('szosty klucz czeka az do siedemdziesiatki, choc piaty leci od piecdziesiatki', () => {
      const zamkniete = [6, 7, 8, 9];
      const naPoziomie = (poziom: number) =>
        wylosujPrzedmiot(poziom, 1, {
          rodzaj: 11, sklep: 1, wyprawa: true, ...ZLOZONE_LUSTRO, zamknieteLochy: zamkniete,
          losuj: () => 1,
        });

      expect(naPoziomie(62)).toBeNull();
      expect(naPoziomie(69)).toBeNull();
      expect(naPoziomie(70)?.item_id).toBe(6);
    });
  });
});
