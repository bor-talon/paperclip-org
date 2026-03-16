export const NODE_WIDTH = 220;
export const NODE_HEIGHT = 80;
export const GROUP_PADDING = 40;

export const STATUS_COLORS: Record<string, string> = {
  running: "bg-cyan-400",
  active: "bg-green-400",
  paused: "bg-yellow-400",
  idle: "bg-yellow-400",
  error: "bg-red-400",
  terminated: "bg-neutral-400",
  pending_approval: "bg-amber-400",
};

export const STATUS_COLOR_DEFAULT = "bg-neutral-400";

export const ADAPTER_LABELS: Record<string, string> = {
  claude_local: "Claude",
  codex_local: "Codex",
  gemini_local: "Gemini",
  opencode_local: "OpenCode",
  cursor: "Cursor",
  openclaw_gateway: "OpenClaw",
  process: "Process",
  http: "HTTP",
};

export const POSITIONS_STORAGE_KEY = "orgchart-positions";
export const FILES_STORAGE_KEY = "orgchart-agent-files";
