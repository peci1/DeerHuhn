<?php

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

$result = new StdClass();
// select the best score
$result->best = build_and_query('DESC', $round, $db);
$result->worst = build_and_query('ASC', $round, $db);

function build_and_query($order, $round, $db) {
    $scoreQuery = 'SELECT * FROM score WHERE round='.$round.' AND deleted=0 ORDER BY score ' . $order;
    if (isset($_GET['limit'])) $scoreQuery .= ' LIMIT ' . (int) $_GET['limit'];
    $result = $db->query($scoreQuery);

    if ($result === FALSE)
        die(mysql_error());

    $scoreTable = Array();
    for ($i = 0; $i < mysql_num_rows($result); $i++) {
        $scoreTable[] = mysql_fetch_array($result, MYSQL_ASSOC);
    }
    return $scoreTable;
}

if (isset($_GET['format']) && $_GET['format'] === 'json') {
    echo json_encode($result);
} else {
    echo '<html><head><meta charset="utf-8" /><link rel="stylesheet" href="css/main.css" /></head><body>';
    if (isset($_GET['message'])) echo '<div><b>'.htmlspecialchars($_GET['message']).'</b></div>';
    echo '<table border=1 id="best_results">';
    echo '<tr><th>Jméno</th><th>Email</th><th>Skóre</th><th>Smazat?</th></tr>';
    foreach ($result->best as $row) {
        echo '<tr>';
        echo '<td>'.htmlspecialchars($row['name']).'&nbsp;</td>';
        echo '<td>'.htmlspecialchars($row['email']).'&nbsp;</td>';
        echo '<td>'.(int)$row['score'].'</td>';
        echo '<td><form action="delete_score.php" method="post" onsubmit="return confirm(\'Opravdu smazat skóre uživatele '.htmlspecialchars($row['name']).'?\')">';
            echo '<input type="hidden" name="name" value="'.htmlspecialchars($row['name']).'" />';
            echo '<input type="hidden" name="email" value="'.htmlspecialchars($row['email']).'" />';
            echo '<input type="hidden" name="score" value="'.(int) $row['score'].'" />';
            echo '<input type="hidden" name="round" value="'.(int) $round.'" />';
            echo '<input type="hidden" name="time" value="'.$row['time'].'" />';
            echo '<input type="submit" name="delete" value="Smazat" />';
        echo '</form></td>';
        echo '</tr>';
    }
    echo '</table></body></html>';
}

/* ?> omitted intentionally */

