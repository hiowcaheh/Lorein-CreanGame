/**
 * Reguly ekwipunku, sprawdzone wobec oryginalnego `req.php`.
 */

import { describe, expect, it } from 'vitest';
import {
  bonusyZPrzedmiotow,
  czyMozeLezec,
  klasaPrzedmiotu,
  slotDlaRodzaju,
  zaplanujPrzeniesienie,
  type PrzedmiotWBazie,
} from '../src/game/ekwipunek.js';

function rzecz(czesci: Partial<PrzedmiotWBazie>): PrzedmiotWBazie {
  return { id: 1, item_type: 1, item_id: 5, slot: 10, ...czesci };
}

describe('slotDlaRodzaju', () => {
  it('odwzorowuje getSlotIndex() z req.php', () => {
    // Kolejnosc miejsc na ekranie postaci: helm, zbroja, rekawice, buty,
    // amulet, pas, pierscien, talizman, bron, tarcza.
    expect([6, 3, 5, 4, 8, 7, 9, 10, 1, 2].map(slotDlaRodzaju)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
    ]);
  });

  it('rzeczy, ktorych sie nie nosi, ida do plecaka', () => {
    // Klucze do lochow (11), mikstury (12) i album (13).
    expect([11, 12, 13, 99].map(slotDlaRodzaju)).toEqual([10, 10, 10, 10]);
  });
});

describe('klasaPrzedmiotu', () => {
  it('czyta klase z tysiecy numeru przedmiotu', () => {
    expect(klasaPrzedmiotu(4)).toBe(1);
    expect(klasaPrzedmiotu(1004)).toBe(2);
    expect(klasaPrzedmiotu(2004)).toBe(3);
  });
});

describe('czyMozeLezec', () => {
  it('bron tylko w slocie broni', () => {
    const bron = rzecz({ item_type: 1, item_id: 5 });
    expect(czyMozeLezec(bron, 8, 1)).toBeNull();
    expect(czyMozeLezec(bron, 0, 1)).toBe('zle-miejsce');
  });

  it('nie da sie zalozyc przedmiotu innej klasy', () => {
    const bronMaga = rzecz({ item_type: 1, item_id: 1005 });
    expect(czyMozeLezec(bronMaga, 8, 2)).toBeNull();
    expect(czyMozeLezec(bronMaga, 8, 1)).toBe('inna-klasa');
  });

  it('bizuteria nie ma ograniczen klasowych', () => {
    // Rodzaje 8, 9 i 10 to amulet, pierscien i talizman — nosi je kazdy.
    const amulet = rzecz({ item_type: 8, item_id: 1003 });
    expect(czyMozeLezec(amulet, 4, 1)).toBeNull();
  });

  it('plecak przyjmuje wszystko', () => {
    const bronMaga = rzecz({ item_type: 1, item_id: 1005 });
    expect(czyMozeLezec(bronMaga, 12, 1)).toBeNull();
  });

  /*
   * ODSTEPSTWO (tabela w CLAUDE.md). Oryginal konczy kazdy ze swoich
   * warunkow czlonem `$item['item_type'] < 8`, wiec bizuterie da sie
   * tam wladowac w kazde miejsce na postaci — i zalozyc trzy pierscienie
   * naraz. U nas kazdy przedmiot ma swoje jedno miejsce.
   */
  it('bizuteria tez ma swoje jedno miejsce', () => {
    const naszyjnik = rzecz({ item_type: 8, item_id: 3 });
    const pierscien = rzecz({ item_type: 9, item_id: 3 });
    const talizman = rzecz({ item_type: 10, item_id: 3 });

    expect(czyMozeLezec(naszyjnik, 4, 1)).toBeNull();
    expect(czyMozeLezec(pierscien, 6, 1)).toBeNull();
    expect(czyMozeLezec(talizman, 7, 1)).toBeNull();

    // Kazde inne miejsce na postaci jest juz zle.
    expect(czyMozeLezec(pierscien, 4, 1)).toBe('zle-miejsce');
    expect(czyMozeLezec(pierscien, 7, 1)).toBe('zle-miejsce');
    expect(czyMozeLezec(naszyjnik, 6, 1)).toBe('zle-miejsce');
    expect(czyMozeLezec(talizman, 4, 1)).toBe('zle-miejsce');
    expect(czyMozeLezec(naszyjnik, 8, 1)).toBe('zle-miejsce');
  });

  it('bizuteria dalej nie ma ograniczen KLASOWYCH', () => {
    // Wezszy warunek klasy dotyczy tylko rodzajow 1-7. Bizuteria ma
    // `item_id` ponizej tysiaca, wiec `klasaPrzedmiotu` daje jedynke —
    // objecie jej tym warunkiem odcieloby ja magowi i zwiadowcy.
    const pierscien = rzecz({ item_type: 9, item_id: 3 });
    expect(czyMozeLezec(pierscien, 6, 2)).toBeNull();
    expect(czyMozeLezec(pierscien, 6, 3)).toBeNull();
  });
});

describe('zaplanujPrzeniesienie', () => {
  it('bez wskazanego celu zaklada na wlasciwe miejsce', () => {
    const helm = rzecz({ item_type: 6, item_id: 3, slot: 11 });
    expect(zaplanujPrzeniesienie(helm, null, null, 1)).toEqual({ zrodlo: 11, cel: 0 });
  });

  it('zamienia sie z tym, co lezalo w celu', () => {
    const wPlecaku = rzecz({ id: 1, item_type: 6, item_id: 3, slot: 11 });
    const zalozony = rzecz({ id: 2, item_type: 6, item_id: 4, slot: 0 });
    expect(zaplanujPrzeniesienie(wPlecaku, zalozony, null, 1)).toEqual({ zrodlo: 11, cel: 0 });
  });

  it('sprawdza takze przedmiot, ktory wraca na miejsce zrodla', () => {
    // Zdejmujemy helm na miejsce, w ktorym leza buty. Buty wrocilyby wtedy
    // na glowe, wiec przeniesienia nie ma. To warunek `$changeItm`
    // z req.php.
    const helm = rzecz({ id: 1, item_type: 6, item_id: 3, slot: 0 });
    const buty = rzecz({ id: 2, item_type: 4, item_id: 3, slot: 3 });
    expect(zaplanujPrzeniesienie(helm, buty, 3, 1)).toBe('zle-miejsce');
  });

  it('zdejmuje na puste miejsce w plecaku', () => {
    const helm = rzecz({ id: 1, item_type: 6, item_id: 3, slot: 0 });
    expect(zaplanujPrzeniesienie(helm, null, 12, 1)).toEqual({ zrodlo: 0, cel: 12 });
  });

  it('zamienia zalozony helm z helmem z plecaka', () => {
    const zalozony = rzecz({ id: 1, item_type: 6, item_id: 3, slot: 0 });
    const wPlecaku = rzecz({ id: 2, item_type: 6, item_id: 8, slot: 12 });
    expect(zaplanujPrzeniesienie(zalozony, wPlecaku, 12, 1)).toEqual({ zrodlo: 0, cel: 12 });
  });

  it('nie odloz do plecaka pod bron — bron trafilaby na glowe', () => {
    // W plecaku lezy bron. Gdyby helm poszedl na jej miejsce, bron
    // wskoczylaby na slot helmu. Oryginal odrzuca to warunkiem
    // `$changeItm` w req.php.
    const helm = rzecz({ id: 1, item_type: 6, item_id: 3, slot: 0 });
    const bron = rzecz({ id: 2, item_type: 1, item_id: 3, slot: 12 });
    expect(zaplanujPrzeniesienie(helm, bron, 12, 1)).toBe('zle-miejsce');
  });

  it('odrzuca miejsce spoza planszy', () => {
    const helm = rzecz({ item_type: 6, item_id: 3, slot: 11 });
    expect(zaplanujPrzeniesienie(helm, null, 15, 1)).toBe('poza-zakresem');
  });
});

describe('bonusyZPrzedmiotow', () => {
  it('sumuje cechy tylko z zalozonych rzeczy', () => {
    const suma = bonusyZPrzedmiotow([
      { slot: 0, atrybuty: [{ rodzaj: 1, wartosc: 5 }] },
      { slot: 12, atrybuty: [{ rodzaj: 1, wartosc: 100 }] },
    ]);
    expect(suma).toEqual([5, 0, 0, 0, 0]);
  });

  it('cecha numer 6 dolicza sie do wszystkich piatki', () => {
    expect(bonusyZPrzedmiotow([{ slot: 3, atrybuty: [{ rodzaj: 6, wartosc: 4 }] }])).toEqual([
      4, 4, 4, 4, 4,
    ]);
  });

  it('sumuje kilka przedmiotow i kilka cech naraz', () => {
    const suma = bonusyZPrzedmiotow([
      { slot: 0, atrybuty: [{ rodzaj: 1, wartosc: 3 }, { rodzaj: 4, wartosc: 2 }] },
      { slot: 8, atrybuty: [{ rodzaj: 1, wartosc: 7 }] },
    ]);
    expect(suma).toEqual([10, 0, 0, 2, 0]);
  });
});
