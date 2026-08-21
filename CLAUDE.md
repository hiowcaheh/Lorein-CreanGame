# Lorein — nowa wersja gry

Aplikacja webowa odtwarzajaca stara gre przegladarkowa, do ktorej wlasciciel
repozytorium ma prawa autorskie. Stary klient Flash zostal zastapiony
wlasnym klientem w Reakcie, a stary protokol PHP — zwyklym API JSON.

## Zasada nadrzedna: kopia jeden do jednego

**Wyglad i zachowanie odtwarzamy co do piksela z oryginalu, nigdy „na oko".**
Kiedy cokolwiek dotyczy ukladu, rozmiaru, koloru, tekstu albo dzialania
ekranu, odpowiedz jest w zrodlach oryginalu, a nie we wlasnym wyczuciu:

| Czego szukac | Gdzie |
| --- | --- |
| polozenia, rozmiary, odstepy | `client-src/sfgame555.swf_as/sfgame_fla/MainTimeline.as` — stale `POS_*`, `REL_*`, `SIZE_*` |
| kolory i wielkosci pisma | tamze — `FontFormat_*` i `CLR_*` (np. `CLR_SFORANGE = 0xf0c042`, `FontFormat_Default` = 20 px) |
| napisy | `sf555/lang/sfgame_pl.txt` — numer pozycji odpowiada stalej `TXT_*` |
| grafika interfejsu | w srodku pliku SWF; wyciaga ja `backend/scripts/wyciagnij-grafike-swf.py` do `sf555/res/ui/` |
| grafika ekranow | `sf555/res/sfgame/` |
| nazwy plikow przedmiotow i pociskow | `MainTimeline.as` — `GetItemFile()` i petla definiujaca `GetArrowID()`; port w `backend/src/game/grafikaPrzedmiotow.ts`. Sama para typ i numer NIE wyznacza pliku: wchodzi jeszcze barwa liczona ze statystyk |
| czcionka | Komika Text, osadzona w SWF; wyciaga ja `backend/scripts/wyciagnij-czcionke-swf.py` |

Przed zmiana wygladu: znajdz odpowiednia stala w `MainTimeline.as` i przepisz
jej wartosc. Kiedy stalej brakuje (np. ramka narysowana wprost na tle), zmierz
ja na obrazie tla, a nie zgaduj. Kazda taka liczba idzie do kodu **razem
z komentarzem, skad pochodzi** — inaczej za tydzien nikt nie wie, czy 254 to
pomiar, czy zgadywanka.

### Swiadome odstepstwa

Odstepstwo od zrodel jest dozwolone tylko wtedy, gdy zdecyduje o nim
wlasciciel gry, i tylko wpisane na te liste. Dopoki tu nie stoi, roznica
wzgledem oryginalu jest bledem do naprawienia, a nie decyzja.

| Gdzie | Na czym polega | Dlaczego |
| --- | --- | --- |
| `web/src/ekrany/karczma/Walka.tsx` — `walka-nagrody` | W ramce z podsumowaniem walki, pod zdaniem z oryginalu, stoi jeszcze wiersz z doswiadczeniem, wynagrodzeniem i grzybami | Oryginal pokazuje tam samo zdanie, a zdobycze widac na gornym pasku. Wlasciciel gry poprosil wprost o widoczne doswiadczenie i awans po walce. Zdanie i jego wybor (`fightStyle`) sa przepisane jeden do jednego. |
| `backend/src/game/karczma.ts` — `wylosujZadania()` | Przez dlugosc wyprawy mnozy sie CALA nagroda, a nie tylko czlon zalezny od poziomu | `req.php` dokłada ryczalt (`basexp` 200-300, `basegold` 30-70) POZA mnozeniem. Do okolo trzydziestego poziomu ryczalt przykrywa dlugosc i wyprawa za 20 minut placi tyle samo, co za 5 — a kosztuje cztery razy wiecej awanturniczosci. Kolejnosc losowan bez zmian, wiec dalej trafiaja sie wyprawy hojniejsze w zloto niz w doswiadczenie. |
| `web/src/ekrany/Sklep.tsx` — `postac-nazwa` | Pod portretem w obu sklepach stoi „Nick (Lv33)" | Oryginal nie wklada `CNT_SCR_CHAR_NAME` ani `LBL_SCR_CHAR_EXPLABEL` do `BNC_SCREEN_SHAKES` i `BNC_SCREEN_FIDGET`, wiec w sklepie nazwy postaci nie ma wcale. Wlasciciel gry poprosil o nick i poziom w obu sklepach. Miejsce jest to samo, co na ekranie postaci (`POS_CHAR_NAME`). |
| `backend/src/game/walka.ts` — `WzorObrazenPotwora` | Potwor z wyprawy liczy obrazenia wzorem `bron x (1 + glowna/10)` ze swojej cechy glownej, a nie `bron x glowna_gracza / 50` z `getQuestMonster()` | Wzor z `req.php` daje potworowi okolo 1/5 sily ciosu gracza na kazdym poziomie — 300 walk na 300 wygranych przy ubytku 7% zycia. Reszta `req.php` (gracz, arena, kopie z wiezy) liczy wlasnie `x (1 + glowna/10)`. Oryginalny wzor zostaje w kodzie pod `'oryginalne'` i to na nim pracuje test roznicowy. |

## Scena

Oryginal to sztywna scena 1280x800:

```
pas z tytulem      (0,   0) 1280x100
panel menu         (0, 100)  280x700
ekran gry        (280, 100) 1000x700
```

Kazde `left`, `top`, `width` i `font-size` w `web/src/style/gra.css` to piksel
tej sceny. Do okna dopasowuje ja jedno `transform: scale()` w `.scena`
(`web/src/gra/useSkalaSceny.ts`) — skalowanie jest nierownomierne, w granicach
0,78–1,25 stosunku pion/poziom, dokladnie tak jak odtwarzacz Flasha rozciagniety
na okno przegladarki.

**Nie wprowadzaj procentow ani progow `@media` do ukladu gry.** Procenty licza
sie raz od szerokosci ekranu, raz od szerokosci siatki, raz od wysokosci
rodzica; progi `@media` nie wiedza nic o wysokosci okna. Oba podejscia byly juz
probowane i oba skonczyly sie rozjezdzonym ukladem.

## Katalogi

- `web/` — klient (Vite + React). `npm run dev` na porcie 5173, `/api` idzie na 8787.
- `backend/` — API (Hono + postgres.js), wdrazane na Vercel jako jedna funkcja.
- `client-src/` — zdekompilowane zrodla oryginalnego klienta Flash. **Tylko do czytania.**
- `sf555/` — oryginalne zasoby gry i stary serwer PHP.

## Sprawdzanie pracy

- `cd web && npm test && npm run build`
- `cd backend && npm test` (testy integracyjne wymagaja Postgresa; bez niego sa pomijane)
- wyglad sprawdzaj w przegladarce (Playwright, Chromium w `/opt/pw-browsers/`),
  **mierzac** elementy, a nie ogladajac zrzut ekranu — wiekszosc bledow ukladu
  z tego projektu byla niewidoczna golym okiem, ale oczywista w pomiarze.

## Srodowisko

Serwer posredniczacy blokuje `vercel.app`, wiec wdrozonej strony nie da sie
stad obejrzec. Diagnostyke wdrozenia prowadzi sie przez `?diag=1` i Supabase.
