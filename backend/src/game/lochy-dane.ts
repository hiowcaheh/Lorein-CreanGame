/*
 * PLIK GENEROWANY — nie poprawiaj recznie.
 * Zrodlo: sf555/req.php, funkcja getDungMonster().
 * Generator: backend/scripts/gen-lochy.mjs
 */

/** Potwor z lochu — pietnascie liczb z konstruktora `Monster`. */
export interface PotworLochu {
  poziom: number;
  /** 1 wojownik, 2 mag, 3 zwiadowca. */
  klasa: number;
  sila: number;
  zrecznosc: number;
  intelekt: number;
  wytrzymalosc: number;
  szczescie: number;
  /** Obrazenia GOTOWE — tablica trzyma juz przemnozone wartosci. */
  obrazeniaMin: number;
  obrazeniaMaks: number;
  zycie: number;
  pancerz: number;
  /** Numer potwora — ten sam, ktory wskazuje obrazek i nazwe. */
  numer: number;
  doswiadczenie: number;
  /** Numer broni; wartosc ujemna to pazury i kly. */
  bron: number;
  /** Numer tarczy; -1 znaczy „bez tarczy". */
  tarcza: number;
}

/** Ile lochow i po ile poziomow — `for ($i = 1; $i <= 13; $i++)`. */
export const LOCHOW = 13;
export const POZIOMOW_W_LOCHU = 10;

/**
 * Potwory: `POTWORY[loch - 1][poziom - 1]`.
 *
 * `null` stoi tam, gdzie oryginal nie ma liczb: dziesiaty poziom
 * dziewiatego lochu to kopia gracza, liczona z jego wlasnych statystyk.
 */
export const POTWORY: (PotworLochu | null)[][] = [
  // loch 1
  [
    { poziom: 10, klasa: 2, sila: 48, zrecznosc: 52, intelekt: 104, wytrzymalosc: 77, szczescie: 470, obrazeniaMin: 342, obrazeniaMaks: 513, zycie: 1694, pancerz: 85, numer: 129, doswiadczenie: 1287, bron: -2, tarcza: -1 },
    { poziom: 12, klasa: 1, sila: 120, zrecznosc: 6, intelekt: 59, wytrzymalosc: 101, szczescie: 51, obrazeniaMin: 208, obrazeniaMaks: 312, zycie: 6565, pancerz: 510, numer: 112, doswiadczenie: 1785, bron: -1, tarcza: 5 },
    { poziom: 14, klasa: 1, sila: 149, zrecznosc: 78, intelekt: 69, wytrzymalosc: 124, szczescie: 65, obrazeniaMin: 302, obrazeniaMaks: 445, zycie: 9300, pancerz: 595, numer: 6, doswiadczenie: 2395, bron: -1, tarcza: 5 },
    { poziom: 16, klasa: 3, sila: 84, zrecznosc: 195, intelekt: 83, wytrzymalosc: 131, szczescie: 94, obrazeniaMin: 554, obrazeniaMaks: 820, zycie: 8908, pancerz: 340, numer: 84, doswiadczenie: 3146, bron: -1, tarcza: -1 },
    { poziom: 18, klasa: 1, sila: 214, zrecznosc: 101, intelekt: 89, wytrzymalosc: 169, szczescie: 93, obrazeniaMin: 754, obrazeniaMaks: 985, zycie: 16055, pancerz: 187, numer: 31, doswiadczenie: 4050, bron: -1, tarcza: 5 },
    { poziom: 22, klasa: 2, sila: 97, zrecznosc: 99, intelekt: 303, wytrzymalosc: 198, szczescie: 137, obrazeniaMin: 2097, obrazeniaMaks: 3130, zycie: 9108, pancerz: 187, numer: 74, doswiadczenie: 6412, bron: -2, tarcza: -1 },
    { poziom: 26, klasa: 1, sila: 359, zrecznosc: 135, intelekt: 122, wytrzymalosc: 260, szczescie: 142, obrazeniaMin: 1292, obrazeniaMaks: 1956, zycie: 35100, pancerz: 1105, numer: 116, doswiadczenie: 9631, bron: 24, tarcza: 5 },
    { poziom: 30, klasa: 2, sila: 126, zrecznosc: 130, intelekt: 460, wytrzymalosc: 279, szczescie: 193, obrazeniaMin: 4277, obrazeniaMaks: 6439, zycie: 17298, pancerz: 255, numer: 114, doswiadczenie: 13952, bron: 1004, tarcza: -1 },
    { poziom: 40, klasa: 1, sila: 614, zrecznosc: 207, intelekt: 191, wytrzymalosc: 445, szczescie: 238, obrazeniaMin: 3370, obrazeniaMaks: 5054, zycie: 91225, pancerz: 1700, numer: 4, doswiadczenie: 30909, bron: -1, tarcza: 5 },
    { poziom: 50, klasa: 3, sila: 221, zrecznosc: 847, intelekt: 213, wytrzymalosc: 561, szczescie: 292, obrazeniaMin: 7284, obrazeniaMaks: 10884, zycie: 114444, pancerz: 1065, numer: 166, doswiadczenie: 60343, bron: -1, tarcza: -1 },
  ],
  // loch 2
  [
    { poziom: 20, klasa: 3, sila: 101, zrecznosc: 264, intelekt: 101, wytrzymalosc: 174, szczescie: 119, obrazeniaMin: 932, obrazeniaMaks: 1397, zycie: 14616, pancerz: 425, numer: 131, doswiadczenie: 2124, bron: -1, tarcza: -1 },
    { poziom: 24, klasa: 1, sila: 317, zrecznosc: 126, intelekt: 117, wytrzymalosc: 238, szczescie: 130, obrazeniaMin: 1046, obrazeniaMaks: 1570, zycie: 29750, pancerz: 1020, numer: 38, doswiadczenie: 7909, bron: -5, tarcza: 5 },
    { poziom: 28, klasa: 1, sila: 393, zrecznosc: 138, intelekt: 125, wytrzymalosc: 284, szczescie: 152, obrazeniaMin: 1531, obrazeniaMaks: 2297, zycie: 41180, pancerz: 1190, numer: 112, doswiadczenie: 11652, bron: -1, tarcza: 5 },
    { poziom: 34, klasa: 3, sila: 143, zrecznosc: 554, intelekt: 144, wytrzymalosc: 303, szczescie: 216, obrazeniaMin: 3215, obrazeniaMaks: 4850, zycie: 42420, pancerz: 722, numer: 86, doswiadczenie: 19539, bron: -1, tarcza: -1 },
    { poziom: 38, klasa: 1, sila: 592, zrecznosc: 178, intelekt: 162, wytrzymalosc: 398, szczescie: 195, obrazeniaMin: 3070, obrazeniaMaks: 4635, zycie: 77610, pancerz: 1615, numer: 51, doswiadczenie: 26652, bron: -1, tarcza: 5 },
    { poziom: 44, klasa: 2, sila: 191, zrecznosc: 190, intelekt: 780, wytrzymalosc: 411, szczescie: 259, obrazeniaMin: 10586, obrazeniaMaks: 15879, zycie: 36990, pancerz: 374, numer: 102, doswiadczenie: 40886, bron: -2, tarcza: -1 },
    { poziom: 48, klasa: 1, sila: 744, zrecznosc: 243, intelekt: 230, wytrzymalosc: 563, szczescie: 246, obrazeniaMin: 4901, obrazeniaMaks: 7314, zycie: 137935, pancerz: 2040, numer: 23, doswiadczenie: 53228, bron: -4, tarcza: 5 },
    { poziom: 56, klasa: 3, sila: 250, zrecznosc: 960, intelekt: 240, wytrzymalosc: 680, szczescie: 345, obrazeniaMin: 9215, obrazeniaMaks: 13774, zycie: 155040, pancerz: 1190, numer: 67, doswiadczenie: 86309, bron: 9, tarcza: -1 },
    { poziom: 66, klasa: 3, sila: 300, zrecznosc: 1160, intelekt: 290, wytrzymalosc: 880, szczescie: 420, obrazeniaMin: 13104, obrazeniaMaks: 19656, zycie: 233840, pancerz: 1420, numer: 92, doswiadczenie: 148282, bron: 8, tarcza: -1 },
    { poziom: 70, klasa: 1, sila: 1240, zrecznosc: 385, intelekt: 360, wytrzymalosc: 960, szczescie: 340, obrazeniaMin: 11875, obrazeniaMaks: 17750, zycie: 340800, pancerz: 2975, numer: 169, doswiadczenie: 181085, bron: -2, tarcza: 5 },
  ],
  // loch 3
  [
    { poziom: 32, klasa: 3, sila: 155, zrecznosc: 486, intelekt: 161, wytrzymalosc: 276, szczescie: 205, obrazeniaMin: 2678, obrazeniaMaks: 4018, zycie: 36432, pancerz: 680, numer: 28, doswiadczenie: 16557, bron: -1, tarcza: -1 },
    { poziom: 36, klasa: 3, sila: 141, zrecznosc: 602, intelekt: 149, wytrzymalosc: 344, szczescie: 230, obrazeniaMin: 3733, obrazeniaMaks: 5569, zycie: 50912, pancerz: 765, numer: 3, doswiadczenie: 22893, bron: -1, tarcza: -1 },
    { poziom: 42, klasa: 3, sila: 205, zrecznosc: 726, intelekt: 224, wytrzymalosc: 403, szczescie: 247, obrazeniaMin: 5226, obrazeniaMaks: 7875, zycie: 69316, pancerz: 892, numer: 57, doswiadczenie: 35642, bron: -1, tarcza: -1 },
    { poziom: 46, klasa: 1, sila: 768, zrecznosc: 215, intelekt: 183, wytrzymalosc: 539, szczescie: 249, obrazeniaMin: 4824, obrazeniaMaks: 7235, zycie: 126665, pancerz: 1955, numer: 94, doswiadczenie: 46757, bron: 9, tarcza: 5 },
    { poziom: 54, klasa: 1, sila: 920, zrecznosc: 265, intelekt: 240, wytrzymalosc: 640, szczescie: 260, obrazeniaMin: 6789, obrazeniaMaks: 10230, zycie: 176000, pancerz: 2295, numer: 140, doswiadczenie: 76872, bron: 7, tarcza: 5 },
    { poziom: 60, klasa: 3, sila: 270, zrecznosc: 1040, intelekt: 260, wytrzymalosc: 760, szczescie: 375, obrazeniaMin: 10710, obrazeniaMaks: 16065, zycie: 185440, pancerz: 1275, numer: 78, doswiadczenie: 108013, bron: -1, tarcza: -1 },
    { poziom: 64, klasa: 1, sila: 1120, zrecznosc: 340, intelekt: 315, wytrzymalosc: 840, szczescie: 310, obrazeniaMin: 9831, obrazeniaMaks: 14690, zycie: 273000, pancerz: 2720, numer: 93, doswiadczenie: 133734, bron: 9, tarcza: 5 },
    { poziom: 76, klasa: 3, sila: 350, zrecznosc: 1360, intelekt: 340, wytrzymalosc: 1080, szczescie: 495, obrazeniaMin: 17673, obrazeniaMaks: 26441, zycie: 332640, pancerz: 1615, numer: 162, doswiadczenie: 240784, bron: -1, tarcza: -1 },
    { poziom: 86, klasa: 1, sila: 1560, zrecznosc: 505, intelekt: 480, wytrzymalosc: 1280, szczescie: 420, obrazeniaMin: 18212, obrazeniaMaks: 27475, zycie: 556800, pancerz: 3655, numer: 142, doswiadczenie: 374041, bron: 7, tarcza: 5 },
    { poziom: 90, klasa: 1, sila: 1640, zrecznosc: 535, intelekt: 510, wytrzymalosc: 1360, szczescie: 440, obrazeniaMin: 20130, obrazeniaMaks: 30195, zycie: 618800, pancerz: 3825, numer: 170, doswiadczenie: 441608, bron: 50, tarcza: 5 },
  ],
  // loch 4
  [
    { poziom: 52, klasa: 3, sila: 230, zrecznosc: 880, intelekt: 220, wytrzymalosc: 601, szczescie: 315, obrazeniaMin: 7832, obrazeniaMaks: 11748, zycie: 127412, pancerz: 1105, numer: 124, doswiadczenie: 68234, bron: -2, tarcza: -1 },
    { poziom: 58, klasa: 3, sila: 260, zrecznosc: 1000, intelekt: 250, wytrzymalosc: 720, szczescie: 360, obrazeniaMin: 9898, obrazeniaMaks: 14847, zycie: 169920, pancerz: 1232, numer: 45, doswiadczenie: 96706, bron: 7, tarcza: -1 },
    { poziom: 62, klasa: 1, sila: 1080, zrecznosc: 325, intelekt: 300, wytrzymalosc: 800, szczescie: 300, obrazeniaMin: 9156, obrazeniaMaks: 13734, zycie: 252000, pancerz: 2635, numer: 94, doswiadczenie: 120287, bron: 9, tarcza: 5 },
    { poziom: 68, klasa: 1, sila: 1200, zrecznosc: 370, intelekt: 345, wytrzymalosc: 920, szczescie: 330, obrazeniaMin: 11132, obrazeniaMaks: 16698, zycie: 317400, pancerz: 2890, numer: 107, doswiadczenie: 163994, bron: -1, tarcza: 5 },
    { poziom: 74, klasa: 1, sila: 1320, zrecznosc: 415, intelekt: 390, wytrzymalosc: 1040, szczescie: 360, obrazeniaMin: 13300, obrazeniaMaks: 19950, zycie: 390000, pancerz: 3145, numer: 46, doswiadczenie: 163994, bron: 21, tarcza: 5 },
    { poziom: 82, klasa: 3, sila: 380, zrecznosc: 1480, intelekt: 370, wytrzymalosc: 1200, szczescie: 540, obrazeniaMin: 20711, obrazeniaMaks: 31141, zycie: 398400, pancerz: 1742, numer: 39, doswiadczenie: 315135, bron: 9, tarcza: -1 },
    { poziom: 84, klasa: 1, sila: 1520, zrecznosc: 490, intelekt: 465, wytrzymalosc: 1240, szczescie: 410, obrazeniaMin: 17442, obrazeniaMaks: 26163, zycie: 527000, pancerz: 3570, numer: 141, doswiadczenie: 343618, bron: 7, tarcza: 5 },
    { poziom: 96, klasa: 1, sila: 1760, zrecznosc: 580, intelekt: 555, wytrzymalosc: 1480, szczescie: 470, obrazeniaMin: 23010, obrazeniaMaks: 34515, zycie: 717800, pancerz: 4080, numer: 47, doswiadczenie: 560797, bron: 21, tarcza: 5 },
    { poziom: 102, klasa: 3, sila: 480, zrecznosc: 1880, intelekt: 470, wytrzymalosc: 1600, szczescie: 690, obrazeniaMin: 32697, obrazeniaMaks: 49140, zycie: 659200, pancerz: 2167, numer: 137, doswiadczenie: 704509, bron: -1, tarcza: -1 },
    { poziom: 110, klasa: 3, sila: 520, zrecznosc: 2040, intelekt: 510, wytrzymalosc: 1760, szczescie: 750, obrazeniaMin: 38335, obrazeniaMaks: 57400, zycie: 781440, pancerz: 2337, numer: 172, doswiadczenie: 940791, bron: 24, tarcza: -1 },
  ],
  // loch 5
  [
    { poziom: 72, klasa: 3, sila: 330, zrecznosc: 1280, intelekt: 320, wytrzymalosc: 1000, szczescie: 465, obrazeniaMin: 15738, obrazeniaMaks: 23607, zycie: 292000, pancerz: 1530, numer: 9, doswiadczenie: 199497, bron: -1, tarcza: -1 },
    { poziom: 78, klasa: 3, sila: 360, zrecznosc: 1400, intelekt: 350, wytrzymalosc: 1120, szczescie: 510, obrazeniaMin: 18612, obrazeniaMaks: 27918, zycie: 353920, pancerz: 1657, numer: 150, doswiadczenie: 263817, bron: 27, tarcza: -1 },
    { poziom: 80, klasa: 3, sila: 370, zrecznosc: 1440, intelekt: 360, wytrzymalosc: 1160, szczescie: 525, obrazeniaMin: 19720, obrazeniaMaks: 29580, zycie: 375840, pancerz: 1700, numer: 36, doswiadczenie: 288496, bron: -1, tarcza: -1 },
    { poziom: 88, klasa: 3, sila: 410, zrecznosc: 1600, intelekt: 400, wytrzymalosc: 1320, szczescie: 585, obrazeniaMin: 23989, obrazeniaMaks: 36064, zycie: 469920, pancerz: 1870, numer: 153, doswiadczenie: 406744, bron: 27, tarcza: -1 },
    { poziom: 94, klasa: 1, sila: 1720, zrecznosc: 565, intelekt: 540, wytrzymalosc: 1440, szczescie: 460, obrazeniaMin: 21971, obrazeniaMaks: 33043, zycie: 684000, pancerz: 3995, numer: 17, doswiadczenie: 518518, bron: -1, tarcza: 5 },
    { poziom: 100, klasa: 3, sila: 470, zrecznosc: 1840, intelekt: 460, wytrzymalosc: 1560, szczescie: 675, obrazeniaMin: 31450, obrazeniaMaks: 47175, zycie: 630240, pancerz: 2125, numer: 151, doswiadczenie: 653687, bron: 27, tarcza: -1 },
    { poziom: 108, klasa: 1, sila: 2000, zrecznosc: 670, intelekt: 645, wytrzymalosc: 1720, szczescie: 530, obrazeniaMin: 29346, obrazeniaMaks: 44220, zycie: 937400, pancerz: 4590, numer: 161, doswiadczenie: 876584, bron: -1, tarcza: 5 },
    { poziom: 114, klasa: 2, sila: 520, zrecznosc: 540, intelekt: 2200, wytrzymalosc: 1760, szczescie: 775, obrazeniaMin: 76908, obrazeniaMaks: 115583, zycie: 404800, pancerz: 969, numer: 118, doswiadczenie: 1081088, bron: -1, tarcza: -1 },
    { poziom: 122, klasa: 1, sila: 2280, zrecznosc: 775, intelekt: 750, wytrzymalosc: 2000, szczescie: 600, obrazeniaMin: 37785, obrazeniaMaks: 56792, zycie: 1230000, pancerz: 5185, numer: 160, doswiadczenie: 1412064, bron: -1, tarcza: 5 },
    { poziom: 130, klasa: 3, sila: 620, zrecznosc: 2440, intelekt: 610, wytrzymalosc: 2160, szczescie: 900, obrazeniaMin: 54145, obrazeniaMaks: 81095, zycie: 1131840, pancerz: 2762, numer: 171, doswiadczenie: 1821461, bron: 20, tarcza: -1 },
  ],
  // loch 6
  [
    { poziom: 92, klasa: 1, sila: 1680, zrecznosc: 550, intelekt: 525, wytrzymalosc: 1400, szczescie: 450, obrazeniaMin: 21125, obrazeniaMaks: 31603, zycie: 651000, pancerz: 3910, numer: 128, doswiadczenie: 478738, bron: -1, tarcza: 5 },
    { poziom: 98, klasa: 3, sila: 460, zrecznosc: 1800, intelekt: 450, wytrzymalosc: 1520, szczescie: 660, obrazeniaMin: 30046, obrazeniaMaks: 45069, zycie: 601920, pancerz: 2082, numer: 86, doswiadczenie: 605700, bron: -1, tarcza: -1 },
    { poziom: 104, klasa: 2, sila: 470, zrecznosc: 490, intelekt: 2000, wytrzymalosc: 1560, szczescie: 700, obrazeniaMin: 63918, obrazeniaMaks: 95877, zycie: 327600, pancerz: 884, numer: 77, doswiadczenie: 758451, bron: -1, tarcza: -1 },
    { poziom: 106, klasa: 3, sila: 500, zrecznosc: 1960, intelekt: 490, wytrzymalosc: 1680, szczescie: 720, obrazeniaMin: 35460, obrazeniaMaks: 53190, zycie: 719040, pancerz: 2252, numer: 81, doswiadczenie: 815853, bron: -3, tarcza: -1 },
    { poziom: 118, klasa: 3, sila: 560, zrecznosc: 2200, intelekt: 520, wytrzymalosc: 1920, szczescie: 810, obrazeniaMin: 44200, obrazeniaMaks: 66300, zycie: 913920, pancerz: 2507, numer: 89, doswiadczenie: 1237696, bron: -1, tarcza: -1 },
    { poziom: 124, klasa: 1, sila: 2320, zrecznosc: 790, intelekt: 765, wytrzymalosc: 2040, szczescie: 610, obrazeniaMin: 39144, obrazeniaMaks: 58716, zycie: 1275000, pancerz: 5270, numer: 16, doswiadczenie: 1506706, bron: -1, tarcza: 5 },
    { poziom: 128, klasa: 3, sila: 610, zrecznosc: 2400, intelekt: 600, wytrzymalosc: 2120, szczescie: 885, obrazeniaMin: 52297, obrazeniaMaks: 78566, zycie: 1093920, pancerz: 2720, numer: 88, doswiadczenie: 1710914, bron: -1, tarcza: -1 },
    { poziom: 136, klasa: 2, sila: 630, zrecznosc: 650, intelekt: 2640, wytrzymalosc: 2200, szczescie: 940, obrazeniaMin: 110240, obrazeniaMaks: 165360, zycie: 602800, pancerz: 1156, numer: 30, doswiadczenie: 2187846, bron: -1, tarcza: -1 },
    { poziom: 144, klasa: 3, sila: 690, zrecznosc: 2720, intelekt: 680, wytrzymalosc: 2440, szczescie: 1005, obrazeniaMin: 66612, obrazeniaMaks: 100191, zycie: 1415200, pancerz: 3060, numer: 87, doswiadczenie: 2767832, bron: -1, tarcza: -1 },
    { poziom: 150, klasa: 3, sila: 720, zrecznosc: 2840, intelekt: 710, wytrzymalosc: 2560, szczescie: 1050, obrazeniaMin: 72675, obrazeniaMaks: 108870, zycie: 1546240, pancerz: 3187, numer: 167, doswiadczenie: 3280697, bron: -1, tarcza: -1 },
  ],
  // loch 7
  [
    { poziom: 112, klasa: 3, sila: 530, zrecznosc: 2080, intelekt: 520, wytrzymalosc: 1800, szczescie: 765, obrazeniaMin: 39710, obrazeniaMaks: 59565, zycie: 813600, pancerz: 2380, numer: 66, doswiadczenie: 1009041, bron: -1, tarcza: -1 },
    { poziom: 116, klasa: 3, sila: 550, zrecznosc: 2160, intelekt: 540, wytrzymalosc: 1880, szczescie: 795, obrazeniaMin: 42749, obrazeniaMaks: 64015, zycie: 879840, pancerz: 2465, numer: 97, doswiadczenie: 1157092, bron: -1, tarcza: -1 },
    { poziom: 120, klasa: 2, sila: 550, zrecznosc: 570, intelekt: 2320, wytrzymalosc: 1880, szczescie: 820, obrazeniaMin: 85511, obrazeniaMaks: 128150, zycie: 454960, pancerz: 1020, numer: 82, doswiadczenie: 1322625, bron: -3, tarcza: -1 },
    { poziom: 126, klasa: 1, sila: 2360, zrecznosc: 805, intelekt: 780, wytrzymalosc: 2080, szczescie: 620, obrazeniaMin: 40527, obrazeniaMaks: 60909, zycie: 1320800, pancerz: 5355, numer: 52, doswiadczenie: 1606255, bron: -6, tarcza: 5 },
    { poziom: 134, klasa: 1, sila: 2520, zrecznosc: 865, intelekt: 840, wytrzymalosc: 2240, szczescie: 660, obrazeniaMin: 46046, obrazeniaMaks: 69069, zycie: 1512000, pancerz: 5695, numer: 158, doswiadczenie: 2059369, bron: -1, tarcza: 5 },
    { poziom: 138, klasa: 1, sila: 2600, zrecznosc: 895, intelekt: 870, wytrzymalosc: 2320, szczescie: 680, obrazeniaMin: 48807, obrazeniaMaks: 73341, zycie: 1612400, pancerz: 5865, numer: 135, doswiadczenie: 2322552, bron: -1, tarcza: 5 },
    { poziom: 142, klasa: 2, sila: 660, zrecznosc: 680, intelekt: 2760, wytrzymalosc: 2320, szczescie: 985, obrazeniaMin: 120218, obrazeniaMaks: 180327, zycie: 663520, pancerz: 1207, numer: 102, doswiadczenie: 2612278, bron: -2, tarcza: -1 },
    { poziom: 146, klasa: 1, sila: 2760, zrecznosc: 955, intelekt: 930, wytrzymalosc: 2480, szczescie: 720, obrazeniaMin: 54846, obrazeniaMaks: 82269, zycie: 1822800, pancerz: 6205, numer: 52, doswiadczenie: 2930646, bron: -6, tarcza: 5 },
    { poziom: 148, klasa: 1, sila: 2800, zrecznosc: 970, intelekt: 945, wytrzymalosc: 2520, szczescie: 730, obrazeniaMin: 56481, obrazeniaMaks: 84581, zycie: 1877400, pancerz: 6290, numer: 149, doswiadczenie: 3101774, bron: -1, tarcza: 5 },
    { poziom: 170, klasa: 1, sila: 3240, zrecznosc: 1135, intelekt: 1110, wytrzymalosc: 2960, szczescie: 840, obrazeniaMin: 75075, obrazeniaMaks: 112450, zycie: 2530800, pancerz: 7225, numer: 168, doswiadczenie: 5583708, bron: -6, tarcza: 5 },
  ],
  // loch 8
  [
    { poziom: 132, klasa: 1, sila: 2480, zrecznosc: 850, intelekt: 825, wytrzymalosc: 2200, szczescie: 650, obrazeniaMin: 44571, obrazeniaMaks: 66981, zycie: 1463000, pancerz: 5610, numer: 38, doswiadczenie: 1937541, bron: -5, tarcza: 5 },
    { poziom: 140, klasa: 3, sila: 670, zrecznosc: 2640, intelekt: 660, wytrzymalosc: 2360, szczescie: 975, obrazeniaMin: 63070, obrazeniaMaks: 94605, zycie: 1331040, pancerz: 2975, numer: 143, doswiadczenie: 2463717, bron: -2, tarcza: -1 },
    { poziom: 154, klasa: 1, sila: 2920, zrecznosc: 1015, intelekt: 990, wytrzymalosc: 2640, szczescie: 760, obrazeniaMin: 61237, obrazeniaMaks: 92002, zycie: 2046000, pancerz: 6545, numer: 147, doswiadczenie: 3663979, bron: -1, tarcza: 5 },
    { poziom: 158, klasa: 3, sila: 760, zrecznosc: 3000, intelekt: 750, wytrzymalosc: 2720, szczescie: 1110, obrazeniaMin: 80668, obrazeniaMaks: 121002, zycie: 1729920, pancerz: 3357, numer: 144, doswiadczenie: 4082943, bron: -2, tarcza: -1 },
    { poziom: 164, klasa: 3, sila: 790, zrecznosc: 3120, intelekt: 780, wytrzymalosc: 2840, szczescie: 1155, obrazeniaMin: 87014, obrazeniaMaks: 130834, zycie: 1874400, pancerz: 3485, numer: 99, doswiadczenie: 4785109, bron: -1, tarcza: -1 },
    { poziom: 168, klasa: 2, sila: 790, zrecznosc: 810, intelekt: 3280, wytrzymalosc: 2840, szczescie: 1180, obrazeniaMin: 169106, obrazeniaMaks: 253659, zycie: 959920, pancerz: 1428, numer: 154, doswiadczenie: 5306545, bron: -3, tarcza: -1 },
    { poziom: 172, klasa: 1, sila: 3280, zrecznosc: 1150, intelekt: 1125, wytrzymalosc: 3000, szczescie: 850, obrazeniaMin: 76657, obrazeniaMaks: 115150, zycie: 2595000, pancerz: 7310, numer: 146, doswiadczenie: 5873522, bron: -1, tarcza: 5 },
    { poziom: 180, klasa: 3, sila: 870, zrecznosc: 3340, intelekt: 860, wytrzymalosc: 3160, szczescie: 1275, obrazeniaMin: 102510, obrazeniaMaks: 153765, zycie: 2287840, pancerz: 3825, numer: 98, doswiadczenie: 7157815, bron: -1, tarcza: -1 },
    { poziom: 185, klasa: 2, sila: 875, zrecznosc: 895, intelekt: 3620, wytrzymalosc: 3180, szczescie: 1305, obrazeniaMin: 205458, obrazeniaMaks: 308187, zycie: 1182960, pancerz: 1572, numer: 156, doswiadczenie: 8070081, bron: -3, tarcza: -1 },
    { poziom: 200, klasa: 2, sila: 950, zrecznosc: 970, intelekt: 3920, wytrzymalosc: 3480, szczescie: 1410, obrazeniaMin: 240516, obrazeniaMaks: 360774, zycie: 1398960, pancerz: 1700, numer: 164, doswiadczenie: 11412835, bron: 2051, tarcza: -1 },
  ],
  // loch 9
  [
    { poziom: 152, klasa: 1, sila: 2880, zrecznosc: 1000, intelekt: 975, wytrzymalosc: 2600, szczescie: 750, obrazeniaMin: 59534, obrazeniaMaks: 89590, zycie: 1989000, pancerz: 6460, numer: 136, doswiadczenie: 3467701, bron: -1, tarcza: 5 },
    { poziom: 156, klasa: 2, sila: 730, zrecznosc: 750, intelekt: 3040, wytrzymalosc: 2600, szczescie: 1090, obrazeniaMin: 145485, obrazeniaMaks: 218380, zycie: 816400, pancerz: 1326, numer: 125, doswiadczenie: 3868959, bron: -2, tarcza: -1 },
    { poziom: 160, klasa: 3, sila: 770, zrecznosc: 3040, intelekt: 760, wytrzymalosc: 2760, szczescie: 1125, obrazeniaMin: 82960, obrazeniaMaks: 124440, zycie: 1777440, pancerz: 3400, numer: 99, doswiadczenie: 4307201, bron: -1, tarcza: -1 },
    { poziom: 162, klasa: 1, sila: 3080, zrecznosc: 1075, intelekt: 1050, wytrzymalosc: 2800, szczescie: 800, obrazeniaMin: 67980, obrazeniaMaks: 101970, zycie: 2282000, pancerz: 6885, numer: 37, doswiadczenie: 4541147, bron: -5, tarcza: 5 },
    { poziom: 166, klasa: 2, sila: 780, zrecznosc: 800, intelekt: 3240, wytrzymalosc: 2800, szczescie: 1165, obrazeniaMin: 164775, obrazeniaMaks: 247325, zycie: 935200, pancerz: 1411, numer: 129, doswiadczenie: 5040468, bron: -2, tarcza: -1 },
    { poziom: 174, klasa: 1, sila: 3320, zrecznosc: 1165, intelekt: 1140, wytrzymalosc: 3040, szczescie: 860, obrazeniaMin: 78588, obrazeniaMaks: 117882, zycie: 2660000, pancerz: 7395, numer: 138, doswiadczenie: 6175189, bron: 2004, tarcza: 5 },
    { poziom: 176, klasa: 3, sila: 850, zrecznosc: 3360, intelekt: 840, wytrzymalosc: 3080, szczescie: 1245, obrazeniaMin: 100763, obrazeniaMaks: 150976, zycie: 2180640, pancerz: 3740, numer: 90, doswiadczenie: 6489101, bron: 8, tarcza: -1 },
    { poziom: 178, klasa: 3, sila: 860, zrecznosc: 3400, intelekt: 850, wytrzymalosc: 3120, szczescie: 1260, obrazeniaMin: 102982, obrazeniaMaks: 154473, zycie: 2233920, pancerz: 3782, numer: 42, doswiadczenie: 6816906, bron: 9, tarcza: -1 },
    { poziom: 190, klasa: 2, sila: 900, zrecznosc: 920, intelekt: 3720, wytrzymalosc: 3280, szczescie: 1340, obrazeniaMin: 216713, obrazeniaMaks: 325256, zycie: 1252960, pancerz: 1615, numer: 74, doswiadczenie: 9081081, bron: -2, tarcza: -1 },
    null,
  ],
  // loch 10
  [
    { poziom: 205, klasa: 3, sila: 995, zrecznosc: 3940, intelekt: 985, wytrzymalosc: 3660, szczescie: 1450, obrazeniaMin: 137460, obrazeniaMaks: 206190, zycie: 3015840, pancerz: 4356, numer: 101, doswiadczenie: 14751538, bron: 24, tarcza: -1 },
    { poziom: 210, klasa: 1, sila: 4040, zrecznosc: 1420, intelekt: 1395, wytrzymalosc: 3760, szczescie: 1010, obrazeniaMin: 115425, obrazeniaMaks: 173340, zycie: 3966800, pancerz: 8925, numer: 115, doswiadczenie: 16222021, bron: 24, tarcza: 5 },
    { poziom: 215, klasa: 1, sila: 4140, zrecznosc: 1455, intelekt: 1430, wytrzymalosc: 3860, szczescie: 1030, obrazeniaMin: 121180, obrazeniaMaks: 181770, zycie: 4168800, pancerz: 9137, numer: 159, doswiadczenie: 16824529, bron: 13, tarcza: 5 },
    { poziom: 220, klasa: 1, sila: 4240, zrecznosc: 1490, intelekt: 1465, wytrzymalosc: 3960, szczescie: 1050, obrazeniaMin: 127075, obrazeniaMaks: 190400, zycie: 4375800, pancerz: 9350, numer: 21, doswiadczenie: 17581974, bron: -4, tarcza: 5 },
    { poziom: 225, klasa: 3, sila: 1095, zrecznosc: 4340, intelekt: 1085, wytrzymalosc: 4060, szczescie: 1590, obrazeniaMin: 166170, obrazeniaMaks: 249255, zycie: 3670240, pancerz: 4781, numer: 61, doswiadczenie: 18491852, bron: -1, tarcza: -1 },
    { poziom: 230, klasa: 3, sila: 1120, zrecznosc: 4440, intelekt: 1110, wytrzymalosc: 4160, szczescie: 1615, obrazeniaMin: 173995, obrazeniaMaks: 260770, zycie: 3843840, pancerz: 4887, numer: 163, doswiadczenie: 18576743, bron: -1, tarcza: -1 },
    { poziom: 235, klasa: 2, sila: 1125, zrecznosc: 1145, intelekt: 4620, wytrzymalosc: 4180, szczescie: 1655, obrazeniaMin: 332897, obrazeniaMaks: 499114, zycie: 1972960, pancerz: 1997, numer: 161, doswiadczenie: 19839326, bron: -1, tarcza: -1 },
    { poziom: 240, klasa: 1, sila: 4640, zrecznosc: 1630, intelekt: 1605, wytrzymalosc: 4360, szczescie: 1130, obrazeniaMin: 151590, obrazeniaMaks: 227385, zycie: 5253800, pancerz: 10200, numer: 159, doswiadczenie: 20302843, bron: 13, tarcza: 5 },
    { poziom: 245, klasa: 1, sila: 4740, zrecznosc: 1665, intelekt: 1640, wytrzymalosc: 4460, szczescie: 1150, obrazeniaMin: 158175, obrazeniaMaks: 237025, zycie: 5485800, pancerz: 10412, numer: 158, doswiadczenie: 20566329, bron: -1, tarcza: 5 },
    { poziom: 250, klasa: 1, sila: 4840, zrecznosc: 1700, intelekt: 1675, wytrzymalosc: 4560, szczescie: 1170, obrazeniaMin: 164900, obrazeniaMaks: 247350, zycie: 5722800, pancerz: 10625, numer: 165, doswiadczenie: 21862139, bron: 10, tarcza: 5 },
  ],
  // loch 11
  [
    { poziom: 255, klasa: 1, sila: 4940, zrecznosc: 1735, intelekt: 1710, wytrzymalosc: 4660, szczescie: 1190, obrazeniaMin: 171270, obrazeniaMaks: 257400, zycie: 5964800, pancerz: 10837, numer: 173, doswiadczenie: 21985806, bron: 20, tarcza: 5 },
    { poziom: 260, klasa: 3, sila: 1270, zrecznosc: 5040, intelekt: 1260, wytrzymalosc: 4760, szczescie: 1835, obrazeniaMin: 223210, obrazeniaMaks: 334815, zycie: 4969440, pancerz: 5525, numer: 174, doswiadczenie: 22369989, bron: 7, tarcza: -1 },
    { poziom: 265, klasa: 1, sila: 5140, zrecznosc: 1805, intelekt: 1780, wytrzymalosc: 4860, szczescie: 1230, obrazeniaMin: 185400, obrazeniaMaks: 278100, zycie: 6463800, pancerz: 11262, numer: 175, doswiadczenie: 23416588, bron: 12, tarcza: 5 },
    { poziom: 270, klasa: 1, sila: 5240, zrecznosc: 1840, intelekt: 1815, wytrzymalosc: 4960, szczescie: 1250, obrazeniaMin: 192675, obrazeniaMaks: 288750, zycie: 6720800, pancerz: 11475, numer: 176, doswiadczenie: 24958126, bron: 6, tarcza: 5 },
    { poziom: 275, klasa: 2, sila: 1325, zrecznosc: 1345, intelekt: 5420, wytrzymalosc: 4980, szczescie: 1935, obrazeniaMin: 456663, obrazeniaMaks: 685266, zycie: 2748960, pancerz: 2337, numer: 177, doswiadczenie: 27191950, bron: -1, tarcza: -1 },
    { poziom: 280, klasa: 3, sila: 1370, zrecznosc: 5440, intelekt: 1360, wytrzymalosc: 5160, szczescie: 1975, obrazeniaMin: 259420, obrazeniaMaks: 389130, zycie: 5799840, pancerz: 5950, numer: 178, doswiadczenie: 29464133, bron: -4, tarcza: -1 },
    { poziom: 285, klasa: 1, sila: 5540, zrecznosc: 1945, intelekt: 1920, wytrzymalosc: 5260, szczescie: 1310, obrazeniaMin: 214785, obrazeniaMaks: 322455, zycie: 7521800, pancerz: 12112, numer: 179, doswiadczenie: 32666036, bron: 20, tarcza: 5 },
    { poziom: 290, klasa: 3, sila: 1420, zrecznosc: 5640, intelekt: 1410, wytrzymalosc: 5360, szczescie: 2045, obrazeniaMin: 278545, obrazeniaMaks: 417535, zycie: 6239040, pancerz: 6162, numer: 180, doswiadczenie: 34842539, bron: 29, tarcza: -1 },
    { poziom: 295, klasa: 2, sila: 1425, zrecznosc: 1445, intelekt: 5820, wytrzymalosc: 5380, szczescie: 2075, obrazeniaMin: 525866, obrazeniaMaks: 789382, zycie: 3184960, pancerz: 2507, numer: 181, doswiadczenie: 36595045, bron: 6, tarcza: -1 },
    { poziom: 300, klasa: 1, sila: 5840, zrecznosc: 2050, intelekt: 2025, wytrzymalosc: 5560, szczescie: 1370, obrazeniaMin: 238680, obrazeniaMaks: 358020, zycie: 8367800, pancerz: 12750, numer: 182, doswiadczenie: 37669139, bron: -1, tarcza: 5 },
  ],
  // loch 12
  [
    { poziom: 305, klasa: 2, sila: 1475, zrecznosc: 1495, intelekt: 6020, wytrzymalosc: 5580, szczescie: 2145, obrazeniaMin: 562599, obrazeniaMaks: 843597, zycie: 3414960, pancerz: 2592, numer: 183, doswiadczenie: 40158305, bron: -1, tarcza: -1 },
    { poziom: 310, klasa: 2, sila: 1500, zrecznosc: 1520, intelekt: 6120, wytrzymalosc: 5680, szczescie: 2180, obrazeniaMin: 581124, obrazeniaMaks: 871686, zycie: 3532960, pancerz: 2635, numer: 184, doswiadczenie: 41185436, bron: -1, tarcza: -1 },
    { poziom: 315, klasa: 1, sila: 6140, zrecznosc: 2155, intelekt: 2130, wytrzymalosc: 5860, szczescie: 1430, obrazeniaMin: 263220, obrazeniaMaks: 394830, zycie: 9258800, pancerz: 13387, numer: 185, doswiadczenie: 47356858, bron: -1, tarcza: 5 },
    { poziom: 320, klasa: 3, sila: 1570, zrecznosc: 6240, intelekt: 1560, wytrzymalosc: 5960, szczescie: 2255, obrazeniaMin: 340000, obrazeniaMaks: 510000, zycie: 7652640, pancerz: 6800, numer: 186, doswiadczenie: 48514978, bron: -5, tarcza: -1 },
    { poziom: 325, klasa: 2, sila: 1575, zrecznosc: 1595, intelekt: 6420, wytrzymalosc: 5980, szczescie: 2285, obrazeniaMin: 639142, obrazeniaMaks: 958713, zycie: 3898960, pancerz: 2762, numer: 187, doswiadczenie: 53997992, bron: -1, tarcza: -1 },
    { poziom: 330, klasa: 1, sila: 6440, zrecznosc: 2260, intelekt: 2235, wytrzymalosc: 6160, szczescie: 1490, obrazeniaMin: 288960, obrazeniaMaks: 434085, zycie: 10194800, pancerz: 14025, numer: 188, doswiadczenie: 58067419, bron: 30, tarcza: 5 },
    { poziom: 335, klasa: 3, sila: 1645, zrecznosc: 6540, intelekt: 1635, wytrzymalosc: 6260, szczescie: 2360, obrazeniaMin: 372695, obrazeniaMaks: 559370, zycie: 8413440, pancerz: 7118, numer: 189, doswiadczenie: 60112488, bron: -1, tarcza: -1 },
    { poziom: 340, klasa: 1, sila: 6640, zrecznosc: 2330, intelekt: 2305, wytrzymalosc: 6360, szczescie: 1530, obrazeniaMin: 307230, obrazeniaMaks: 460845, zycie: 10843800, pancerz: 14450, numer: 190, doswiadczenie: 64218630, bron: -5, tarcza: 5 },
    { poziom: 345, klasa: 1, sila: 6740, zrecznosc: 2365, intelekt: 2340, wytrzymalosc: 6460, szczescie: 1150, obrazeniaMin: 316575, obrazeniaMaks: 474525, zycie: 11175800, pancerz: 14662, numer: 191, doswiadczenie: 69464246, bron: 53, tarcza: 5 },
    { poziom: 350, klasa: 1, sila: 6840, zrecznosc: 2400, intelekt: 2375, wytrzymalosc: 6560, szczescie: 1570, obrazeniaMin: 326060, obrazeniaMaks: 489090, zycie: 11512800, pancerz: 14875, numer: 192, doswiadczenie: 75631756, bron: 51, tarcza: 5 },
  ],
  // loch 13
  [
    { poziom: 355, klasa: 1, sila: 7570, zrecznosc: 2655, intelekt: 2630, wytrzymalosc: 7290, szczescie: 1716, obrazeniaMin: 365356, obrazeniaMaks: 548792, zycie: 12976200, pancerz: 15087, numer: 243, doswiadczenie: 77688663, bron: -1, tarcza: 5 },
    { poziom: 360, klasa: 2, sila: 1970, zrecznosc: 1990, intelekt: 8000, wytrzymalosc: 7560, szczescie: 2838, obrazeniaMin: 881901, obrazeniaMaks: 1323252, zycie: 5458320, pancerz: 3060, numer: 244, doswiadczenie: 80153259, bron: 1003, tarcza: -1 },
    { poziom: 365, klasa: 1, sila: 8290, zrecznosc: 2908, intelekt: 2882, wytrzymalosc: 8010, szczescie: 1860, obrazeniaMin: 411680, obrazeniaMaks: 617520, zycie: 14658300, pancerz: 15512, numer: 245, doswiadczenie: 81185362, bron: -1, tarcza: -1 },
    { poziom: 370, klasa: 2, sila: 2160, zrecznosc: 2180, intelekt: 8760, wytrzymalosc: 8320, szczescie: 3104, obrazeniaMin: 992764, obrazeniaMaks: 1489146, zycie: 6173440, pancerz: 3145, numer: 246, doswiadczenie: 83222145, bron: 1008, tarcza: -1 },
    { poziom: 375, klasa: 1, sila: 9340, zrecznosc: 3275, intelekt: 3250, wytrzymalosc: 9060, szczescie: 2070, obrazeniaMin: 476850, obrazeniaMaks: 715275, zycie: 17032800, pancerz: 15937, numer: 247, doswiadczenie: 84798125, bron: 0, tarcza: 5 },
    { poziom: 380, klasa: 3, sila: 2682, zrecznosc: 10690, intelekt: 2672, wytrzymalosc: 10410, szczescie: 3812, obrazeniaMin: 691220, obrazeniaMaks: 1036830, zycie: 15864840, pancerz: 8075, numer: 248, doswiadczenie: 86954248, bron: 2056, tarcza: -1 },
    { poziom: 385, klasa: 2, sila: 2888, zrecznosc: 2908, intelekt: 11670, wytrzymalosc: 11230, szczescie: 4122, obrazeniaMin: 1375904, obrazeniaMaks: 2063856, zycie: 8669560, pancerz: 3272, numer: 249, doswiadczenie: 90052148, bron: 1056, tarcza: -1 },
    { poziom: 390, klasa: 1, sila: 12540, zrecznosc: 4395, intelekt: 4370, wytrzymalosc: 12260, szczescie: 2710, obrazeniaMin: 665150, obrazeniaMaks: 897725, zycie: 23968300, pancerz: 16575, numer: 250, doswiadczenie: 93123457, bron: 55, tarcza: 5 },
    { poziom: 395, klasa: 1, sila: 13540, zrecznosc: 4724, intelekt: 4720, wytrzymalosc: 13260, szczescie: 2910, obrazeniaMin: 727635, obrazeniaMaks: 1056775, zycie: 26254800, pancerz: 16787, numer: 251, doswiadczenie: 94258223, bron: 11, tarcza: 5 },
    { poziom: 400, klasa: 1, sila: 16840, zrecznosc: 5900, intelekt: 5875, wytrzymalosc: 16540, szczescie: 3570, obrazeniaMin: 886640, obrazeniaMaks: 1164960, zycie: 32162700, pancerz: 17000, numer: 252, doswiadczenie: 98853215, bron: 22, tarcza: 5 },
  ],
];
