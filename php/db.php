<?php

require_once('config.php');

/**
 * Database connection.
 */
class db {

    private $host;
    private $dbName;
    private $username;
    private $password;
    private $dbEncoding;

    private $dbHandle = NULL;

    public function __construct() {
        $this->host = DB_HOST;
        $this->dbName = DB_NAME;
        $this->username = DB_USERNAME;
        $this->password = DB_PASSWORD;
        $this->dbEncoding = DB_ENCODING;
    }

    public function connect() {
        $this->dbHandle = mysql_connect($this->host, $this->username, $this->password);
        if ($this->dbHandle === FALSE)
            die(mysql_error());

        $dbSelected = mysql_select_db($this->dbName, $this->dbHandle);
        if ($dbSelected === FALSE)
            die(mysql_error());

        $charsetSelected = mysql_query('set character_set_results='.$this->dbEncoding.
            ', character_set_connection='.$this->dbEncoding.
            ', character_set_client='.$this->dbEncoding);

        if ($charsetSelected === FALSE)
            die(mysql_error());
    }

    public function query($query) {
        return mysql_query($query, $this->dbHandle);
    }

    public function escape($string) {
        return mysql_real_escape_string($string, $this->dbHandle);
    }
}

/* ?> omitted intentionally */
