import type { Agent, Pod, Viewport } from '../types';

export const DEFAULT_VIEWPORT: Viewport = {
  x: 0,
  y: 0,
  zoom: 1,
};

export const DEFAULT_AGENTS: Agent[] = [
  {
    id: 'echo',
    name: 'Echo',
    role: 'Team Lead',
    description: 'Echo is the team lead agent',
    avatar: '',
    skills: ['task-assignment', 'coordination'],
    tier: 'oversight',
    files: [
      { name: 'AGENTS.md', content: '# AGENTS.md\n\nTeam coordination agent.' },
      { name: 'SOUL.md', content: '# SOUL.md\n\nI am Echo, the team lead.' },
    ],
  },
  {
    id: 'talon',
    name: 'Talon',
    role: 'Lead Engineer',
    description: 'Lead software engineer',
    avatar: '',
    skills: ['coding', 'implementation'],
    tier: 'senior',
    podId: 'engineering',
    files: [],
  },
  {
    id: 'cairo',
    name: 'Cairo',
    role: 'Research Agent',
    description: 'Research and analysis',
    avatar: '',
    skills: ['research', 'analysis'],
    tier: 'senior',
    files: [],
  },
];

export const DEFAULT_PODS: Pod[] = [
  {
    id: 'engineering',
    name: 'Engineering',
    description: 'Software development team',
    agents: ['talon'],
  },
];

export const TIER_COLORS = {
  oversight: '#8b5cf6',
  senior: '#3b82f6',
  junior: '#22c55e',
} as const;
