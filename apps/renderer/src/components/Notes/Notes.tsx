import { useEffect, useState, useCallback, useRef } from 'react';
import { Plus, FileText, Trash2, Save } from 'lucide-react';
import { clsx } from 'clsx';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useNotesStore, useWorkspaceStore } from '../../stores';

export default function Notes() {
    const { currentWorkspace } = useWorkspaceStore();
    const {
        notes,
        currentNote,
        isLoading,
        isSaving,
        loadNotes,
        createNote,
        saveNote,
        deleteNote,
        setCurrentNote
    } = useNotesStore();

    const [showPreview, setShowPreview] = useState(true);
    const [localContent, setLocalContent] = useState('');
    const saveTimeoutRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
        if (currentWorkspace) {
            loadNotes(currentWorkspace.id);
        }
    }, [currentWorkspace, loadNotes]);

    useEffect(() => {
        if (currentNote) {
            setLocalContent(currentNote.content);
        }
    }, [currentNote?.id]);

    // Autosave with debounce
    const handleContentChange = useCallback((value: string | undefined) => {
        const content = value || '';
        setLocalContent(content);

        if (currentNote) {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            saveTimeoutRef.current = setTimeout(() => {
                saveNote(currentNote.id, content);
            }, 1000); // 1 second debounce
        }
    }, [currentNote, saveNote]);

    const handleCreateNote = async () => {
        if (currentWorkspace) {
            await createNote(currentWorkspace.id, 'Untitled Note');
        }
    };

    const handleDeleteNote = async (id: string) => {
        if (confirm('Delete this note?')) {
            await deleteNote(id);
        }
    };

    if (!currentWorkspace) {
        return null;
    }

    return (
        <div className="flex h-full">
            {/* Notes List */}
            <div className="w-64 border-r border-df-border-primary bg-df-bg-secondary flex flex-col">
                <div className="p-3 border-b border-df-border-primary flex items-center justify-between">
                    <h2 className="font-semibold text-sm">Notes</h2>
                    <button
                        onClick={handleCreateNote}
                        className="p-1.5 rounded-lg hover:bg-df-bg-hover transition-colors text-df-accent-primary"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {isLoading ? (
                        <div className="text-center text-df-text-muted py-4 text-sm">Loading...</div>
                    ) : notes.length === 0 ? (
                        <div className="text-center text-df-text-muted py-4 text-sm">
                            No notes yet. Create one!
                        </div>
                    ) : (
                        notes.map((note) => (
                            <div
                                key={note.id}
                                className={clsx(
                                    "group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors",
                                    currentNote?.id === note.id
                                        ? "bg-df-accent-primary text-white"
                                        : "hover:bg-df-bg-hover"
                                )}
                                onClick={() => setCurrentNote(note)}
                            >
                                <FileText className="w-4 h-4 flex-shrink-0" />
                                <span className="flex-1 text-sm truncate">{note.title}</span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteNote(note.id);
                                    }}
                                    className={clsx(
                                        "p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity",
                                        currentNote?.id === note.id
                                            ? "hover:bg-white/20"
                                            : "hover:bg-df-bg-hover"
                                    )}
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 flex flex-col">
                {currentNote ? (
                    <>
                        {/* Toolbar */}
                        <div className="h-12 px-4 border-b border-df-border-primary flex items-center justify-between bg-df-bg-secondary">
                            <input
                                type="text"
                                value={currentNote.title}
                                onChange={(e) => {
                                    useNotesStore.getState().updateNote(currentNote.id, { title: e.target.value });
                                }}
                                className="bg-transparent text-lg font-medium focus:outline-none flex-1"
                            />
                            <div className="flex items-center gap-2">
                                {isSaving && (
                                    <span className="text-xs text-df-text-muted flex items-center gap-1">
                                        <Save className="w-3 h-3 animate-pulse" />
                                        Saving...
                                    </span>
                                )}
                                <button
                                    onClick={() => setShowPreview(!showPreview)}
                                    className={clsx(
                                        "px-3 py-1.5 text-sm rounded-lg transition-colors",
                                        showPreview
                                            ? "bg-df-accent-primary text-white"
                                            : "bg-df-bg-tertiary hover:bg-df-bg-hover"
                                    )}
                                >
                                    {showPreview ? 'Editor Only' : 'Show Preview'}
                                </button>
                            </div>
                        </div>

                        {/* Editor + Preview */}
                        <div className="flex-1 flex overflow-hidden">
                            <div className={clsx("flex-1", showPreview && "border-r border-df-border-primary")}>
                                <Editor
                                    height="100%"
                                    defaultLanguage="markdown"
                                    value={localContent}
                                    onChange={handleContentChange}
                                    theme="vs-dark"
                                    options={{
                                        minimap: { enabled: false },
                                        fontSize: 14,
                                        lineNumbers: 'off',
                                        wordWrap: 'on',
                                        padding: { top: 16 },
                                        scrollBeyondLastLine: false,
                                    }}
                                />
                            </div>

                            {showPreview && (
                                <div className="flex-1 overflow-y-auto p-6 prose prose-invert max-w-none">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            code({ node, inline, className, children, ...props }: any) {
                                                const match = /language-(\w+)/.exec(className || '');
                                                return !inline && match ? (
                                                    <SyntaxHighlighter
                                                        style={vscDarkPlus}
                                                        language={match[1]}
                                                        PreTag="div"
                                                        {...props}
                                                    >
                                                        {String(children).replace(/\n$/, '')}
                                                    </SyntaxHighlighter>
                                                ) : (
                                                    <code className={className} {...props}>
                                                        {children}
                                                    </code>
                                                );
                                            },
                                        }}
                                    >
                                        {localContent}
                                    </ReactMarkdown>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-df-text-muted">
                        <div className="text-center">
                            <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                            <p>Select a note or create a new one</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
