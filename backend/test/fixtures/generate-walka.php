<?php
/**
 * Wzorce walki prosto z oryginalu.
 *
 * Wycina z `req.php` klasy `SF_Calc`, `Char` i `Monster` oraz funkcje
 * `getQuestMonster` i `getRealArmor`, podstawia atrape bazy danych
 * i uruchamia walke przy ustalonym ziarnie generatora.
 *
 * Dzieki temu port w TypeScript da sie porownac z oryginalem co do liczby,
 * zamiast wierzyc, ze przepisalo sie wszystko dobrze.
 *
 * Uruchomienie:  php test/fixtures/generate-walka.php > test/fixtures/walka.json
 */

$zrodlo = file(__DIR__ . '/../../../sf555/req.php');

function wytnij(array $linie, int $od, int $do): string {
    return implode('', array_slice($linie, $od - 1, $do - $od + 1));
}

// --- atrapa bazy ---------------------------------------------------------
// Oryginal odpytuje baze w konstruktorze postaci i w srodku petli walki.
// Atrapa odpowiada wedlug tresci zapytania.

$STAN = ['items' => [], 'armor' => 0];

class FakeStmt {
    public function __construct(private string $sql) {}
    public function bindParam($a, &$b) {}
    public function execute($p = null) { return true; }
    public function fetch($m = null) { return $this->dane()[0] ?? false; }
    public function fetchAll($m = null) { return $this->dane(); }
    private function dane(): array {
        global $STAN;
        if (str_contains($this->sql, 'slot = 8'))  return array_values(array_filter($STAN['items'], fn($i) => $i['slot'] == 8));
        if (str_contains($this->sql, 'slot = 9') || str_contains($this->sql, ':slot')) {
            return array_values(array_filter($STAN['items'], fn($i) => $i['slot'] == 9));
        }
        if (str_contains($this->sql, 'slot = 2'))  return [];
        if (str_contains($this->sql, 'slot = 3'))  return [];
        if (str_contains($this->sql, 'item_type <= 10')) return $STAN['items'];
        return [];
    }
}

class FakeDb {
    public function prepare($sql) { return new FakeStmt($sql); }
}

$db = new FakeDb();
$SSID = str_repeat('x', 32);
$character_data = [];

// --- kod z oryginalu -----------------------------------------------------
eval(wytnij($zrodlo, 452, 957));          // SF_Calc, Char, Monster
eval(wytnij($zrodlo, 1306, 1409));        // getQuestMonster

function getRealArmor(int $uid) {
    global $STAN;
    return $STAN['armor'];
}

// --- przypadki -----------------------------------------------------------

$przypadki = [];

$konfiguracje = [
    ['nazwa' => 'wojownik z bronia',  'class' => 1, 'lvl' => 10, 'str' => 100, 'agi' => 20,  'int' => 20,  'wit' => 50, 'luck' => 30, 'weapon' => [10, 20], 'armor' => 0],
    ['nazwa' => 'mag',                'class' => 2, 'lvl' => 25, 'str' => 30,  'agi' => 30,  'int' => 200, 'wit' => 80, 'luck' => 60, 'weapon' => [30, 60], 'armor' => 0],
    ['nazwa' => 'lowca w zbroi',      'class' => 3, 'lvl' => 40, 'str' => 50,  'agi' => 300, 'int' => 40,  'wit' => 120,'luck' => 90, 'weapon' => [50, 90], 'armor' => 800],
    ['nazwa' => 'poczatkujacy',       'class' => 1, 'lvl' => 1,  'str' => 17,  'agi' => 13,  'int' => 10,  'wit' => 15, 'luck' => 10, 'weapon' => [4, 8],   'armor' => 0],
];

foreach ($konfiguracje as $k) {
    foreach ([1, 7, 42, 1234, 99999] as $ziarno) {
        mt_srand($ziarno);

        $STAN['items'] = [[
            'slot' => 8, 'dmg_min' => $k['weapon'][0], 'dmg_max' => $k['weapon'][1],
            'atr_type_1' => 0, 'atr_type_2' => 0, 'atr_type_3' => 0,
            'atr_val_1' => 0, 'atr_val_2' => 0, 'atr_val_3' => 0,
            'item_type' => 1, 'item_id' => 1,
        ]];
        $STAN['armor'] = $k['armor'];
        $character_data = [447 => $k['armor']];

        $db_data = [
            'class' => $k['class'], 'lvl' => $k['lvl'], 'user_id' => 1, 'user_name' => 'Zenek',
            'attr_str' => $k['str'], 'attr_agi' => $k['agi'], 'attr_int' => $k['int'],
            'attr_wit' => $k['wit'], 'attr_luck' => $k['luck'],
            'portal_monster' => 1, 'portal_act' => 1, 'g_monster' => 1, 'g_act' => 1,
            'potion_id1' => 0, 'potion_id2' => 0, 'potion_id3' => 0,
            'potion_value1' => 0, 'potion_value2' => 0, 'potion_value3' => 0,
        ];

        $p = new Char($db_data);
        $m = getQuestMonster($db_data);

        $przypadki[] = [
            'nazwa'  => $k['nazwa'],
            'ziarno' => $ziarno,
            'wejscie' => [
                'class' => $k['class'], 'lvl' => $k['lvl'],
                'str' => $k['str'], 'agi' => $k['agi'], 'int' => $k['int'],
                'wit' => $k['wit'], 'luck' => $k['luck'],
                'weapon' => $k['weapon'], 'armor' => $k['armor'],
            ],
            'gracz' => [
                'hp' => $p->getHP(), 'str' => $p->getStr(), 'dex' => $p->getDex(),
                'int' => $p->getInt(), 'wit' => $p->getWit(), 'luck' => $p->getLuck(),
                'bronMin' => $p->WeaponMin(), 'bronMax' => $p->WeaponMax(),
            ],
            'potwor' => [
                'lvl' => $m->getLvl(), 'class' => $m->getClass(), 'hp' => $m->getHP(),
                'str' => $m->getStr(), 'dex' => $m->getDex(), 'int' => $m->getInt(),
                'wit' => $m->getWit(), 'luck' => $m->getLuck(),
                'bronMin' => $m->WeaponMin(), 'bronMax' => $m->WeaponMax(),
            ],
        ];
    }
}

echo json_encode($przypadki, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), "\n";
