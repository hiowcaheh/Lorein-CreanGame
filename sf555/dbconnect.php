<?php
error_reporting(0);
ini_set('display_errors', 0);
ini_set('default_charset', 'utf-8');

date_default_timezone_set('Europe/Berlin');

/**
 * Dane dostepowe do bazy czytane sa w kolejnosci:
 *
 *   1. zmienne srodowiskowe procesu (SF_DB_HOST, SF_DB_PORT, SF_DB_NAME,
 *      SF_DB_USER, SF_DB_PASS),
 *   2. plik `.env` lezacy obok tego pliku — nie trafia do repozytorium.
 *
 * Brak konfiguracji konczy sie bledem. To celowe: lepiej, zeby serwer nie
 * wstal, niz zeby po cichu polaczyl sie na domyslnych danych roota.
 */
function sf_env(string $key, ?string $default = null): ?string
{
    static $fileValues = null;

    if ($fileValues === null) {
        $fileValues = [];
        $path = __DIR__ . '/.env';

        if (is_readable($path)) {
            $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

            foreach ($lines as $line) {
                $line = trim($line);
                if ($line === '' || $line[0] === '#') {
                    continue;
                }

                $parts = explode('=', $line, 2);
                if (count($parts) !== 2) {
                    continue;
                }

                $fileValues[trim($parts[0])] = trim(trim($parts[1]), "\"'");
            }
        }
    }

    $value = getenv($key);
    if ($value === false || $value === '') {
        $value = $fileValues[$key] ?? null;
    }

    return ($value === null || $value === '') ? $default : $value;
}

$sfDbHost = sf_env('SF_DB_HOST', 'localhost');
$sfDbPort = sf_env('SF_DB_PORT', '3306');
$sfDbName = sf_env('SF_DB_NAME', 'sf555');
$sfDbUser = sf_env('SF_DB_USER');
$sfDbPass = sf_env('SF_DB_PASS');

if ($sfDbUser === null || $sfDbPass === null) {
    error_log('sf555: brak SF_DB_USER lub SF_DB_PASS — skopiuj .env.example do .env i uzupelnij.');
    exit('SQL Error');
}

try {
    $db = new PDO(
        sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8', $sfDbHost, $sfDbPort, $sfDbName),
        $sfDbUser,
        $sfDbPass
    );
    $db->exec('SET sql_mode=""');
} catch (Exception $e) {
    // Tresc bledu trafia do logu serwera, a nie do przegladarki gracza.
    error_log('sf555: blad polaczenia z baza: ' . $e->getMessage());
    exit ('SQL Error');
}

$db->setAttribute(PDO::ATTR_ORACLE_NULLS, PDO::NULL_TO_STRING);
$db->exec('SET sql_mode=""');
