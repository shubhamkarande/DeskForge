import { useState } from 'react';
import { clsx } from 'clsx';
import {
    FileText,
    Send,
    Key,
    Code2,
    GitBranch,
    Search,
    FolderOpen,
    Plus,
    Settings,
    Moon,
    Sun,
    ChevronDown,
} from 'lucide-react';
import { useWorkspaceStore, useThemeStore } from '../../stores';
import { selectFolder } from '../../utils/electron';
import type { ModuleType } from '../../App';

interface SidebarProps {
    activeModule: ModuleType;
    onModuleChange: (module: ModuleType) => void;
    onOpenCommandPalette: () => void;
}

const modules = [
    { id: 'notes' as ModuleType, label: 'Notes', icon: FileText },
    { id: 'api' as ModuleType, label: 'API Tester', icon: Send },
    { id: 'env' as ModuleType, label: 'Environment', icon: Key },
    { id: 'snippets' as ModuleType, label: 'Snippets', icon: Code2 },
    { id: 'git' as ModuleType, label: 'Git', icon: GitBranch },
];

export default function Sidebar({ activeModule, onModuleChange, onOpenCommandPalette }: SidebarProps) {
    const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);
    const { workspaces, currentWorkspace, setCurrentWorkspace, loadWorkspaces } = useWorkspaceStore();
    const { theme, toggleTheme } = useThemeStore();
    const [isCreating, setIsCreating] = useState(false);

    const handleCreateWorkspace = async () => {
        setIsCreating(true);
        try {
            const path = await selectFolder();
            if (path) {
                const name = path.split(/[/\\]/).pop() || 'New Workspace';
                await useWorkspaceStore.getState().createWorkspace(name, path);
            }
        } catch (error) {
            console.error('Failed to create workspace:', error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleSelectWorkspace = async (workspace: typeof currentWorkspace) => {
        setCurrentWorkspace(workspace);
        setShowWorkspaceMenu(false);
    };

    return (
        <aside className="w-64 flex flex-col bg-df-bg-secondary border-r border-df-border-primary">
            {/* Logo */}
            <div className="h-14 flex items-center px-4 border-b border-df-border-primary">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-df-accent-primary to-df-accent-secondary flex items-center justify-center">
                        <Code2 className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-semibold text-lg gradient-text">DeskForge</span>
                </div>
            </div>

            {/* Workspace Selector */}
            <div className="px-3 py-3 border-b border-df-border-primary">
                <button
                    onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-df-bg-tertiary hover:bg-df-bg-hover transition-colors"
                >
                    <FolderOpen className="w-4 h-4 text-df-accent-primary" />
                    <span className="flex-1 text-left text-sm truncate">
                        {currentWorkspace?.name || 'Select Workspace'}
                    </span>
                    <ChevronDown className={clsx(
                        "w-4 h-4 transition-transform",
                        showWorkspaceMenu && "rotate-180"
                    )} />
                </button>

                {showWorkspaceMenu && (
                    <div className="mt-2 py-1 bg-df-bg-tertiary rounded-lg border border-df-border-primary animate-fade-in">
                        {workspaces.map((workspace) => (
                            <button
                                key={workspace.id}
                                onClick={() => handleSelectWorkspace(workspace)}
                                className={clsx(
                                    "w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-df-bg-hover transition-colors",
                                    currentWorkspace?.id === workspace.id && "text-df-accent-primary"
                                )}
                            >
                                <FolderOpen className="w-4 h-4" />
                                <span className="truncate">{workspace.name}</span>
                            </button>
                        ))}
                        <button
                            onClick={handleCreateWorkspace}
                            disabled={isCreating}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-df-accent-primary hover:bg-df-bg-hover transition-colors border-t border-df-border-primary"
                        >
                            <Plus className="w-4 h-4" />
                            <span>{isCreating ? 'Creating...' : 'New Workspace'}</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Search Button */}
            <div className="px-3 py-2">
                <button
                    onClick={onOpenCommandPalette}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-df-text-secondary bg-df-bg-tertiary rounded-lg hover:bg-df-bg-hover transition-colors"
                >
                    <Search className="w-4 h-4" />
                    <span className="flex-1 text-left">Search...</span>
                    <kbd className="text-xs bg-df-bg-primary px-1.5 py-0.5 rounded">⌘K</kbd>
                </button>
            </div>

            {/* Module Navigation */}
            <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
                {modules.map((module) => {
                    const Icon = module.icon;
                    const isActive = activeModule === module.id;

                    return (
                        <button
                            key={module.id}
                            onClick={() => onModuleChange(module.id)}
                            className={clsx(
                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                                isActive
                                    ? "bg-df-accent-primary text-white shadow-glow"
                                    : "text-df-text-secondary hover:bg-df-bg-hover hover:text-df-text-primary"
                            )}
                        >
                            <Icon className="w-5 h-5" />
                            <span>{module.label}</span>
                        </button>
                    );
                })}
            </nav>

            {/* Bottom Actions */}
            <div className="px-3 py-3 border-t border-df-border-primary space-y-1">
                <button
                    onClick={toggleTheme}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-df-text-secondary hover:bg-df-bg-hover transition-colors"
                >
                    {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
                <button
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-df-text-secondary hover:bg-df-bg-hover transition-colors"
                >
                    <Settings className="w-5 h-5" />
                    <span>Settings</span>
                </button>
            </div>
        </aside>
    );
}
