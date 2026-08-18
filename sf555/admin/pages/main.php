<?php if (!defined('IN_ITEMSHOP')) exit("You can't access this file directly."); ?>
<?php
$dashboard_stats = [
	'registered_players' => (int) $db->query('SELECT COUNT(*) FROM user_data')->fetchColumn(),
	'online_15m' => 0,
	'online_24h' => 0,
	'active_vouchers' => acp_table_exists('vouchers') ? (int) $db->query('SELECT COUNT(*) FROM vouchers')->fetchColumn() : 0,
];

$activity_column = acp_get_activity_column();
if ($activity_column) {
	$query = $db->prepare(
		sprintf(
			'SELECT SUM(CASE WHEN CAST(`%1$s` AS UNSIGNED) >= :online_15m THEN 1 ELSE 0 END) AS online_15m,
					SUM(CASE WHEN CAST(`%1$s` AS UNSIGNED) >= :online_24h THEN 1 ELSE 0 END) AS online_24h
			 FROM user_data',
			$activity_column
		)
	);
	$query->bindValue(':online_15m', time() - 900, PDO::PARAM_INT);
	$query->bindValue(':online_24h', time() - 86400, PDO::PARAM_INT);
	$query->execute();
	$activity_stats = $query->fetch(PDO::FETCH_ASSOC) ?: [];
	$dashboard_stats['online_15m'] = (int) ($activity_stats['online_15m'] ?? 0);
	$dashboard_stats['online_24h'] = (int) ($activity_stats['online_24h'] ?? 0);
}

$loads = function_exists('sys_getloadavg') ? sys_getloadavg() : [0, 0, 0];
$server_load = [
	'load_1m' => (float) ($loads[0] ?? 0),
	'load_5m' => (float) ($loads[1] ?? 0),
	'load_15m' => (float) ($loads[2] ?? 0),
];

$recent_online_players = [];
$daily_online_players = [];

if ($activity_column) {
	$chat_color_column = acp_column_exists('user_data', 'chat_color') ? 'chat_color' : false;
	$chat_color_select = $chat_color_column ? ', CAST(`' . $chat_color_column . '` AS SIGNED) AS chat_color' : ', 0 AS chat_color';

	foreach ([900 => 'recent_online_players', 86400 => 'daily_online_players'] as $seconds => $target_variable) {
		$query = $db->prepare(
			sprintf(
				'SELECT user_id, user_name, `group`%s
				 FROM user_data
				 WHERE CAST(`%s` AS UNSIGNED) >= :threshold
				 ORDER BY CAST(`%s` AS UNSIGNED) DESC, user_name ASC',
				$chat_color_select,
				$activity_column,
				$activity_column
			)
		);
		$query->bindValue(':threshold', time() - (int) $seconds, PDO::PARAM_INT);
		$query->execute();
		${$target_variable} = $query->fetchAll(PDO::FETCH_ASSOC) ?: [];
	}
}
?>
<section class="admin-page-section">
	<div class="row g-4 mb-4">
		<div class="col-12 col-md-6 col-xl-3">
			<div class="admin-card p-4 text-center shadow">
				<div class="text-secondary small text-uppercase">Zarejestrowani gracze</div>
				<div class="fs-2 fw-bold text-white mt-2"><?= number_format($dashboard_stats['registered_players'], 0, '.', ' ') ?></div>
			</div>
		</div>
		<div class="col-12 col-md-6 col-xl-3">
			<div class="admin-card p-4 text-center shadow">
				<div class="text-secondary small text-uppercase">Online 15 minut</div>
				<div class="fs-2 fw-bold text-info mt-2"><?= number_format($dashboard_stats['online_15m'], 0, '.', ' ') ?></div>
			</div>
		</div>
		<div class="col-12 col-md-6 col-xl-3">
			<div class="admin-card p-4 text-center shadow">
				<div class="text-secondary small text-uppercase">Aktywni 24h</div>
				<div class="fs-2 fw-bold text-success mt-2"><?= number_format($dashboard_stats['online_24h'], 0, '.', ' ') ?></div>
			</div>
		</div>
		<div class="col-12 col-md-6 col-xl-3">
			<div class="admin-card p-4 text-center shadow">
				<div class="text-secondary small text-uppercase">Aktywne kupony</div>
				<div class="fs-2 fw-bold text-warning mt-2"><?= number_format($dashboard_stats['active_vouchers'], 0, '.', ' ') ?></div>
			</div>
		</div>
	</div>

	<div class="admin-card p-4 shadow mb-4">
		<div class="chat_table_header p-2 mb-3">Gracze Online</div>
		<div class="row g-4">
			<div class="col-12 col-xl-6">
				<div class="player-section-label">Aktywni w ciągu 15 minut</div>
				<div class="player-badge-grid">
					<?php if ($recent_online_players) { ?>
						<?php foreach ($recent_online_players as $player) { ?>
							<a href="index.php?p=user&id=<?= (int) $player['user_id'] ?>" class="player-badge-item text-decoration-none">
								<span class="<?= htmlspecialchars(acp_get_player_css_class($player)) ?>"><?= htmlspecialchars($player['user_name']) ?></span>
							</a>
						<?php } ?>
					<?php } else { ?>
						<div class="admin-empty-state">Brak aktywnych graczy w ciągu ostatnich 15 minut.</div>
					<?php } ?>
				</div>
			</div>
			<div class="col-12 col-xl-6">
				<div class="player-section-label">Aktywni w ciągu 24 godzin</div>
				<div class="player-badge-grid">
					<?php if ($daily_online_players) { ?>
						<?php foreach ($daily_online_players as $player) { ?>
							<a href="index.php?p=user&id=<?= (int) $player['user_id'] ?>" class="player-badge-item text-decoration-none">
								<span class="<?= htmlspecialchars(acp_get_player_css_class($player)) ?>"><?= htmlspecialchars($player['user_name']) ?></span>
							</a>
						<?php } ?>
					<?php } else { ?>
						<div class="admin-empty-state">Brak aktywnych graczy w ciągu ostatnich 24 godzin.</div>
					<?php } ?>
				</div>
			</div>
		</div>
	</div>

	<div class="admin-card p-4 shadow">
		<div class="chat_table_header p-2 mb-3">Obciążenie serwera</div>
		<div class="row g-3 mb-4">
			<div class="col-12 col-md-4">
				<div class="admin-card p-3 text-center">
					<div class="text-secondary small text-uppercase">Load Average 1m</div>
					<div class="fs-4 fw-bold text-white mt-2"><?= number_format($server_load['load_1m'], 2, '.', ' ') ?></div>
				</div>
			</div>
			<div class="col-12 col-md-4">
				<div class="admin-card p-3 text-center">
					<div class="text-secondary small text-uppercase">Load Average 5m</div>
					<div class="fs-4 fw-bold text-white mt-2"><?= number_format($server_load['load_5m'], 2, '.', ' ') ?></div>
				</div>
			</div>
			<div class="col-12 col-md-4">
				<div class="admin-card p-3 text-center">
					<div class="text-secondary small text-uppercase">Load Average 15m</div>
					<div class="fs-4 fw-bold text-white mt-2"><?= number_format($server_load['load_15m'], 2, '.', ' ') ?></div>
				</div>
			</div>
		</div>

		<div class="chat_table_header p-2 mb-3">Szybkie akcje</div>
		<div class="d-flex flex-wrap gap-2">
			<a href="index.php?p=users" class="admin-btn">Przejdź do listy graczy</a>
            <?php if (get_group() == 4): ?>
			<a href="index.php?p=vouchers" class="admin-btn">Generuj kupony</a>
			<a href="index.php?p=mass_message" class="admin-btn">Wyślij wiadomość masową</a>
            <?php endif; ?>
		</div>
	</div>
</section>
