import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Agent } from '../types';
import { DEFAULT_AGENTS } from '../constants';

interface AgentState {
  agents: Agent[];
  selectedAgentId: string | null;
  addAgent: (agent: Omit<Agent, 'id'>) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  deleteAgent: (id: string) => void;
  selectAgent: (id: string | null) => void;
  getAgent: (id: string) => Agent | undefined;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

export const useAgentStore = create<AgentState>()(
  persist(
    (set, get) => ({
      agents: DEFAULT_AGENTS,
      selectedAgentId: null,

      addAgent: (agent) => {
        const newAgent: Agent = {
          ...agent,
          id: generateId(),
        };
        set((state) => ({ agents: [...state.agents, newAgent] }));
      },

      updateAgent: (id, updates) => {
        set((state) => ({
          agents: state.agents.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        }));
      },

      deleteAgent: (id) => {
        set((state) => ({
          agents: state.agents.filter((a) => a.id !== id),
          selectedAgentId: state.selectedAgentId === id ? null : state.selectedAgentId,
        }));
      },

      selectAgent: (id) => {
        set({ selectedAgentId: id });
      },

      getAgent: (id) => {
        return get().agents.find((a) => a.id === id);
      },
    }),
    {
      name: 'org-chart-agents',
    }
  )
);
