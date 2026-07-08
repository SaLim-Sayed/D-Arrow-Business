import { create } from "zustand";
import { persist } from "zustand/middleware";
import { STORAGE_KEYS } from "@/lib/constants";

interface LayoutState {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  portalPickerOpen: boolean;
  portalFabPosition: { x: number; y: number } | null;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileSidebarOpen: (open: boolean) => void;
  setPortalPickerOpen: (open: boolean) => void;
  setPortalFabPosition: (position: { x: number; y: number } | null) => void;
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      mobileSidebarOpen: false,
      portalPickerOpen: false,
      portalFabPosition: null,
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) =>
        set({ sidebarCollapsed: collapsed }),
      setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
      setPortalPickerOpen: (open) => set({ portalPickerOpen: open }),
      setPortalFabPosition: (position) => set({ portalFabPosition: position }),
    }),
    {
      name: STORAGE_KEYS.LAYOUT,
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        portalFabPosition: state.portalFabPosition,
      }),
    }
  )
);
