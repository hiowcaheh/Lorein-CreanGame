<?php
// Jak PHP zamienia liczby zmiennoprzecinkowe na napisy (precyzja 14).
$vals = [
  0.1+0.2, 1/3, 2/3, 12.5, 0.30000000000000004, 100.10000000000001,
  0.000001, 0.0000001, 1234.5678, 0.15*3, 250*1.15, -0.1-0.2,
  1.5, 2.25, 33.333333333333336, 0.001, 99.99999999999999,
  150*1.1, 1700/1700, 0.02, 1e-5, 1.0e-6,
  0.0001, 0.00012345, 0.001234, 1e-4, 9.9e-5, 123456789.123456
];
$out = [];
foreach ($vals as $v) { $out[] = ['value' => $v, 'expected' => (string)$v]; }
echo json_encode($out, JSON_PRETTY_PRINT);
