<?php

require_once('config.php');

/**
 * Database connection.
 */
class db {

    private $dsn;
    private $host;
    private $dbName;
    private $username;
    private $password;
    private $dbEncoding;

    private $dbHandle = NULL;

    public function __construct() {
        $this->dsn = DB_DSN;
        $this->host = DB_HOST;
        $this->dbName = DB_NAME;
        $this->username = DB_USERNAME;
        $this->password = DB_PASSWORD;
        $this->dbEncoding = DB_ENCODING;
    }

    public function connect() {
        $this->dbHandle = new PDO($this->dsn, $this->username, $this->password);
    }

    public function query($query) {
        return $this->dbHandle->query($query);
    }

    public function escape($string) {
        return $this->dbHandle->quote($string);
    }

    public function get_last_error() {
        return print_r($this->dbHandle->errorInfo(), TRUE);
    }

    public function exec($query) {
        return $this->dbHandle->exec($query);
    }

    public function prepare($query) {
        return $this->dbHandle->prepare($query);
    }
}

/* ?> omitted intentionally */
