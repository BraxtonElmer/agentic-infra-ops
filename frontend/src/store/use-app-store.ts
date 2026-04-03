import { create } from 'zustand';

interface AppState {
  agentDrawerOpen: boolean;
  openAgentDrawer: () => void;
  closeAgentDrawer: () => void;
  toggleAgentDrawer: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  agentDrawerOpen: false,
  openAgentDrawer: () => set({ agentDrawerOpen: true }),
  closeAgentDrawer: () => set({ agentDrawerOpen: false }),
  toggleAgentDrawer: () => set((s) => ({ agentDrawerOpen: !s.agentDrawerOpen })),
}));
