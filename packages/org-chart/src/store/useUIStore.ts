import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface UIState {
  theme: Theme;
  showSidebar: boolean;
  isDetailPanelOpen: boolean;
  setTheme: (theme: Theme) => void;
  toggleSidebar: () => void;
  setDetailPanelOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'system',
      showSidebar: true,
      isDetailPanelOpen: false,

      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((state) => ({ showSidebar: !state.showSidebar })),
      setDetailPanelOpen: (open) => set({ isDetailPanelOpen: open }),
    }),
    {
      name: 'org-chart-ui',
    }
  )
);
