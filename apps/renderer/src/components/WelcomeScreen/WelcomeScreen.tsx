import { useState } from 'react';
import { Plus, FolderOpen, AlertCircle } from 'lucide-react';
import { useWorkspaceStore } from '../../stores';
import { isElectron, selectFolder } from '../../utils/electron';

export default function WelcomeScreen() {
    const [isCreating, setIsCreating] = useState(false);
    const { createWorkspace } = useWorkspaceStore();
    const inElectron = isElectron();

    const handleCreateWorkspace = async () => {
        setIsCreating(true);
        try {
            const path = await selectFolder();
            if (path) {
                const name = path.split(/[/\\]/).pop() || 'New Workspace';
                await createWorkspace(name, path);
            }
        } catch (error) {
            console.error('Failed to create workspace:', error);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="flex-1 flex items-center justify-center bg-df-bg-primary">
            <div className="text-center max-w-md mx-auto px-8 animate-fade-in">
                {/* Browser Mode Warning */}
                {!inElectron && (
                    <div className="mb-6 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-center gap-2 text-yellow-400 text-sm">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>Running in browser mode - open in Electron for full features</span>
                    </div>
                )}

                {/* Logo */}
                <div className="w-24 h-24 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-df-accent-primary to-df-accent-secondary flex items-center justify-center shadow-glow-lg">
                    <svg className="w-14 h-14 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                    </svg>
                </div>

                <h1 className="text-4xl font-bold mb-3">
                    <span className="gradient-text">Welcome to DeskForge</span>
                </h1>
                <p className="text-df-text-secondary text-lg mb-8">
                    Your all-in-one developer workspace. Create or select a workspace to get started.
                </p>

                <button
                    onClick={handleCreateWorkspace}
                    disabled={isCreating}
                    className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-df-accent-primary to-df-accent-secondary text-white font-semibold rounded-xl shadow-glow hover:shadow-glow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isCreating ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Creating...</span>
                        </>
                    ) : (
                        <>
                            <Plus className="w-5 h-5" />
                            <span>Create Workspace</span>
                        </>
                    )}
                </button>

                <div className="mt-12 grid grid-cols-3 gap-6 text-sm text-df-text-muted">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-df-bg-secondary flex items-center justify-center">
                            <FolderOpen className="w-5 h-5 text-df-accent-primary" />
                        </div>
                        <span>Workspaces</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-df-bg-secondary flex items-center justify-center">
                            <svg className="w-5 h-5 text-df-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <span>Markdown Notes</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-lg bg-df-bg-secondary flex items-center justify-center">
                            <svg className="w-5 h-5 text-df-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <span>API Testing</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
