<?php
require_once '../globals.php';

header('Content-Type: application/json');
$user_data = loaduserdata();

$response = ['success' => false, 'message' => 'Nieprawidłowe żądanie.'];

$action = $_POST['action'] ?? '';

switch ($action) {
    case 'tavern':
        $item = $_POST['item'] ?? '';

        list($costMushrooms, $resetAmounts) = [[3, 10, 25], [1, 5, 10]];
        if (!is_numeric($item) || $item < 1 || $item > 3) {
            $response['message'] = 'Nieprawidłowy przedmiot.';
            break;
        }

        if ($user_data['mushroom'] < $costMushrooms[$item - 1]) {
            $response['message'] = 'Do zakupu brakuje Ci ' . ($costMushrooms[$item - 1] - $user_data['mushroom']) . ' grzybów.';
            break;
        }

        if ($user_data['beers'] < $resetAmounts[$item - 1]) {
            $response['message'] = 'Nie wypiłeś' . ($resetAmounts[$item - 1] == 1 ? ' żadnego piwa.' : ' wystarczającej ilości piw.') . ' Wypiłeś tylko ' . $user_data['beers'] . '.';
            break;
        }
        $response['success'] = true;
        $response['message'] = 'Zakup udany! Resetujesz ' . $resetAmounts[$item - 1] . ' wypitych piw w karczmie.';

        $user_data['mushroom'] -= $costMushrooms[$item - 1];
        $user_data['beers'] -= $resetAmounts[$item - 1];
        $db->prepare("UPDATE user_data SET mushroom = ?, beers = ? WHERE user_id = ?")
            ->execute([$user_data['mushroom'], $user_data['beers'], $user_data['user_id']]);

        $response['balance'] = [
            'mushroom' => $user_data['mushroom']
        ];
        break;

    case 'elixirs':
        $item = $_POST['item'] ?? '';

        list ($costMushrooms, $statIncreases) = [[10, 15, 20], [5, 10, 15]];
        if (!is_numeric($item) || $item < 1 || $item > 3) {
            $response['message'] = 'Nieprawidłowy przedmiot.';
            break;
        }

        if ($user_data['mushroom'] < $costMushrooms[$item - 1]) {
            $response['message'] = 'Do zakupu brakuje Ci ' . ($costMushrooms[$item - 1] - $user_data['mushroom']) . ' grzybów.';
            break;
        }

        $response['success'] = true;
        $response['message'] = 'Zakup udany! Na stałe zwiększasz swoje wszystkie cechy o ' . $statIncreases[$item - 1] . ' punktów.';
        $db->prepare("UPDATE user_data SET attr_str=attr_str+?, attr_agi=attr_agi+?, mushroom=mushroom-?, attr_int=attr_int+?, attr_wit=attr_wit+?, attr_luck=attr_luck+? WHERE user_id = ?")
            ->execute([$statIncreases[$item - 1], $statIncreases[$item - 1], $costMushrooms[$item - 1], $statIncreases[$item - 1], $statIncreases[$item - 1], $statIncreases[$item - 1], $user_data['user_id']]);
        $response['balance'] = [
            'mushroom' => $user_data['mushroom'] - $costMushrooms[$item - 1]
        ];
        break;

    case 'dungeon':
        $item = $_POST['item'] ?? '';

        if (!is_numeric($item) || $item < 1 || $item > 9) {
            $response['message'] = 'Nieprawidłowy przedmiot.';
            break;
        }

        $costMushrooms = [25, 35, 45, 55, 65, 75, 85, 95, 100];
        if ($user_data['mushroom'] < $costMushrooms[$item - 1]) {
            $response['message'] = 'Do zakupu brakuje Ci ' . ($costMushrooms[$item - 1] - $user_data['mushroom']) . ' grzybów.';
            break;
        }

        if ($user_data['dungeon_' . $item] > 0) {
            $response['message'] = 'Już otworzyłeś ten loch.';
            break;
        }

        $response['success'] = true;
        $response['message'] = 'Zakup udany! Otrzymujesz klucz do lochu ' . $item . '.';

        $qry = $db->prepare("UPDATE user_data SET mushroom = mushroom - ?, dungeon_? = 1 WHERE user_id = ?");
        $qry->bindValue(1, $costMushrooms[$item - 1], PDO::PARAM_INT);
        $qry->bindValue(2, $item, PDO::PARAM_INT);
        $qry->bindValue(3, $user_data['user_id'], PDO::PARAM_INT);
        $qry->execute();
            
        $response['balance'] = [
            'mushroom' => $user_data['mushroom'] - $costMushrooms[$item - 1]
        ];
        break;

    case 'blacksmith':
        $itemId = $_POST['item_id'] ?? '';
        $targetType = $_POST['target_type'] ?? 'player';

        if (!is_numeric($itemId)) {
            $response['message'] = 'Nieprawidłowy przedmiot.';
            break;
        }

        if ($targetType === 'helper') {
            $qry = $db->prepare("SELECT * FROM tower_helper_items WHERE id = ? AND user_id = ?");
        } else {
            $qry = $db->prepare("SELECT * FROM items WHERE id = ? AND owner_id = ?");
        }
        $qry->execute([$itemId, $user_data['user_id']]);
        $item = $qry->fetch(PDO::FETCH_ASSOC);

        if (!$item) {
            $response['message'] = 'Przedmiot nie należy do Ciebie.';
            break;
        }

        $currentUpgrade = (int)($item['upgrade_level'] ?? 0);
        if ($currentUpgrade >= 10) {
            $response['message'] = 'Ten przedmiot osiągnął już maksymalny poziom ulepszenia (+10).';
            break;
        }

        $isEpic = (($item['item_id'] % 1000) >= 50);
        $successChance = 100 - (10 * $currentUpgrade);
        $goldCost = $item['gold'] * (1 + 0.5 * $currentUpgrade);
        $shroomCost = $isEpic ? (10 * ($currentUpgrade + 1)) : 0;

        if ($user_data['silver'] < $goldCost) {
            $response['message'] = 'Nie masz wystarczającej ilości złota u kowala.';
            break;
        }
        if ($user_data['mushroom'] < $shroomCost) {
            $response['message'] = 'Do ulepszenia epika brakuje Ci grzybów.';
            break;
        }

        $user_data['silver'] -= $goldCost;
        $user_data['mushroom'] -= $shroomCost;
        
        $db->prepare("UPDATE user_data SET silver = ?, mushroom = ? WHERE user_id = ?")
           ->execute([$user_data['silver'], $user_data['mushroom'], $user_data['user_id']]);

        $roll = rand(1, 100);
        if ($roll > $successChance) {
            $response['success'] = true;
            $response['upgrade_success'] = false;
            $response['message'] = 'Kowal niefortunnie stopił ulepszenie! Surowce przepadły.';
            $response['balance'] = [
                'silver' => $user_data['silver'],
                'mushroom' => $user_data['mushroom']
            ];
            break;
        }

        $newUpgrade = $currentUpgrade + 1;
        
        $updateFields = [];
        $updateParams = [];

        if ((int)$item['item_type'] === 1) {
            $item['dmg_min'] = (int)round($item['dmg_min'] * 1.10);
            $item['dmg_max'] = (int)round($item['dmg_max'] * 1.10);
            $updateFields[] = "dmg_min = ?, dmg_max = ?";
            array_push($updateParams, $item['dmg_min'], $item['dmg_max']);
            $statModifier = 1.05;
        } else {
            $statModifier = 1.10;
        }

        for ($i = 1; $i <= 3; $i++) {
            if ((int)$item['atr_type_'.$i] > 0) {
                $item['atr_val_'.$i] = (int)floor($item['atr_val_'.$i] * $statModifier);
                $updateFields[] = "atr_val_{$i} = ?";
                $updateParams[] = $item['atr_val_'.$i];
            }
        }

        $updateFields[] = "upgrade_level = ?";
        $updateParams[] = $newUpgrade;

        $tableName = ($targetType === 'helper') ? 'tower_helper_items' : 'items';
        $updateParams[] = $item['id'];
        
        $sql = "UPDATE {$tableName} SET " . implode(", ", $updateFields) . " WHERE id = ?";
        $db->prepare($sql)->execute($updateParams);

        $response['success'] = true;
        $response['upgrade_success'] = true;
        $response['message'] = "Kowal pomyślnie ulepszył przedmiot na +{$newUpgrade}!";
        $response['balance'] = [
            'silver' => $user_data['silver'],
            'mushroom' => $user_data['mushroom']
        ];
        $response['item_updated'] = [
            'id' => $item['id'],
            'target_type' => $targetType,
            'upgrade_level' => $newUpgrade,
            'dmg_min' => $item['dmg_min'] ?? 0,
            'dmg_max' => $item['dmg_max'] ?? 0,
            'atr_val_1' => $item['atr_val_1'],
            'atr_val_2' => $item['atr_val_2'],
            'atr_val_3' => $item['atr_val_3'],
            'next_gold_cost' => number_format(($item['gold'] * (1 + 0.5 * $newUpgrade)) / 100, 2, '.', ' '),
            'next_shroom_cost' => $isEpic ? (10 * ($newUpgrade + 1)) : 0,
            'next_chance' => 100 - (10 * $newUpgrade),
            'is_maxed' => $newUpgrade >= 10
        ];
        break;

    case 'chat_color':
        $color = $_POST['color'] ?? '';
        
        if (!is_numeric($color) || $color < 0 || $color > 6) {
            $response['message'] = 'Nieprawidłowy wybór koloru.';
            break;
        }

        $color = (int)$color;

        if ((int)$user_data['color'] === $color) {
            $response['message'] = 'Ten kolor jest już aktualnie ustawiony.';
            break;
        }

        $cost = ($color === 0) ? 0 : 100;

        if ($user_data['mushroom'] < $cost) {
            $response['message'] = 'Do zmiany koloru brakuje Ci ' . ($cost - $user_data['mushroom']) . ' grzybów.';
            break;
        }

        $user_data['mushroom'] -= $cost;
        $db->prepare("UPDATE user_data SET mushroom = ?, color = ? WHERE user_id = ?")
           ->execute([$user_data['mushroom'], $color, $user_data['user_id']]);

        $response['success'] = true;
        $response['message'] = ($color === 0) ? 'Przywrócono domyślny kolor rangi czatu!' : 'Kolor czatu został pomyślnie zmieniony!';
        $response['new_color'] = $color;
        $response['balance'] = [
            'mushroom' => $user_data['mushroom']
        ];
        break;

    case 'voucher':
        $code = trim($_POST['code'] ?? '');

        if (empty($code)) {
            $response['message'] = 'Wpisz kod vouchera.';
            break;
        }

        $currentTime = time();
        if ((int)($user_data['voucher_date'] ?? 0) > $currentTime) {
            $response['message'] = 'Musisz odczekać przed realizacją kolejnego kodu.';
            break;
        }

        $qry = $db->prepare("SELECT * FROM vouchers WHERE UPPER(code) = UPPER(?) LIMIT 1");
        $qry->execute([$code]);
        $voucher = $qry->fetch(PDO::FETCH_ASSOC);

        if (!$voucher) {
            $response['message'] = 'Podany kod promocyjny jest nieprawidłowy lub wygasł.';
            break;
        }

        $rewardType = $voucher['type'];
        $rewardAmount = (int)$voucher['amount'];
        $remainingUses = (int)$voucher['used'];

        if ($remainingUses <= 0) {
            $response['message'] = 'Ten kod wykorzystał już limit swoich użyć.';
            break;
        }

        $nextVoucherDate = strtotime('tomorrow');
        
        if ($rewardType === 'mushroom') {
            $user_data['mushroom'] += $rewardAmount;
            $db->prepare("UPDATE user_data SET mushroom = ?, voucher_date = ? WHERE user_id = ?")
               ->execute([$user_data['mushroom'], $nextVoucherDate, $user_data['user_id']]);
            
            $response['message'] = "Sukces! Kod pomyślnie aktywowany. Otrzymujesz {$rewardAmount} grzybów!";
        } elseif ($rewardType === 'silver') {
            $user_data['silver'] += $rewardAmount;
            $db->prepare("UPDATE user_data SET silver = ?, voucher_date = ? WHERE user_id = ?")
               ->execute([$user_data['silver'], $nextVoucherDate, $user_data['user_id']]);
               
            $formattedGold = number_format($rewardAmount / 100, 2, '.', ' ');
            $response['message'] = "Sukces! Kod pomyślnie aktywowany. Otrzymujesz {$formattedGold} złota!";
        } else {
            $response['message'] = 'Błąd systemowy: Nieznany typ nagrody.';
            break;
        }

        if ($remainingUses === 1) {
            $db->prepare("DELETE FROM vouchers WHERE id = ?")->execute([$voucher['id']]);
        } else {
            $db->prepare("UPDATE vouchers SET used = used - 1 WHERE id = ?")->execute([$voucher['id']]);
        }

        $response['success'] = true;
        $response['balance'] = [
            'mushroom' => $user_data['mushroom'],
            'silver' => $user_data['silver']
        ];
        break;
}

echo json_encode($response);