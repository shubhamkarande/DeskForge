import { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import {
    GitBranch,
    GitCommit as GitCommitIcon,
    RefreshCw,
    FileText,
    Plus,
    Minus,
    AlertCircle,
    Clock
} from 'lucide-react';
import { useWorkspaceStore } from '../../stores';

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

interface GitBranches {
    current: string;
    local: string[];
    remote: string[];
}

export default function GitViewer() {
    const { currentWorkspace } = useWorkspaceStore();
    const [isGitRepo, setIsGitRepo] = useState<boolean | null>(null);
    const [status, setStatus] = useState<GitStatus | null>(null);
    const [commits, setCommits] = useState<GitCommit[]>([]);
    const [branches, setBranches] = useState<GitBranches | null>(null);
    const [diff, setDiff] = useState<string>('');
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'changes' | 'history'>('changes');

    useEffect(() => {
        if (currentWorkspace) {
            checkRepo();
        }
    }, [currentWorkspace]);

    const checkRepo = async () => {
        if (!currentWorkspace) return;
        setIsLoading(true);
        setError(null);

        try {
            const isRepo = await window.deskforge.git.isRepo(currentWorkspace.path);
            setIsGitRepo(isRepo);

            if (isRepo) {
                await loadGitData();
            }
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    const loadGitData = async () => {
        if (!currentWorkspace) return;

        try {
            const [statusData, commitsData, branchesData] = await Promise.all([
                window.deskforge.git.status(currentWorkspace.path),
                window.deskforge.git.log(currentWorkspace.path, 50),
                window.deskforge.git.branch(currentWorkspace.path),
            ]);

            setStatus(statusData);
            setCommits(commitsData);
            setBranches(branchesData);
        } catch (err) {
            setError((err as Error).message);
        }
    };

    const loadDiff = async (file?: string) => {
        if (!currentWorkspace) return;

        try {
            const diffContent = await window.deskforge.git.diff(currentWorkspace.path, file);
            setDiff(diffContent);
            setSelectedFile(file || null);
        } catch (err) {
            setError((err as Error).message);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    };

    if (isLoading && isGitRepo === null) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin text-df-accent-primary" />
                    <p className="text-df-text-muted">Checking repository...</p>
                </div>
            </div>
        );
    }

    if (isGitRepo === false) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <GitBranch className="w-16 h-16 mx-auto mb-4 text-df-text-muted opacity-30" />
                    <h2 className="text-xl font-semibold mb-2">Not a Git Repository</h2>
                    <p className="text-df-text-muted max-w-md">
                        This workspace folder is not initialized as a Git repository.
                        Initialize it with <code className="px-1 py-0.5 bg-df-bg-tertiary rounded">git init</code>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full">
            {/* Left Panel - Status/History */}
            <div className="w-80 border-r border-df-border-primary bg-df-bg-secondary flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-df-border-primary">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-semibold">Git</h2>
                        <button
                            onClick={loadGitData}
                            disabled={isLoading}
                            className="p-1.5 rounded-lg hover:bg-df-bg-hover transition-colors"
                        >
                            <RefreshCw className={clsx("w-4 h-4", isLoading && "animate-spin")} />
                        </button>
                    </div>

                    {/* Branch Info */}
                    {status && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-df-bg-tertiary rounded-lg">
                            <GitBranch className="w-4 h-4 text-df-accent-primary" />
                            <span className="font-mono text-sm">{status.branch}</span>
                            {(status.ahead > 0 || status.behind > 0) && (
                                <div className="flex items-center gap-1 text-xs text-df-text-muted ml-auto">
                                    {status.ahead > 0 && <span>↑{status.ahead}</span>}
                                    {status.behind > 0 && <span>↓{status.behind}</span>}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex border-b border-df-border-primary">
                    <button
                        onClick={() => setActiveTab('changes')}
                        className={clsx(
                            "flex-1 px-4 py-2 text-sm font-medium transition-colors",
                            activeTab === 'changes'
                                ? "text-df-accent-primary border-b-2 border-df-accent-primary"
                                : "text-df-text-muted hover:text-df-text-primary"
                        )}
                    >
                        Changes
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={clsx(
                            "flex-1 px-4 py-2 text-sm font-medium transition-colors",
                            activeTab === 'history'
                                ? "text-df-accent-primary border-b-2 border-df-accent-primary"
                                : "text-df-text-muted hover:text-df-text-primary"
                        )}
                    >
                        History
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {activeTab === 'changes' && status && (
                        <div className="p-2 space-y-4">
                            {/* Staged */}
                            {status.staged.length > 0 && (
                                <div>
                                    <h3 className="px-2 py-1 text-xs font-medium text-df-text-muted uppercase">
                                        Staged ({status.staged.length})
                                    </h3>
                                    {status.staged.map((file) => (
                                        <button
                                            key={file}
                                            onClick={() => loadDiff(file)}
                                            className={clsx(
                                                "w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-df-bg-hover transition-colors text-left",
                                                selectedFile === file && "bg-df-bg-hover"
                                            )}
                                        >
                                            <Plus className="w-3 h-3 text-green-400" />
                                            <span className="truncate font-mono text-xs">{file}</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Modified */}
                            {status.modified.length > 0 && (
                                <div>
                                    <h3 className="px-2 py-1 text-xs font-medium text-df-text-muted uppercase">
                                        Modified ({status.modified.length})
                                    </h3>
                                    {status.modified.map((file) => (
                                        <button
                                            key={file}
                                            onClick={() => loadDiff(file)}
                                            className={clsx(
                                                "w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-df-bg-hover transition-colors text-left",
                                                selectedFile === file && "bg-df-bg-hover"
                                            )}
                                        >
                                            <FileText className="w-3 h-3 text-yellow-400" />
                                            <span className="truncate font-mono text-xs">{file}</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Untracked */}
                            {status.untracked.length > 0 && (
                                <div>
                                    <h3 className="px-2 py-1 text-xs font-medium text-df-text-muted uppercase">
                                        Untracked ({status.untracked.length})
                                    </h3>
                                    {status.untracked.map((file) => (
                                        <button
                                            key={file}
                                            onClick={() => loadDiff(file)}
                                            className={clsx(
                                                "w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-df-bg-hover transition-colors text-left",
                                                selectedFile === file && "bg-df-bg-hover"
                                            )}
                                        >
                                            <AlertCircle className="w-3 h-3 text-df-text-muted" />
                                            <span className="truncate font-mono text-xs">{file}</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {status.staged.length === 0 && status.modified.length === 0 && status.untracked.length === 0 && (
                                <div className="text-center py-8 text-df-text-muted text-sm">
                                    No changes detected
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="p-2 space-y-1">
                            {commits.map((commit) => (
                                <div
                                    key={commit.hash}
                                    className="p-3 rounded-lg hover:bg-df-bg-hover transition-colors cursor-pointer"
                                >
                                    <div className="flex items-start gap-2">
                                        <GitCommitIcon className="w-4 h-4 mt-0.5 text-df-accent-primary flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm truncate">{commit.message}</p>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-df-text-muted">
                                                <span className="font-mono">{commit.shortHash}</span>
                                                <span>•</span>
                                                <span>{commit.author}</span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {formatDate(commit.date)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel - Diff Viewer */}
            <div className="flex-1 flex flex-col">
                <div className="p-4 border-b border-df-border-primary bg-df-bg-secondary">
                    <h3 className="font-medium">
                        {selectedFile ? (
                            <span className="font-mono text-sm">{selectedFile}</span>
                        ) : (
                            'Diff Viewer'
                        )}
                    </h3>
                </div>

                <div className="flex-1 overflow-auto p-4 font-mono text-sm">
                    {diff ? (
                        <pre className="whitespace-pre-wrap">
                            {diff.split('\n').map((line, i) => {
                                let className = '';
                                if (line.startsWith('+') && !line.startsWith('+++')) {
                                    className = 'text-green-400 bg-green-400/10';
                                } else if (line.startsWith('-') && !line.startsWith('---')) {
                                    className = 'text-red-400 bg-red-400/10';
                                } else if (line.startsWith('@@')) {
                                    className = 'text-blue-400';
                                }
                                return (
                                    <div key={i} className={clsx('px-2', className)}>
                                        {line || ' '}
                                    </div>
                                );
                            })}
                        </pre>
                    ) : (
                        <div className="flex items-center justify-center h-full text-df-text-muted">
                            <div className="text-center">
                                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p>Select a file to view changes</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Error Toast */}
            {error && (
                <div className="fixed bottom-4 right-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400 animate-fade-in">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{error}</span>
                    <button onClick={() => setError(null)} className="ml-2 text-sm hover:text-red-300">
                        ×
                    </button>
                </div>
            )}
        </div>
    );
}
