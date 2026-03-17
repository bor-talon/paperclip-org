export const PLUGIN_ID = "research-review";
export const PLUGIN_VERSION = "0.1.0";
export const PAGE_ROUTE = "research-review";

export const SLOT_IDS = {
  page: "review-page",
  dashboardWidget: "review-widget",
  sidebar: "review-sidebar",
} as const;

export const EXPORT_NAMES = {
  page: "ResearchReviewPage",
  dashboardWidget: "ReviewWidget",
  sidebar: "ResearchReviewSidebarLink",
} as const;

export const JOB_KEYS = {
  weeklyPrune: "weekly-prune",
} as const;

export const WEBHOOK_KEYS = {
  submitCard: "submit-card",
} as const;

export const CARD_STATUSES = ["pending", "approved", "rejected", "dig-deeper", "pruned"] as const;
export type CardStatus = (typeof CARD_STATUSES)[number];

export type ResearchCard = {
  id: string;
  title: string;
  source: string;
  tags: string[];
  summary: string;
  cairoConfidence: number;
  relevanceCategory: string;
  submittedAt: string;
  status: CardStatus;
  reviewedAt?: string;
  swipeDirection?: "right" | "left" | "up";
  score?: number;
  feedback?: string;
};

export type ReviewStats = {
  totalReviewed: number;
  avgScore: number;
  topCategories: Record<string, number>;
  rejectRate: number;
  digDeeperRate: number;
};

export type FeedbackEntry = {
  cardId: string;
  score: number;
  feedback: string;
  direction: string;
  timestamp: string;
};
