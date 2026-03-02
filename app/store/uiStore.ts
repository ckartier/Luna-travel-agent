import { create } from 'zustand'

interface NodeState {
  activeNode: string | null;
  setActiveNode: (id: string | null) => void;
}

export const useNodeStore = create<NodeState>((set) => ({
  activeNode: null,
  setActiveNode: (id) => set({ activeNode: id }),
}))
