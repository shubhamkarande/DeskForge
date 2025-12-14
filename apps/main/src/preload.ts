import { contextBridge, ipcRenderer } from 'electron';

// Type definitions for exposed API
export interface DeskForgeAPI {
    // Workspace operations
    workspace: {
        create: (name: string, path: string) => Promise<Workspace>;
        list: () => Promise<Workspace[]>;
        get: (id: string) => Promise<Workspace | null>;
        update: (id: string, data: Partial<Workspace>) => Promise<Workspace>;
        delete: (id: string) => Promise<void>;
    };

    // Filesystem operations
    fs: {
        readFile: (filePath: string) => Promise<string>;
        writeFile: (filePath: string, content: string) => Promise<void>;
        readDir: (dirPath: string) => Promise<FileEntry[]>;
        selectFolder: () => Promise<string | null>;
        exists: (path: string) => Promise<boolean>;
    };

    // Environment variables
    env: {
        list: (workspaceId: string) => Promise<EnvVariable[]>;
        set: (workspaceId: string, key: string, value: string, isSecret: boolean) => Promise<void>;
        get: (workspaceId: string, key: string) => Promise<string | null>;
        delete: (workspaceId: string, key: string) => Promise<void>;
        importFromFile: (workspaceId: string, filePath: string) => Promise<void>;
        exportToFile: (workspaceId: string, filePath: string) => Promise<void>;
    };

    // Git operations
    git: {
        status: (repoPath: string) => Promise<GitStatus>;
        log: (repoPath: string, limit?: number) => Promise<GitCommit[]>;
        diff: (repoPath: string, file?: string) => Promise<string>;
        branch: (repoPath: string) => Promise<GitBranch>;
        isRepo: (path: string) => Promise<boolean>;
    };

    // API testing
    api: {
        sendRequest: (request: ApiRequest) => Promise<ApiResponse>;
        saveRequest: (workspaceId: string, request: ApiRequest) => Promise<SavedApiRequest>;
        listRequests: (workspaceId: string) => Promise<SavedApiRequest[]>;
        deleteRequest: (id: string) => Promise<void>;
    };

    // Notes
    notes: {
        list: (workspaceId: string) => Promise<Note[]>;
        get: (id: string) => Promise<Note | null>;
        create: (workspaceId: string, title: string, content?: string) => Promise<Note>;
        update: (id: string, data: Partial<Note>) => Promise<Note>;
        delete: (id: string) => Promise<void>;
    };

    // Snippets
    snippets: {
        list: (language?: string) => Promise<Snippet[]>;
        get: (id: string) => Promise<Snippet | null>;
        create: (data: CreateSnippetData) => Promise<Snippet>;
        update: (id: string, data: Partial<Snippet>) => Promise<Snippet>;
        delete: (id: string) => Promise<void>;
        search: (query: string) => Promise<Snippet[]>;
    };
}

// Type definitions
interface Workspace {
    id: string;
    name: string;
    path: string;
    createdAt: string;
    updatedAt: string;
}

interface FileEntry {
    name: string;
    path: string;
    isDirectory: boolean;
    size?: number;
}

interface EnvVariable {
    key: string;
    value: string;
    isSecret: boolean;
}

interface GitStatus {
    branch: string;
    ahead: number;
    behind: number;
    staged: string[];
    modified: string[];
    untracked: string[];
}

interface GitCommit {
    hash: string;
    shortHash: string;
    message: string;
    author: string;
    date: string;
}

interface GitBranch {
    current: string;
    local: string[];
    remote: string[];
}

interface ApiRequest {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    url: string;
    headers?: Record<string, string>;
    body?: string;
    type: 'REST' | 'GraphQL';
}

interface ApiResponse {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: string;
    time: number;
}

interface SavedApiRequest extends ApiRequest {
    id: string;
    name: string;
    workspaceId: string;
    createdAt: string;
}

interface Note {
    id: string;
    workspaceId: string;
    title: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}

interface Snippet {
    id: string;
    title: string;
    language: string;
    code: string;
    description?: string;
    tags: string[];
    createdAt: string;
    updatedAt: string;
}

interface CreateSnippetData {
    title: string;
    language: string;
    code: string;
    description?: string;
    tags?: string[];
}

// Expose the API to the renderer process
const api: DeskForgeAPI = {
    workspace: {
        create: (name, path) => ipcRenderer.invoke('workspace:create', { name, path }),
        list: () => ipcRenderer.invoke('workspace:list'),
        get: (id) => ipcRenderer.invoke('workspace:get', { id }),
        update: (id, data) => ipcRenderer.invoke('workspace:update', { id, ...data }),
        delete: (id) => ipcRenderer.invoke('workspace:delete', { id }),
    },

    fs: {
        readFile: (filePath) => ipcRenderer.invoke('fs:readFile', { path: filePath }),
        writeFile: (filePath, content) => ipcRenderer.invoke('fs:writeFile', { path: filePath, content }),
        readDir: (dirPath) => ipcRenderer.invoke('fs:readDir', { path: dirPath }),
        selectFolder: () => ipcRenderer.invoke('fs:selectFolder'),
        exists: (path) => ipcRenderer.invoke('fs:exists', { path }),
    },

    env: {
        list: (workspaceId) => ipcRenderer.invoke('env:list', { workspaceId }),
        set: (workspaceId, key, value, isSecret) => ipcRenderer.invoke('env:set', { workspaceId, key, value, isSecret }),
        get: (workspaceId, key) => ipcRenderer.invoke('env:get', { workspaceId, key }),
        delete: (workspaceId, key) => ipcRenderer.invoke('env:delete', { workspaceId, key }),
        importFromFile: (workspaceId, filePath) => ipcRenderer.invoke('env:import', { workspaceId, path: filePath }),
        exportToFile: (workspaceId, filePath) => ipcRenderer.invoke('env:export', { workspaceId, path: filePath }),
    },

    git: {
        status: (repoPath) => ipcRenderer.invoke('git:status', { path: repoPath }),
        log: (repoPath, limit = 50) => ipcRenderer.invoke('git:log', { path: repoPath, limit }),
        diff: (repoPath, file) => ipcRenderer.invoke('git:diff', { path: repoPath, file }),
        branch: (repoPath) => ipcRenderer.invoke('git:branch', { path: repoPath }),
        isRepo: (path) => ipcRenderer.invoke('git:isRepo', { path }),
    },

    api: {
        sendRequest: (request) => ipcRenderer.invoke('api:send', request),
        saveRequest: (workspaceId, request) => ipcRenderer.invoke('api:save', { workspaceId, ...request }),
        listRequests: (workspaceId) => ipcRenderer.invoke('api:list', { workspaceId }),
        deleteRequest: (id) => ipcRenderer.invoke('api:delete', { id }),
    },

    notes: {
        list: (workspaceId) => ipcRenderer.invoke('notes:list', { workspaceId }),
        get: (id) => ipcRenderer.invoke('notes:get', { id }),
        create: (workspaceId, title, content) => ipcRenderer.invoke('notes:create', { workspaceId, title, content }),
        update: (id, data) => ipcRenderer.invoke('notes:update', { id, ...data }),
        delete: (id) => ipcRenderer.invoke('notes:delete', { id }),
    },

    snippets: {
        list: (language) => ipcRenderer.invoke('snippets:list', { language }),
        get: (id) => ipcRenderer.invoke('snippets:get', { id }),
        create: (data) => ipcRenderer.invoke('snippets:create', data),
        update: (id, data) => ipcRenderer.invoke('snippets:update', { id, ...data }),
        delete: (id) => ipcRenderer.invoke('snippets:delete', { id }),
        search: (query) => ipcRenderer.invoke('snippets:search', { query }),
    },
};

contextBridge.exposeInMainWorld('deskforge', api);
