<?php

require_once('db.php');

if (isset($_POST['confirm']) && isset($_POST['password'])):
    if ($_POST['password'] !== NEW_ROUND_PASSWORD) {
        header('Location: start_new_round.php?message=Špatné+heslo');
        die();
    }

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
$insertQuery = sprintf("INSERT INTO current_round (round) VALUES (%u)", $round+1);
$result = $db->query($insertQuery);

if ($result === FALSE)
    die($db->get_last_error());
else {
    header('Location: start_new_round.php?message=Nové+kolo+bylo+založeno');
}

else:
?>

<html>
<head><meta charset="utf-8" /></head>
<body>
    <?php if (isset($_GET['message'])): ?><div><b><?php echo $_GET['message']; ?></b></div><?php endif; ?>
    <b>Opravdu si přejete začít nové kolo?</b>
    <form action="" method="post">
        <label for="password">Heslo: </label><input type="password" name="password" />
        <input type="submit" name="confirm" value="Potvrdit" />
    </form>
</body>
</html>

<?php
endif;

/* ?> omitted intentionally */
