import Database from 'better-sqlite3';
/**
 * Initialize the SQLite database
 */
export declare function initDatabase(dbPath: string): Database.Database;
/**
 * Get the database instance
 */
export declare function getDatabase(): Database.Database;
/**
 * Close the database connection
 */
export declare function closeDatabase(): void;
export { Database };
//# sourceMappingURL=index.d.ts.map