import { IpcMain } from 'electron';
import { getDatabase } from '../lib/database';
import { v4 as uuidv4 } from 'uuid';

interface CreateNotePayload {
    workspaceId: string;
    title: string;
    content?: string;
}

interface UpdateNotePayload {
    id: string;
    title?: string;
    content?: string;
}

interface GetNotePayload {
    id: string;
}

interface ListNotesPayload {
    workspaceId: string;
}

export function registerNotesHandlers(ipcMain: IpcMain): void {
    // Create note
    ipcMain.handle('notes:create', async (_, payload: CreateNotePayload) => {
        const db = getDatabase();
        const id = uuidv4();
        const now = new Date().toISOString();

        db.prepare(`
      INSERT INTO notes (id, workspace_id, title, content, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, payload.workspaceId, payload.title, payload.content || '', now, now);

        return {
            id,
            workspaceId: payload.workspaceId,
            title: payload.title,
            content: payload.content || '',
            createdAt: now,
            updatedAt: now,
        };
    });

    // List notes
    ipcMain.handle('notes:list', async (_, payload: ListNotesPayload) => {
        const db = getDatabase();
        const rows = db.prepare(`
      SELECT id, workspace_id as workspaceId, title, content, created_at as createdAt, updated_at as updatedAt
      FROM notes
      WHERE workspace_id = ?
      ORDER BY updated_at DESC
    `).all(payload.workspaceId);

        return rows;
    });

    // Get single note
    ipcMain.handle('notes:get', async (_, payload: GetNotePayload) => {
        const db = getDatabase();
        const row = db.prepare(`
      SELECT id, workspace_id as workspaceId, title, content, created_at as createdAt, updated_at as updatedAt
      FROM notes
      WHERE id = ?
    `).get(payload.id);

        return row || null;
    });

    // Update note
    ipcMain.handle('notes:update', async (_, payload: UpdateNotePayload) => {
        const db = getDatabase();
        const now = new Date().toISOString();

        const updates: string[] = [];
        const values: unknown[] = [];

        if (payload.title !== undefined) {
            updates.push('title = ?');
            values.push(payload.title);
        }
        if (payload.content !== undefined) {
            updates.push('content = ?');
            values.push(payload.content);
        }

        updates.push('updated_at = ?');
        values.push(now);
        values.push(payload.id);

        db.prepare(`
      UPDATE notes
      SET ${updates.join(', ')}
      WHERE id = ?
    `).run(...values);

        return db.prepare(`
      SELECT id, workspace_id as workspaceId, title, content, created_at as createdAt, updated_at as updatedAt
      FROM notes
      WHERE id = ?
    `).get(payload.id);
    });

    // Delete note
    ipcMain.handle('notes:delete', async (_, payload: GetNotePayload) => {
        const db = getDatabase();
        db.prepare('DELETE FROM notes WHERE id = ?').run(payload.id);
    });
}
