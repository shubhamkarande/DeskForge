import { IpcMain } from 'electron';
import {
    getStatus,
    getLog,
    getDiff,
    getBranches,
    isGitRepository
} from '../lib/git-utils';

interface GitPathPayload {
    path: string;
}

interface GitLogPayload {
    path: string;
    limit?: number;
}

interface GitDiffPayload {
    path: string;
    file?: string;
}

export function registerGitHandlers(ipcMain: IpcMain): void {
    // Get git status
    ipcMain.handle('git:status', async (_, payload: GitPathPayload) => {
        try {
            return await getStatus(payload.path);
        } catch (error) {
            throw new Error(`Git status failed: ${(error as Error).message}`);
        }
    });

    // Get git log
    ipcMain.handle('git:log', async (_, payload: GitLogPayload) => {
        try {
            return await getLog(payload.path, payload.limit || 50);
        } catch (error) {
            throw new Error(`Git log failed: ${(error as Error).message}`);
        }
    });

    // Get git diff
    ipcMain.handle('git:diff', async (_, payload: GitDiffPayload) => {
        try {
            return await getDiff(payload.path, payload.file);
        } catch (error) {
            throw new Error(`Git diff failed: ${(error as Error).message}`);
        }
    });

    // Get branches
    ipcMain.handle('git:branch', async (_, payload: GitPathPayload) => {
        try {
            return await getBranches(payload.path);
        } catch (error) {
            throw new Error(`Git branch failed: ${(error as Error).message}`);
        }
    });

    // Check if directory is a git repository
    ipcMain.handle('git:isRepo', async (_, payload: GitPathPayload) => {
        try {
            return await isGitRepository(payload.path);
        } catch {
            return false;
        }
    });
}
