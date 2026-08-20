-- Kilka przedmiotow do plecaka postaci Velven (user_id = 1).
--
-- Wartosci NIE sa wymyslone: wylosowal je `wylosujPrzedmiot()`
-- z `backend/src/game/generatorPrzedmiotow.ts`, przepisany co do wzoru
-- z funkcji `genItem()` oryginalnego `sf555/req.php`. Wojownik na
-- pierwszym poziomie dostaje w zbrojowni dokladnie takie rzeczy.
--
-- Sloty 10..14 to piec miejsc w plecaku; 0..9 to miejsca na zalozone
-- przedmioty.
--
--   rodzaj 6 -> helm      (16 pancerza, +1 wytrzymalosci)
--   rodzaj 3 -> zbroja    (19 pancerza, +1 wytrzymalosci)
--   rodzaj 4 -> buty      (13 pancerza, +5 sily i +1 inteligencji)
--   rodzaj 2 -> tarcza    (10% bloku, +1 wytrzymalosci)
--   rodzaj 1 -> bron      (2-9 obrazen, +1 zrecznosci)
--
-- Uruchom w Supabase: SQL Editor -> New query -> wklej -> Run.

INSERT INTO items (item_type, item_id, dmg_min, dmg_max,
                   atr_type_1, atr_type_2, atr_type_3,
                   atr_val_1, atr_val_2, atr_val_3,
                   gold, mush, slot, owner_id)
SELECT * FROM (VALUES
  (6, 2, 16, 0, 4, 0, 0, 1, 0, 0, 53,  0, 10, 1),
  (3, 2, 19, 0, 4, 0, 0, 1, 0, 0, 40,  0, 11, 1),
  (4, 1, 13, 0, 1, 3, 0, 5, 1, 0, 35, 10, 12, 1),
  (2, 1, 10, 0, 4, 0, 0, 1, 0, 0, 34,  0, 13, 1),
  (1, 1,  2, 9, 2, 0, 0, 1, 0, 0, 43,  0, 14, 1)
) AS nowe
-- Gdyby skrypt poszedl drugi raz, plecak nie ma sie zdublowac.
WHERE NOT EXISTS (
  SELECT 1 FROM items WHERE owner_id = 1 AND slot BETWEEN 10 AND 14
);

SELECT slot, item_type, item_id, dmg_min, dmg_max, atr_type_1, atr_val_1, gold, mush
FROM items WHERE owner_id = 1 ORDER BY slot;
