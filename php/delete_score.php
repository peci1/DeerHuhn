<?php

if (!isset($_POST['name']) || !isset($_POST['email']) || !isset($_POST['score']) || !isset($_POST['round']) || !isset($_POST['delete']) || !isset($_POST['time']))
    die('Nesprávné použití');

require_once('db.php');

$db = new db();
$db->connect();

// delete the entry
$deleteQuery = $db->prepare('UPDATE score SET deleted=1 WHERE round=? AND score=? AND name=? AND email=? AND time=?');
$deleteResult = $deleteQuery->execute(array($_POST['round'], $_POST['score'], $_POST['name'], $_POST['email'], $_POST['time']));

if ($deleteResult === FALSE)
    die($db->get_last_error());
else
    header('Location: get_best_score.php?message=Výsledek+byl+smazán');
/* ?> omitted intentionally */
