/**
 * Przejscie calego toru tak, jak robi to gracz: zaloz bohatera, obejrzyj
 * ekran postaci, odswiez strone, wyloguj sie, zaloguj ponownie, sprobuj
 * zlego hasla. Po drodze zrzuty ekranu.
 *
 * To NIE jest test jednostkowy — potrzebuje dzialajacego serwera:
 *
 *     cd backend && DATABASE_URL=... npm start      # port 8787
 *     cd web     && npm run dev                      # port 5173
 *     node e2e/przejscie.mjs /sciezka/na/zrzuty
 *
 * Warto go uruchamiac po zmianach w logowaniu. Juz raz zlapal blad,
 * ktorego zaden test jednostkowy nie widzial: menu zostawalo otwarte po
 * wylogowaniu i zaslanialo ekran logowania.
 *
 * Uwaga: backend pozwala zalozyc trzy konta z jednego adresu IP, wiec
 * przy kolejnych przebiegach trzeba wyczyscic tabele:
 *     psql "$DATABASE_URL" -c "TRUNCATE user_data, items RESTART IDENTITY CASCADE"
 */
import { chromium, devices } from 'playwright';

const S = process.argv[2];
// Sciezka do przegladarki bywa rozna — bez zmiennej Playwright szuka sam.
const b = await chromium.launch(
  process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {},
);
const k = await b.newContext(devices['iPhone 13']);
const s = await k.newPage();

const bledy = [];
s.on('console', (m) => { if (m.type() === 'error') bledy.push(m.text()); });
s.on('pageerror', (e) => bledy.push('WYJATEK: ' + e.message));
s.on('response', (r) => { if (r.status() >= 400) bledy.push(`${r.status()} ${r.url()}`); });

await s.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' });
await s.screenshot({ path: `${S}/1-logowanie.png` });
console.log('1. ekran logowania:', await s.locator('h2').textContent());

await s.getByRole('button', { name: 'Stwórz nowego bohatera' }).click();
await s.waitForTimeout(200);

// Elf, kobieta, lowca
await s.locator('.wybor button').nth(1).click();          // plec: kobieta
await s.locator('.wybor').nth(1).locator('button').nth(1).click();  // rasa: elf
await s.locator('.wybor').nth(2).locator('button').nth(2).click();  // klasa: lowca
await s.waitForTimeout(300);

const nick = 'Testowa' + Math.floor(Math.random() * 10000);
await s.getByLabel('Imię bohatera').fill(nick);
await s.getByLabel('E-mail').fill(`${nick.toLowerCase()}@example.com`);
await s.getByLabel('Hasło').fill('tajne123');
await s.screenshot({ path: `${S}/2-tworzenie.png` });

await s.getByRole('button', { name: 'Rozpocznij grę' }).click();
await s.waitForSelector('.cechy', { timeout: 8000 });
console.log('2. po rejestracji, naglowek:', await s.locator('h2').textContent());
await s.screenshot({ path: `${S}/3-bohater.png` });

// Czy token przetrwa odswiezenie strony
await s.reload({ waitUntil: 'networkidle' });
await s.waitForSelector('.cechy', { timeout: 8000 });
console.log('3. po odswiezeniu nadal zalogowany:', await s.locator('h2').textContent());

// Wylogowanie i powrot
await s.locator('.przelacznik-menu').click();
await s.getByRole('button', { name: 'Wyloguj' }).click();
await s.waitForTimeout(300);
console.log('4. po wylogowaniu:', await s.locator('h2').textContent());

await s.getByLabel('Imię bohatera').fill(nick);
await s.getByLabel('Hasło').fill('tajne123');
await s.getByRole('button', { name: 'Wejdź do gry' }).click();
await s.waitForSelector('.cechy', { timeout: 8000 });
console.log('5. po ponownym zalogowaniu:', await s.locator('h2').textContent());

// Zle haslo
await s.locator('.przelacznik-menu').click();
await s.getByRole('button', { name: 'Wyloguj' }).waitFor({ state: 'visible' });
await s.getByRole('button', { name: 'Wyloguj' }).click();
await s.getByLabel('Imię bohatera').fill(nick);
await s.getByLabel('Hasło').fill('nie-to-haslo');
await s.getByRole('button', { name: 'Wejdź do gry' }).click();
await s.waitForSelector('.blad', { timeout: 8000 });
console.log('6. zle haslo:', await s.locator('.blad').textContent());

await b.close();
console.log(bledy.length ? 'BLEDY:\n  ' + [...new Set(bledy)].join('\n  ') : 'Zero bledow w konsoli i zero nieudanych zapytan.');
