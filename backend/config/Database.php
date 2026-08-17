<?php
/**
 * Surge Elite Basketball Platform - Database Connection Manager
 * PDO Singleton Database Wrapper
 */

class Database {
    private static ?PDO $instance = null;

    private static string $host = '127.0.0.1';
    private static string $dbName = 'surge_elite';
    private static string $username = 'root';
    private static string $password = '';
    private static string $charset = 'utf8mb4';
    private static string $port = '3306';

    /**
     * Get the singleton PDO instance
     */
    public static function getConnection(): PDO {
        if (self::$instance === null) {
            // Allow environment variable overrides if configured
            $host = getenv('DB_HOST') ?: self::$host;
            $dbName = getenv('DB_NAME') ?: self::$dbName;
            $username = getenv('DB_USER') ?: self::$username;
            $password = getenv('DB_PASS') !== false ? getenv('DB_PASS') : self::$password;
            $charset = getenv('DB_CHARSET') ?: self::$charset;
            $port = getenv('DB_PORT') ?: self::$port;

            $dsn = "mysql:host={$host};port={$port};dbname={$dbName};charset={$charset}";

            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];

            try {
                self::$instance = new PDO($dsn, $username, $password, $options);
            } catch (PDOException $e) {
                // If database doesn't exist, allow fallback or throw clean error
                throw new PDOException("Database connection error: " . $e->getMessage(), (int)$e->getCode());
            }
        }

        return self::$instance;
    }

    /**
     * Set explicit connection config
     */
    public static function configure(string $host, string $dbName, string $username, string $password, string $port = '3306'): void {
        self::$host = $host;
        self::$dbName = $dbName;
        self::$username = $username;
        self::$password = $password;
        self::$port = $port;
        self::$instance = null;
    }
}
