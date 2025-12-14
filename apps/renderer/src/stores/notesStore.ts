import { create } from 'zustand';

export interface Note {
    id: string;
    workspaceId: string;
    title: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}

interface NotesStore {
    notes: Note[];
    currentNote: Note | null;
    isLoading: boolean;
    isSaving: boolean;
    error: string | null;

    // Actions
    setNotes: (notes: Note[]) => void;
    setCurrentNote: (note: Note | null) => void;
    addNote: (note: Note) => void;
    updateNote: (id: string, data: Partial<Note>) => void;
    removeNote: (id: string) => void;
    setLoading: (loading: boolean) => void;
    setSaving: (saving: boolean) => void;

    // Async actions
    loadNotes: (workspaceId: string) => Promise<void>;
    createNote: (workspaceId: string, title: string) => Promise<Note>;
    saveNote: (id: string, content: string) => Promise<void>;
    deleteNote: (id: string) => Promise<void>;
}

export const useNotesStore = create<NotesStore>((set, get) => ({
    notes: [],
    currentNote: null,
    isLoading: false,
    isSaving: false,
    error: null,

    setNotes: (notes) => set({ notes }),
    setCurrentNote: (note) => set({ currentNote: note }),
    addNote: (note) => set((state) => ({ notes: [note, ...state.notes] })),
    updateNote: (id, data) => set((state) => ({
        notes: state.notes.map((n) => n.id === id ? { ...n, ...data } : n),
        currentNote: state.currentNote?.id === id
            ? { ...state.currentNote, ...data }
            : state.currentNote,
    })),
    removeNote: (id) => set((state) => ({
        notes: state.notes.filter((n) => n.id !== id),
        currentNote: state.currentNote?.id === id ? null : state.currentNote,
    })),
    setLoading: (isLoading) => set({ isLoading }),
    setSaving: (isSaving) => set({ isSaving }),

    loadNotes: async (workspaceId) => {
        set({ isLoading: true, error: null });
        try {
            const notes = await window.deskforge.notes.list(workspaceId);
            set({ notes, isLoading: false });
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
        }
    },

    createNote: async (workspaceId, title) => {
        set({ isLoading: true, error: null });
        try {
            const note = await window.deskforge.notes.create(workspaceId, title, '');
            get().addNote(note);
            set({ currentNote: note, isLoading: false });
            return note;
        } catch (error) {
            set({ error: (error as Error).message, isLoading: false });
            throw error;
        }
    },

    saveNote: async (id, content) => {
        set({ isSaving: true });
        try {
            const updated = await window.deskforge.notes.update(id, { content });
            get().updateNote(id, updated);
            set({ isSaving: false });
        } catch (error) {
            set({ error: (error as Error).message, isSaving: false });
        }
    },

    deleteNote: async (id) => {
        try {
            await window.deskforge.notes.delete(id);
            get().removeNote(id);
        } catch (error) {
            set({ error: (error as Error).message });
        }
    },
}));
