<?php
error_reporting(0);
ini_set('display_errors', 0);
ini_set('default_charset', 'utf-8');

date_default_timezone_set('Europe/Berlin');

try {
    $db = new PDO('mysql:host=db;dbname=sf555;charset=utf8', 'root', 'root');
    $db->exec('SET sql_mode=""');
} catch (Exception $e) {
    exit ('SQL Error');
}

$db->setAttribute(PDO::ATTR_ORACLE_NULLS, PDO::NULL_TO_STRING);
$db->exec('SET sql_mode=""');