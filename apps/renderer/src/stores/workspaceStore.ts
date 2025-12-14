import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Workspace {
    id: string;
    name: string;
    path: string;
    createdAt: string;
    updatedAt: string;
}

interface WorkspaceStore {
    workspaces: Workspace[];
    currentWorkspace: Workspace | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    setWorkspaces: (workspaces: Workspace[]) => void;
    setCurrentWorkspace: (workspace: Workspace | null) => void;
    addWorkspace: (workspace: Workspace) => void;
    updateWorkspace: (id: string, data: Partial<Workspace>) => void;
    removeWorkspace: (id: string) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;

    // Async actions
    loadWorkspaces: () => Promise<void>;
    createWorkspace: (name: string, path: string) => Promise<Workspace>;
    deleteWorkspace: (id: string) => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceStore>()(
    persist(
        (set, get) => ({
            workspaces: [],
            currentWorkspace: null,
            isLoading: false,
            error: null,

            setWorkspaces: (workspaces) => set({ workspaces }),
            setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),
            addWorkspace: (workspace) => set((state) => ({
                workspaces: [workspace, ...state.workspaces]
            })),
            updateWorkspace: (id, data) => set((state) => ({
                workspaces: state.workspaces.map((w) =>
                    w.id === id ? { ...w, ...data } : w
                ),
                currentWorkspace: state.currentWorkspace?.id === id
                    ? { ...state.currentWorkspace, ...data }
                    : state.currentWorkspace,
            })),
            removeWorkspace: (id) => set((state) => ({
                workspaces: state.workspaces.filter((w) => w.id !== id),
                currentWorkspace: state.currentWorkspace?.id === id
                    ? null
                    : state.currentWorkspace,
            })),
            setLoading: (isLoading) => set({ isLoading }),
            setError: (error) => set({ error }),

            loadWorkspaces: async () => {
                set({ isLoading: true, error: null });
                try {
                    const workspaces = await window.deskforge.workspace.list();
                    set({ workspaces, isLoading: false });
                } catch (error) {
                    set({ error: (error as Error).message, isLoading: false });
                }
            },

            createWorkspace: async (name, path) => {
                set({ isLoading: true, error: null });
                try {
                    const workspace = await window.deskforge.workspace.create(name, path);
                    get().addWorkspace(workspace);
                    set({ currentWorkspace: workspace, isLoading: false });
                    return workspace;
                } catch (error) {
                    set({ error: (error as Error).message, isLoading: false });
                    throw error;
                }
            },

            deleteWorkspace: async (id) => {
                set({ isLoading: true, error: null });
                try {
                    await window.deskforge.workspace.delete(id);
                    get().removeWorkspace(id);
                    set({ isLoading: false });
                } catch (error) {
                    set({ error: (error as Error).message, isLoading: false });
                    throw error;
                }
            },
        }),
        {
            name: 'deskforge-workspace',
            partialize: (state) => ({
                currentWorkspace: state.currentWorkspace
            }),
        }
    )
);
