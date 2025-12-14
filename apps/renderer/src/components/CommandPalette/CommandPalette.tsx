import { useState, useEffect, useRef } from 'react';
import { clsx } from 'clsx';
import {
    Search,
    FileText,
    Send,
    Key,
    Code2,
    GitBranch,
    FolderOpen,
    Moon,
    Sun,
    Settings
} from 'lucide-react';
import { useWorkspaceStore, useThemeStore } from '../../stores';

interface Command {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    category: string;
    action: () => void;
    shortcut?: string;
}

interface CommandPaletteProps {
    onClose: () => void;
}

export default function CommandPalette({ onClose }: CommandPaletteProps) {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const { workspaces, setCurrentWorkspace } = useWorkspaceStore();
    const { theme, toggleTheme } = useThemeStore();

    // Define commands
    const commands: Command[] = [
        // Navigation
        { id: 'nav-notes', label: 'Go to Notes', icon: FileText, category: 'Navigation', action: () => { }, shortcut: '⌘1' },
        { id: 'nav-api', label: 'Go to API Tester', icon: Send, category: 'Navigation', action: () => { }, shortcut: '⌘2' },
        { id: 'nav-env', label: 'Go to Environment', icon: Key, category: 'Navigation', action: () => { }, shortcut: '⌘3' },
        { id: 'nav-snippets', label: 'Go to Snippets', icon: Code2, category: 'Navigation', action: () => { }, shortcut: '⌘4' },
        { id: 'nav-git', label: 'Go to Git', icon: GitBranch, category: 'Navigation', action: () => { }, shortcut: '⌘5' },

        // Workspace
        ...workspaces.map((ws) => ({
            id: `ws-${ws.id}`,
            label: `Switch to ${ws.name}`,
            icon: FolderOpen,
            category: 'Workspaces',
            action: () => setCurrentWorkspace(ws),
        })),

        // Settings
        {
            id: 'toggle-theme',
            label: theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
            icon: theme === 'dark' ? Sun : Moon,
            category: 'Settings',
            action: toggleTheme
        },
        { id: 'settings', label: 'Open Settings', icon: Settings, category: 'Settings', action: () => { } },
    ];

    // Filter commands
    const filteredCommands = query
        ? commands.filter((cmd) =>
            cmd.label.toLowerCase().includes(query.toLowerCase()) ||
            cmd.category.toLowerCase().includes(query.toLowerCase())
        )
        : commands;

    // Group by category
    const groupedCommands = filteredCommands.reduce((acc, cmd) => {
        if (!acc[cmd.category]) acc[cmd.category] = [];
        acc[cmd.category].push(cmd);
        return acc;
    }, {} as Record<string, Command[]>);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredCommands[selectedIndex]) {
                filteredCommands[selectedIndex].action();
                onClose();
            }
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    const handleCommandClick = (command: Command) => {
        command.action();
        onClose();
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 flex items-start justify-center pt-[15vh] z-50"
            onClick={onClose}
        >
            <div
                className="w-full max-w-xl bg-df-bg-secondary rounded-xl shadow-2xl border border-df-border-primary overflow-hidden animate-slide-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Search Input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-df-border-primary">
                    <Search className="w-5 h-5 text-df-text-muted" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Type a command or search..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 bg-transparent text-lg focus:outline-none"
                    />
                    <kbd className="hidden sm:inline-block text-xs px-2 py-1 bg-df-bg-tertiary rounded text-df-text-muted">
                        ESC
                    </kbd>
                </div>

                {/* Commands List */}
                <div className="max-h-[60vh] overflow-y-auto py-2">
                    {filteredCommands.length === 0 ? (
                        <div className="px-4 py-8 text-center text-df-text-muted">
                            No commands found
                        </div>
                    ) : (
                        Object.entries(groupedCommands).map(([category, cmds]) => (
                            <div key={category}>
                                <div className="px-4 py-1.5 text-xs font-medium text-df-text-muted uppercase">
                                    {category}
                                </div>
                                {cmds.map((cmd) => {
                                    const globalIndex = filteredCommands.indexOf(cmd);
                                    const Icon = cmd.icon;

                                    return (
                                        <button
                                            key={cmd.id}
                                            onClick={() => handleCommandClick(cmd)}
                                            className={clsx(
                                                "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                                                globalIndex === selectedIndex
                                                    ? "bg-df-accent-primary text-white"
                                                    : "hover:bg-df-bg-hover"
                                            )}
                                        >
                                            <Icon className="w-5 h-5" />
                                            <span className="flex-1">{cmd.label}</span>
                                            {cmd.shortcut && (
                                                <kbd className={clsx(
                                                    "text-xs px-1.5 py-0.5 rounded",
                                                    globalIndex === selectedIndex
                                                        ? "bg-white/20"
                                                        : "bg-df-bg-tertiary"
                                                )}>
                                                    {cmd.shortcut}
                                                </kbd>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2 border-t border-df-border-primary flex items-center gap-4 text-xs text-df-text-muted">
                    <span className="flex items-center gap-1">
                        <kbd className="px-1 py-0.5 bg-df-bg-tertiary rounded">↑↓</kbd>
                        Navigate
                    </span>
                    <span className="flex items-center gap-1">
                        <kbd className="px-1 py-0.5 bg-df-bg-tertiary rounded">↵</kbd>
                        Select
                    </span>
                    <span className="flex items-center gap-1">
                        <kbd className="px-1 py-0.5 bg-df-bg-tertiary rounded">ESC</kbd>
                        Close
                    </span>
                </div>
            </div>
        </div>
    );
}
