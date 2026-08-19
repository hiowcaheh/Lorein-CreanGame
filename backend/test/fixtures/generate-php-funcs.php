<?php
// Wzorce zachowania funkcji PHP do porownania z modulem compat/php.ts.
$roundCases = [
    [2.5,0],[-2.5,0],[0.5,0],[-0.5,0],[1.5,0],[-1.5,0],[3.4,0],[-3.4,0],
    [0.285,2],[1.005,2],[1.55,1],[-1.55,1],[2.675,2],
    [1234,-2],[1250,-2],[1350,-2],[-1250,-2],[9999,-3],
    [0,0],[0.0001,2],[123.456,1],[123.456,2],[-123.456,1],
    [1/3,4],[2/3,4],[10/3,0],[-10/3,0],
];
$intvalCases = [ "12abc", "abc", "-45xyz", "  7 ", "3.9", 3.9, -3.9, true, false, null, "", "+8", "0012" ];
$urlCases = [ "Gracz 1", "Zażółć gęślą jaźń", "a+b=c&d", "nick_test-1.2", "!'()*", "100%", "ąę/łó", "" ];
$ctypeCases = [ "123", "", "12a", "0", " 12", "-1" ];
$explodeCases = [ [";","a;b;c",null], [";","a;b;c",2], [";","",null], [";","a",null], [";","a;b;c;d",3] ];

$out = ['round'=>[], 'intval'=>[], 'urlencode'=>[], 'ctype_digit'=>[], 'explode'=>[]];
foreach ($roundCases as $c)  $out['round'][]  = ['value'=>$c[0],'precision'=>$c[1],'expected'=>round($c[0],$c[1])];
foreach ($intvalCases as $c) $out['intval'][] = ['value'=>$c,'expected'=>(int)$c];
foreach ($urlCases as $c)    $out['urlencode'][] = ['value'=>$c,'expected'=>urlencode($c)];
foreach ($ctypeCases as $c)  $out['ctype_digit'][] = ['value'=>$c,'expected'=>ctype_digit($c)];
foreach ($explodeCases as $c) $out['explode'][] = ['sep'=>$c[0],'subject'=>$c[1],'limit'=>$c[2],
    'expected'=> $c[2] === null ? explode($c[0],$c[1]) : explode($c[0],$c[1],$c[2])];

echo json_encode($out, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
