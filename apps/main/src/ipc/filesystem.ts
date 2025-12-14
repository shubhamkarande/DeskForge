import { IpcMain, dialog } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';

interface ReadFilePayload {
    path: string;
}

interface WriteFilePayload {
    path: string;
    content: string;
}

interface ReadDirPayload {
    path: string;
}

interface ExistsPayload {
    path: string;
}

export function registerFilesystemHandlers(ipcMain: IpcMain): void {
    // Read file content
    ipcMain.handle('fs:readFile', async (_, payload: ReadFilePayload) => {
        try {
            const content = await fs.readFile(payload.path, 'utf-8');
            return content;
        } catch (error) {
            throw new Error(`Failed to read file: ${(error as Error).message}`);
        }
    });

    // Write file content
    ipcMain.handle('fs:writeFile', async (_, payload: WriteFilePayload) => {
        try {
            // Ensure directory exists
            const dir = path.dirname(payload.path);
            await fs.mkdir(dir, { recursive: true });
            await fs.writeFile(payload.path, payload.content, 'utf-8');
        } catch (error) {
            throw new Error(`Failed to write file: ${(error as Error).message}`);
        }
    });

    // Read directory contents
    ipcMain.handle('fs:readDir', async (_, payload: ReadDirPayload) => {
        try {
            const entries = await fs.readdir(payload.path, { withFileTypes: true });

            const results = await Promise.all(
                entries.map(async (entry) => {
                    const fullPath = path.join(payload.path, entry.name);
                    let size: number | undefined;

                    if (entry.isFile()) {
                        const stats = await fs.stat(fullPath);
                        size = stats.size;
                    }

                    return {
                        name: entry.name,
                        path: fullPath,
                        isDirectory: entry.isDirectory(),
                        size,
                    };
                })
            );

            return results;
        } catch (error) {
            throw new Error(`Failed to read directory: ${(error as Error).message}`);
        }
    });

    // Select folder dialog
    ipcMain.handle('fs:selectFolder', async () => {
        const result = await dialog.showOpenDialog({
            properties: ['openDirectory'],
            title: 'Select Folder',
        });

        if (result.canceled || result.filePaths.length === 0) {
            return null;
        }

        return result.filePaths[0];
    });

    // Check if path exists
    ipcMain.handle('fs:exists', async (_, payload: ExistsPayload) => {
        try {
            await fs.access(payload.path);
            return true;
        } catch {
            return false;
        }
    });

    // Select file dialog
    ipcMain.handle('fs:selectFile', async (_, options?: { filters?: { name: string; extensions: string[] }[] }) => {
        const result = await dialog.showOpenDialog({
            properties: ['openFile'],
            title: 'Select File',
            filters: options?.filters,
        });

        if (result.canceled || result.filePaths.length === 0) {
            return null;
        }

        return result.filePaths[0];
    });

    // Save file dialog
    ipcMain.handle('fs:saveFile', async (_, options?: { defaultPath?: string; filters?: { name: string; extensions: string[] }[] }) => {
        const result = await dialog.showSaveDialog({
            title: 'Save File',
            defaultPath: options?.defaultPath,
            filters: options?.filters,
        });

        if (result.canceled || !result.filePath) {
            return null;
        }

        return result.filePath;
    });
}
