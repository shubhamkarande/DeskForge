import { IpcMain } from 'electron';
import { getDatabase } from '../lib/database';
import { v4 as uuidv4 } from 'uuid';

interface CreateSnippetPayload {
    title: string;
    language: string;
    code: string;
    description?: string;
    tags?: string[];
}

interface UpdateSnippetPayload {
    id: string;
    title?: string;
    language?: string;
    code?: string;
    description?: string;
    tags?: string[];
}

interface GetSnippetPayload {
    id: string;
}

interface ListSnippetsPayload {
    language?: string;
}

interface SearchSnippetsPayload {
    query: string;
}

export function registerSnippetHandlers(ipcMain: IpcMain): void {
    // Create snippet
    ipcMain.handle('snippets:create', async (_, payload: CreateSnippetPayload) => {
        const db = getDatabase();
        const id = uuidv4();
        const now = new Date().toISOString();

        db.prepare(`
      INSERT INTO snippets (id, title, language, code, description, tags, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
            id,
            payload.title,
            payload.language,
            payload.code,
            payload.description || '',
            JSON.stringify(payload.tags || []),
            now,
            now
        );

        return {
            id,
            title: payload.title,
            language: payload.language,
            code: payload.code,
            description: payload.description || '',
            tags: payload.tags || [],
            createdAt: now,
            updatedAt: now,
        };
    });

    // List snippets
    ipcMain.handle('snippets:list', async (_, payload: ListSnippetsPayload) => {
        const db = getDatabase();
        let query = `
      SELECT id, title, language, code, description, tags, created_at as createdAt, updated_at as updatedAt
      FROM snippets
    `;
        const params: string[] = [];

        if (payload.language) {
            query += ' WHERE language = ?';
            params.push(payload.language);
        }

        query += ' ORDER BY updated_at DESC';

        const rows = db.prepare(query).all(...params) as Array<{
            id: string;
            title: string;
            language: string;
            code: string;
            description: string;
            tags: string;
            createdAt: string;
            updatedAt: string;
        }>;

        return rows.map((row) => ({
            ...row,
            tags: JSON.parse(row.tags),
        }));
    });

    // Get single snippet
    ipcMain.handle('snippets:get', async (_, payload: GetSnippetPayload) => {
        const db = getDatabase();
        const row = db.prepare(`
      SELECT id, title, language, code, description, tags, created_at as createdAt, updated_at as updatedAt
      FROM snippets
      WHERE id = ?
    `).get(payload.id) as {
            id: string;
            title: string;
            language: string;
            code: string;
            description: string;
            tags: string;
            createdAt: string;
            updatedAt: string;
        } | undefined;

        if (!row) return null;

        return {
            ...row,
            tags: JSON.parse(row.tags),
        };
    });

    // Update snippet
    ipcMain.handle('snippets:update', async (_, payload: UpdateSnippetPayload) => {
        const db = getDatabase();
        const now = new Date().toISOString();

        const updates: string[] = [];
        const values: unknown[] = [];

        if (payload.title !== undefined) {
            updates.push('title = ?');
            values.push(payload.title);
        }
        if (payload.language !== undefined) {
            updates.push('language = ?');
            values.push(payload.language);
        }
        if (payload.code !== undefined) {
            updates.push('code = ?');
            values.push(payload.code);
        }
        if (payload.description !== undefined) {
            updates.push('description = ?');
            values.push(payload.description);
        }
        if (payload.tags !== undefined) {
            updates.push('tags = ?');
            values.push(JSON.stringify(payload.tags));
        }

        updates.push('updated_at = ?');
        values.push(now);
        values.push(payload.id);

        db.prepare(`
      UPDATE snippets
      SET ${updates.join(', ')}
      WHERE id = ?
    `).run(...values);

        return db.prepare(`
      SELECT id, title, language, code, description, tags, created_at as createdAt, updated_at as updatedAt
      FROM snippets
      WHERE id = ?
    `).get(payload.id);
    });

    // Delete snippet
    ipcMain.handle('snippets:delete', async (_, payload: GetSnippetPayload) => {
        const db = getDatabase();
        db.prepare('DELETE FROM snippets WHERE id = ?').run(payload.id);
    });

    // Search snippets
    ipcMain.handle('snippets:search', async (_, payload: SearchSnippetsPayload) => {
        const db = getDatabase();
        const searchTerm = `%${payload.query}%`;

        const rows = db.prepare(`
      SELECT id, title, language, code, description, tags, created_at as createdAt, updated_at as updatedAt
      FROM snippets
      WHERE title LIKE ? OR description LIKE ? OR code LIKE ? OR tags LIKE ?
      ORDER BY updated_at DESC
    `).all(searchTerm, searchTerm, searchTerm, searchTerm) as Array<{
            id: string;
            title: string;
            language: string;
            code: string;
            description: string;
            tags: string;
            createdAt: string;
            updatedAt: string;
        }>;

        return rows.map((row) => ({
            ...row,
            tags: JSON.parse(row.tags),
        }));
    });
}
