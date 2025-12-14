import { IpcMain, dialog } from 'electron';
import { getDatabase } from '../lib/database';
import { v4 as uuidv4 } from 'uuid';

interface CreateWorkspacePayload {
    name: string;
    path: string;
}

interface WorkspaceIdPayload {
    id: string;
}

interface UpdateWorkspacePayload extends WorkspaceIdPayload {
    name?: string;
    path?: string;
}

export function registerWorkspaceHandlers(ipcMain: IpcMain): void {
    // Create workspace
    ipcMain.handle('workspace:create', async (_, payload: CreateWorkspacePayload) => {
        const db = getDatabase();
        const id = uuidv4();
        const now = new Date().toISOString();

        db.prepare(`
      INSERT INTO workspaces (id, name, path, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, payload.name, payload.path, now, now);

        return {
            id,
            name: payload.name,
            path: payload.path,
            createdAt: now,
            updatedAt: now,
        };
    });

    // List all workspaces
    ipcMain.handle('workspace:list', async () => {
        const db = getDatabase();
        const rows = db.prepare(`
      SELECT id, name, path, created_at as createdAt, updated_at as updatedAt
      FROM workspaces
      ORDER BY updated_at DESC
    `).all();

        return rows;
    });

    // Get single workspace
    ipcMain.handle('workspace:get', async (_, payload: WorkspaceIdPayload) => {
        const db = getDatabase();
        const row = db.prepare(`
      SELECT id, name, path, created_at as createdAt, updated_at as updatedAt
      FROM workspaces
      WHERE id = ?
    `).get(payload.id);

        return row || null;
    });

    // Update workspace
    ipcMain.handle('workspace:update', async (_, payload: UpdateWorkspacePayload) => {
        const db = getDatabase();
        const now = new Date().toISOString();

        const updates: string[] = [];
        const values: unknown[] = [];

        if (payload.name !== undefined) {
            updates.push('name = ?');
            values.push(payload.name);
        }
        if (payload.path !== undefined) {
            updates.push('path = ?');
            values.push(payload.path);
        }

        updates.push('updated_at = ?');
        values.push(now);
        values.push(payload.id);

        db.prepare(`
      UPDATE workspaces
      SET ${updates.join(', ')}
      WHERE id = ?
    `).run(...values);

        return db.prepare(`
      SELECT id, name, path, created_at as createdAt, updated_at as updatedAt
      FROM workspaces
      WHERE id = ?
    `).get(payload.id);
    });

    // Delete workspace
    ipcMain.handle('workspace:delete', async (_, payload: WorkspaceIdPayload) => {
        const db = getDatabase();

        // Delete related data
        db.prepare('DELETE FROM notes WHERE workspace_id = ?').run(payload.id);
        db.prepare('DELETE FROM api_requests WHERE workspace_id = ?').run(payload.id);
        db.prepare('DELETE FROM env_variables WHERE workspace_id = ?').run(payload.id);
        db.prepare('DELETE FROM workspaces WHERE id = ?').run(payload.id);
    });

    // Select folder dialog
    ipcMain.handle('workspace:selectFolder', async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openDirectory'],
            title: 'Select Project Folder',
        });

        if (result.canceled || result.filePaths.length === 0) {
            return null;
        }

        return result.filePaths[0];
    });
}
