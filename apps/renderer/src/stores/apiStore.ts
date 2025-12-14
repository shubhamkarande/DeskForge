import { create } from 'zustand';

export interface ApiRequest {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    url: string;
    headers: Record<string, string>;
    body: string;
    type: 'REST' | 'GraphQL';
}

export interface SavedApiRequest extends ApiRequest {
    id: string;
    name: string;
    workspaceId: string;
    createdAt: string;
}

export interface ApiResponse {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: string;
    time: number;
}

interface ApiStore {
    savedRequests: SavedApiRequest[];
    currentRequest: ApiRequest;
    response: ApiResponse | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    setSavedRequests: (requests: SavedApiRequest[]) => void;
    setCurrentRequest: (request: Partial<ApiRequest>) => void;
    setResponse: (response: ApiResponse | null) => void;
    setLoading: (loading: boolean) => void;

    // Async actions
    loadRequests: (workspaceId: string) => Promise<void>;
    sendRequest: () => Promise<void>;
    saveRequest: (workspaceId: string, name: string) => Promise<void>;
    deleteRequest: (id: string) => Promise<void>;
    loadSavedRequest: (request: SavedApiRequest) => void;
    resetRequest: () => void;
}

const defaultRequest: ApiRequest = {
    method: 'GET',
    url: '',
    headers: {},
    body: '',
    type: 'REST',
};

export const useApiStore = create<ApiStore>((set, get) => ({
    savedRequests: [],
    currentRequest: { ...defaultRequest },
    response: null,
    isLoading: false,
    error: null,

    setSavedRequests: (savedRequests) => set({ savedRequests }),
    setCurrentRequest: (request) => set((state) => ({
        currentRequest: { ...state.currentRequest, ...request },
    })),
    setResponse: (response) => set({ response }),
    setLoading: (isLoading) => set({ isLoading }),

    loadRequests: async (workspaceId) => {
        try {
            const requests = await window.deskforge.api.listRequests(workspaceId);
            set({ savedRequests: requests });
        } catch (error) {
            set({ error: (error as Error).message });
        }
    },

    sendRequest: async () => {
        const { currentRequest } = get();
        if (!currentRequest.url) return;

        set({ isLoading: true, error: null, response: null });
        try {
            const response = await window.deskforge.api.sendRequest(currentRequest);
            set({ response, isLoading: false });
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
        }
    },

    saveRequest: async (workspaceId, name) => {
        const { currentRequest } = get();
        try {
            const saved = await window.deskforge.api.saveRequest(workspaceId, {
                ...currentRequest,
                name,
            } as any);
            set((state) => ({
                savedRequests: [saved, ...state.savedRequests],
            }));
        } catch (error) {
            set({ error: (error as Error).message });
        }
    },

    deleteRequest: async (id) => {
        try {
            await window.deskforge.api.deleteRequest(id);
            set((state) => ({
                savedRequests: state.savedRequests.filter((r) => r.id !== id),
            }));
        } catch (error) {
            set({ error: (error as Error).message });
        }
    },

    loadSavedRequest: (request) => {
        set({
            currentRequest: {
                method: request.method,
                url: request.url,
                headers: request.headers,
                body: request.body,
                type: request.type,
            },
            response: null,
        });
    },

    resetRequest: () => {
        set({
            currentRequest: { ...defaultRequest },
            response: null,
        });
    },
}));
