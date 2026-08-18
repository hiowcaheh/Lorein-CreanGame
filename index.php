<?php include("globals.php"); ?>
<!DOCTYPE html>
<html>
<head>
<meta http-equiv="X-UA-Compatible" content="IE=Edge">
<meta http-equiv="expires" content="0">
<meta http-equiv="cache-control" content="no-cache">
<meta http-equiv="pragma" content="no-cache">
<meta name="author" content="Playa Games GmbH">
<meta name="publisher" content="Playa Games GmbH">
<meta name="copyright" content="Copyright 2013 Playa Games GmbH. All Rights reserved.">
<meta name="keywords" content="browser game">
<meta name="description" content="The fun Shakes & Fidget browser game">
<meta name="page-topic" content="Computer/Software/Games">
<meta name="audience" content="All">
<meta name="robots" content="index, follow">
<link rel="shortcut icon" href="favicon.ico" type="image/x-icon" />
<link rel="stylesheet" type="text/css" href="res/chat.css">
<style type="text/css">
html,body {
    width: 100%;
    height: 100%;
    padding: 0;
    margin: 0;
}
</style>

<script src="res/chat.js?v=<?php echo time(); ?>"></script>
</head>

<body>
<div id="fade" class="black_overlay"></div>
<script language="JavaScript" type="text/javascript">
// <!--
// -----------------------------------------------------------------------------
// Globals
var sociallinks = {"sfgame":{"facebook":"https:\/\/www.facebook.com\/pages\/Shakes-Fidget-The-Game\/107431265996255"}};

var swfwidth = '100%';
var swfheight = '100%';
var swfquality = 'best';
var swfscale = 'showAll';
var project = 'sfgame';
var movie = 'res/sfgame_edit';
var bgimage = 'background.jpg';
var message1 = 'Shakes & Fidget potrebuje Flash';
var message2 = 'Nainštaluj Flash teraz!';
var servername = 's1.sfgame.cz';
var branding_url = '';
var country = 'csl';
var serverid = 's1';
var strings = {};
var flimmerkistePoll = 300;
var moshid = 'hash=07903051fed624032a806770dc9171bc&time=1387449398';

var isIframe = false;
try{
  if (window.location != window.parent.location){
    isIframe = true; 
  }
} catch(e){
}

// Major version of Flash required
var requiredMajorVersion = 9;
// Minor version of Flash required
var requiredMinorVersion = 0;
// Revision of Flash required
var requiredRevision = 124;
// -----------------------------------------------------------------------------
strings["brandengage.no_offers"] = 'Obecnie nie są dostępne żadne oferty.';
// -->
</script>

<script src="https://unpkg.com/@ruffle-rs/ruffle"></script>
<script src="res/js/thegame.js?version=25" type="text/javascript"></script>

<noscript>
    <style type="text/css">
    body {
        background: url(http://img.playa-games.com/background.jpg) no-repeat top center #000000;
    }
    a:link, a:visited, a:active, a:focus {
        text-decoration: none;
        color: #ffd9aa;
    }
    a:hover {
        text-decoration: underline;
        color: #ffd9aa;
    }
    </style>
    <table align="center" width="550px" style="font-family: Tahoma, Arial, Helvetica, sans-serif; color: #FFFFFF;">
        <tr>
            <td><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br><br>
                <b>Shakes & Fidget wymaga aplikacji Adobe Flash: <a href="http://www.adobe.com/go/getflashplayer/">Zainstaluj Flash teraz!</a></b>
            </td>
        </tr>
    </table>
</noscript>
<iframe id="maif" name="maif" src="" width="0" height="0" style="position: absolute; left: 0; top: 0; border: 0 none"></iframe>
<script type="text/javascript">
function default_phandler(action, cid, playerid, paramObj, paramObjCreate)
{
//  document.getElementById("maif").src="marketing/map.php?a="+action+"&b="+cid+"&c="+playerid+"&d=1&e=52&f=eJxLtDKwqq4FAAZPAf4%3D&r=1387449398.6948";
}
default_phandler("regStart", "", 0, 0, 0);
</script>

<table class="chat_table">
    <tr>
        <td class="chat_table_header" colspan="2">
            -=[ Czat Globalny ]=-
        </td>
    </tr>
    <tr>
        <td width="12%">
            <table summary="" cellSpacing="1" cellPadding="3" class="tableinborder" border="0">
                <?php
                global $smilies;
                $smiles_count = 0;
                
                foreach ($smilies as $code => $url) {
                    if ($smiles_count == 0) {
                        print("<tr>\n");
                    }
                    
                    $safeCode = htmlspecialchars($code, ENT_QUOTES, 'UTF-8');
                    print("<td class=\"chat_table\"><center>" .
                          "<img border=\"0\" src=\"res/chat/smilies/" . htmlspecialchars($url, ENT_QUOTES, 'UTF-8') . "\" onclick=\"javascript: em('" . addslashes($code) . "')\" alt=\"" . $safeCode . "\" /></center></td>\n");

                    $smiles_count++;
                    if ($smiles_count == 4) {
                        print("</tr>\n");
                        $smiles_count = 0;
                    }
                }
                
                if (($smiles_count != 4) && ($smiles_count != 0)) {
                    print("<td class=\"tablea\" colspan=\"" . (4 - $smiles_count) . "\">&nbsp;</td>\n</tr>\n");
                }
                ?>
                <tr>
                    <td class="chat_table" colspan="4"><font color='silver'><b>Grupy:</b></font>
                        <ul>
                            <li><font class="Gracz">Gracz</font></li>
                            <li><font class="VIP">VIP</font></li>
                            <li><font class="Moderator">Moderator</font></li>
                            <li><font class="Admin">Administrator</font></li>
                        </ul>
                    </td>
                </tr>
                <tr>
                    <td class="chat_table" colspan="4"><b>Regulamin:</b>
                        <ul type="1" style="overflow-y:scroll; max-height:100px;">
                            <li><i>Nieznajomość regulaminu nie zwalnia użytkownika od jego przestrzegania.</i></li>
                            <li><i>Zabrania się umieszczania treści niezgodnych z ogólnie przyjętymi zasadami moralności.</i></li>
                            <li><i>Użytkownik zobowiązany jest do przestrzegania cenzury wulgaryzmów.</i></li>
                            <li><i>Panuje kategoryczny zakaz sprzedaży oraz ujawniania danych do konta.</i></li>
                            <li><i>Jeśli uważasz, że moderator pomylił się nadając ci blokadę, napisz do <a target="_blank" href="/support">supportu</a>.</i></li>
                            <li><i>Administracja nie odpowiada za utratę dóbr wirtualnych.</i></li>
                            <li><i>Nieprzestrzeganie regulaminu grozi stałą blokadą konta.</i></li>
                        </ul>
                    </td>
                </tr>
            </table>
        </td>
        <td>
            <table summary="" class="tableinborder" border="0" cellspacing="1" cellpadding="5" width="100%">
                <tr>
                    <td>
                        <div id="chat_messages"></div>
                    </td>
                </tr>
                <tr>
                    <td class="chat_table">
                        <input id="message" style="font-size:11px;" size="200" autocomplete="on" /> 
                        <button onClick="send_chat();">Wyślij</button>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
</body>
</html>