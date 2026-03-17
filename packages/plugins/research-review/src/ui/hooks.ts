import { usePluginData, usePluginAction } from "@paperclipai/plugin-sdk/ui";
import type { ResearchCard, ReviewStats } from "../constants.js";

export function usePendingCards() {
  return usePluginData<ResearchCard[]>("pending-cards");
}

export function useReviewStats() {
  return usePluginData<ReviewStats>("review-stats");
}

export function useReviewHistory() {
  return usePluginData<ResearchCard[]>("review-history");
}

export function useSwipeCard() {
  return usePluginAction("swipe-card");
}

export function useSubmitReview() {
  return usePluginAction("submit-review");
}
