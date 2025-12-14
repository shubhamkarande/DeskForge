// Type declarations for DeskForge API exposed by preload script

declare global {
    interface Window {
        deskforge: DeskForgeAPI;
    }
}

interface DeskForgeAPI {
    workspace: {
        create: (name: string, path: string) => Promise<Workspace>;
        list: () => Promise<Workspace[]>;
        get: (id: string) => Promise<Workspace | null>;
        update: (id: string, data: Partial<Workspace>) => Promise<Workspace>;
        delete: (id: string) => Promise<void>;
    };

    fs: {
        readFile: (filePath: string) => Promise<string>;
        writeFile: (filePath: string, content: string) => Promise<void>;
        readDir: (dirPath: string) => Promise<FileEntry[]>;
        selectFolder: () => Promise<string | null>;
        exists: (path: string) => Promise<boolean>;
    };

    env: {
        list: (workspaceId: string) => Promise<EnvVariable[]>;
        set: (workspaceId: string, key: string, value: string, isSecret: boolean) => Promise<void>;
        get: (workspaceId: string, key: string) => Promise<string | null>;
        delete: (workspaceId: string, key: string) => Promise<void>;
        importFromFile: (workspaceId: string, filePath: string) => Promise<void>;
        exportToFile: (workspaceId: string, filePath: string) => Promise<void>;
    };

    git: {
        status: (repoPath: string) => Promise<GitStatus>;
        log: (repoPath: string, limit?: number) => Promise<GitCommit[]>;
        diff: (repoPath: string, file?: string) => Promise<string>;
        branch: (repoPath: string) => Promise<GitBranch>;
        isRepo: (path: string) => Promise<boolean>;
    };

    api: {
        sendRequest: (request: ApiRequest) => Promise<ApiResponse>;
        saveRequest: (workspaceId: string, request: ApiRequest & { name: string }) => Promise<SavedApiRequest>;
        listRequests: (workspaceId: string) => Promise<SavedApiRequest[]>;
        deleteRequest: (id: string) => Promise<void>;
    };

    notes: {
        list: (workspaceId: string) => Promise<Note[]>;
        get: (id: string) => Promise<Note | null>;
        create: (workspaceId: string, title: string, content?: string) => Promise<Note>;
        update: (id: string, data: Partial<Note>) => Promise<Note>;
        delete: (id: string) => Promise<void>;
    };

    snippets: {
        list: (language?: string) => Promise<Snippet[]>;
        get: (id: string) => Promise<Snippet | null>;
        create: (data: CreateSnippetData) => Promise<Snippet>;
        update: (id: string, data: Partial<Snippet>) => Promise<Snippet>;
        delete: (id: string) => Promise<void>;
        search: (query: string) => Promise<Snippet[]>;
    };
}

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
    description: string;
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

export { };
