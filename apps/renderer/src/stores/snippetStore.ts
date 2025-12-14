import { create } from 'zustand';

export interface Snippet {
    id: string;
    title: string;
    language: string;
    code: string;
    description: string;
    tags: string[];
    createdAt: string;
    updatedAt: string;
}

interface SnippetStore {
    snippets: Snippet[];
    currentSnippet: Snippet | null;
    searchQuery: string;
    filterLanguage: string | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    setSnippets: (snippets: Snippet[]) => void;
    setCurrentSnippet: (snippet: Snippet | null) => void;
    setSearchQuery: (query: string) => void;
    setFilterLanguage: (language: string | null) => void;
    addSnippet: (snippet: Snippet) => void;
    updateSnippet: (id: string, data: Partial<Snippet>) => void;
    removeSnippet: (id: string) => void;

    // Async actions
    loadSnippets: () => Promise<void>;
    searchSnippets: (query: string) => Promise<void>;
    createSnippet: (data: Omit<Snippet, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Snippet>;
    saveSnippet: (id: string, data: Partial<Snippet>) => Promise<void>;
    deleteSnippet: (id: string) => Promise<void>;
}

export const useSnippetStore = create<SnippetStore>((set, get) => ({
    snippets: [],
    currentSnippet: null,
    searchQuery: '',
    filterLanguage: null,
    isLoading: false,
    error: null,

    setSnippets: (snippets) => set({ snippets }),
    setCurrentSnippet: (snippet) => set({ currentSnippet: snippet }),
    setSearchQuery: (searchQuery) => set({ searchQuery }),
    setFilterLanguage: (filterLanguage) => set({ filterLanguage }),
    addSnippet: (snippet) => set((state) => ({ snippets: [snippet, ...state.snippets] })),
    updateSnippet: (id, data) => set((state) => ({
        snippets: state.snippets.map((s) => s.id === id ? { ...s, ...data } : s),
        currentSnippet: state.currentSnippet?.id === id
            ? { ...state.currentSnippet, ...data }
            : state.currentSnippet,
    })),
    removeSnippet: (id) => set((state) => ({
        snippets: state.snippets.filter((s) => s.id !== id),
        currentSnippet: state.currentSnippet?.id === id ? null : state.currentSnippet,
    })),

    loadSnippets: async () => {
        set({ isLoading: true, error: null });
        try {
            const { filterLanguage } = get();
            const snippets = await window.deskforge.snippets.list(filterLanguage || undefined);
            set({ snippets, isLoading: false });
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
        }
    },

    searchSnippets: async (query) => {
        set({ isLoading: true, searchQuery: query });
        try {
            const snippets = await window.deskforge.snippets.search(query);
            set({ snippets, isLoading: false });
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
        }
    },

    createSnippet: async (data) => {
        set({ isLoading: true, error: null });
        try {
            const snippet = await window.deskforge.snippets.create(data);
            get().addSnippet(snippet);
            set({ currentSnippet: snippet, isLoading: false });
            return snippet;
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
            throw error;
        }
    },

    saveSnippet: async (id, data) => {
        try {
            const updated = await window.deskforge.snippets.update(id, data);
            get().updateSnippet(id, updated);
        } catch (error) {
            set({ error: (error as Error).message });
        }
    },

    deleteSnippet: async (id) => {
        try {
            await window.deskforge.snippets.delete(id);
            get().removeSnippet(id);
        } catch (error) {
            set({ error: (error as Error).message });
        }
    },
}));
