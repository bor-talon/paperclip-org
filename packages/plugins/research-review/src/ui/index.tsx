import { useCallback, useState, type CSSProperties } from "react";
import type {
  PluginPageProps,
  PluginWidgetProps,
  PluginSidebarProps,
} from "@paperclipai/plugin-sdk/ui";
import type { ResearchCard } from "../constants.js";
import { PAGE_ROUTE } from "../constants.js";
import { usePendingCards, useReviewStats, useReviewHistory, useSwipeCard, useSubmitReview } from "./hooks.js";
import { CardStack } from "./CardStack.js";
import { ScoreDialog } from "./ScoreDialog.js";
import { ReviewWidget } from "./DashboardWidget.js";

// ── Styles ──────────────────────────────────────────────────────────────────

const pageStyle: CSSProperties = {
  maxWidth: 900,
  margin: "0 auto",
  padding: 24,
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 24,
};

const h1Style: CSSProperties = {
  fontSize: 28,
  fontWeight: 800,
  color: "#1a1a2e",
  margin: 0,
};

const statsBarStyle: CSSProperties = {
  display: "flex",
  gap: 20,
  fontSize: 13,
  color: "#666",
};

const tabRowStyle: CSSProperties = {
  display: "flex",
  gap: 0,
  marginBottom: 24,
  borderBottom: "2px solid #e0e0e0",
};

const tabStyle = (active: boolean): CSSProperties => ({
  padding: "10px 20px",
  fontSize: 14,
  fontWeight: 600,
  color: active ? "#3949ab" : "#888",
  background: "none",
  border: "none",
  borderBottom: active ? "2px solid #3949ab" : "2px solid transparent",
  cursor: "pointer",
  marginBottom: -2,
});

const historyCardStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "12px 16px",
  borderBottom: "1px solid #f0f0f0",
};

const historyTitleStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "#333",
};

const historyMetaStyle: CSSProperties = {
  fontSize: 12,
  color: "#999",
};

const statusBadge = (status: string): CSSProperties => {
  const colors: Record<string, { bg: string; fg: string }> = {
    approved: { bg: "#e8f5e9", fg: "#2e7d32" },
    rejected: { bg: "#ffebee", fg: "#c62828" },
    "dig-deeper": { bg: "#e3f2fd", fg: "#1565c0" },
    pruned: { bg: "#f5f5f5", fg: "#999" },
  };
  const c = colors[status] ?? { bg: "#f5f5f5", fg: "#666" };
  return {
    fontSize: 11,
    fontWeight: 600,
    padding: "2px 8px",
    borderRadius: 10,
    background: c.bg,
    color: c.fg,
  };
};

const starDisplay = (score: number): string => {
  return "★".repeat(score) + "☆".repeat(5 - score);
};

// ── Main Page ───────────────────────────────────────────────────────────────

function ResearchReviewPageInner() {
  const [tab, setTab] = useState<"review" | "history">("review");
  const { data: pendingCards, loading: loadingPending, refresh: refreshPending } = usePendingCards();
  const { data: stats, refresh: refreshStats } = useReviewStats();
  const { data: history, refresh: refreshHistory } = useReviewHistory();
  const swipeCard = useSwipeCard();
  const submitReview = useSubmitReview();

  const [swipedCard, setSwipedCard] = useState<{ card: ResearchCard; direction: "right" | "left" | "up" } | null>(
    null,
  );

  const handleSwipe = useCallback(
    async (card: ResearchCard, direction: "right" | "left" | "up") => {
      await swipeCard.call({ cardId: card.id, direction });
      setSwipedCard({ card, direction });
    },
    [swipeCard],
  );

  const handleScoreSubmit = useCallback(
    async (score: number, feedback: string) => {
      if (!swipedCard) return;
      await submitReview.call({
        cardId: swipedCard.card.id,
        score,
        feedback,
      });
      setSwipedCard(null);
      refreshPending();
      refreshStats();
      refreshHistory();
    },
    [swipedCard, submitReview, refreshPending, refreshStats, refreshHistory],
  );

  const handleScoreCancel = useCallback(() => {
    setSwipedCard(null);
    refreshPending();
    refreshStats();
  }, [refreshPending, refreshStats]);

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <h1 style={h1Style}>Research Review</h1>
        <div style={statsBarStyle}>
          <span>
            <strong>{pendingCards?.length ?? 0}</strong> pending
          </span>
          <span>
            <strong>{stats?.totalReviewed ?? 0}</strong> reviewed
          </span>
          <span>
            avg <strong>{stats?.avgScore?.toFixed(1) ?? "—"}</strong>
          </span>
        </div>
      </div>

      <div style={tabRowStyle}>
        <button style={tabStyle(tab === "review")} onClick={() => setTab("review")}>
          Review
        </button>
        <button style={tabStyle(tab === "history")} onClick={() => setTab("history")}>
          History
        </button>
      </div>

      {tab === "review" && (
        <>
          {loadingPending ? (
            <div style={{ textAlign: "center", padding: 40, color: "#999" }}>Loading...</div>
          ) : (
            <CardStack cards={pendingCards ?? []} onSwipe={handleSwipe} />
          )}
        </>
      )}

      {tab === "history" && (
        <div>
          {(!history || history.length === 0) && (
            <div style={{ textAlign: "center", padding: 40, color: "#999" }}>No reviews yet.</div>
          )}
          {history?.map((card) => (
            <div key={card.id} style={historyCardStyle}>
              <div>
                <div style={historyTitleStyle}>{card.title}</div>
                <div style={historyMetaStyle}>
                  {card.reviewedAt ? new Date(card.reviewedAt).toLocaleDateString() : ""}
                  {card.score != null && (
                    <span style={{ marginLeft: 8, color: "#ffc107" }}>{starDisplay(card.score)}</span>
                  )}
                </div>
              </div>
              <span style={statusBadge(card.status)}>{card.status}</span>
            </div>
          ))}
        </div>
      )}

      {swipedCard && (
        <ScoreDialog
          direction={swipedCard.direction}
          onSubmit={handleScoreSubmit}
          onCancel={handleScoreCancel}
        />
      )}
    </div>
  );
}

// ── Exports (match manifest slot exportNames) ──────────────────────────────

export function ResearchReviewPage(_props: PluginPageProps) {
  return <ResearchReviewPageInner />;
}

export { ReviewWidget } from "./DashboardWidget.js";

export function ResearchReviewSidebarLink(_props: PluginSidebarProps) {
  return (
    <a
      href={`/plugins/${PAGE_ROUTE}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 12px",
        fontSize: 14,
        color: "#333",
        textDecoration: "none",
        borderRadius: 6,
      }}
    >
      <span style={{ fontSize: 18 }}>🔬</span>
      Research Review
    </a>
  );
}
