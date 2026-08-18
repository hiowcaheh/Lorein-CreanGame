-- Konto aplikacyjne dla gry — zasada minimalnych uprawnien.
--
-- Gra nie wykonuje ZADNEGO polecenia DDL (sprawdzone: brak CREATE / ALTER /
-- DROP / TRUNCATE w 45 plikach PHP), wiec konto aplikacyjne nie potrzebuje
-- praw do zmiany struktury bazy. Wystarczy odczyt i zapis danych.
--
-- Uruchom jako root JEDEN raz, po zaimportowaniu sf555/DATABASE.sql.
-- Przed uruchomieniem podmien haslo ponizej na dlugie i losowe.

CREATE DATABASE IF NOT EXISTS `sf555`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- 'localhost' oznacza, ze konto zadziala WYLACZNIE z tej samej maszyny.
-- Przy Dockerze podmien na '%' — siec kontenerow i tak nie jest publiczna.
CREATE USER IF NOT EXISTS 'sf555_app'@'localhost'
    IDENTIFIED BY 'ZMIEN-TO-NA-DLUGIE-LOSOWE-HASLO';

GRANT SELECT, INSERT, UPDATE, DELETE
    ON `sf555`.*
    TO 'sf555_app'@'localhost';

-- Swiadomie NIE nadajemy: CREATE, ALTER, DROP, TRUNCATE, GRANT OPTION, FILE.
-- Dzieki temu bledna lub wstrzyknieta kwerenda nie skasuje tabeli
-- ani nie odczyta plikow z dysku serwera.

FLUSH PRIVILEGES;

-- Weryfikacja:
-- SHOW GRANTS FOR 'sf555_app'@'localhost';
