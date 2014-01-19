<?php

if (!isset($_POST['name']) || !isset($_POST['email']) || !isset($_POST['score']) || !isset($_POST['round']) || !isset($_POST['delete']) || !isset($_POST['time']))
    die('Nesprávné použití');

require_once('db.php');

$db = new db();
$db->connect();

// delete the entry
$deleteQuery = sprintf("UPDATE score SET deleted='1' WHERE round=%u AND score=%d AND name='%s' AND email='%s' AND time='%s' LIMIT 1",
    $_POST['round'], $_POST['score'], $db->escape($_POST['name']), $db->escape($_POST['email']), $db->escape($_POST['time']));
$deleteResult = $db->query($deleteQuery);
if ($deleteResult === FALSE)
    die(mysql_error());
else
    header('Location: get_best_score.php?message=Výsledek+byl+smazán');
/* ?> omitted intentionally */
