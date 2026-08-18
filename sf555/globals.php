<?php
ob_start(); 

// GLOBALS SETTINGS //

require_once __DIR__ . "/dbconnect.php";

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}


$smilies = [
    "(usmiech)" => "usmiech.gif",
    "(oczko)" => "oczko.gif",
    "(zly)" => "zly.gif",
    "(bezradny)" => "bezradny.gif",
    "(smutny2)" => "smutny2.gif",
    "(zalamka)" => "zalamka.gif",
    "(jezyk)" => "jezyk_oko.gif",
    "(foch)" => "foch.gif",
    "(figielek)" => "figielek.gif",
    "(chatownik)" => "chatownik.gif",
    "(dobani)" => "dobani.gif",
    "(puknijsie.png)" => "puknijsie.png.gif",
    "(cfaniak)" => "cfaniak.gif",
    "(glupek2)" => "glupek2.gif",
    "(niedowiary)" => "niedowiary.gif",
    "(zakochany)" => "zakochany.gif",
    "(jupi)" => "jupi.gif",
    "(mniam)" => "mniam.gif",
    "(haha)" => "haha.gif",
    "(lol)" => "lol.gif",
    "(lol2)" => "lol2.gif",
    "(zeby)" => "zeby.gif",
    "??" => "pytajnik.gif",
    "!!" => "wykrzyknik.gif"
];

function auth(): bool
{
    global $db;
    
    if (isset($_SESSION['user_ssid'])) {
        $qry = $db->prepare("SELECT `user_id` FROM `user_data` WHERE `ssid` = :ssid LIMIT 1");
        $qry->execute([':ssid' => $_SESSION['user_ssid']]);
        
        return $qry->rowCount() > 0;
    }
    
    return false;
}

function loaduserdata()
{
    global $db;
    
    if (auth()) {
        $qry = $db->prepare("SELECT * FROM `user_data` WHERE `ssid` = :ssid LIMIT 1");
        $qry->execute([':ssid' => $_SESSION['user_ssid']]);
        
        return $qry->fetch(PDO::FETCH_ASSOC);
    }
    
    return false;
}

function get_group_name(array $user): string
{
    $group = (int)($user['group'] ?? 1);
    
    switch ($group) {
        case 2:  return "VIP";
        case 3:  return "Moderator";
        case 4:  return "Admin";
        default: return "Gracz";
    }
}

function get_color(array $user): string
{
    $colorId = (int)($user['color'] ?? 0);
    
    if ($colorId !== 0) {
        return "color" . $colorId;
    }
    
    return get_group_name($user);
}