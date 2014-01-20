<?php

if ($_POST['score'] < -5000 || $_POST['score'] > 5000)
    die('fuck off');

require_once('db.php');

$db = new db();
$db->connect();

// query the current round
$roundResult = $db->query("SELECT MAX(round) AS current_round FROM current_round");
if ($roundResult === FALSE)
    die(mysql_error());

if (mysql_num_rows($roundResult) !== 1)
    die('The query for current round returned ' . mysql_num_rows($roundResult) . ' rows.');

$round = mysql_fetch_array($roundResult, MYSQL_ASSOC);
$round = (int) $round['current_round'];

// insert the values into current round
$insertQuery = sprintf("INSERT INTO score (round, score, name, email) VALUES (%u, '%d', '%s', '%s')", 
    $round, (int) $_POST['score'], $db->escape($_POST['name']), $db->escape($_POST['email']));
$result = $db->query($insertQuery);

if ($result === FALSE)
    echo mysql_error();
else
    echo '1';

/* ?> omitted intentionally */
