import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Import IPC handlers
import { registerWorkspaceHandlers } from './ipc/workspace';
import { registerFilesystemHandlers } from './ipc/filesystem';
import { registerEnvHandlers } from './ipc/env';
import { registerGitHandlers } from './ipc/git';
import { registerApiHandlers } from './ipc/api';
import { registerSnippetHandlers } from './ipc/snippets';
import { registerNotesHandlers } from './ipc/notes';
import { initDatabase } from './lib/database';

// Load environment variables
dotenv.config();

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.APP_ENV === 'development' || !app.isPackaged;

function createWindow(): void {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1000,
        minHeight: 700,
        title: 'DeskForge',
        backgroundColor: '#0f0f23',
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false,
        },
    });

    // Show window when ready to prevent white flash
    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
    });

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

async function initialize(): Promise<void> {
    try {
        // Initialize database
        const userDataPath = app.getPath('userData');
        const dbPath = path.join(userDataPath, 'deskforge.db');
        console.log('Initializing database at:', dbPath);
        initDatabase(dbPath);
        console.log('Database initialized successfully');

        // Register all IPC handlers
        registerWorkspaceHandlers(ipcMain);
        registerFilesystemHandlers(ipcMain);
        registerEnvHandlers(ipcMain);
        registerGitHandlers(ipcMain);
        registerApiHandlers(ipcMain);
        registerSnippetHandlers(ipcMain);
        registerNotesHandlers(ipcMain);
        console.log('IPC handlers registered');
    } catch (error) {
        console.error('Failed to initialize:', error);
        throw error;
    }
}

app.whenReady().then(async () => {
    try {
        await initialize();
        createWindow();

        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                createWindow();
            }
        });
    } catch (error) {
        console.error('Failed to start app:', error);
    }
}).catch((error) => {
    console.error('App failed to be ready:', error);
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Security: Prevent new windows
app.on('web-contents-created', (_, contents) => {
    contents.setWindowOpenHandler(() => {
        return { action: 'deny' };
    });
});

// Global error handlers
process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection:', reason);
});
