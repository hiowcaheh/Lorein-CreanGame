<?php
/**
 * Generator wzorcow dla akcji 007 (ranking).
 *
 * Zawiera logike przepisana ZNAK W ZNAK z `sf555/req.php`, z jedyna roznica:
 * zapytania do bazy zastapiono danymi podanymi wprost. Dzieki temu wzorce
 * powstaja z prawdziwego PHP, bez potrzeby stawiania MySQL-a.
 *
 * Gdy `req.php` sie zmieni, ten plik trzeba zaktualizowac razem z nim —
 * inaczej test przestanie pilnowac tego, co powinien.
 *
 * Uruchomienie:  php test/fixtures/generate-ranking.php > ranking.json
 */

/** Odtworzenie oryginalnej logiki na podanych danych. */
function buildRanking(string $action_extra, array $rows, int $playerCount, int $lookupPos, int $now): string
{
    $in = explode(';', $action_extra ?? '');
    $pos = 0;

    if (ctype_digit($in[1] ?? '')) {
        $pos = (int)str_replace(';', '', $action_extra);
    } else {
        // W oryginale: SELECT pos ... WHERE user_name = :name
        $pos = $lookupPos;
    }

    if ($pos < 8) {
        $pos = 8;
    }

    if ($pos > $playerCount && $playerCount > 8) {
        $pos = $playerCount;
    }
    if ($pos > $playerCount && $playerCount < 8) {
        $pos = 8;
    }

    $posFrom = $pos - 8;

    // W oryginale: SELECT ... ORDER BY honor DESC, lvl DESC, user_id DESC LIMIT :posFrom, 15
    $res = array_slice($rows, $posFrom, 15);

    $ret = ["007"];
    $pos -= 7;
    $index = 0;

    foreach ($res as $row) {
        $ret[$index]     = urlencode((string)$pos);
        $ret[$index + 1] = $row['user_name'] ?? '';
        $ret[$index + 2] = $row['guild'] ?? '';
        $ret[$index + 3] = $row['lvl'] ?? 0;
        $ret[$index + 4] = $row['honor'] ?? 0;
        $ret[$index + 5] = round($now - ((int) ($row['last_activ'] ?? 0))) <= 900 ? 1 : 0;

        $class = (int)($row['class'] ?? 1);
        if ($class === 2) {
            $ret[$index + 3] = "-" . $ret[$index + 3];
        } elseif ($class === 3) {
            $ret[$index] = "-" . $ret[$index];
        }

        $pos++;
        $index += 6;
    }

    $ret[0] = "007" . ($ret[0] ?? '');
    $ret[] = ";";

    return join("/", $ret);
}

$NOW = 1750000000;

function player(string $name, int $lvl, int $honor, int $class, int $lastActiv, ?string $guild = ''): array
{
    return [
        'user_name'  => $name,
        'guild'      => $guild,
        'lvl'        => $lvl,
        'honor'      => $honor,
        'class'      => $class,
        'last_activ' => (string)$lastActiv,
    ];
}

$manyPlayers = [];
for ($i = 1; $i <= 20; $i++) {
    $manyPlayers[] = player("Gracz$i", 100 - $i, 5000 - ($i * 10), ($i % 3) + 1, $NOW - ($i * 100), $i % 4 === 0 ? "Gildia $i" : '');
}

$scenarios = [
    [
        'name'        => 'pusty ranking — pole zerowe dostaje przedrostek dwa razy',
        'extra'       => 'Nikt;',
        'rows'        => [],
        'playerCount' => 0,
        'lookupPos'   => 0,
    ],
    [
        'name'        => 'trzech graczy, wszystkie trzy klasy',
        'extra'       => 'Ktos;',
        'rows'        => [
            player('Wojownik', 50, 900, 1, $NOW - 10, 'Zelazni'),
            player('Magik', 40, 800, 2, $NOW - 1000),
            player('Lowca', 30, 700, 3, $NOW - 899, 'Cienie'),
        ],
        'playerCount' => 3,
        'lookupPos'   => 2,
    ],
    [
        'name'        => 'dwudziestu graczy, pozycja podana liczba',
        'extra'       => '12;12',
        'rows'        => $manyPlayers,
        'playerCount' => 20,
        'lookupPos'   => 0,
    ],
    [
        'name'        => 'dwudziestu graczy, wyszukiwanie po nazwie',
        'extra'       => 'Gracz15;',
        'rows'        => $manyPlayers,
        'playerCount' => 20,
        'lookupPos'   => 15,
    ],
    [
        'name'        => 'pozycja poza zakresem zostaje przycieta do liczby graczy',
        'extra'       => '999;999',
        'rows'        => $manyPlayers,
        'playerCount' => 20,
        'lookupPos'   => 0,
    ],
    [
        'name'        => 'nazwy wymagajace kodowania URL',
        'extra'       => 'Zażółć gęślą;',
        'rows'        => [
            player('Gracz Ze Spacja', 10, 100, 1, $NOW, 'Gildia Z Spacja'),
            player('Zażółć', 9, 90, 2, $NOW - 5000, 'Ćma & Ćwierć'),
            player("Znaki!'()*", 8, 80, 3, $NOW, ''),
        ],
        'playerCount' => 3,
        'lookupPos'   => 1,
    ],
    [
        'name'        => 'granica online dokladnie na 900 sekundach',
        'extra'       => 'X;',
        'rows'        => [
            player('Rowno900', 10, 100, 1, $NOW - 900),
            player('O sekunde za duzo', 10, 99, 1, $NOW - 901),
        ],
        'playerCount' => 2,
        'lookupPos'   => 1,
    ],
];

$out = ['now' => $NOW, 'cases' => []];

foreach ($scenarios as $s) {
    $out['cases'][] = [
        'name'        => $s['name'],
        'extra'       => $s['extra'],
        'rows'        => $s['rows'],
        'playerCount' => $s['playerCount'],
        'lookupPos'   => $s['lookupPos'],
        'expected'    => buildRanking($s['extra'], $s['rows'], $s['playerCount'], $s['lookupPos'], $NOW),
    ];
}

echo json_encode($out, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
