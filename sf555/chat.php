<?php
    // Zeusxp //
    include("globals.php");
    
    global $db, $smilies;
    $time = time(); 
    
    // Przygotowanie nagłówka, że zwracamy JSON
    header('Content-Type: application/json; charset=utf-8');
    
    // Obiekt domyślnej odpowiedzi serwera
    $response = [
        'success'  => true,
        'error'    => null,
        'messages' => []
    ];
        
    function format_comment(?string $text): string
    {
        global $smilies;
        if ($text === null || $text === '') return '';

        $s = stripslashes($text); 
        $s = preg_replace("/\[center\]((\s|.)+?)\[\/center\]/i", "<center>$1</center>", $s); 
        $s = preg_replace("/\[list\]((\s|.)+?)\[\/list\]/", "<ul>$1</ul>", $s); 
        $s = preg_replace("/\[list=(disc|circle|square)\]((\s|.)+?)\[\/list\]/", "<ul type=\"$1\">$2</ul>", $s); 
        $s = preg_replace("/\[list=(1|a|A|i|I)\]((\s|.)+?)\[\/list\]/", "<ol type=\"$1\">$2</ol>", $s); 
        $s = preg_replace("/\[\*\]/", "<li>", $s); 
        $s = preg_replace("/\[b\]((\s|.)+?)\[\/b\]/", "<b>$1</b>", $s); 
        $s = preg_replace("/\[i\]((\s|.)+?)\[\/i\]/", "<i>$1</i>", $s); 
        $s = preg_replace("/\[u\]((\s|.)+?)\[\/u\]/", "<u>$1</u>", $s); 
        $s = preg_replace("/\[u\]((\s|.)+?)\[\/u\]/i", "<u>$1</u>", $s); 
        $s = preg_replace("/\[img\]([^\s'\"<>]+?)\[\/img\]/i", "<a href=\"$1\" target=\"_blank\"><img src=\"$1\" style=\"max-width:150px; max-height:150px;\" title=\"Kliknij by zobaczyć obrazek\" border=\"0\"></a>", $s); 
        $s = preg_replace("/\[img=([^\s'\"<>]+?)\]/i", "<a href=\"$1\" target=\"_blank\"><img src=\"$1\" style=\"max-width:150px; max-height:150px;\" title=\"Kliknij by zobaczyć obrazek\" border=\"0\"></a>", $s); 
        $s = preg_replace("/\[color=([a-zA-Z]+)\]((\s|.)+?)\[\/color\]/i", "<font color=\"$1\">$2</font>", $s); 
        $s = preg_replace("/\[color=(#[a-f0-9]{3,6})\]((\s|.)+?)\[\/color\]/i", "<font color=\"$1\">$2</font>", $s); 
        $s = preg_replace("/\[url=([^()<>\s]+?)\]((\s|.)+?)\[\/url\]/i", "<a href=\"$1\" target=\"_blank\">$2</a>", $s); 
        $s = preg_replace("/\[url\]([^()<>\s]+?)\[\/url\]/i", "<a href=\"$1\" target=\"_blank\">$1</a>", $s); 
        $s = preg_replace("/\[size=([1-7])\]((\s|.)+?)\[\/size\]/i", "<font size=\"$1\">$2</font>", $s); 
        $s = preg_replace("/\[font=([a-zA-Z ,]+)\]((\s|.)+?)\[\/font\]/i", "<font face=\"$1\">$2</font>", $s);
        $s = nl2br($s); 
        
        $s = preg_replace("/\[pre\]((\s|.)+?)\[\/pre\]/i", "<tt><nobr>$1</nobr></tt>", $s); 
        $s = preg_replace("/\[nfo\]((\s|.)+?)\[\/nfo\]/i", "<tt><nobr><font face=\"MS Linedraw\" size=\"2\" style=\"font-size: 10pt; line-height: 10pt\">$1</font></nobr></tt>", $s); 
        $s = str_replace("  ", " &nbsp;", $s);

        foreach ($smilies as $code => $url) {
            $s = str_replace($code, "<img src=\"res/chat/smilies/$url\" border=\"0\" alt=\"" . htmlspecialchars($code, ENT_QUOTES, 'UTF-8') . "\">", $s);
        }
        return $s;
    }
    
    function get_user_icon(array $user): string
    {
        $icon = "";
        $uClass = (int)($user['class'] ?? 0);
        $uGroup = (int)($user['group'] ?? 1);
        
        switch ($uClass) {
            case 1: $icon .= " <img src='res/chat/icons/icon_warrior.png' />"; break;
            case 2: $icon .= " <img src='res/chat/icons/icon_mage.png' />"; break;
            case 3: $icon .= " <img src='res/chat/icons/icon_hunter.png' />"; break;
        }
        switch ($uGroup) {
            case 2: $icon .= " <img src='res/chat/icons/icon_vip.png' />"; break;
            case 3: $icon .= " <img src='res/chat/icons/icon_mod.png' />"; break;
            case 4: $icon .= " <img src='res/chat/icons/icon_admin.png' />"; break;
        }
        if (($user['enabled'] ?? 'yes') === "no")  $icon .= " <img src='res/chat/icons/icon_ban.png' />"; 
        if (($user['warned'] ?? 'no') === "yes")   $icon .= " <img src='res/chat/icons/icon_warn.png' />"; 
        if ((int)($user['reg_date'] ?? 0) < (time() - 86400)) $icon .= " <img src='res/chat/icons/icon_new.png' />"; 
        
        return $icon;
    }
    
    $user_data = loaduserdata() ?? [];
    
    // =========================================================================
    // OBSŁUGA AKCJI (POST)
    // =========================================================================
    if (isset($_POST['act'], $_POST['data'])) {
        if (auth()) {
            $act = (int)$_POST['act'];
            $data = htmlspecialchars($_POST['data'], ENT_QUOTES, 'UTF-8');
            $userGroup = (int)($user_data['group'] ?? 1);
            
            switch ($act) {
                case 1: // Pisanie
                    $emailValidated = (int)($user_data['email_validated'] ?? $user_data['email_validate'] ?? 1);
                    $userLvl = (int)($user_data['lvl'] ?? 1);
                    $chatBanUntil = (int)($user_data['chat_ban_until'] ?? 0);

                    if ($emailValidated !== 1) {
                        $response['success'] = false;
                        $response['error'] = 'By pisać na czacie wymagane jest potwierdzenie adresu email.';
                    } elseif ($userLvl < 1) { // Tutaj próg poziomu
                        $response['success'] = false;
                        $response['error'] = 'Pisanie dostępne od wyższego poziomu.';
                    } elseif ($chatBanUntil > $time) {
                        $response['success'] = false;
                        $response['error'] = 'Masz blokadę czatu do ' . date('d.m.Y H:i:s', $chatBanUntil) . '.';
                    } elseif (($user_data['enabled'] ?? 'yes') !== "yes") {
                        $response['success'] = false;
                        $response['error'] = 'Te konto zostało zbanowane.';
                    } else {
                        if (trim($data) !== "") {
                            $qry = $db->prepare("INSERT INTO `chat` (`id`, `user_id`, `message`, `date`) VALUES (NULL, :uid, :data, :time)");
                            $qry->execute([':uid' => $user_data['user_id'], ':data' => $data, ':time' => $time]);
                        }
                    }
                    break;

                case 2: // Usuń Post
                    if ($userGroup > 2) {
                        $qry = $db->prepare("DELETE FROM `chat` WHERE `id` = :id LIMIT 1");
                        $qry->execute([':id' => (int)$data]);
                    }
                    break;

                case 3: // Warn
                    if ($userGroup > 2) {
                        $qry = $db->prepare("UPDATE `user_data` SET `warned` = 'yes' WHERE `user_id` = :uid LIMIT 1");
                        $qry->execute([':uid' => (int)$data]);
                    }
                    break;

                case 4: // Unwarn
                    if ($userGroup > 2) {
                        $qry = $db->prepare("UPDATE `user_data` SET `warned` = 'no' WHERE `user_id` = :uid LIMIT 1");
                        $qry->execute([':uid' => (int)$data]);
                    }
                    break;

                case 5: // Ban
                    if ($userGroup > 3) {
                        $qry = $db->prepare("UPDATE `user_data` SET `enabled` = 'no' WHERE `user_id` = :uid LIMIT 1");
                        $qry->execute([':uid' => (int)$data]);
                    }
                    break;

                case 6: // Unban
                    if ($userGroup > 3) {
                        $qry = $db->prepare("UPDATE `user_data` SET `enabled` = 'yes' WHERE `user_id` = :uid LIMIT 1");
                        $qry->execute([':uid' => (int)$data]);
                    }
                    break;
            }
        } else {
            $response['success'] = false;
            $response['error'] = 'Błąd autoryzacji: Zaloguj się ponownie.';
        }
    }
    
    // =========================================================================
    // BUDOWANIE LISTY WIADOMOŚCI DLA JSON
    // =========================================================================
    $qry = $db->query("SELECT chat.*, user_data.user_name, user_data.lvl, user_data.group, user_data.color, user_data.enabled, user_data.warned, user_data.reg_date, user_data.class 
                       FROM `chat` 
                       LEFT JOIN `user_data` ON chat.user_id = user_data.user_id 
                       ORDER BY chat.`date` DESC LIMIT 150");
    
    $chatLogs = $qry->fetchAll(PDO::FETCH_ASSOC);
    $currentUserGroup = (int)($user_data['group'] ?? 1);

    // Przekazujemy rangę aktualnego widza do JS, by wiedział czy renderować ikony moda/admina
    $response['viewer_group'] = $currentUserGroup;

    foreach ($chatLogs as $chat) {
        if (empty($chat['user_name'])) continue;

        $response['messages'][] = [
            'id'         => (int)$chat['id'],
            'user_id'    => (int)$chat['user_id'],
            'lvl'        => (int)$chat['lvl'],
            'user_name'  => htmlspecialchars($chat['user_name'], ENT_QUOTES, 'UTF-8'),
            'color_class'=> get_color($chat),
            'icons_html' => get_user_icon($chat),
            'time_html'  => date("H:i", (int)$chat["date"]),
            'body_html'  => format_comment($chat['message'])
        ];
    }

    echo json_encode($response);
    exit;