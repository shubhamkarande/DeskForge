import { IpcMain } from 'electron';
import * as fs from 'fs/promises';
import { getDatabase } from '../lib/database';
import { encrypt, decrypt } from '../lib/encryption';

interface ListEnvPayload {
    workspaceId: string;
}

interface SetEnvPayload {
    workspaceId: string;
    key: string;
    value: string;
    isSecret: boolean;
}

interface GetEnvPayload {
    workspaceId: string;
    key: string;
}

interface DeleteEnvPayload {
    workspaceId: string;
    key: string;
}

interface ImportEnvPayload {
    workspaceId: string;
    path: string;
}

interface ExportEnvPayload {
    workspaceId: string;
    path: string;
}

export function registerEnvHandlers(ipcMain: IpcMain): void {
    // List environment variables
    ipcMain.handle('env:list', async (_, payload: ListEnvPayload) => {
        const db = getDatabase();
        const rows = db.prepare(`
      SELECT key, value, is_secret as isSecret
      FROM env_variables
      WHERE workspace_id = ?
      ORDER BY key ASC
    `).all(payload.workspaceId) as Array<{ key: string; value: string; isSecret: number }>;

        return rows.map((row) => ({
            key: row.key,
            value: row.isSecret ? '••••••••' : row.value,
            isSecret: Boolean(row.isSecret),
        }));
    });

    // Set environment variable
    ipcMain.handle('env:set', async (_, payload: SetEnvPayload) => {
        const db = getDatabase();
        const valueToStore = payload.isSecret ? encrypt(payload.value) : payload.value;

        db.prepare(`
      INSERT OR REPLACE INTO env_variables (workspace_id, key, value, is_secret)
      VALUES (?, ?, ?, ?)
    `).run(payload.workspaceId, payload.key, valueToStore, payload.isSecret ? 1 : 0);
    });

    // Get environment variable value
    ipcMain.handle('env:get', async (_, payload: GetEnvPayload) => {
        const db = getDatabase();
        const row = db.prepare(`
      SELECT value, is_secret as isSecret
      FROM env_variables
      WHERE workspace_id = ? AND key = ?
    `).get(payload.workspaceId, payload.key) as { value: string; isSecret: number } | undefined;

        if (!row) return null;

        return row.isSecret ? decrypt(row.value) : row.value;
    });

    // Delete environment variable
    ipcMain.handle('env:delete', async (_, payload: DeleteEnvPayload) => {
        const db = getDatabase();
        db.prepare(`
      DELETE FROM env_variables
      WHERE workspace_id = ? AND key = ?
    `).run(payload.workspaceId, payload.key);
    });

    // Import from .env file
    ipcMain.handle('env:import', async (_, payload: ImportEnvPayload) => {
        const content = await fs.readFile(payload.path, 'utf-8');
        const lines = content.split('\n');
        const db = getDatabase();

        for (const line of lines) {
            const trimmed = line.trim();

            // Skip empty lines and comments
            if (!trimmed || trimmed.startsWith('#')) continue;

            const equalIndex = trimmed.indexOf('=');
            if (equalIndex === -1) continue;

            const key = trimmed.substring(0, equalIndex).trim();
            let value = trimmed.substring(equalIndex + 1).trim();

            // Remove quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }

            // Detect if it's likely a secret (contains common secret patterns)
            const isSecret = /secret|password|key|token|api_key/i.test(key);
            const valueToStore = isSecret ? encrypt(value) : value;

            db.prepare(`
        INSERT OR REPLACE INTO env_variables (workspace_id, key, value, is_secret)
        VALUES (?, ?, ?, ?)
      `).run(payload.workspaceId, key, valueToStore, isSecret ? 1 : 0);
        }
    });

    // Export to .env file
    ipcMain.handle('env:export', async (_, payload: ExportEnvPayload) => {
        const db = getDatabase();
        const rows = db.prepare(`
      SELECT key, value, is_secret as isSecret
      FROM env_variables
      WHERE workspace_id = ?
      ORDER BY key ASC
    `).all(payload.workspaceId) as Array<{ key: string; value: string; isSecret: number }>;

        const lines = rows.map((row) => {
            const value = row.isSecret ? decrypt(row.value) : row.value;
            // Quote values that contain spaces or special characters
            const needsQuotes = /[\s#=]/.test(value);
            return `${row.key}=${needsQuotes ? `"${value}"` : value}`;
        });

        await fs.writeFile(payload.path, lines.join('\n'), 'utf-8');
    });
}
