import { create } from 'zustand';
import { persist } from 'zustand/middleware';


interface PeopleUIState {
  isLeaveModalOpen: boolean;
  selectedEmployeeId: string | null;
  setLeaveModalOpen: (open: boolean) => void;
  setSelectedEmployeeId: (id: string | null) => void;
}

export const usePeopleUIStore = create<PeopleUIState>()(
  persist(
    (set) => ({
      isLeaveModalOpen: false,
      selectedEmployeeId: null,
      setLeaveModalOpen: (open) => set({ isLeaveModalOpen: open }),
      setSelectedEmployeeId: (id) => set({ selectedEmployeeId: id }),
    }),
    {
      name: 'd-arrow-people-ui-store',
    }
  )
);
