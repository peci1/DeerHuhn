<?php
if ($_POST['score'] < -5000 || $_POST['score'] > 5000)
    die('fuck off');

session_start();

if (!isset($_SESSION['game_start_time']))
    die('fuck off');

$timeDiff = time() - $_SESSION['game_start_time'];
$gameDurationSeconds = 275 * 0.6; // 275 days, 0.6 s each

if ($timeDiff < $gameDurationSeconds)
    die('fuck off');

// disallow multiple insertion
unset($_SESSION['game_start_time']);

require_once('db.php');

$db = new db();
$db->connect();

// query the current round
if ($db->query('SELECT COUNT(*) FROM current_round')->fetchColumn() == 0) //intentionally ==
    die('V databázi není záznam o žádném kole. ' . $db->get_last_error());

$roundResult = $db->query("SELECT MAX(round) AS current_round FROM current_round");

$round = $roundResult->fetchColumn();
if ($round === FALSE)
    die($db->get_last_error());
$round = (int) $round;

// insert the values into current round
$insertQuery = sprintf("INSERT INTO score (round, score, name, email, deleted, time) VALUES (%u, %d, %s, %s, 0, %s)", 
    $round, (int) $_POST['score'], $db->escape($_POST['name']), $db->escape($_POST['email']), $db->escape(date('Y-m-d H:i:s')));
$result = $db->query($insertQuery);

if ($result === FALSE)
    die($db->get_last_error());
else
    echo '1';

/* ?> omitted intentionally */
