import { useEffect, useState } from 'react';
import { useWorkspaceStore, useThemeStore } from './stores';
import Sidebar from './components/Sidebar/Sidebar';
import Notes from './components/Notes/Notes';
import ApiTester from './components/ApiTester/ApiTester';
import EnvManager from './components/EnvManager/EnvManager';
import SnippetVault from './components/SnippetVault/SnippetVault';
import GitViewer from './components/GitViewer/GitViewer';
import CommandPalette from './components/CommandPalette/CommandPalette';
import WelcomeScreen from './components/WelcomeScreen/WelcomeScreen';

export type ModuleType = 'notes' | 'api' | 'env' | 'snippets' | 'git';

function App() {
    const [activeModule, setActiveModule] = useState<ModuleType>('notes');
    const [showCommandPalette, setShowCommandPalette] = useState(false);
    const { currentWorkspace, loadWorkspaces } = useWorkspaceStore();
    const { theme } = useThemeStore();

    useEffect(() => {
        loadWorkspaces();
    }, [loadWorkspaces]);

    // Apply theme to document
    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
    }, [theme]);

    // Global keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Cmd/Ctrl + K for command palette
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setShowCommandPalette((prev) => !prev);
            }
            // Escape to close command palette
            if (e.key === 'Escape') {
                setShowCommandPalette(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const renderModule = () => {
        if (!currentWorkspace) {
            return <WelcomeScreen />;
        }

        switch (activeModule) {
            case 'notes':
                return <Notes />;
            case 'api':
                return <ApiTester />;
            case 'env':
                return <EnvManager />;
            case 'snippets':
                return <SnippetVault />;
            case 'git':
                return <GitViewer />;
            default:
                return <Notes />;
        }
    };

    return (
        <div className="flex h-screen bg-df-bg-primary text-df-text-primary overflow-hidden">
            {/* Sidebar */}
            <Sidebar
                activeModule={activeModule}
                onModuleChange={setActiveModule}
                onOpenCommandPalette={() => setShowCommandPalette(true)}
            />

            {/* Main Content */}
            <main className="flex-1 overflow-hidden">
                {renderModule()}
            </main>

            {/* Command Palette */}
            {showCommandPalette && (
                <CommandPalette onClose={() => setShowCommandPalette(false)} />
            )}
        </div>
    );
}

export default App;
