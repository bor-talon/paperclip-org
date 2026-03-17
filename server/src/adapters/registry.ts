/**
 * Adapter registry — loads adapter packages dynamically to gracefully handle
 * missing packages (e.g. in Vercel serverless where local adapters aren't installed).
 */
import type { ServerAdapterModule } from "./types.js";
import { processAdapter } from "./process/index.js";
import { httpAdapter } from "./http/index.js";

const adaptersByType = new Map<string, ServerAdapterModule>([
  [processAdapter.type, processAdapter],
  [httpAdapter.type, httpAdapter],
]);

async function tryLoad(
  type: string,
  loader: () => Promise<ServerAdapterModule>,
): Promise<void> {
  try {
    const adapter = await loader();
    adaptersByType.set(type, adapter);
  } catch {
    // Adapter package not available — skip silently (expected in serverless)
  }
}

// Load all optional adapters in parallel at startup.
// Missing packages are silently skipped.
const _ready = Promise.allSettled([
  tryLoad("claude_local", async () => {
    const { execute, testEnvironment, sessionCodec } = await import("@paperclipai/adapter-claude-local/server");
    const { agentConfigurationDoc, models } = await import("@paperclipai/adapter-claude-local");
    return { type: "claude_local", execute, testEnvironment, sessionCodec, models, supportsLocalAgentJwt: true, agentConfigurationDoc };
  }),
  tryLoad("codex_local", async () => {
    const { execute, testEnvironment, sessionCodec } = await import("@paperclipai/adapter-codex-local/server");
    const { agentConfigurationDoc, models } = await import("@paperclipai/adapter-codex-local");
    const { listCodexModels } = await import("./codex-models.js");
    return { type: "codex_local", execute, testEnvironment, sessionCodec, models, listModels: listCodexModels, supportsLocalAgentJwt: true, agentConfigurationDoc };
  }),
  tryLoad("cursor", async () => {
    const { execute, testEnvironment, sessionCodec } = await import("@paperclipai/adapter-cursor-local/server");
    const { agentConfigurationDoc, models } = await import("@paperclipai/adapter-cursor-local");
    const { listCursorModels } = await import("./cursor-models.js");
    return { type: "cursor", execute, testEnvironment, sessionCodec, models, listModels: listCursorModels, supportsLocalAgentJwt: true, agentConfigurationDoc };
  }),
  tryLoad("gemini_local", async () => {
    const { execute, testEnvironment, sessionCodec } = await import("@paperclipai/adapter-gemini-local/server");
    const { agentConfigurationDoc, models } = await import("@paperclipai/adapter-gemini-local");
    return { type: "gemini_local", execute, testEnvironment, sessionCodec, models, supportsLocalAgentJwt: true, agentConfigurationDoc };
  }),
  tryLoad("openclaw_gateway", async () => {
    const { execute, testEnvironment } = await import("@paperclipai/adapter-openclaw-gateway/server");
    const { agentConfigurationDoc, models } = await import("@paperclipai/adapter-openclaw-gateway");
    return { type: "openclaw_gateway", execute, testEnvironment, models, supportsLocalAgentJwt: false, agentConfigurationDoc };
  }),
  tryLoad("opencode_local", async () => {
    const { execute, testEnvironment, sessionCodec, listOpenCodeModels } = await import("@paperclipai/adapter-opencode-local/server");
    const { agentConfigurationDoc } = await import("@paperclipai/adapter-opencode-local");
    return { type: "opencode_local", execute, testEnvironment, sessionCodec, models: [], listModels: listOpenCodeModels, supportsLocalAgentJwt: true, agentConfigurationDoc };
  }),
  tryLoad("pi_local", async () => {
    const { execute, testEnvironment, sessionCodec, listPiModels } = await import("@paperclipai/adapter-pi-local/server");
    const { agentConfigurationDoc } = await import("@paperclipai/adapter-pi-local");
    return { type: "pi_local", execute, testEnvironment, sessionCodec, models: [], listModels: listPiModels, supportsLocalAgentJwt: true, agentConfigurationDoc };
  }),
  tryLoad("hermes_local", async () => {
    const { execute, testEnvironment, sessionCodec } = await import("hermes-paperclip-adapter/server");
    const { agentConfigurationDoc, models } = await import("hermes-paperclip-adapter");
    return { type: "hermes_local", execute, testEnvironment, sessionCodec, models, supportsLocalAgentJwt: true, agentConfigurationDoc };
  }),
]);

/** Wait for all adapters to finish loading. Call before first use in async contexts. */
export async function ensureAdaptersLoaded(): Promise<void> {
  await _ready;
}

export function getServerAdapter(type: string): ServerAdapterModule {
  const adapter = adaptersByType.get(type);
  if (!adapter) {
    return processAdapter;
  }
  return adapter;
}

export async function listAdapterModels(type: string): Promise<{ id: string; label: string }[]> {
  await _ready;
  const adapter = adaptersByType.get(type);
  if (!adapter) return [];
  if (adapter.listModels) {
    const discovered = await adapter.listModels();
    if (discovered.length > 0) return discovered;
  }
  return adapter.models ?? [];
}

export function listServerAdapters(): ServerAdapterModule[] {
  return Array.from(adaptersByType.values());
}

export function findServerAdapter(type: string): ServerAdapterModule | null {
  return adaptersByType.get(type) ?? null;
}
