// Package db opens the application's SQLite database and applies the schema.
// SQLite keeps the prototype runnable with zero external services; swapping to
// Postgres later is a driver + DSN change since modules use database/sql.
package db

import (
	"database/sql"
	"fmt"

	_ "modernc.org/sqlite" // registers the pure-Go "sqlite" driver (no cgo)
)

// schema is applied on every startup. Statements are idempotent (IF NOT EXISTS)
// so this doubles as a lightweight migration runner for the prototype.
const schema = `
CREATE TABLE IF NOT EXISTS users (
	id         TEXT PRIMARY KEY,
	name       TEXT NOT NULL,
	phone      TEXT NOT NULL UNIQUE,
	role       TEXT NOT NULL,
	created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
	token      TEXT PRIMARY KEY,
	user_id    TEXT NOT NULL REFERENCES users(id),
	created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS trips (
	id         TEXT PRIMARY KEY,
	rider_id   TEXT NOT NULL,
	driver_id  TEXT,
	pickup_lat REAL NOT NULL,
	pickup_lng REAL NOT NULL,
	drop_lat   REAL NOT NULL,
	drop_lng   REAL NOT NULL,
	status     TEXT NOT NULL,
	created_at TEXT NOT NULL,
	updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_trips_rider ON trips(rider_id);
`

// Open connects to the SQLite database at path and applies the schema.
// Pass a file path (e.g. "ridenow.db") for persistence, or ":memory:" for tests.
func Open(path string) (*sql.DB, error) {
	// _busy_timeout avoids "database is locked" under concurrent writers;
	// foreign_keys=on enforces the session→user reference.
	dsn := fmt.Sprintf("file:%s?_pragma=busy_timeout(5000)&_pragma=foreign_keys(1)", path)
	conn, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, fmt.Errorf("open sqlite: %w", err)
	}
	if err := conn.Ping(); err != nil {
		return nil, fmt.Errorf("ping sqlite: %w", err)
	}
	if _, err := conn.Exec(schema); err != nil {
		return nil, fmt.Errorf("apply schema: %w", err)
	}
	return conn, nil
}
