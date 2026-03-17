import { randomUUID } from "node:crypto";
import {
  definePlugin,
  runWorker,
  type PaperclipPlugin,
  type PluginContext,
  type PluginHealthDiagnostics,
  type PluginJobContext,
  type PluginWebhookInput,
} from "@paperclipai/plugin-sdk";
import {
  JOB_KEYS,
  WEBHOOK_KEYS,
  type FeedbackEntry,
  type ResearchCard,
  type ReviewStats,
} from "./constants.js";

let currentContext: PluginContext | null = null;

// ── State helpers ──────────────────────────────────────────────────────────

async function setState(ctx: PluginContext, key: string, value: unknown): Promise<void> {
  await ctx.state.set({ scopeKind: "instance", stateKey: key }, value);
}

async function getState<T = unknown>(ctx: PluginContext, key: string): Promise<T | null> {
  return (await ctx.state.get({ scopeKind: "instance", stateKey: key })) as T | null;
}

// ── Card helpers ───────────────────────────────────────────────────────────

async function getAllCards(ctx: PluginContext): Promise<ResearchCard[]> {
  const keys = (await getState<string[]>(ctx, "card-index")) ?? [];
  const cards: ResearchCard[] = [];
  for (const key of keys) {
    const card = await getState<ResearchCard>(ctx, key);
    if (card) cards.push(card);
  }
  return cards;
}

async function addCardToIndex(ctx: PluginContext, cardKey: string): Promise<void> {
  const keys = (await getState<string[]>(ctx, "card-index")) ?? [];
  if (!keys.includes(cardKey)) {
    keys.push(cardKey);
    await setState(ctx, "card-index", keys);
  }
}

async function computeStats(ctx: PluginContext): Promise<ReviewStats> {
  const cards = await getAllCards(ctx);
  const reviewed = cards.filter((c) => c.status !== "pending" && c.status !== "pruned");
  const totalReviewed = reviewed.length;
  const avgScore =
    totalReviewed > 0
      ? reviewed.reduce((sum, c) => sum + (c.score ?? 0), 0) / totalReviewed
      : 0;
  const rejectCount = reviewed.filter((c) => c.status === "rejected").length;
  const digDeeperCount = reviewed.filter((c) => c.status === "dig-deeper").length;
  const topCategories: Record<string, number> = {};
  for (const card of reviewed) {
    const cat = card.relevanceCategory || "uncategorized";
    topCategories[cat] = (topCategories[cat] ?? 0) + 1;
  }
  return {
    totalReviewed,
    avgScore: Math.round(avgScore * 100) / 100,
    topCategories,
    rejectRate: totalReviewed > 0 ? Math.round((rejectCount / totalReviewed) * 100) / 100 : 0,
    digDeeperRate: totalReviewed > 0 ? Math.round((digDeeperCount / totalReviewed) * 100) / 100 : 0,
  };
}

// ── Registration functions ─────────────────────────────────────────────────

async function registerDataHandlers(ctx: PluginContext): Promise<void> {
  ctx.data.register("pending-cards", async () => {
    const cards = await getAllCards(ctx);
    return cards.filter((c) => c.status === "pending").sort((a, b) => {
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    });
  });

  ctx.data.register("review-stats", async () => {
    return await computeStats(ctx);
  });

  ctx.data.register("review-history", async () => {
    const cards = await getAllCards(ctx);
    return cards
      .filter((c) => c.status !== "pending")
      .sort((a, b) => {
        const aTime = a.reviewedAt ? new Date(a.reviewedAt).getTime() : 0;
        const bTime = b.reviewedAt ? new Date(b.reviewedAt).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 50);
  });

  ctx.data.register("plugin-config", async () => {
    return await ctx.config.get();
  });
}

async function registerActionHandlers(ctx: PluginContext): Promise<void> {
  ctx.actions.register("swipe-card", async (params) => {
    const { cardId, direction } = params as { cardId: string; direction: "right" | "left" | "up" };
    const cardKey = `card:${cardId}`;
    const card = await getState<ResearchCard>(ctx, cardKey);
    if (!card) throw new Error(`Card ${cardId} not found`);

    const statusMap: Record<string, ResearchCard["status"]> = {
      right: "approved",
      left: "rejected",
      up: "dig-deeper",
    };
    card.status = statusMap[direction] ?? "approved";
    card.swipeDirection = direction;
    card.reviewedAt = new Date().toISOString();
    await setState(ctx, cardKey, card);
    return { ok: true, card };
  });

  ctx.actions.register("submit-review", async (params) => {
    const { cardId, score, feedback } = params as {
      cardId: string;
      score: number;
      feedback?: string;
    };
    const cardKey = `card:${cardId}`;
    const card = await getState<ResearchCard>(ctx, cardKey);
    if (!card) throw new Error(`Card ${cardId} not found`);
    if (!card.swipeDirection) throw new Error(`Card ${cardId} has not been swiped yet — call swipe-card first`);

    card.score = score;
    card.feedback = feedback ?? "";
    await setState(ctx, cardKey, card);

    // Add to feedback queue
    const queue = (await getState<FeedbackEntry[]>(ctx, "feedback-queue")) ?? [];
    queue.push({
      cardId,
      score,
      feedback: feedback ?? "",
      direction: card.swipeDirection,
      timestamp: new Date().toISOString(),
    });
    await setState(ctx, "feedback-queue", queue);

    // Recompute stats
    const stats = await computeStats(ctx);
    await setState(ctx, "review-stats", stats);

    return { ok: true, card, stats };
  });

  ctx.actions.register("flush-feedback", async () => {
    const queue = (await getState<FeedbackEntry[]>(ctx, "feedback-queue")) ?? [];
    await setState(ctx, "feedback-queue", []);
    return { ok: true, flushed: queue.length, entries: queue };
  });
}

async function registerJobHandlers(ctx: PluginContext): Promise<void> {
  ctx.jobs.register(JOB_KEYS.weeklyPrune, async (_jobCtx: PluginJobContext): Promise<void> => {
    const cards = await getAllCards(ctx);
    const now = Date.now();
    const fourteenDays = 14 * 24 * 60 * 60 * 1000;

    for (const card of cards) {
      const shouldPrune =
        (card.status !== "pruned" && card.score != null && card.score <= 2) ||
        (card.status === "pending" &&
          now - new Date(card.submittedAt).getTime() > fourteenDays);

      if (shouldPrune) {
        card.status = "pruned";
        card.reviewedAt = card.reviewedAt ?? new Date().toISOString();
        await setState(ctx, `card:${card.id}`, card);
      }
    }

    const stats = await computeStats(ctx);
    await setState(ctx, "review-stats", stats);
  });
}

// ── Plugin definition ──────────────────────────────────────────────────────

const plugin: PaperclipPlugin = definePlugin({
  async setup(ctx) {
    currentContext = ctx;
    await registerDataHandlers(ctx);
    await registerActionHandlers(ctx);
    await registerJobHandlers(ctx);
  },

  async onHealth(): Promise<PluginHealthDiagnostics> {
    if (!currentContext) {
      return { status: "ok", message: "Research Review plugin loaded (no context yet)" };
    }
    const stats = await computeStats(currentContext);
    return {
      status: "ok",
      message: "Research Review plugin ready",
      details: {
        totalReviewed: stats.totalReviewed,
        avgScore: stats.avgScore,
      },
    };
  },

  async onWebhook(input: PluginWebhookInput): Promise<void> {
    if (input.endpointKey !== WEBHOOK_KEYS.submitCard) {
      throw new Error(`Unknown webhook endpoint "${input.endpointKey}"`);
    }
    const ctx = currentContext;
    if (!ctx) throw new Error("Plugin not initialized");

    const body = input.parsedBody as {
      title?: string;
      source?: string;
      tags?: string[];
      summary?: string;
      confidence?: number;
      category?: string;
    };

    if (!body.title || !body.summary) {
      throw new Error("Missing required fields: title, summary");
    }

    const id = randomUUID();
    const card: ResearchCard = {
      id,
      title: body.title,
      source: body.source ?? "",
      tags: body.tags ?? [],
      summary: body.summary,
      cairoConfidence: typeof body.confidence === "number" ? body.confidence : 0.5,
      relevanceCategory: body.category ?? "general",
      submittedAt: new Date().toISOString(),
      status: "pending",
    };

    const cardKey = `card:${id}`;
    await setState(ctx, cardKey, card);
    await addCardToIndex(ctx, cardKey);
  },

  async onShutdown() {
    currentContext = null;
  },
});

export default plugin;
runWorker(plugin, import.meta.url);
