import { IpcMain } from 'electron';
import { getDatabase } from '../lib/database';
import { v4 as uuidv4 } from 'uuid';

interface ApiRequest {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    url: string;
    headers?: Record<string, string>;
    body?: string;
    type: 'REST' | 'GraphQL';
}

interface SaveApiPayload extends ApiRequest {
    workspaceId: string;
    name: string;
}

interface ListApiPayload {
    workspaceId: string;
}

interface DeleteApiPayload {
    id: string;
}

export function registerApiHandlers(ipcMain: IpcMain): void {
    // Send API request
    ipcMain.handle('api:send', async (_, request: ApiRequest) => {
        const startTime = Date.now();

        try {
            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                ...request.headers,
            };

            const fetchOptions: RequestInit = {
                method: request.method,
                headers,
            };

            // Add body for non-GET requests
            if (request.method !== 'GET' && request.body) {
                fetchOptions.body = request.body;
            }

            const response = await fetch(request.url, fetchOptions);
            const responseBody = await response.text();
            const endTime = Date.now();

            // Convert headers to object
            const responseHeaders: Record<string, string> = {};
            response.headers.forEach((value, key) => {
                responseHeaders[key] = value;
            });

            return {
                status: response.status,
                statusText: response.statusText,
                headers: responseHeaders,
                body: responseBody,
                time: endTime - startTime,
            };
        } catch (error) {
            const endTime = Date.now();
            return {
                status: 0,
                statusText: 'Network Error',
                headers: {},
                body: (error as Error).message,
                time: endTime - startTime,
            };
        }
    });

    // Save API request
    ipcMain.handle('api:save', async (_, payload: SaveApiPayload) => {
        const db = getDatabase();
        const id = uuidv4();
        const now = new Date().toISOString();

        db.prepare(`
      INSERT INTO api_requests (id, workspace_id, name, method, url, headers, body, type, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
            id,
            payload.workspaceId,
            payload.name,
            payload.method,
            payload.url,
            JSON.stringify(payload.headers || {}),
            payload.body || '',
            payload.type,
            now
        );

        return {
            id,
            name: payload.name,
            workspaceId: payload.workspaceId,
            method: payload.method,
            url: payload.url,
            headers: payload.headers,
            body: payload.body,
            type: payload.type,
            createdAt: now,
        };
    });

    // List saved API requests
    ipcMain.handle('api:list', async (_, payload: ListApiPayload) => {
        const db = getDatabase();
        const rows = db.prepare(`
      SELECT id, workspace_id as workspaceId, name, method, url, headers, body, type, created_at as createdAt
      FROM api_requests
      WHERE workspace_id = ?
      ORDER BY created_at DESC
    `).all(payload.workspaceId) as Array<{
            id: string;
            workspaceId: string;
            name: string;
            method: string;
            url: string;
            headers: string;
            body: string;
            type: string;
            createdAt: string;
        }>;

        return rows.map((row) => ({
            ...row,
            headers: JSON.parse(row.headers),
        }));
    });

    // Delete API request
    ipcMain.handle('api:delete', async (_, payload: DeleteApiPayload) => {
        const db = getDatabase();
        db.prepare('DELETE FROM api_requests WHERE id = ?').run(payload.id);
    });
}
