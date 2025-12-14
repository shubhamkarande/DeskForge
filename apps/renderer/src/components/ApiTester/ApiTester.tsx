import { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import {
    Send,
    Plus,
    Trash2,
    Save,
    Clock,
    ChevronDown,
    Copy,
    Check
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { useApiStore, useWorkspaceStore } from '../../stores';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const;

const methodColors: Record<string, string> = {
    GET: 'text-green-400',
    POST: 'text-blue-400',
    PUT: 'text-yellow-400',
    DELETE: 'text-red-400',
    PATCH: 'text-purple-400',
};

export default function ApiTester() {
    const { currentWorkspace } = useWorkspaceStore();
    const {
        savedRequests,
        currentRequest,
        response,
        isLoading,
        setCurrentRequest,
        sendRequest,
        saveRequest,
        loadRequests,
        deleteRequest,
        loadSavedRequest,
        resetRequest,
    } = useApiStore();

    const [activeTab, setActiveTab] = useState<'body' | 'headers'>('body');
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [saveName, setSaveName] = useState('');
    const [headerInput, setHeaderInput] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (currentWorkspace) {
            loadRequests(currentWorkspace.id);
        }
    }, [currentWorkspace, loadRequests]);

    const handleSend = async () => {
        await sendRequest();
    };

    const handleSave = async () => {
        if (currentWorkspace && saveName) {
            await saveRequest(currentWorkspace.id, saveName);
            setShowSaveModal(false);
            setSaveName('');
        }
    };

    const handleCopyResponse = () => {
        if (response) {
            navigator.clipboard.writeText(response.body);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const parseHeaders = (input: string): Record<string, string> => {
        const headers: Record<string, string> = {};
        input.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split(':');
            if (key && valueParts.length) {
                headers[key.trim()] = valueParts.join(':').trim();
            }
        });
        return headers;
    };

    const formatJson = (str: string): string => {
        try {
            return JSON.stringify(JSON.parse(str), null, 2);
        } catch {
            return str;
        }
    };

    const getStatusColor = (status: number) => {
        if (status >= 200 && status < 300) return 'text-green-400';
        if (status >= 300 && status < 400) return 'text-yellow-400';
        if (status >= 400 && status < 500) return 'text-orange-400';
        return 'text-red-400';
    };

    return (
        <div className="flex h-full">
            {/* Saved Requests Sidebar */}
            <div className="w-64 border-r border-df-border-primary bg-df-bg-secondary flex flex-col">
                <div className="p-3 border-b border-df-border-primary flex items-center justify-between">
                    <h2 className="font-semibold text-sm">Requests</h2>
                    <button
                        onClick={resetRequest}
                        className="p-1.5 rounded-lg hover:bg-df-bg-hover transition-colors text-df-accent-primary"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {savedRequests.length === 0 ? (
                        <div className="text-center text-df-text-muted py-4 text-sm">
                            No saved requests
                        </div>
                    ) : (
                        savedRequests.map((req) => (
                            <div
                                key={req.id}
                                className="group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-df-bg-hover transition-colors"
                                onClick={() => loadSavedRequest(req)}
                            >
                                <span className={clsx("text-xs font-mono font-bold", methodColors[req.method])}>
                                    {req.method}
                                </span>
                                <span className="flex-1 text-sm truncate">{req.name}</span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteRequest(req.id);
                                    }}
                                    className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-df-bg-tertiary"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Request Bar */}
                <div className="p-4 border-b border-df-border-primary bg-df-bg-secondary">
                    <div className="flex gap-2">
                        {/* Method Selector */}
                        <div className="relative">
                            <select
                                value={currentRequest.method}
                                onChange={(e) => setCurrentRequest({ method: e.target.value as any })}
                                className={clsx(
                                    "appearance-none px-4 py-2.5 pr-8 rounded-lg bg-df-bg-tertiary font-mono font-bold text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-df-accent-primary",
                                    methodColors[currentRequest.method]
                                )}
                            >
                                {HTTP_METHODS.map((method) => (
                                    <option key={method} value={method}>{method}</option>
                                ))}
                            </select>
                            <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-df-text-muted" />
                        </div>

                        {/* URL Input */}
                        <input
                            type="text"
                            placeholder="Enter request URL..."
                            value={currentRequest.url}
                            onChange={(e) => setCurrentRequest({ url: e.target.value })}
                            className="flex-1 px-4 py-2.5 rounded-lg bg-df-bg-tertiary focus:outline-none focus:ring-2 focus:ring-df-accent-primary text-sm"
                        />

                        {/* Send Button */}
                        <button
                            onClick={handleSend}
                            disabled={!currentRequest.url || isLoading}
                            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-df-accent-primary to-df-accent-secondary text-white font-medium rounded-lg hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                            <span>Send</span>
                        </button>

                        {/* Save Button */}
                        <button
                            onClick={() => setShowSaveModal(true)}
                            className="p-2.5 rounded-lg bg-df-bg-tertiary hover:bg-df-bg-hover transition-colors"
                            title="Save Request"
                        >
                            <Save className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Type Toggle */}
                    <div className="mt-3 flex gap-2">
                        <button
                            onClick={() => setCurrentRequest({ type: 'REST' })}
                            className={clsx(
                                "px-3 py-1 text-sm rounded-lg transition-colors",
                                currentRequest.type === 'REST'
                                    ? "bg-df-accent-primary text-white"
                                    : "bg-df-bg-tertiary hover:bg-df-bg-hover"
                            )}
                        >
                            REST
                        </button>
                        <button
                            onClick={() => setCurrentRequest({ type: 'GraphQL' })}
                            className={clsx(
                                "px-3 py-1 text-sm rounded-lg transition-colors",
                                currentRequest.type === 'GraphQL'
                                    ? "bg-df-accent-primary text-white"
                                    : "bg-df-bg-tertiary hover:bg-df-bg-hover"
                            )}
                        >
                            GraphQL
                        </button>
                    </div>
                </div>

                {/* Request/Response Area */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Request Body/Headers */}
                    <div className="w-1/2 flex flex-col border-r border-df-border-primary">
                        <div className="flex border-b border-df-border-primary">
                            <button
                                onClick={() => setActiveTab('body')}
                                className={clsx(
                                    "px-4 py-2 text-sm font-medium transition-colors",
                                    activeTab === 'body'
                                        ? "text-df-accent-primary border-b-2 border-df-accent-primary"
                                        : "text-df-text-muted hover:text-df-text-primary"
                                )}
                            >
                                Body
                            </button>
                            <button
                                onClick={() => setActiveTab('headers')}
                                className={clsx(
                                    "px-4 py-2 text-sm font-medium transition-colors",
                                    activeTab === 'headers'
                                        ? "text-df-accent-primary border-b-2 border-df-accent-primary"
                                        : "text-df-text-muted hover:text-df-text-primary"
                                )}
                            >
                                Headers
                            </button>
                        </div>

                        <div className="flex-1">
                            {activeTab === 'body' ? (
                                <Editor
                                    height="100%"
                                    defaultLanguage={currentRequest.type === 'GraphQL' ? 'graphql' : 'json'}
                                    value={currentRequest.body}
                                    onChange={(value) => setCurrentRequest({ body: value || '' })}
                                    theme="vs-dark"
                                    options={{
                                        minimap: { enabled: false },
                                        fontSize: 13,
                                        lineNumbers: 'on',
                                        padding: { top: 8 },
                                        scrollBeyondLastLine: false,
                                    }}
                                />
                            ) : (
                                <textarea
                                    placeholder="Content-Type: application/json&#10;Authorization: Bearer token"
                                    value={headerInput}
                                    onChange={(e) => {
                                        setHeaderInput(e.target.value);
                                        setCurrentRequest({ headers: parseHeaders(e.target.value) });
                                    }}
                                    className="w-full h-full p-4 bg-transparent resize-none focus:outline-none text-sm font-mono"
                                />
                            )}
                        </div>
                    </div>

                    {/* Response */}
                    <div className="w-1/2 flex flex-col">
                        <div className="px-4 py-2 border-b border-df-border-primary flex items-center justify-between">
                            <span className="text-sm font-medium">Response</span>
                            {response && (
                                <div className="flex items-center gap-4 text-sm">
                                    <span className={getStatusColor(response.status)}>
                                        {response.status} {response.statusText}
                                    </span>
                                    <span className="flex items-center gap-1 text-df-text-muted">
                                        <Clock className="w-3 h-3" />
                                        {response.time}ms
                                    </span>
                                    <button
                                        onClick={handleCopyResponse}
                                        className="p-1 rounded hover:bg-df-bg-hover transition-colors"
                                    >
                                        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 overflow-auto">
                            {response ? (
                                <Editor
                                    height="100%"
                                    defaultLanguage="json"
                                    value={formatJson(response.body)}
                                    theme="vs-dark"
                                    options={{
                                        readOnly: true,
                                        minimap: { enabled: false },
                                        fontSize: 13,
                                        lineNumbers: 'on',
                                        padding: { top: 8 },
                                        scrollBeyondLastLine: false,
                                    }}
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-df-text-muted">
                                    <div className="text-center">
                                        <Send className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                        <p>Send a request to see the response</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Save Modal */}
            {showSaveModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-df-bg-secondary rounded-xl p-6 w-96 shadow-xl animate-fade-in">
                        <h3 className="text-lg font-semibold mb-4">Save Request</h3>
                        <input
                            type="text"
                            placeholder="Request name..."
                            value={saveName}
                            onChange={(e) => setSaveName(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg bg-df-bg-tertiary focus:outline-none focus:ring-2 focus:ring-df-accent-primary mb-4"
                            autoFocus
                        />
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setShowSaveModal(false)}
                                className="px-4 py-2 rounded-lg hover:bg-df-bg-hover transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!saveName}
                                className="px-4 py-2 rounded-lg bg-df-accent-primary text-white disabled:opacity-50"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
