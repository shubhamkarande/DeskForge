"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Database = void 0;
exports.initDatabase = initDatabase;
exports.getDatabase = getDatabase;
exports.closeDatabase = closeDatabase;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
exports.Database = better_sqlite3_1.default;
let db = null;
/**
 * Initialize the SQLite database
 */
function initDatabase(dbPath) {
    db = new better_sqlite3_1.default(dbPath);
    // Enable WAL mode for better performance
    db.pragma('journal_mode = WAL');
    // Create tables
    createTables(db);
    return db;
}
/**
 * Get the database instance
 */
function getDatabase() {
    if (!db) {
        throw new Error('Database not initialized. Call initDatabase first.');
    }
    return db;
}
/**
 * Close the database connection
 */
function closeDatabase() {
    if (db) {
        db.close();
        db = null;
    }
}
/**
 * Create all required tables
 */
function createTables(database) {
    // Workspaces table
    database.exec(`
    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      path TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
    // Notes table
    database.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
    )
  `);
    // Create index for faster lookups
    database.exec(`
    CREATE INDEX IF NOT EXISTS idx_notes_workspace ON notes(workspace_id)
  `);
    // Snippets table
    database.exec(`
    CREATE TABLE IF NOT EXISTS snippets (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      language TEXT NOT NULL,
      code TEXT NOT NULL,
      description TEXT DEFAULT '',
      tags TEXT DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
    // Create index for language filtering
    database.exec(`
    CREATE INDEX IF NOT EXISTS idx_snippets_language ON snippets(language)
  `);
    // API Requests table
    database.exec(`
    CREATE TABLE IF NOT EXISTS api_requests (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      name TEXT NOT NULL,
      method TEXT NOT NULL,
      url TEXT NOT NULL,
      headers TEXT DEFAULT '{}',
      body TEXT DEFAULT '',
      type TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
    )
  `);
    // Create index for workspace filtering
    database.exec(`
    CREATE INDEX IF NOT EXISTS idx_api_requests_workspace ON api_requests(workspace_id)
  `);
    // Environment Variables table
    database.exec(`
    CREATE TABLE IF NOT EXISTS env_variables (
      workspace_id TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      is_secret INTEGER DEFAULT 0,
      PRIMARY KEY (workspace_id, key),
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
    )
  `);
}
//# sourceMappingURL=index.js.map