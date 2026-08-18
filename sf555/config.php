<?php
require_once 'dbconnect.php';

$host = $db->query('SELECT `value` FROM `server_config` WHERE `name` = "HOST" LIMIT 1')->fetchColumn();
$language = $db->query('SELECT `value` FROM `server_config` WHERE `name` = "LANGUAGE" LIMIT 1')->fetchColumn();
$mail = $db->query('SELECT `value` FROM `server_config` WHERE `name` = "MAIL" LIMIT 1')->fetchColumn();
$background = $db->query('SELECT `value` FROM `server_config` WHERE `name` = "BACKGROUND" LIMIT 1')->fetchColumn();

print "1	" . $language . "\n";
print "2	http://img.playa-games.com/res/sfgame/\n";
print "3	http://img.playa-games.com/res/sfgame/\n";
print "7	" . $host . "\n";
print "8	http://" . $host . "/\n";
print "9	0\n";
print "10	\n";
print "11	http://" . $host . "/support\n";
print "12	shop\n";
print "13	\n";
print "14	\n";
print "17	3\n";
print "18	" . $host . "/\n";
print "21	3\n";
print "23	1\n";
print "25	http://" . $host . "/req.php?req=%1&random=%2\n";
print "29	" . $mail . "\n";
print "30	http://" . $host . "/res/papaya44.swf\n";
print "31	http://" . $host . "/papaya_cfg.php\n";
print "32	1\n";
print "34	2\n";
print "35	\n";
print "42	1\n";
print "43	529\n";
print "48	http://img.playa-games.com/res/sfgame/\n";
print "46	ar/cs/da/de/el/en/es/fi/fr/hr/hu/it/ja/nl/pl/pt/pt-br/ro/ru/sk/sv/tr\n";
print "47	arabian/czech/danish/german/greek/english/spanish/fi/french/hr/hungarian/italian/japanese/dutch/polish/portugese/brazilian portugese/romanian/russian/slovakian/swedish/turkish\n";
print "54	0\n";
print "55	\n";
print "56	http://" . $host . "/html_payment.php?playerid=<playerid>&eventid=<eventid>&country=<country>&androidversion=<androidversion>&store=<store>\n";
print "57	" . $background . "\n";
print "62	Ghu2o1I87j/fC8hdF+sm4Ve7CFUaRz3L9xp8Yr+gmJbqliU+d+6gadf178nmpJoUtjgK3VQRCr+xy0tBW/P3Vyk52gzdBGTAWuMZ6NF7r2vC8q3UJR1mSM51o7xgICkYPfQMdpcFrWM12eajOsu4jqSJHiqr8OVukRIlvnx9hRg=\n";
?>