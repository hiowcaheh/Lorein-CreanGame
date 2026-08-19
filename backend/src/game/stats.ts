/**
 * Statystyki startowe klas i ras oraz mnoznik wierzchowca.
 *
 * Port funkcji `loadDefaultStats()` i `mountMultiplier()` z `req.php`.
 */

export const CLASS = {
  WARRIOR: 1,
  MAGE: 2,
  ROGUE: 3,
} as const;

export const RACE = {
  HUMAN: 1,
  ELF: 2,
  DWARF: 3,
  GNOME: 4,
  ORC: 5,
  DARK_ELF: 6,
  GOBLIN: 7,
  DEMON: 8,
} as const;

/**
 * Statystyki bazowe: `[sila, zrecznosc, inteligencja, spryt, szczescie]`.
 * Kazda zaczyna od 10, potem dochodzi bonus klasy i modyfikator rasy.
 */
export function loadDefaultStats(charClass: number, race: number): number[] {
  const stats = [10, 10, 10, 10, 10];

  switch (charClass) {
    case CLASS.WARRIOR:
      stats[0]! += 7;
      stats[1]! += 3;
      stats[3]! += 5;
      break;
    case CLASS.MAGE:
      stats[2]! += 8;
      stats[3]! += 2;
      stats[4]! += 5;
      break;
    case CLASS.ROGUE:
      stats[0]! += 1;
      stats[1]! += 7;
      stats[2]! += 1;
      stats[3]! += 4;
      stats[4]! += 2;
      break;
  }

  switch (race) {
    case RACE.ORC:
      stats[0]! += 1;
      stats[2]! -= 1;
      break;
    case RACE.ELF:
      stats[0]! -= 1;
      stats[1]! += 2;
      stats[3]! -= 1;
      break;
    case RACE.DARK_ELF:
      stats[0]! -= 2;
      stats[1]! += 2;
      stats[2]! += 1;
      stats[3]! -= 1;
      break;
    case RACE.DWARF:
      stats[1]! -= 2;
      stats[2]! -= 1;
      stats[3]! += 2;
      stats[4]! += 1;
      break;
    case RACE.GOBLIN:
      stats[0]! -= 2;
      stats[1]! += 2;
      stats[3]! -= 1;
      stats[4]! += 1;
      break;
    case RACE.GNOME:
      stats[0]! -= 2;
      stats[1]! += 3;
      stats[2]! -= 1;
      stats[3]! -= 1;
      stats[4]! += 1;
      break;
    case RACE.DEMON:
      stats[0]! += 3;
      stats[1]! -= 1;
      stats[3]! += 1;
      stats[4]! -= 3;
      break;
  }

  return stats;
}

/** Wierzchowiec skraca czas questow — im lepszy, tym mniejszy mnoznik. */
export function mountMultiplier(mount: number): number {
  switch (mount) {
    case 0:
      return 1;
    case 1:
      return 0.9;
    case 2:
      return 0.8;
    case 3:
      return 0.7;
    case 4:
      return 0.5;
    default:
      return 1;
  }
}
