/**
 * Pula polaczen do bazy gry.
 *
 * Na tym etapie zapytania pisane sa recznie w SQL — tak jak w `req.php`,
 * co ulatwia porownanie portu z oryginalem. Kolejnym krokiem jest
 * introspekcja schematu (19 tabel) do typowanego modelu; wymaga to jednak
 * dostepu do dzialajacej bazy, wiec nalezy do wdrozenia u Ciebie, nie tutaj.
 */

import mysql from 'mysql2/promise';
import { config } from '../config.js';

let pool: mysql.Pool | undefined;

export function getPool(): mysql.Pool {
  pool ??= mysql.createPool({
    host: config.db.host,
    port: config.db.port,
    database: config.db.database,
    user: config.db.user,
    password: config.db.password,
    waitForConnections: true,
    connectionLimit: 10,
    charset: 'utf8mb4',
    // Gra trzyma czasy jako liczby uniksowe, a nie typy DATE — bez tego
    // sterownik probowalby konwertowac je na obiekty Date.
    dateStrings: true,
  });

  return pool;
}

export async function withConnection<T>(fn: (conn: mysql.PoolConnection) => Promise<T>): Promise<T> {
  const conn = await getPool().getConnection();
  try {
    return await fn(conn);
  } finally {
    conn.release();
  }
}

export async function closePool(): Promise<void> {
  await pool?.end();
  pool = undefined;
}
