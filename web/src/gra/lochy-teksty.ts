/*
 * PLIK GENEROWANY — nie poprawiaj recznie.
 * Zrodlo: sf555/lang/sfgame_pl.txt oraz stale TXT_* klienta Flash.
 * Generator: backend/scripts/gen-lochy.mjs
 */

/**
 * Nazwy lochow i ich motta — `TXT_DUNGEON_NAME + i` dla i = 0..8,
 * czyli lochy 1..9. Motto stoi po pionowej kresce i klient pokazuje je
 * osobnym, blekitnym wierszem (`FontFormat_EpicItemQuote`).
 */
export const NAZWY_LOCHOW: { nazwa: string; motto: string }[] = [
  { nazwa: 'Zbezczeszczone Katakumby', motto: '"Martwi są tu wyjątkowo żywi."' },
  { nazwa: 'Kopalnie Glorii', motto: '"Hej-ho! Hej-ho! Do pracy by się szło!"' },
  { nazwa: 'Ruiny Gnark', motto: '"Gdzieś na dzikim zachodzie."' },
  { nazwa: 'Grota Korsarzy', motto: '"Szemrane typy w szemranym miejscu."' },
  { nazwa: 'Ołtarz Szmaragdowej Łuski', motto: '"Żąda ofiar..."' },
  { nazwa: 'Toksyczne Drzewo', motto: '"Jego korzenie sięgają czeluści piekielnych."' },
  { nazwa: 'Strumień Lawy', motto: '"Gorąca imprezka."' },
  { nazwa: 'Świątynia Zimnej Krwi', motto: '"Zachowaj jej nazwę."' },
  { nazwa: 'Piramida Szaleństwa', motto: '"Nie trać głowy."' },
];

/**
 * Druga plansza — `TXT_HL_MAINQUESTS_NAME + i` dla i = 0..5:
 * lochy 10-13, potem wieza i portal.
 */
export const NAZWY_DRUGIEJ_PLANSZY: { nazwa: string; motto: string }[] = [
  { nazwa: 'Twierdza', motto: 'Z zewnątrz wygląda na solidną.' },
  { nazwa: 'Cyrk', motto: 'Skąd dobiega ta radosna melodia?' },
  { nazwa: 'Piekło', motto: 'Nie może być tam aż tak źle...' },
  { nazwa: '13. piętro', motto: 'Na sam szczyt!' },
  { nazwa: 'Wieża', motto: 'Za siedmioma górami i lasami, był sobie dzielny poszukiwacz przygód i jego trzech kompanów...' },
  { nazwa: 'Portal do piekieł', motto: 'Znasz już ojczyznę demonów?' },
];

/** `TXT_HL_MAINQUESTS_TITLE` — tytul drugiej planszy. */
export const TYTUL_DRUGIEJ_PLANSZY = 'Lochy';

/** `TXT_DUNGEON_INFO` — „Poziom: %1/10#Kolejny przeciwnik: %2". */
export const OPIS_POSTEPU = 'Poziom: %1/10#Kolejny przeciwnik: %2';
/** `TXT_DUNGEON_INFO + 1` — nad zamknietym lochem. */
export const BRAK_KLUCZA = 'Nie masz klucza do tego miejsca.';
/** `TXT_DUNGEON_INFO + 2` — nad przejsztym lochem. */
export const OCZYSZCZONY = 'Oczyściłeś to miejsce z wszelkiego plugastwa.';
/** `TXT_DUNGEON_INFO + 3` — tytul ekranu lochu: „%1 - Poziom %2/10". */
export const TYTUL_LOCHU = '%1 - Poziom %2/10';
/** `TXT_DUNGEON_INFO + 4` — tytul listy lochow. */
export const TYTUL_LISTY = 'Lochy';
/** `TXT_MQ_MUSHHINT` — ile jeszcze czekac, zanim mozna wejsc znowu. */
export const PODPOWIEDZ_GRZYBA = 'Po ostatnich odwiedzinach w lochach potrzebujesz przerwy (%1). Albo grzyba.';
