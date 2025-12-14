import { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import {
    Plus,
    Trash2,
    Search,
    Copy,
    Check,
    Code2,
    Tag
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { useSnippetStore } from '../../stores';

const LANGUAGES = [
    'javascript', 'typescript', 'python', 'java', 'go', 'rust',
    'cpp', 'c', 'csharp', 'php', 'ruby', 'swift', 'kotlin',
    'html', 'css', 'scss', 'sql', 'graphql', 'json', 'yaml',
    'markdown', 'bash', 'powershell', 'dockerfile'
];

export default function SnippetVault() {
    const {
        snippets,
        currentSnippet,
        searchQuery,
        filterLanguage,
        isLoading,
        loadSnippets,
        searchSnippets,
        createSnippet,
        saveSnippet,
        deleteSnippet,
        setCurrentSnippet,
        setSearchQuery,
        setFilterLanguage,
    } = useSnippetStore();

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newLanguage, setNewLanguage] = useState('javascript');
    const [copied, setCopied] = useState(false);
    const [localCode, setLocalCode] = useState('');

    useEffect(() => {
        loadSnippets();
    }, [filterLanguage, loadSnippets]);

    useEffect(() => {
        if (currentSnippet) {
            setLocalCode(currentSnippet.code);
        }
    }, [currentSnippet?.id]);

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        if (query) {
            searchSnippets(query);
        } else {
            loadSnippets();
        }
    };

    const handleCreate = async () => {
        if (!newTitle) return;
        await createSnippet({
            title: newTitle,
            language: newLanguage,
            code: '// Your code here',
            description: '',
            tags: [],
        });
        setShowCreateModal(false);
        setNewTitle('');
    };

    const handleSave = async () => {
        if (currentSnippet) {
            await saveSnippet(currentSnippet.id, { code: localCode });
        }
    };

    const handleCopy = () => {
        if (currentSnippet) {
            navigator.clipboard.writeText(localCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Delete this snippet?')) {
            await deleteSnippet(id);
        }
    };

    return (
        <div className="flex h-full">
            {/* Sidebar */}
            <div className="w-72 border-r border-df-border-primary bg-df-bg-secondary flex flex-col">
                <div className="p-3 border-b border-df-border-primary">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="font-semibold text-sm">Snippets</h2>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="p-1.5 rounded-lg hover:bg-df-bg-hover transition-colors text-df-accent-primary"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-df-text-muted" />
                        <input
                            type="text"
                            placeholder="Search snippets..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 rounded-lg bg-df-bg-tertiary text-sm focus:outline-none focus:ring-2 focus:ring-df-accent-primary"
                        />
                    </div>

                    {/* Language Filter */}
                    <select
                        value={filterLanguage || ''}
                        onChange={(e) => setFilterLanguage(e.target.value || null)}
                        className="w-full mt-2 px-3 py-2 rounded-lg bg-df-bg-tertiary text-sm focus:outline-none focus:ring-2 focus:ring-df-accent-primary"
                    >
                        <option value="">All Languages</option>
                        {LANGUAGES.map((lang) => (
                            <option key={lang} value={lang}>{lang}</option>
                        ))}
                    </select>
                </div>

                {/* Snippets List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {isLoading ? (
                        <div className="text-center text-df-text-muted py-4 text-sm">Loading...</div>
                    ) : snippets.length === 0 ? (
                        <div className="text-center text-df-text-muted py-4 text-sm">
                            {searchQuery ? 'No matches found' : 'No snippets yet'}
                        </div>
                    ) : (
                        snippets.map((snippet) => (
                            <div
                                key={snippet.id}
                                onClick={() => setCurrentSnippet(snippet)}
                                className={clsx(
                                    "group p-3 rounded-lg cursor-pointer transition-colors",
                                    currentSnippet?.id === snippet.id
                                        ? "bg-df-accent-primary text-white"
                                        : "hover:bg-df-bg-hover"
                                )}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-sm truncate">{snippet.title}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={clsx(
                                                "text-xs px-1.5 py-0.5 rounded",
                                                currentSnippet?.id === snippet.id
                                                    ? "bg-white/20"
                                                    : "bg-df-bg-tertiary text-df-accent-primary"
                                            )}>
                                                {snippet.language}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(snippet.id);
                                        }}
                                        className={clsx(
                                            "p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity",
                                            currentSnippet?.id === snippet.id
                                                ? "hover:bg-white/20"
                                                : "hover:bg-df-bg-tertiary"
                                        )}
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 flex flex-col">
                {currentSnippet ? (
                    <>
                        {/* Toolbar */}
                        <div className="h-14 px-4 border-b border-df-border-primary flex items-center justify-between bg-df-bg-secondary">
                            <div className="flex items-center gap-3">
                                <Code2 className="w-5 h-5 text-df-accent-primary" />
                                <input
                                    type="text"
                                    value={currentSnippet.title}
                                    onChange={(e) => saveSnippet(currentSnippet.id, { title: e.target.value })}
                                    className="bg-transparent text-lg font-medium focus:outline-none"
                                />
                                <span className="px-2 py-0.5 text-xs rounded bg-df-bg-tertiary text-df-accent-primary">
                                    {currentSnippet.language}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleCopy}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-df-bg-tertiary hover:bg-df-bg-hover transition-colors text-sm"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="w-4 h-4 text-green-400" />
                                            <span className="text-green-400">Copied!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4" />
                                            <span>Copy</span>
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="px-4 py-1.5 rounded-lg bg-df-accent-primary text-white text-sm hover:bg-df-accent-secondary transition-colors"
                                >
                                    Save
                                </button>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="px-4 py-2 border-b border-df-border-primary bg-df-bg-secondary">
                            <input
                                type="text"
                                placeholder="Add description..."
                                value={currentSnippet.description}
                                onChange={(e) => saveSnippet(currentSnippet.id, { description: e.target.value })}
                                className="w-full bg-transparent text-sm text-df-text-secondary focus:outline-none"
                            />
                        </div>

                        {/* Tags */}
                        <div className="px-4 py-2 border-b border-df-border-primary bg-df-bg-secondary flex items-center gap-2">
                            <Tag className="w-4 h-4 text-df-text-muted" />
                            <div className="flex items-center gap-1 flex-wrap">
                                {currentSnippet.tags.map((tag, i) => (
                                    <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-df-bg-tertiary">
                                        {tag}
                                    </span>
                                ))}
                                <span className="text-xs text-df-text-muted">
                                    {currentSnippet.tags.length === 0 && 'No tags'}
                                </span>
                            </div>
                        </div>

                        {/* Code Editor */}
                        <div className="flex-1">
                            <Editor
                                height="100%"
                                language={currentSnippet.language}
                                value={localCode}
                                onChange={(value) => setLocalCode(value || '')}
                                theme="vs-dark"
                                options={{
                                    minimap: { enabled: false },
                                    fontSize: 14,
                                    lineNumbers: 'on',
                                    padding: { top: 16 },
                                    scrollBeyondLastLine: false,
                                }}
                            />
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-df-text-muted">
                        <div className="text-center">
                            <Code2 className="w-16 h-16 mx-auto mb-4 opacity-30" />
                            <p>Select a snippet or create a new one</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-df-bg-secondary rounded-xl p-6 w-96 shadow-xl animate-fade-in">
                        <h3 className="text-lg font-semibold mb-4">Create Snippet</h3>
                        <input
                            type="text"
                            placeholder="Snippet title..."
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg bg-df-bg-tertiary focus:outline-none focus:ring-2 focus:ring-df-accent-primary mb-3"
                            autoFocus
                        />
                        <select
                            value={newLanguage}
                            onChange={(e) => setNewLanguage(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg bg-df-bg-tertiary focus:outline-none focus:ring-2 focus:ring-df-accent-primary mb-4"
                        >
                            {LANGUAGES.map((lang) => (
                                <option key={lang} value={lang}>{lang}</option>
                            ))}
                        </select>
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="px-4 py-2 rounded-lg hover:bg-df-bg-hover transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={!newTitle}
                                className="px-4 py-2 rounded-lg bg-df-accent-primary text-white disabled:opacity-50"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
