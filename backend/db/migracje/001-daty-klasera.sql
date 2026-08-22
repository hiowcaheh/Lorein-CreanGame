-- Daty odblokowania pozycji klasera.
--
-- `schema.sql` tworzy bazę od zera i nie da sie go puscic na dzialajacej;
-- ten plik dokłada sama kolumne i mozna go uruchomic wielokrotnie.
--
--     npm run db:migruj
--
-- Kolumna trzyma JSON `{"numer bitu": czas uniksowy}`. Pusty napis znaczy
-- „nic jeszcze nie zapisano" — stare wpisy klasera zostaja bez daty.

ALTER TABLE user_data
    ADD COLUMN IF NOT EXISTS album_dates text NOT NULL DEFAULT '';
