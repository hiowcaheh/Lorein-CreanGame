/**
 * Lochy — lista, wejscie i walka.
 *
 * Port `$ACT_ENTER_DUNGEON` (lista) i `$ACT_MAINQUEST` (jedna walka)
 * z `req.php`. Cala rozgrywka liczy sie tutaj: klient dostaje gotowy
 * zapis walki i nowy stan lochu, tak samo jak przy wyprawie.
 */

import { Hono } from 'hono';
import type { Context } from 'hono';
import { getSql } from '../db/client.js';
import { PhpMtRand } from '../compat/rng.js';
import { time } from '../compat/php.js';
import { LEVELS } from '../protocol/gamedata.js';
import { rozegrajWalke, wojownikZGracza, type Wojownik } from '../game/walka.js';
import { wolneMiejsceWPlecaku } from '../game/karczma.js';
import { wylosujPrzedmiot } from '../game/generatorPrzedmiotow.js';
import {
  GRZYBOW_ZA_POMINIECIE,
  KLUCZ_UZYTY,
  LOCHOW,
  PIERWSZY_POZIOM,
  POZIOMOW_W_LOCHU,
  PRZERWA_SEKUND,
  PRZESZEDL,
  kolumnaLochu,
  kopiaGracza,
  opisPotwora,
  otwarty,
  potworZLochu,
  poziomZeStanu,
} from '../game/lochy.js';
import {
  BEZ_KLASERA,
  PUSTY_KLASER,
  dopiszDoKlasera,
  dopiszPotworaDoKlasera,
  odczytajDaty,
  premiaZKlasera,
  zapiszDaty,
  type StanKlasera,
} from '../game/album.js';
import { dolozKolumne } from '../db/kolumny.js';
import { KOLUMNA_DAT } from '../game/album.js';
import { maPelneLustro } from '../game/lustro.js';
import {
  KOLUMNA_PIETRA,
  LOKACJA_WIEZY,
  PIERWSZE_PIETRO,
  PIETER_WIEZY,
  pietroZeStanu,
  potworZWiezy,
  poziomNagrody,
  przeszedlWieze,
  srebroZaPietro,
} from '../game/wieza.js';
import {
  opisWojownika,
  przedmiotyGracza,
  rysunekBroni,
  rysunekBroniPotwora,
  rysunekPiesci,
} from './karczma.js';
import { wczytajGracza, zbudujPrzedmiot, type Przedmiot as PrzedmiotEkranu } from './gracz.js';
import { tokenZNaglowka } from './konto.js';

export const lochy = new Hono();

type Sql = ReturnType<typeof getSql>;

interface WierszGracza extends Record<string, unknown> {
  user_id: number;
}

function liczba(wartosc: unknown): number {
  const n = Number(wartosc);
  return Number.isFinite(n) ? n : 0;
}

async function wczytaj(c: Context): Promise<{ sql: Sql; wiersz: WierszGracza } | null> {
  const token = tokenZNaglowka(c);
  if (!token) return null;

  const sql = getSql();
  const [wiersz] = await sql<WierszGracza[]>`SELECT * FROM user_data WHERE ssid = ${token} LIMIT 1`;
  return wiersz ? { sql, wiersz } : null;
}

/** Jeden loch tak, jak widzi go ekran listy. */
export interface OpisLochu {
  numer: number;
  /** Wartosc kolumny `dungeon_N`: 0 zamkniety, 2-11 poziom, 12 przejsty. */
  stan: number;
  /** Poziom, przed ktorym stoi gracz (1..10). */
  poziom: number;
  /** Numer potwora czekajacego na tym poziomie; `-1` przy kopii gracza. */
  potwor: number;
}

export interface StanLochow {
  lochy: OpisLochu[];
  /**
   * Lochy otwarte wlasnie teraz — dla nich klient odgrywa otwieranie wrot.
   *
   * Oryginal poznaje je po tym, ze zapis stanu wyslany do klienta ma
   * jeszcze jedynke (`DungeonLevel == "0"`), mimo ze baza dostala juz
   * dwojke. Zamiast wysylac nieaktualna liczbe, mowimy wprost, ktore
   * to sa — efekt ten sam: `FadeOut(CNT_MQS_DISABLED + i)` i `unlock.mp3`.
   */
  swiezoOtwarte: number[];
  /** Do kiedy trwa przerwa — czas uniksowy. */
  przerwaDo: number;
  teraz: number;
  grzyby: number;
  wolneMiejsceWPlecaku: boolean;
}

/**
 * Czy bohater jest zajety na tyle, ze nie zejdzie do lochu.
 *
 *     if ($status === 1 && $mirror < $fullMirror) { ... }
 *     if ($status === 2 && $mirror < $fullMirror) { ... }
 *
 * `status` 1 to praca na warcie, 2 to wyprawa. Komplet Magicznego Lustra
 * znosi oba warunki — to cala jego moc.
 */
function zajetyBezLustra(wiersz: WierszGracza): boolean {
  const status = liczba(wiersz['status']);
  return (status === 1 || status === 2) && !maPelneLustro(wiersz['magic_mirror']);
}

/**
 * Wejscie na liste lochow.
 *
 * `$ACT_ENTER_DUNGEON` przy okazji podnosi kazda jedynke do dwojki —
 * to wlasnie tu klucz uzyty na ekranie postaci staje sie otwartym lochem.
 */
async function stanLochow(sql: Sql, wiersz: WierszGracza): Promise<StanLochow> {
  const swiezoOtwarte: number[] = [];

  for (let loch = 1; loch < 10; loch++) {
    if (liczba(wiersz[`dungeon_${loch}`]) !== KLUCZ_UZYTY) continue;
    swiezoOtwarte.push(loch);
    wiersz[`dungeon_${loch}`] = PIERWSZY_POZIOM;
    await sql`
      UPDATE user_data SET ${sql(`dungeon_${loch}`)} = ${PIERWSZY_POZIOM}
      WHERE user_id = ${wiersz.user_id}
    `;
  }

  const zajete = (
    await sql<{ slot: number }[]>`
      SELECT slot FROM items WHERE owner_id = ${wiersz.user_id} AND slot >= 10
    `
  ).map((w) => w.slot);

  const opisy: OpisLochu[] = [];
  for (let loch = 1; loch <= LOCHOW; loch++) {
    const stan = liczba(wiersz[`dungeon_${loch}`]);
    const opis = opisPotwora(loch, stan);
    opisy.push({
      numer: loch,
      stan,
      poziom: poziomZeStanu(stan),
      potwor: opis ? opis.numer : -1,
    });
  }

  return {
    lochy: opisy,
    swiezoOtwarte,
    przerwaDo: liczba(wiersz['dungeon_time']),
    teraz: time(),
    grzyby: liczba(wiersz['mushroom']),
    wolneMiejsceWPlecaku: wolneMiejsceWPlecaku(zajete) !== null,
  };
}

lochy.get('/lochy', async (c) => {
  const dane = await wczytaj(c);
  if (!dane) return c.json({ blad: 'Sesja wygasła — zaloguj się ponownie.' }, 401);

  if (zajetyBezLustra(dane.wiersz)) {
    return c.json(
      { blad: 'Jesteś zajęty. Dopiero komplet Magicznego Lustra pozwala zejść do lochu w trakcie wyprawy.' },
      409,
    );
  }

  /*
   * Wieza idzie razem z lochami. Oryginal tez podaje ja od razu —
   * `$ret[] = tower_level - 1` siedzi w tej samej odpowiedzi, co lochy,
   * bo jej kafel stoi na drugiej planszy i musi zaraz pokazac pietro.
   */
  await dolozKolumne(dane.sql, 'user_data', 'tower_level', KOLUMNA_PIETRA);

  const stan = await stanLochow(dane.sql, dane.wiersz);
  return c.json({
    ...stan,
    wieza: await stanWiezy(dane.sql, dane.wiersz),
    gracz: await wczytajGracza(dane.sql, dane.wiersz),
  });
});

/** Rozliczenie jednej walki w lochu — ten sam ksztalt, co przy wyprawie. */
interface RozliczenieLochu {
  wygrana: boolean;
  /** Numer lochu. */
  loch: number;
  /**
   * Numer krainy dla tla walki. Lochy stoja na `IMG_SCR_QUEST_BG_1 + 50 + N`,
   * czyli `location{50 + N}.jpg` — ten sam mechanizm, co przy wyprawie.
   */
  lokacja: number;
  poziom: number;
  awans: number | null;
  /*
   * Ten sam ksztalt, co po wyprawie — ekran walki jest wspolny. Honoru
   * ani grzybow loch nie daje, wiec stoja tam zera.
   */
  nagroda: { zloto: number; doswiadczenie: number; honor: number; grzyby: number } | null;
  /** Skladniki premii, w procentach — klient rozpisuje je po klikniecu. */
  premie: { klaser: number };
  premieZlota: Record<string, number>;
  /** Ekran walki potrafi pokazac, ze plecak byl pelny; tutaj nigdy nie jest. */
  plecakBylPelny: boolean;
  zdobytyPrzedmiot: PrzedmiotEkranu | null;
  /** Loch przeszedl do konca — `stage == 12`. */
  ukonczony: boolean;
  walka: unknown;
}

lochy.post('/lochy/:numer/walcz', async (c) => {
  const dane = await wczytaj(c);
  if (!dane) return c.json({ blad: 'Sesja wygasła — zaloguj się ponownie.' }, 401);

  const { sql } = dane;
  const wiersz = dane.wiersz;
  const numer = Number(c.req.param('numer'));
  const kolumna = kolumnaLochu(numer);
  if (!kolumna) return c.json({ blad: 'Nie ma takiego lochu.' }, 400);

  if (zajetyBezLustra(wiersz)) {
    return c.json(
      { blad: 'Jesteś zajęty. Dopiero komplet Magicznego Lustra pozwala zejść do lochu w trakcie wyprawy.' },
      409,
    );
  }

  const stan = liczba(wiersz[kolumna]);
  // `if ($db_data['dungeon_' . $dung] >= 12) break;` — po nim nie ma co robic.
  if (stan >= PRZESZEDL) return c.json({ blad: 'Ten loch masz już za sobą.' }, 409);
  // `if ($db_data['dungeon_' . $dung] < 2) $ret = [$ERR_SESSION_ID_EXPIRED];`
  if (!otwarty(stan)) return c.json({ blad: 'Nie masz klucza do tego miejsca.' }, 409);

  /*
   * Miejsce w plecaku sprawdza sie PRZED walka:
   *
   *     $slotInfo = findFreeSlot(...);
   *     if ($slotInfo[0] == false) { $ret = [$ERR_INVENTORY_FULL]; break; }
   */
  const zajete = (
    await sql<{ slot: number }[]>`
      SELECT slot FROM items WHERE owner_id = ${wiersz.user_id} AND slot >= 10
    `
  ).map((w) => w.slot);
  const miejsce = wolneMiejsceWPlecaku(zajete);
  if (miejsce === null) return c.json({ blad: 'Plecak jest pełny.' }, 409);

  /*
   * Przerwa miedzy walkami. Grzyb ja pomija, ale NIE skraca — oryginal
   * zostawia wtedy stary `dungeon_time`, wiec kolejna walka znowu
   * kosztuje grzyba, dopoki godzina nie minie.
   */
  const teraz = time();
  let koniecPrzerwy = liczba(wiersz['dungeon_time']);
  let grzyby = liczba(wiersz['mushroom']);

  if (teraz < koniecPrzerwy) {
    if (grzyby <= 0) return c.json({ blad: 'Musisz odczekać albo zapłacić grzybem.' }, 409);
    grzyby -= GRZYBOW_ZA_POMINIECIE;
  } else {
    koniecPrzerwy = teraz + PRZERWA_SEKUND;
  }

  // ------------------------------------------------------------ walka --

  const rng = new PhpMtRand();
  const przedmioty = await przedmiotyGracza(sql, wiersz.user_id);
  const gracz = wojownikZGracza(wiersz, przedmioty);

  const opis = opisPotwora(numer, stan);
  const potwor: Wojownik = opis
    ? potworZLochu(opis, 'Potwór')
    : kopiaGracza(gracz, String(wiersz['user_name'] ?? 'Sobowtór'));
  const numerPotwora = opis ? opis.numer : -1;
  const doswiadczeniePotwora = opis ? opis.doswiadczenie : 13322552;
  const bronPotwora = opis ? opis.bron : 0;

  const doRysowania = await sql<Record<string, unknown>[]>`
    SELECT slot, item_type, item_id, upgrade_level, dmg_min, dmg_max,
           atr_type_1, atr_type_2, atr_type_3, atr_val_1, atr_val_2, atr_val_3,
           gold, mush
    FROM items WHERE owner_id = ${wiersz.user_id} AND slot IN (8, 9)
  `;
  const bronWSlocie = doRysowania.find((p) => liczba(p['slot']) === 8);
  const tarczaWSlocie = doRysowania.find((p) => liczba(p['slot']) === 9);
  const bronGracza = bronWSlocie ? liczba(bronWSlocie['item_id']) : 0;
  const rysunekBroniGracza = bronWSlocie ? rysunekBroni(bronWSlocie) : rysunekPiesci();
  const ikonaTarczyGracza = tarczaWSlocie ? zbudujPrzedmiot(tarczaWSlocie).obrazek : null;

  const zycieGraczaPrzed = gracz.zycie;
  const zyciePotworaPrzed = potwor.zycie;
  const walka = rozegrajWalke(gracz, potwor, rng);
  const wygrana = walka.wygral === 1;

  // ------------------------------------------------------- rozliczenie --

  let poziom = liczba(wiersz['lvl']) || 1;
  const poziomPrzed = poziom;
  let doswiadczenie = liczba(wiersz['exp']);
  let srebro = liczba(wiersz['silver']);
  let nowyStan = stan;
  let zdobytyPrzedmiot: PrzedmiotEkranu | null = null;

  /*
   * Nagroda. Oryginal losuje `rand(1, 3)` PRZED sprawdzeniem wygranej
   * i po tej liczbie poznaje, czy zamiast zlota wypadnie przedmiot:
   *
   *     if ($itemRand == 1 || $stage == 12 || $db_data['dungeon_13'] >= 2)
   *         $db_data['silver'] += 0;  // i leci przedmiot
   *     else
   *         $db_data['silver'] += $OP->getGold();
   */
  const losPrzedmiotu = rng.rand(1, 3);

  const maKlaser = liczba(wiersz['album'] ?? BEZ_KLASERA) !== BEZ_KLASERA;
  let stanKlasera: StanKlasera = {
    dane: String(wiersz['album_data'] ?? '') || PUSTY_KLASER,
    ile: liczba(wiersz['album'] ?? 0),
    daty: odczytajDaty(wiersz['album_dates']),
  };
  const klaserPrzed = stanKlasera.ile;

  /*
   * SWIADOME ODSTEPSTWO (tabela w CLAUDE.md): premia kolekcjonera liczy
   * sie takze w lochu. `req.php` doklada `$OP->getExp()` i `$OP->getGold()`
   * surowo — premie chodza tam tylko przy wyprawie (`finishQuest`).
   *
   * Dotyczy WYLACZNIE doswiadczenia, tak samo jak przy wyprawie: tam
   * `$albumbonus` wchodzi do `$exp`, a zloto liczy sie osobnym wzorem,
   * ktory klasera w ogole nie zna.
   */
  const bonusKlasera = maKlaser ? premiaZKlasera(klaserPrzed) : 0;
  const zPremia = (ile: number) => Math.trunc(ile * (1 + bonusKlasera));

  if (wygrana) {
    nowyStan = stan + 1;
    doswiadczenie += zPremia(doswiadczeniePotwora);

    /*
     * `$this->silver = $exp * 2.5;` — zloto potwora liczy sie z GOLEGO
     * doswiadczenia, jeszcze przed premia.
     */
    const zlotoPotwora = Math.trunc(doswiadczeniePotwora * 2.5);
    const zamiastZlota =
      losPrzedmiotu === 1 || nowyStan === PRZESZEDL || liczba(wiersz['dungeon_13']) >= 2;

    if (!zamiastZlota) srebro += zlotoPotwora;

    if (maKlaser && numerPotwora > 0) {
      stanKlasera = dopiszPotworaDoKlasera(stanKlasera, numerPotwora, teraz);
    }

    if (zamiastZlota) {
      /*
       * `genItem($statvalue, $class, $shop, 'dungeon')`, gdzie
       * `$statvalue = min($OP->getLvl(), $lvl)` i `$shop = max(0, rand(0,2) - 1)`.
       */
      const naJakiPoziom = Math.min(potwor.poziom, poziom);
      const sklep = Math.max(0, rng.rand(0, 2) - 1);
      const zdobycz = wylosujPrzedmiot(naJakiPoziom, liczba(wiersz['class']) || 1, {
        sklep,
        /*
         * Bez tego z lochu wypadal KOLEJNY Klaser Dokladnosci graczowi,
         * ktory juz go ma. `losujRodzajGabinetu()` puszcza rodzaj 13
         * wylacznie przy `album == -1`, a tutaj nie dostawal o tym znac.
         * Klucze i odlamki lustra do lochu i tak nie dochodza: rodzaj 11
         * rodzi sie tylko z wyprawy (`$option === "tavern"`).
         */
        maAlbum: maKlaser,
        losuj: (od, doo) => rng.rand(od, doo),
      });

      if (zdobycz) {
        await sql`
          INSERT INTO items (item_type, item_id, dmg_min, dmg_max,
                             atr_type_1, atr_type_2, atr_type_3,
                             atr_val_1, atr_val_2, atr_val_3,
                             gold, mush, slot, owner_id)
          VALUES (${zdobycz.item_type}, ${zdobycz.item_id}, ${zdobycz.dmg_min}, ${zdobycz.dmg_max},
                  ${zdobycz.atr_type_1}, ${zdobycz.atr_type_2}, ${zdobycz.atr_type_3},
                  ${zdobycz.atr_val_1}, ${zdobycz.atr_val_2}, ${zdobycz.atr_val_3},
                  ${zdobycz.gold}, ${zdobycz.mush}, ${miejsce}, ${wiersz.user_id})
        `;
        zdobytyPrzedmiot = {
          ...zbudujPrzedmiot({ ...zdobycz, upgrade_level: 0 }),
          slot: miejsce,
        };
        if (maKlaser) stanKlasera = dopiszDoKlasera(stanKlasera, [zdobycz], teraz);
      }
    }

    // Awans — ten sam wzor, co po wyprawie.
    while (doswiadczenie > (LEVELS[poziom] ?? Number.MAX_SAFE_INTEGER)) {
      doswiadczenie -= LEVELS[poziom]!;
      poziom += 1;
    }
  }

  await sql`
    UPDATE user_data SET
      exp = ${doswiadczenie}, lvl = ${poziom}, silver = ${srebro},
      mushroom = ${grzyby}, dungeon_time = ${koniecPrzerwy},
      ${sql(kolumna)} = ${nowyStan}
    WHERE user_id = ${wiersz.user_id}
  `;

  /*
   * Przejscie lochu 9-12 otwiera nastepny:
   *
   *     if ($dung >= 9 && $dung <= 12 && $stage == 12) $stage2 = 2;
   */
  if (numer >= 9 && numer <= 12 && nowyStan === PRZESZEDL) {
    const kolejny = kolumnaLochu(numer + 1);
    if (kolejny) {
      await sql`
        UPDATE user_data SET ${sql(kolejny)} = ${PIERWSZY_POZIOM}
        WHERE user_id = ${wiersz.user_id}
      `;
    }
  }

  if (maKlaser && stanKlasera.ile > klaserPrzed) {
    if (await dolozKolumne(sql, 'user_data', 'album_dates', KOLUMNA_DAT)) {
      await sql`
        UPDATE user_data SET
          album_data = ${stanKlasera.dane},
          album = ${stanKlasera.ile},
          album_dates = ${zapiszDaty(stanKlasera.daty)}
        WHERE user_id = ${wiersz.user_id}
      `;
    } else {
      await sql`
        UPDATE user_data SET album_data = ${stanKlasera.dane}, album = ${stanKlasera.ile}
        WHERE user_id = ${wiersz.user_id}
      `;
    }
  }

  const [swiezy] = await sql<WierszGracza[]>`
    SELECT * FROM user_data WHERE user_id = ${wiersz.user_id} LIMIT 1
  `;

  const rozliczenie: RozliczenieLochu = {
    wygrana,
    loch: numer,
    lokacja: 50 + numer,
    poziom: poziomZeStanu(stan),
    awans: poziom > poziomPrzed ? poziom : null,
    nagroda: wygrana
      ? {
          zloto:
            losPrzedmiotu === 1 || nowyStan === PRZESZEDL
              ? 0
              : Math.trunc(doswiadczeniePotwora * 2.5),
          doswiadczenie: zPremia(doswiadczeniePotwora),
          honor: 0,
          grzyby: 0,
        }
      : null,
    premie: { klaser: Math.round(bonusKlasera * 100) },
    /** Zlota zadna premia nie dotyczy — patrz komentarz przy `zPremia`. */
    premieZlota: {},
    zdobytyPrzedmiot,
    plecakBylPelny: false,
    ukonczony: nowyStan >= PRZESZEDL,
    walka: {
      gracz: {
        ...opisWojownika(gracz, zycieGraczaPrzed, bronGracza),
        ...rysunekBroniGracza,
        tarczaObrazek: ikonaTarczyGracza,
      },
      potwor: {
        ...opisWojownika(potwor, zyciePotworaPrzed, bronPotwora),
        obrazek: numerPotwora,
        ...rysunekBroniPotwora(bronPotwora),
        tarczaObrazek: null,
      },
      ciosy: walka.ciosy,
    },
  };

  const stanPo = await stanLochow(sql, swiezy ?? wiersz);
  return c.json({
    ...stanPo,
    rozliczenie,
    gracz: await wczytajGracza(sql, swiezy ?? wiersz),
  });
});


// ============================================================ WIEZA ==

/*
 * Wieza — sto pieter, port `$ACT_TOWER_TRY`.
 *
 * Siedzi w tym samym module, co lochy, bo dzieli z nimi wszystko poza
 * tabela potworow: ten sam ekran wejsciowy, ta sama przerwa
 * (`dungeon_time`), ta sama walka i ten sam sposob losowania nagrody.
 *
 * ODSTEPSTWO: oryginal przepuszcza przez potwora CZTERY rundy — trzej
 * pomocnicy (`Copycat`), a dopiero potem gracz, przy czym zycie potwora
 * przechodzi z rundy do rundy. Pomocnikow jeszcze nie ma czym ubrac
 * (`tower_helper_items`), a bez ekwipunku ich bron ma zero obrazen, wiec
 * potwor i tak doszedlby do gracza z pelnym zyciem. Zostaje wiec sama
 * runda gracza — mechanicznie to samo, co w oryginale przy nagich
 * pomocnikach. Patrz DO-ZROBIENIA.md.
 */

interface StanWiezy {
  pietro: number;
  pieterWszystkich: number;
  /** Numer potwora z tego pietra — tak samo jak w lochu. */
  potwor: number;
  ukonczona: boolean;
  przerwaDo: number;
  teraz: number;
  grzyby: number;
  wolneMiejsceWPlecaku: boolean;
}

async function stanWiezy(sql: Sql, wiersz: WierszGracza): Promise<StanWiezy> {
  const zajete = (
    await sql<{ slot: number }[]>`
      SELECT slot FROM items WHERE owner_id = ${wiersz.user_id} AND slot >= 10
    `
  ).map((w) => w.slot);

  const stan = liczba(wiersz['tower_level']) || PIERWSZE_PIETRO;
  const potwor = potworZWiezy(stan);

  return {
    pietro: pietroZeStanu(stan),
    pieterWszystkich: PIETER_WIEZY,
    potwor: potwor ? potwor.numer : -1,
    ukonczona: przeszedlWieze(stan),
    przerwaDo: liczba(wiersz['dungeon_time']),
    teraz: time(),
    grzyby: liczba(wiersz['mushroom']),
    wolneMiejsceWPlecaku: wolneMiejsceWPlecaku(zajete) !== null,
  };
}

lochy.get('/wieza', async (c) => {
  const dane = await wczytaj(c);
  if (!dane) return c.json({ blad: 'Sesja wygasła — zaloguj się ponownie.' }, 401);

  await dolozKolumne(dane.sql, 'user_data', 'tower_level', KOLUMNA_PIETRA);
  return c.json(await stanWiezy(dane.sql, dane.wiersz));
});

lochy.post('/wieza/walcz', async (c) => {
  const dane = await wczytaj(c);
  if (!dane) return c.json({ blad: 'Sesja wygasła — zaloguj się ponownie.' }, 401);

  const { sql, wiersz } = dane;

  if (zajetyBezLustra(wiersz)) {
    return c.json(
      { blad: 'Jesteś zajęty. Dopiero komplet Magicznego Lustra pozwala wejść do wieży w trakcie wyprawy.' },
      409,
    );
  }

  await dolozKolumne(sql, 'user_data', 'tower_level', KOLUMNA_PIETRA);

  const stan = liczba(wiersz['tower_level']) || PIERWSZE_PIETRO;
  if (przeszedlWieze(stan)) return c.json({ blad: 'Wieżę masz już za sobą.' }, 409);

  const opis = potworZWiezy(stan);
  if (!opis) return c.json({ blad: 'Tego piętra nie ma.' }, 409);

  // `if ($slotInfo[0] == false) { $ret = [$ERR_INVENTORY_FULL]; break; }`
  const zajete = (
    await sql<{ slot: number }[]>`
      SELECT slot FROM items WHERE owner_id = ${wiersz.user_id} AND slot >= 10
    `
  ).map((w) => w.slot);
  const miejsce = wolneMiejsceWPlecaku(zajete);
  if (miejsce === null) return c.json({ blad: 'Plecak jest pełny.' }, 409);

  // Przerwa wspolna z lochami — ta sama kolumna i te same zasady.
  const teraz = time();
  let koniecPrzerwy = liczba(wiersz['dungeon_time']);
  let grzyby = liczba(wiersz['mushroom']);

  if (teraz < koniecPrzerwy) {
    if (grzyby <= 0) return c.json({ blad: 'Musisz odczekać albo zapłacić grzybem.' }, 409);
    grzyby -= GRZYBOW_ZA_POMINIECIE;
  } else {
    koniecPrzerwy = teraz + PRZERWA_SEKUND;
  }

  // ------------------------------------------------------------ walka --

  const rng = new PhpMtRand();
  const przedmioty = await przedmiotyGracza(sql, wiersz.user_id);
  const gracz = wojownikZGracza(wiersz, przedmioty);
  const potwor = potworZLochu(opis, 'Strażnik piętra');

  const doRysowania = await sql<Record<string, unknown>[]>`
    SELECT slot, item_type, item_id, upgrade_level, dmg_min, dmg_max,
           atr_type_1, atr_type_2, atr_type_3, atr_val_1, atr_val_2, atr_val_3,
           gold, mush
    FROM items WHERE owner_id = ${wiersz.user_id} AND slot IN (8, 9)
  `;
  const bronWSlocie = doRysowania.find((p) => liczba(p['slot']) === 8);
  const tarczaWSlocie = doRysowania.find((p) => liczba(p['slot']) === 9);
  const bronGracza = bronWSlocie ? liczba(bronWSlocie['item_id']) : 0;
  const rysunekBroniGracza = bronWSlocie ? rysunekBroni(bronWSlocie) : rysunekPiesci();
  const ikonaTarczyGracza = tarczaWSlocie ? zbudujPrzedmiot(tarczaWSlocie).obrazek : null;

  const zycieGraczaPrzed = gracz.zycie;
  const zyciePotworaPrzed = potwor.zycie;
  const walka = rozegrajWalke(gracz, potwor, rng);
  const wygrana = walka.wygral === 1;

  // ------------------------------------------------------- rozliczenie --

  let srebro = liczba(wiersz['silver']);
  let nowyStan = stan;
  let zdobytyPrzedmiot: PrzedmiotEkranu | null = null;
  let zdobyteSrebro = 0;

  if (wygrana) {
    nowyStan = stan + 1;
    zdobyteSrebro = srebroZaPietro(opis);
    srebro += zdobyteSrebro;

    /*
     * Nagroda przedmiotowa. Klasa jest LOSOWA i nigdy nie jest klasa
     * gracza — wieza daje rzeczy do sprzedania, a nie do zalozenia:
     *
     *     $class = rand(1, 3);
     *     while ($class == $db_data['class']) $class = rand(1, 3);
     *     $shop = rand(0, 2) - 1; if ($shop < 0) $shop = 0;
     */
    const klasaGracza = liczba(wiersz['class']) || 1;
    let klasa = rng.rand(1, 3);
    while (klasa === klasaGracza) klasa = rng.rand(1, 3);
    const sklep = Math.max(0, rng.rand(0, 2) - 1);

    const zdobycz = wylosujPrzedmiot(poziomNagrody(opis, liczba(wiersz['lvl']) || 1), klasa, {
      sklep,
      maAlbum: liczba(wiersz['album'] ?? BEZ_KLASERA) !== BEZ_KLASERA,
      losuj: (od, doo) => rng.rand(od, doo),
    });

    if (zdobycz) {
      /*
       * `':gold' => 0` — oryginal zeruje zloto przedmiotu z wiezy, wiec
       * sprzedaz nie oddaje za niego nic poza grzybami.
       */
      await sql`
        INSERT INTO items (item_type, item_id, dmg_min, dmg_max,
                           atr_type_1, atr_type_2, atr_type_3,
                           atr_val_1, atr_val_2, atr_val_3,
                           gold, mush, slot, owner_id)
        VALUES (${zdobycz.item_type}, ${zdobycz.item_id}, ${zdobycz.dmg_min}, ${zdobycz.dmg_max},
                ${zdobycz.atr_type_1}, ${zdobycz.atr_type_2}, ${zdobycz.atr_type_3},
                ${zdobycz.atr_val_1}, ${zdobycz.atr_val_2}, ${zdobycz.atr_val_3},
                0, ${zdobycz.mush}, ${miejsce}, ${wiersz.user_id})
      `;
      zdobytyPrzedmiot = {
        ...zbudujPrzedmiot({ ...zdobycz, gold: 0, upgrade_level: 0 }),
        slot: miejsce,
      };
    }
  }

  await sql`
    UPDATE user_data SET
      silver = ${srebro}, mushroom = ${grzyby},
      dungeon_time = ${koniecPrzerwy}, tower_level = ${nowyStan}
    WHERE user_id = ${wiersz.user_id}
  `;

  const [swiezy] = await sql<WierszGracza[]>`
    SELECT * FROM user_data WHERE user_id = ${wiersz.user_id} LIMIT 1
  `;

  const rozliczenie: RozliczenieLochu = {
    wygrana,
    loch: 0,
    /** Tlo walki w wiezy — `location_tower.jpg`, patrz `LOKACJA_WIEZY`. */
    lokacja: LOKACJA_WIEZY,
    poziom: pietroZeStanu(stan),
    /** Wieza nie daje doswiadczenia, wiec i awansu z niej nie ma. */
    awans: null,
    nagroda: wygrana
      ? { zloto: zdobyteSrebro, doswiadczenie: 0, honor: 0, grzyby: 0 }
      : null,
    premie: { klaser: 0 },
    premieZlota: {},
    zdobytyPrzedmiot,
    plecakBylPelny: false,
    ukonczony: przeszedlWieze(nowyStan),
    walka: {
      gracz: {
        ...opisWojownika(gracz, zycieGraczaPrzed, bronGracza),
        ...rysunekBroniGracza,
        tarczaObrazek: ikonaTarczyGracza,
      },
      potwor: {
        ...opisWojownika(potwor, zyciePotworaPrzed, opis.bron),
        obrazek: opis.numer,
        ...rysunekBroniPotwora(opis.bron),
        tarczaObrazek: null,
      },
      ciosy: walka.ciosy,
    },
  };

  const stanPo = await stanWiezy(sql, swiezy ?? wiersz);
  return c.json({
    ...stanPo,
    rozliczenie,
    gracz: await wczytajGracza(sql, swiezy ?? wiersz),
  });
});

export { POZIOMOW_W_LOCHU };
