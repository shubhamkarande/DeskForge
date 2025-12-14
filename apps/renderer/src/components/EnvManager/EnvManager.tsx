import { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import {
    Plus,
    Trash2,
    Eye,
    EyeOff,
    Upload,
    Download,
    Key as KeyIcon,
    AlertCircle
} from 'lucide-react';
import { useWorkspaceStore } from '../../stores';

interface EnvVariable {
    key: string;
    value: string;
    isSecret: boolean;
}

export default function EnvManager() {
    const { currentWorkspace } = useWorkspaceStore();
    const [variables, setVariables] = useState<EnvVariable[]>([]);
    const [newKey, setNewKey] = useState('');
    const [newValue, setNewValue] = useState('');
    const [newIsSecret, setNewIsSecret] = useState(false);
    const [revealedSecrets, setRevealedSecrets] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (currentWorkspace) {
            loadVariables();
        }
    }, [currentWorkspace]);

    const loadVariables = async () => {
        if (!currentWorkspace) return;
        setIsLoading(true);
        try {
            const vars = await window.deskforge.env.list(currentWorkspace.id);
            setVariables(vars);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!currentWorkspace || !newKey) return;
        try {
            await window.deskforge.env.set(currentWorkspace.id, newKey, newValue, newIsSecret);
            setNewKey('');
            setNewValue('');
            setNewIsSecret(false);
            await loadVariables();
        } catch (err) {
            setError((err as Error).message);
        }
    };

    const handleDelete = async (key: string) => {
        if (!currentWorkspace) return;
        if (confirm(`Delete variable "${key}"?`)) {
            try {
                await window.deskforge.env.delete(currentWorkspace.id, key);
                await loadVariables();
            } catch (err) {
                setError((err as Error).message);
            }
        }
    };

    const toggleReveal = async (key: string) => {
        if (!currentWorkspace) return;

        if (revealedSecrets.has(key)) {
            setRevealedSecrets((prev) => {
                const next = new Set(prev);
                next.delete(key);
                return next;
            });
        } else {
            try {
                const value = await window.deskforge.env.get(currentWorkspace.id, key);
                if (value !== null) {
                    setVariables((prev) =>
                        prev.map((v) => v.key === key ? { ...v, value } : v)
                    );
                    setRevealedSecrets((prev) => new Set(prev).add(key));
                }
            } catch (err) {
                setError((err as Error).message);
            }
        }
    };

    const handleImport = async () => {
        if (!currentWorkspace) return;
        try {
            const path = await (window as any).deskforge.fs.selectFile?.({
                filters: [{ name: 'Environment Files', extensions: ['env', 'env.local', 'env.development'] }]
            });
            if (path) {
                await window.deskforge.env.importFromFile(currentWorkspace.id, path);
                await loadVariables();
            }
        } catch (err) {
            setError((err as Error).message);
        }
    };

    const handleExport = async () => {
        if (!currentWorkspace) return;
        try {
            const path = await (window as any).deskforge.fs.saveFile?.({
                defaultPath: '.env',
                filters: [{ name: 'Environment Files', extensions: ['env'] }]
            });
            if (path) {
                await window.deskforge.env.exportToFile(currentWorkspace.id, path);
            }
        } catch (err) {
            setError((err as Error).message);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-df-border-primary bg-df-bg-secondary">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold">Environment Variables</h1>
                        <p className="text-sm text-df-text-muted mt-1">
                            Manage secrets and environment variables for this workspace
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleImport}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-df-bg-tertiary hover:bg-df-bg-hover transition-colors text-sm"
                        >
                            <Upload className="w-4 h-4" />
                            Import .env
                        </button>
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-df-bg-tertiary hover:bg-df-bg-hover transition-colors text-sm"
                        >
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                    </div>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="mx-4 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                    <button
                        onClick={() => setError(null)}
                        className="ml-auto text-sm hover:text-red-300"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* Add New Variable */}
            <div className="p-4">
                <div className="bg-df-bg-secondary rounded-xl p-4 border border-df-border-primary">
                    <h3 className="text-sm font-medium mb-3">Add Variable</h3>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            placeholder="KEY"
                            value={newKey}
                            onChange={(e) => setNewKey(e.target.value.toUpperCase())}
                            className="flex-1 px-3 py-2 rounded-lg bg-df-bg-tertiary focus:outline-none focus:ring-2 focus:ring-df-accent-primary text-sm font-mono"
                        />
                        <input
                            type={newIsSecret ? 'password' : 'text'}
                            placeholder="Value"
                            value={newValue}
                            onChange={(e) => setNewValue(e.target.value)}
                            className="flex-1 px-3 py-2 rounded-lg bg-df-bg-tertiary focus:outline-none focus:ring-2 focus:ring-df-accent-primary text-sm"
                        />
                        <label className="flex items-center gap-2 px-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={newIsSecret}
                                onChange={(e) => setNewIsSecret(e.target.checked)}
                                className="w-4 h-4 rounded border-df-border-primary text-df-accent-primary focus:ring-df-accent-primary"
                            />
                            <span className="text-sm text-df-text-muted">Secret</span>
                        </label>
                        <button
                            onClick={handleAdd}
                            disabled={!newKey}
                            className="flex items-center gap-2 px-4 py-2 bg-df-accent-primary text-white rounded-lg disabled:opacity-50 transition-colors hover:bg-df-accent-secondary"
                        >
                            <Plus className="w-4 h-4" />
                            Add
                        </button>
                    </div>
                </div>
            </div>

            {/* Variables List */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
                {isLoading ? (
                    <div className="text-center text-df-text-muted py-8">Loading...</div>
                ) : variables.length === 0 ? (
                    <div className="text-center py-12">
                        <KeyIcon className="w-16 h-16 mx-auto mb-4 text-df-text-muted opacity-30" />
                        <p className="text-df-text-muted">No environment variables yet</p>
                        <p className="text-sm text-df-text-muted mt-1">
                            Add variables above or import from a .env file
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {variables.map((variable) => (
                            <div
                                key={variable.key}
                                className="flex items-center gap-3 p-3 bg-df-bg-secondary rounded-lg border border-df-border-primary hover:border-df-border-hover transition-colors group"
                            >
                                <span className="font-mono text-sm text-df-accent-primary font-medium w-48 truncate">
                                    {variable.key}
                                </span>
                                <span className="flex-1 font-mono text-sm truncate">
                                    {variable.isSecret && !revealedSecrets.has(variable.key)
                                        ? '••••••••'
                                        : variable.value}
                                </span>
                                {variable.isSecret && (
                                    <span className="px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded">
                                        Secret
                                    </span>
                                )}
                                <div className="flex items-center gap-1">
                                    {variable.isSecret && (
                                        <button
                                            onClick={() => toggleReveal(variable.key)}
                                            className="p-1.5 rounded-lg hover:bg-df-bg-hover transition-colors"
                                            title={revealedSecrets.has(variable.key) ? 'Hide' : 'Reveal'}
                                        >
                                            {revealedSecrets.has(variable.key)
                                                ? <EyeOff className="w-4 h-4" />
                                                : <Eye className="w-4 h-4" />}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(variable.key)}
                                        className="p-1.5 rounded-lg hover:bg-df-bg-hover transition-colors text-red-400 opacity-0 group-hover:opacity-100"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
