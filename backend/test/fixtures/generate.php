<?php
// Generuje wzorce z PHP do porownania z implementacja TypeScript.
$out = [];
$seeds  = [0, 1, 42, 12345, 999983, 2147483647];
$ranges = [[1,2],[1,3],[1,6],[0,255],[1,100],[1,158],[200,300],[900,1100],[1,1000000]];

foreach ($seeds as $seed) {
    mt_srand($seed);
    $raw = [];
    for ($i = 0; $i < 10; $i++) { $raw[] = mt_rand(); }

    $ranged = [];
    foreach ($ranges as $r) {
        mt_srand($seed);
        $seq = [];
        for ($i = 0; $i < 12; $i++) { $seq[] = mt_rand($r[0], $r[1]); }
        $ranged[] = ['min' => $r[0], 'max' => $r[1], 'values' => $seq];
    }

    // rand() jest w PHP 7.1+ aliasem mt_rand()
    mt_srand($seed);
    $viaRand = [];
    for ($i = 0; $i < 8; $i++) { $viaRand[] = rand(1, 158); }

    $out[] = ['seed' => $seed, 'raw' => $raw, 'ranged' => $ranged, 'viaRand' => $viaRand];
}
echo json_encode($out, JSON_PRETTY_PRINT);
