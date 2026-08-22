/**
 * Ekran postaci — dane ulozenia.
 *
 * Wszystkie polozenia pochodza ze stalych `POS_CHAR_*` klienta Flash.
 * Tam byly w pikselach sceny 1280x800; obszar ekranu gry zaczyna sie
 * w punkcie (280, 100) i ma 1000x700, wiec tutaj sa przeliczone na
 * piksele wzgledem lewego gornego rogu tego obszaru.
 *
 * PIKSELE, nie procenty. Cala scena jest skalowana jednym
 * `transform: scale()` (patrz `useSkalaSceny`), wiec piksel oryginalu jest
 * tu prawdziwa jednostka miary i mozna przepisywac stale wprost. Procenty
 * byly zrodlem ciaglych pomylek: liczyly sie raz od szerokosci ekranu, raz
 * od szerokosci siatki, raz od wysokosci rodzica.
 */

const POCZATEK_X = 280;
const POCZATEK_Y = 100;

export interface Ramka {
  lewo: string;
  gora: string;
  szerokosc: string;
  wysokosc: string;
}

function ramka(x: number, y: number, sz: number, wy: number): Ramka {
  return {
    lewo: `${x - POCZATEK_X}px`,
    gora: `${y - POCZATEK_Y}px`,
    szerokosc: `${sz}px`,
    wysokosc: `${wy}px`,
  };
}

/** Kwadratowe miejsce na przedmiot ma 90x90, tak jak same obrazki. */
const BOK_SLOTU = 90;

export interface MiejsceNaPrzedmiot {
  /** Numer miejsca w bazie (kolumna `slot` tabeli `items`). */
  slot: number;
  nazwa: string;
  /** Obrazek pustego miejsca — sylwetka czapki, buta, tarczy... */
  pusty: string;
  ramka: Ramka;
}

/*
 * Uklad miejsc na przedmioty, wprost ze stalych klienta:
 *
 *   POS_CHAR_SLOTS_LEFT_X  = 304   lewa kolumna
 *   POS_CHAR_SLOTS_RIGHT_X = 680   prawa kolumna
 *   rzedy: 117, 217, 317, 417      co 100 px
 *   w rzedzie 4 dodatkowo: 441 (bron) i 543 (tarcza)
 *   plecak: rzad 679, kolumny 304, 398, 493, 588, 680
 */
export const MIEJSCA: MiejsceNaPrzedmiot[] = [
  { slot: 0, nazwa: 'Hełm', pusty: 'slot1.png', ramka: ramka(304, 117, BOK_SLOTU, BOK_SLOTU) },
  { slot: 1, nazwa: 'Zbroja', pusty: 'slot2.png', ramka: ramka(304, 217, BOK_SLOTU, BOK_SLOTU) },
  { slot: 2, nazwa: 'Rękawice', pusty: 'slot3.png', ramka: ramka(304, 317, BOK_SLOTU, BOK_SLOTU) },
  { slot: 3, nazwa: 'Buty', pusty: 'slot4.png', ramka: ramka(304, 417, BOK_SLOTU, BOK_SLOTU) },

  { slot: 4, nazwa: 'Amulet', pusty: 'slot5.png', ramka: ramka(680, 117, BOK_SLOTU, BOK_SLOTU) },
  { slot: 5, nazwa: 'Pas', pusty: 'slot6.png', ramka: ramka(680, 217, BOK_SLOTU, BOK_SLOTU) },
  { slot: 6, nazwa: 'Pierścień', pusty: 'slot7.png', ramka: ramka(680, 317, BOK_SLOTU, BOK_SLOTU) },
  { slot: 7, nazwa: 'Amulet szczęścia', pusty: 'slot8.png', ramka: ramka(680, 417, BOK_SLOTU, BOK_SLOTU) },

  // Bron i tarcza stoja pod portretem, w rzedzie czwartym.
  { slot: 8, nazwa: 'Broń', pusty: 'slot9_1.png', ramka: ramka(441, 417, BOK_SLOTU, BOK_SLOTU) },
  { slot: 9, nazwa: 'Tarcza', pusty: 'slot10.png', ramka: ramka(543, 417, BOK_SLOTU, BOK_SLOTU) },
];

/**
 * Sylwetka pustego miejsca na bron zalezy od klasy: miecz, laska albo luk.
 *
 *     if (ownerClass == 1 && slotNum == 9) itemID = IMG_EMPTY_SLOT_9_1;
 *     if (ownerClass == 2 && slotNum == 9) itemID = IMG_EMPTY_SLOT_9_2;
 *     if (ownerClass == 3 && slotNum == 9) itemID = IMG_EMPTY_SLOT_9_3;
 */
export function pustaBron(klasa: number): string {
  return klasa === 2 ? 'slot9_2.png' : klasa === 3 ? 'slot9_3.png' : 'slot9_1.png';
}

/**
 * Sylwetka pustego miejsca na tarcze — TYLKO dla wojownika.
 *
 * Oryginal podstawia obrazek pod dziesiate miejsce wylacznie wtedy, gdy
 * `ownerClass == 1`; magowi i zwiadowcy nie podstawia niczego, wiec
 * kwadrat zostaje pusty:
 *
 *     if (ownerClass == 1) { ... itemID = IMG_EMPTY_SLOT_10; }
 *     else if (ownerClass == 2) { if (slotNum == 9) itemID = IMG_EMPTY_SLOT_9_2; }
 *     else if (ownerClass == 3) { if (slotNum == 9) itemID = IMG_EMPTY_SLOT_9_3; }
 *
 * Tarczy nie nosi zadna z tych klas, wiec nie ma tam czego zapowiadac —
 * bron ma juz swoje wlasne miejsce obok.
 */
export const SLOT_BRONI = 8;
export const SLOT_TARCZY = 9;

export function pustaTarcza(klasa: number, pociskBroni?: string | null): string | null {
  if (klasa === 1) return 'slot10.png';

  /*
   * Odstepstwo: oryginal zostawia tu magowi i zwiadowcy pusty kwadrat.
   * Wlasciciel gry poprosil, zeby stal tam POCISK, ktory wypuszcza
   * zalozona bron — ten sam plik, ktory leci przez pole bitwy
   * (`GetArrowID`). Bez broni nie ma czego pokazac.
   */
  return pociskBroni ?? null;
}

/** Plecak — piec miejsc w dolnym rzedzie. */
export const PLECAK: Ramka[] = [304, 398, 493, 588, 680].map((x) => ramka(x, 679, BOK_SLOTU, BOK_SLOTU));

/*
 * Portret.
 *
 * Klient rysuje warstwy twarzy (kazda 300x300) w punkcie
 * POS_SCR_CHAR_CHARIMG = (408,119) ze skala 0,86 — czyli pole ma
 * 300 * 0,86 = 258 pikseli boku. Wczesniej bylo tu 224 px z przesunieciem
 * o 20 px i portret plywal w srodku ramki, zostawiajac dookola puste
 * niebieskie tlo.
 */
export const PORTRET = ramka(408, 119, 258, 258);

/*
 * Kawalki Magicznego Lustra leza NA portrecie, w tym samym punkcie
 * (`POS_SCR_CHAR_CHARIMG_X/Y` = 408, 119) i w naturalnym rozmiarze
 * 260x260. Oryginal trzyma je przygaszone:
 *
 *     DefineImg(IMG_MIRROR_PIECE + i, "scr/char/mirror/mirror" + (i+1) + ".png", ...);
 *     actor[IMG_MIRROR_PIECE + i].alpha = 0.3;
 */
export const KAWALEK_LUSTRA = ramka(408, 119, 260, 260);
export const PRZEZROCZYSTOSC_LUSTRA = 0.3;
export const KAWALKOW_LUSTRA = 13;

export function plikKawalkaLustra(numer: number): string {
  return `/res/sfgame/scr/char/mirror/mirror${numer}.png`;
}

/** Imie stoi na dole pola portretu: POS_CHAR_NAME = (410, 345). */
export const NAZWA_W_POLU = ramka(408, 345, 258, 26);

/*
 * Pasek doswiadczenia.
 *
 * Rozmiar bierze sie z obszaru klikalnego w oryginale:
 * `DefineClickArea(CA_SCR_CHAR_EXPBAR, ..., 409, 381, 254, 24)`.
 * Wczesniej bylo 282 px szerokosci i pasek wystawal poza ramke portretu.
 */
export const PASEK_DOSWIADCZENIA = ramka(409, 381, 254, 24);
export const WYPELNIENIE_PASKA = '/res/sfgame/scr/char/experience.jpg';

/*
 * Piec wierszy wartosci pod portretem:
 *
 *   POS_CHAR_PROP_COLUMN_1_X = 304   nazwa cechy
 *   POS_CHAR_PROP_COLUMN_2_X = 405   wartosc cechy
 *   POS_CHAR_PROP_COLUMN_3_X = 470   przycisk dodawania punktu
 *   POS_CHAR_PROP_COLUMN_5_X = 520   nazwa wartosci pochodnej
 *   POS_CHAR_PROP_COLUMN_6_X = 650   wartosc pochodna
 *   POS_CHAR_PROP_Y = 517, REL_CHAR_PROP_Y = 32 (odstep wierszy)
 *
 * Wszystkie napisy sa wyrownane do LEWEJ swojej kolumny — w oryginale to
 * zwykle pola tekstowe z `autoSize = LEFT` postawione w tych punktach.
 */
export const WIERSZ_CECHY_Y = 517;
export const ODSTEP_WIERSZA = 32;
export const KOLUMNY_CECH = [304, 405, 470, 520, 650].map((x) => x - POCZATEK_X);

/** Przycisk „+" stoi 3 px wyzej niz wiersz (patrz `DefineBtn` w oryginale). */
export const PRZESUNIECIE_PLUSA = -3;
/** `plus.png` ma 33x33. */
export const BOK_PLUSA = 33;

/**
 * Cena punktu cechy stoi w kolumnie CZWARTEJ — a ta ma dokladnie te sama
 * wspolrzedna, co piata (`POS_CHAR_PROP_COLUMN_4_X` i `_5_X` to oba 520).
 *
 * To nie pomylka: cena i podpis wartosci pochodnej NIGDY nie sa widoczne
 * naraz. Oryginal trzyma je w dwoch wiazkach — `BNC_CHAR_PREISE`
 * i `BNC_CHAR_SECONDPROP` — i przelacza je, gdy kursor wejdzie na
 * ktorykolwiek przycisk „+" (`BoostBtnOver` / `BoostBtnOut`). Sama
 * WARTOSC pochodna (kolumna szosta) zostaje na miejscu.
 */
export const KOLUMNA_CENY = 520 - POCZATEK_X;

/*
 * Prawa polowa ekranu:
 *
 *   POS_GILDEEHRE          = (795, 120), SIZE_GILDEEHRE = 375x40
 *   ikona klasy            = (795, 120), 40x40
 *   napis o czci           = y 130
 *   ciemna plansza opisu   = (795, 175), 440x200, przezroczystosc 0,65
 *   pole tekstowe opisu    = (805, 185)
 *   POS_CHAR_MOUNT         = (805, 429), wiersze co 25
 *   portret wierzchowca    = (805 + 274, 429), 150x150
 *   pancerz: ikona         = (795, 595), 40x40; napis (840, 602)
 *   POS_SCR_CHAR_ACH       = (795, 635), osiem odznak 50x67 co 55
 */
export const IKONA_KLASY = ramka(795, 120, 40, 40);

/*
 * Ciemne plansze pod napisami (`black_square_neutral`) sa w oryginale
 * podane stalymi: pasek czci 375x40 od (795,120), opis postaci 440x200
 * od (795,175). Ale RAMKI, w ktorych maja siedziec, sa namalowane wprost
 * na tle `character_right_new.jpg` i leza troche inaczej — zmierzone na
 * obrazie: pasek czci 843..1170 x 118..155, opis 798..1225 x 175..400.
 *
 * Trzymamy sie pomiaru, bo to on decyduje o tym, co widac. Przy stalych
 * z kodu plansza opisu byla o 25 px za niska i pod nia zostawal jasny
 * pasek dna ramki.
 */
export const TLO_CZCI = ramka(843, 118, 328, 38);
export const HONOR = ramka(853, 126, 310, 24);
export const OPIS = ramka(798, 176, 428, 224);
/*
 * Panel wierzchowca — cztery wiersze od (805, 429), szerokie na
 * `REL_CHAR_MOUNT_IMG_X - 5` = 269 px:
 *
 *   +0    nazwa            LBL_CHAR_MOUNT_NAME
 *   +25   opis             LBL_CHAR_MOUNT_DESCR   (lamany, REL_CHAR_MOUNT_LINE_Y)
 *   +100  zysk             LBL_CHAR_MOUNT_GAIN    (LINE_Y * 4)
 *   +125  okres wynajmu    LBL_CHAR_MOUNT_RUNTIME (LINE_Y * 5)
 */
const ODSTEP_WIERSZA_WIERZCHOWCA = 25;
export const WIERZCHOWIEC_NAZWA = ramka(805, 429, 269, 24);
export const WIERZCHOWIEC_OPIS = ramka(805, 429 + ODSTEP_WIERSZA_WIERZCHOWCA, 269, 72);
export const WIERZCHOWIEC_ZYSK = ramka(805, 429 + ODSTEP_WIERSZA_WIERZCHOWCA * 4, 269, 24);
export const WIERZCHOWIEC_OKRES = ramka(805, 429 + ODSTEP_WIERSZA_WIERZCHOWCA * 5, 269, 24);
export const PORTRET_WIERZCHOWCA = ramka(1079, 429, 150, 150);
export const IKONA_PANCERZA = ramka(795, 595, 40, 40);
export const PANCERZ = ramka(840, 602, 300, 26);
export const OSIAGNIECIA = ramka(795, 635, 7 * 55 + 50, 67);

/*
 * Trzy miejsca na dzialajace mikstury.
 *
 *   POS_POTION_X = 1079, POS_POTION_Y = 590, REL_POTION_X = 50
 *
 * Klient stawia tam zwykle pojemniki na przedmiot i skaluje je o polowe
 * (`scaleX = scaleY = 0.5`), wiec ikonka 90x90 ma tam 45 pikseli boku.
 */
export const BOK_MIKSTURY = BOK_SLOTU / 2;
export const MIEJSCA_MIKSTUR: Ramka[] = [0, 1, 2].map((i) =>
  ramka(1079 + 50 * i, 590, BOK_MIKSTURY, BOK_MIKSTURY),
);

/**
 * Numery `data-slot` dla miejsc na mikstury.
 *
 * Miejsca na przedmioty maja numery z bazy (0..14), wiec mikstury dostaja
 * osobny zakres — inaczej upuszczenie eliksiru na miejsce nr 1 wygladaloby
 * jak zakladanie zbroi.
 */
export const PIERWSZE_MIEJSCE_MIKSTURY = 300;

/*
 * Klaser Dokladnosci — `IMG_CHAR_ALBUM` w punkcie (280 + 500 + 350,
 * 100 + 20). Oryginalna ikonka `icon_foliant.png` nie doszla do naszej
 * paczki zasobow, wiec stoi tam obrazek samego przedmiotu z `itm/13-1`.
 */
export const KLASER = ramka(280 + 500 + 350, 100 + 20, 48, 48);
export const OBRAZ_KLASERA = '/res/sfgame/itm/13-1/itm13-1-1.png';
/** Ile pozycji miesci klaser — `contentMax` w kliencie. */
export const POZYCJI_W_KLASERZE = 1700;

export const KATALOG_ODZNAK = '/res/sfgame/scr/char/ach/';
/** Ikony klas: 1 wojownik, 2 mag, 3 lowca — tak jak w oryginale. */
export const IKONY_KLAS: Record<number, string> = {
  1: '/res/sfgame/scr/char/char_krieger.jpg',
  2: '/res/sfgame/scr/char/char_magier.jpg',
  3: '/res/sfgame/scr/char/char_dieb.jpg',
};
export const IKONA_TARCZY = '/res/sfgame/scr/char/icon_schild.jpg';

export const TLO_LEWE = '/res/sfgame/scr/char/charbg.jpg';
export const TLO_PRAWE = '/res/sfgame/scr/char/character_right_new.jpg';
export const KATALOG_SLOTOW = '/res/sfgame/scr/char/';

/**
 * Dwie kolumny cech spod portretu.
 *
 * Ten sam komplet stoi na ekranie postaci i w sklepach — `BNC_SCREEN_CHAR`
 * i `BNC_SCREEN_SHAKES` dostaja po piec `LBL_SCR_CHAR_STAERKE`
 * i `LBL_SCR_CHAR_SCHADEN` z podpisami. Roznica jest jedna: w sklepie
 * nie ma przyciskow „+", bo `BTN_SCR_CHAR_STEIGERN1` nalezy tylko do
 * ekranu postaci.
 */
export function wierszeCech(gracz: {
  cechy: { sila: number; zrecznosc: number; intelekt: number; wytrzymalosc: number; szczescie: number };
  obrazenia: { min: number; max: number; srednio: number };
  unik: number;
  odpornosc: number;
  zycie: number;
  ciosKrytyczny: number;
}) {
  return [
    { nazwa: 'Siła', klucz: 'sila' as const, wartosc: String(gracz.cechy.sila) },
    { nazwa: 'Zręczność', klucz: 'zrecznosc' as const, wartosc: String(gracz.cechy.zrecznosc) },
    { nazwa: 'Inteligencja', klucz: 'intelekt' as const, wartosc: String(gracz.cechy.intelekt) },
    // "Wytrzym." — skrot jest w oryginalnym pliku jezykowym (pozycja 63).
    {
      nazwa: 'Wytrzym.',
      klucz: 'wytrzymalosc' as const,
      wartosc: String(gracz.cechy.wytrzymalosc),
    },
    { nazwa: 'Szczęście', klucz: 'szczescie' as const, wartosc: String(gracz.cechy.szczescie) },
  ];
}

/**
 * Prawa kolumna pod portretem — PIEC wierszy, ktore ZALEZA OD KLASY.
 *
 * Klient buduje ja zawsze tak samo (podpisy `TXT_CHAR_SCHADEN + i`,
 * czyli pozycje 65..69 pliku jezykowego):
 *
 *   0  Obrona          = Sila / 2
 *   1  Zdolnosc uniku  = Zrecznosc / 2
 *   2  Odpornosc       = Inteligencja / 2
 *   3  Zywotnosc       = Wytrzym. * mnoznik klasy * (poziom + 1)
 *   4  Cios krytyczny  = Szczescie * 5 / (poziom przeciwnika * 2)
 *
 * a potem PODMIENIA ten jeden wiersz, ktory odpowiada cesze glownej
 * klasy: jego podpis staje sie „Obrazenia" (pozycja 160), a wartosc
 * srednia ciosu:
 *
 *   case 1: SchadenLblID = LBL_SCR_CHAR_SCHADEN_CAPTION;    // wiersz 0, sila
 *   case 2: SchadenLblID = LBL_SCR_CHAR_LEBEN_CAPTION;      // wiersz 2, inteligencja
 *   case 3: SchadenLblID = LBL_SCR_CHAR_KAMPFWERT_CAPTION;  // wiersz 1, zrecznosc
 *   ...
 *   actor[SchadenLblID].text = txt[TXT_SCHADEN];
 *   actor[SchadenID].text = "~" + tmpDamageAvg;
 *
 * Wojownik ma wiec „Obrazenia" tam, gdzie mag ma „Obrona", a lowca
 * „Zdolnosc uniku" — i odwrotnie. Wczesniej stalo tu piec wierszy
 * wojownika dla kazdej klasy i mag nie widzial ani swojej obrony, ani
 * tego, ze bije inteligencja.
 */

/** Ktory wiersz prawej kolumny zajmuja obrazenia. Indeks cechy glownej. */
export function wierszObrazen(klasa: number): number {
  return klasa === 2 ? 2 : klasa === 3 ? 1 : 0;
}

export function wierszePochodnych(gracz: {
  klasa: number;
  obrazenia: { min: number; max: number; srednio: number };
  obrona: number;
  unik: number;
  odpornosc: number;
  zycie: number;
  ciosKrytyczny: number;
}) {
  const wiersze = [
    // Pozycje 65..69 oryginalnego pliku jezykowego.
    { nazwa: 'Obrona', wartosc: String(gracz.obrona), tytul: 'Siła / 2' },
    { nazwa: 'Zdolność uniku', wartosc: String(gracz.unik), tytul: 'Zręczność / 2' },
    { nazwa: 'Odporność', wartosc: String(gracz.odpornosc), tytul: 'Inteligencja / 2' },
    {
      nazwa: 'Żywotność',
      wartosc: String(gracz.zycie),
      tytul: `Wytrzym. * ${MNOZNIK_ZYCIA[gracz.klasa] ?? 5} * (Poziom + 1)`,
    },
    {
      nazwa: 'Cios krytyczny',
      wartosc: `${gracz.ciosKrytyczny}%`,
      tytul: 'Szczęście * 5 / (Poziom przeciwnika * 2)',
    },
  ];

  wiersze[wierszObrazen(gracz.klasa)] = {
    // Pozycja 160 — ten sam napis, co w podpowiedzi broni.
    nazwa: 'Obrażenia',
    wartosc: `~${gracz.obrazenia.srednio}`,
    tytul: `${gracz.obrazenia.min} – ${gracz.obrazenia.max}`,
  };

  return wiersze;
}

/**
 * Mnoznik zywotnosci — `tmpLifeFactor` z klienta: wojownik 5, mag 2,
 * lowca 4. Ta sama liczba stoi w `Char::__construct` serwera.
 */
const MNOZNIK_ZYCIA: Record<number, number> = { 1: 5, 2: 2, 3: 4 };
