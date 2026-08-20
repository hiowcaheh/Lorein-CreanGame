/**
 * Konto gracza: zalozenie, logowanie, odczyt wlasnych danych.
 *
 * Trasy JSON dla nowego klienta. Stary protokol (`/req.php`) dziala dalej
 * obok — te same tabele, inna forma odpowiedzi.
 */

import { Hono } from 'hono';
import { getSql } from '../db/client.js';
import { zapiszWDzienniku } from '../db/dziennik.js';
import { loadDefaultStats } from '../game/stats.js';
import { time } from '../compat/php.js';
import { wczytajGracza, zakodujOpis } from './gracz.js';
import { czyStaryHash, hasloPasuje, nowyToken, zahashujHaslo } from './sesja.js';
import type { Context } from 'hono';

export const konto = new Hono();

/** Ile kont wolno zalozyc z jednego adresu IP. */
const KONT_NA_IP = 3;

interface DaneRejestracji {
  nick?: unknown;
  email?: unknown;
  haslo?: unknown;
  rasa?: unknown;
  plec?: unknown;
  klasa?: unknown;
  wyglad?: unknown;
}

function tekst(wartosc: unknown, maks = 200): string {
  return typeof wartosc === 'string' ? wartosc.trim().slice(0, maks) : '';
}

function liczba(wartosc: unknown, min: number, maks: number, domyslna: number): number {
  const n = typeof wartosc === 'number' ? wartosc : Number(wartosc);
  if (!Number.isFinite(n)) return domyslna;
  return Math.min(maks, Math.max(min, Math.trunc(n)));
}

function adresIp(c: Context): string {
  const naglowek = c.req.header('x-forwarded-for');
  if (naglowek) return naglowek.split(',')[0]!.trim();
  return c.req.header('x-real-ip') ?? '0.0.0.0';
}

/** Wspolna odpowiedz po zalozeniu konta i po zalogowaniu. */
async function odpowiedzZTokenem(sql: ReturnType<typeof getSql>, token: string) {
  const [wiersz] = await sql<Record<string, unknown>[]>`
    SELECT * FROM user_data WHERE ssid = ${token} LIMIT 1
  `;
  if (!wiersz) throw new Error('konto zniknelo miedzy zapisem a odczytem');
  return { token, gracz: await wczytajGracza(sql, wiersz) };
}

// ------------------------------------------------------------ zaloz --

konto.post('/register', async (c) => {
  const dane = (await c.req.json().catch(() => ({}))) as DaneRejestracji;

  const nick = tekst(dane.nick, 20);
  const email = tekst(dane.email, 120).toLowerCase();
  const haslo = typeof dane.haslo === 'string' ? dane.haslo : '';

  if (nick.length < 3) return c.json({ blad: 'Imię musi mieć co najmniej 3 znaki.' }, 400);
  if (/[^-a-z0-9_ ]/i.test(nick)) return c.json({ blad: 'Imię może zawierać tylko litery, cyfry, spację, - i _.' }, 400);
  if (haslo.length < 4) return c.json({ blad: 'Hasło musi mieć co najmniej 4 znaki.' }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return c.json({ blad: 'To nie wygląda na adres e-mail.' }, 400);

  const rasa = liczba(dane.rasa, 1, 8, 1);
  const klasa = liczba(dane.klasa, 1, 3, 1);
  const plec = dane.plec === 'f' ? 2 : 1;

  const wyglad = Array.isArray(dane.wyglad) ? dane.wyglad : [];
  const twarz = Array.from({ length: 10 }, (_, i) => liczba(wyglad[i], 0, 32000, 1));

  const sql = getSql();
  const ip = adresIp(c);

  const zajete = await sql<{ user_name: string; email: string }[]>`
    SELECT user_name, email FROM user_data WHERE user_name = ${nick} OR email = ${email}
  `;
  if (zajete.length > 0) {
    const kolizja = zajete[0]!;
    return c.json(
      { blad: kolizja.email === email ? 'Na ten adres jest już założone konto.' : 'To imię jest zajęte.' },
      409,
    );
  }

  const zTegoIp = await sql<{ ile: string }[]>`
    SELECT COUNT(*) AS ile FROM user_data WHERE last_ip = ${ip}
  `;
  if (Number(zTegoIp[0]?.ile ?? 0) >= KONT_NA_IP) {
    return c.json({ blad: 'Z tego adresu założono już maksymalną liczbę kont.' }, 429);
  }

  const cechy = loadDefaultStats(klasa, rasa);
  const token = nowyToken();
  const teraz = time();

  const [nowy] = await sql<{ user_id: number }[]>`
    INSERT INTO user_data (
      user_name, password, email, last_ip, last_activ, ssid, reg_date,
      class, race, gender,
      attr_str, attr_agi, attr_int, attr_wit, attr_luck,
      face1, face2, face3, face4, face5, face6, face7, face8, face9, face10,
      quest_gold_1, quest_gold_2, quest_gold_3,
      quest_exp_1, quest_exp_2, quest_exp_3,
      quest_location_1, quest_location_2, quest_location_3,
      quest_dur_1, quest_dur_2, quest_dur_3,
      g_silverspent, g_mushroomspent, user_desc, album_data, voucher_date,
      potion_id1, potion_id2, potion_id3,
      potion_value1, potion_value2, potion_value3,
      potion_time1, potion_time2, potion_time3
    ) VALUES (
      ${nick}, ${await zahashujHaslo(haslo)}, ${email}, ${ip}, ${String(teraz)}, ${token}, ${teraz},
      ${klasa}, ${rasa}, ${plec},
      ${cechy[0]!}, ${cechy[1]!}, ${cechy[2]!}, ${cechy[3]!}, ${cechy[4]!},
      ${twarz[0]!}, ${twarz[1]!}, ${twarz[2]!}, ${twarz[3]!}, ${twarz[4]!},
      ${twarz[5]!}, ${twarz[6]!}, ${twarz[7]!}, ${twarz[8]!}, ${twarz[9]!},
      0, 0, 0,
      0, 0, 0,
      1, 1, 1,
      1, 1, 1,
      0, 0, '', '', 0,
      0, 0, 0,
      0, 0, 0,
      0, 0, 0
    )
    RETURNING user_id
  `;

  // Bron startowa zalezna od klasy — jak w oryginale.
  const bron = klasa === 1 ? { id: 1, min: 4, maks: 8 }
             : klasa === 2 ? { id: 1001, min: 6, maks: 12 }
             : { id: 2001, min: 5, maks: 10 };

  await sql`
    INSERT INTO items (
      item_type, item_id, dmg_min, dmg_max,
      atr_type_1, atr_type_2, atr_type_3, atr_val_1, atr_val_2, atr_val_3,
      gold, mush, slot, owner_id
    ) VALUES (
      1, ${bron.id}, ${bron.min}, ${bron.maks},
      0, 0, 0, 0, 0, 0,
      1, 0, 8, ${nowy?.user_id ?? 0}
    )
  `;

  return c.json(await odpowiedzZTokenem(sql, token), 201);
});

// --------------------------------------------------------- zaloguj --

konto.post('/login', async (c) => {
  const dane = (await c.req.json().catch(() => ({}))) as { nick?: unknown; haslo?: unknown };
  const nick = tekst(dane.nick, 20);
  const haslo = typeof dane.haslo === 'string' ? dane.haslo : '';

  const sql = getSql();

  const [konto_] = await sql<Record<string, unknown>[]>`
    SELECT user_id, password, enabled FROM user_data WHERE user_name = ${nick} LIMIT 1
  `;

  // Ten sam komunikat przy zlym imieniu i przy zlym hasle — inaczej
  // odpowiedz zdradza, ktore konta istnieja.
  const zle = () => c.json({ blad: 'Nie ma takiego bohatera albo hasło się nie zgadza.' }, 401);

  if (!konto_) {
    await zapiszWDzienniku('/api/login', 401, 'logowanie-brak-konta', `nick: ${nick}`);
    return zle();
  }

  if (!(await hasloPasuje(haslo, String(konto_['password'] ?? '')))) {
    // Zapisujemy sam fakt i rodzaj zapisanego hasla — nigdy samego hasla.
    const rodzaj = String(konto_['password'] ?? '').startsWith('scrypt$') ? 'scrypt' : 'md5';
    await zapiszWDzienniku('/api/login', 401, 'logowanie-zle-haslo', `nick: ${nick}, zapisane haslo: ${rodzaj}`);
    return zle();
  }
  if (String(konto_['enabled'] ?? 'yes') === 'no') {
    return c.json({ blad: 'To konto zostało zablokowane.' }, 403);
  }

  const token = nowyToken();

  // Konto z czasow MD5 przechodzi na scrypt przy okazji logowania —
  // to jedyny moment, w ktorym mamy haslo w postaci jawnej.
  const nowyHash = czyStaryHash(String(konto_['password'] ?? '')) ? await zahashujHaslo(haslo) : null;

  await sql`
    UPDATE user_data
    SET ssid = ${token},
        last_ip = ${adresIp(c)},
        last_activ = ${String(time())}
        ${nowyHash ? sql`, password = ${nowyHash}` : sql``}
    WHERE user_id = ${Number(konto_['user_id'])}
  `;

  await zapiszWDzienniku('/api/login', 200, 'logowanie-ok', `nick: ${nick}`);
  return c.json(await odpowiedzZTokenem(sql, token));
});

// ------------------------------------------------------------- ja --

konto.get('/me', async (c) => {
  const token = tokenZNaglowka(c);
  if (!token) return c.json({ blad: 'Brak tokenu sesji.' }, 401);

  const sql = getSql();
  const [wiersz] = await sql<Record<string, unknown>[]>`
    SELECT * FROM user_data WHERE ssid = ${token} LIMIT 1
  `;

  if (!wiersz) return c.json({ blad: 'Sesja wygasła — zaloguj się ponownie.' }, 401);
  return c.json({ gracz: await wczytajGracza(getSql(), wiersz) });
});

// ---------------------------------------------------------- opis --

/**
 * Ile znakow opisu przyjmujemy.
 *
 * Oryginal nie mial twardego ograniczenia — pole `user_desc` to `text`,
 * a klient wysylal wszystko, co gracz wpisal. Ale pole opisu ma na
 * ekranie 440x200 pikseli, wiec dluzszy tekst i tak nie ma sie gdzie
 * zmiescic, a bez limitu kazdy moglby wpakowac do bazy megabajt.
 */
const DLUGOSC_OPISU = 500;

konto.post('/opis', async (c) => {
  const token = tokenZNaglowka(c);
  if (!token) return c.json({ blad: 'Brak tokenu sesji.' }, 401);

  const dane = (await c.req.json().catch(() => ({}))) as { opis?: unknown };
  if (typeof dane.opis !== 'string') return c.json({ blad: 'Brak opisu.' }, 400);

  // Znaki sterujace i znaki nowej linii wychodza — stary klient sklejal
  // odpowiedz srednikami i ukosnikami, wiec wpisany srednik potrafil
  // rozjechac caly protokol. Nowy klient tego nie ma, ale ta sama baza
  // obsluguje oba.
  const opis = dane.opis
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f;/|]/g, ' ')
    .trim()
    .slice(0, DLUGOSC_OPISU);

  const sql = getSql();
  const zmienione = await sql<Record<string, unknown>[]>`
    UPDATE user_data SET user_desc = ${zakodujOpis(opis)}
    WHERE ssid = ${token}
    RETURNING user_id
  `;

  if (zmienione.length === 0) {
    return c.json({ blad: 'Sesja wygasła — zaloguj się ponownie.' }, 401);
  }

  return c.json({ opis });
});

export function tokenZNaglowka(c: Context): string | null {
  const naglowek = c.req.header('authorization') ?? '';
  const dopasowanie = naglowek.match(/^Bearer\s+([0-9a-f]{32})$/i);
  return dopasowanie?.[1] ?? null;
}
