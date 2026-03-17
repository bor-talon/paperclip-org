import type { CSSProperties } from "react";
import type { PluginWidgetProps } from "@paperclipai/plugin-sdk/ui";
import { useReviewStats, usePendingCards } from "./hooks.js";
import { PAGE_ROUTE } from "../constants.js";

const widgetStyle: CSSProperties = {
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const statRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const labelStyle: CSSProperties = {
  fontSize: 13,
  color: "#666",
};

const valueStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: "#1a1a2e",
};

const linkStyle: CSSProperties = {
  fontSize: 13,
  color: "#3949ab",
  textDecoration: "none",
  fontWeight: 600,
  marginTop: 4,
};

export function ReviewWidget(_props: PluginWidgetProps) {
  const { data: stats } = useReviewStats();
  const { data: pending } = usePendingCards();

  const pendingCount = pending?.length ?? 0;

  return (
    <div style={widgetStyle}>
      <div style={statRowStyle}>
        <span style={labelStyle}>Pending</span>
        <span style={{ ...valueStyle, color: pendingCount > 0 ? "#e65100" : "#4caf50" }}>
          {pendingCount}
        </span>
      </div>
      <div style={statRowStyle}>
        <span style={labelStyle}>Reviewed</span>
        <span style={valueStyle}>{stats?.totalReviewed ?? 0}</span>
      </div>
      <div style={statRowStyle}>
        <span style={labelStyle}>Avg Score</span>
        <span style={valueStyle}>{stats?.avgScore?.toFixed(1) ?? "—"}</span>
      </div>
      <a href={`/plugins/${PAGE_ROUTE}`} style={linkStyle}>
        Open Review →
      </a>
    </div>
  );
}
