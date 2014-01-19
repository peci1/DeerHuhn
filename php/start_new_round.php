<?php

if (isset($_POST['confirm']) && isset($_POST['password'])):

    if ($_POST['password'] !== '2014srnek') {
        header('Location: start_new_round.php?message=Špatné+heslo');
        die();
    }

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
$insertQuery = sprintf("INSERT INTO current_round (round) VALUES (%u)", $round+1);
$result = $db->query($insertQuery);

if ($result === FALSE)
    echo mysql_error();
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
