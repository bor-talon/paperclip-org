import type { CSSProperties } from "react";
import type { ResearchCard } from "../constants.js";

const cardStyle: CSSProperties = {
  background: "#fff",
  borderRadius: 16,
  boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
  padding: 24,
  width: "100%",
  maxWidth: 400,
  minHeight: 320,
  display: "flex",
  flexDirection: "column",
  gap: 12,
  userSelect: "none",
};

const titleStyle: CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  color: "#1a1a2e",
  margin: 0,
  lineHeight: 1.3,
};

const summaryStyle: CSSProperties = {
  fontSize: 14,
  color: "#444",
  lineHeight: 1.6,
  flex: 1,
};

const tagContainerStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 6,
};

const tagStyle: CSSProperties = {
  background: "#e8eaf6",
  color: "#3949ab",
  fontSize: 11,
  fontWeight: 600,
  padding: "3px 8px",
  borderRadius: 12,
};

const categoryBadgeStyle: CSSProperties = {
  background: "#fff3e0",
  color: "#e65100",
  fontSize: 11,
  fontWeight: 600,
  padding: "3px 10px",
  borderRadius: 12,
  alignSelf: "flex-start",
};

const confidenceBarOuter: CSSProperties = {
  background: "#e0e0e0",
  borderRadius: 4,
  height: 6,
  width: "100%",
};

const sourceLinkStyle: CSSProperties = {
  fontSize: 12,
  color: "#1976d2",
  textDecoration: "none",
  wordBreak: "break-all",
};

const metaRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 8,
};

export function ReviewCardDisplay({ card }: { card: ResearchCard }) {
  const confidencePct = Math.round(card.cairoConfidence * 100);
  return (
    <div style={cardStyle}>
      <div style={metaRowStyle}>
        <span style={categoryBadgeStyle}>{card.relevanceCategory}</span>
        <span style={{ fontSize: 11, color: "#999" }}>
          {confidencePct}% confidence
        </span>
      </div>
      <h3 style={titleStyle}>{card.title}</h3>
      <p style={summaryStyle}>{card.summary}</p>
      {card.tags.length > 0 && (
        <div style={tagContainerStyle}>
          {card.tags.map((tag) => (
            <span key={tag} style={tagStyle}>
              {tag}
            </span>
          ))}
        </div>
      )}
      <div style={confidenceBarOuter}>
        <div
          style={{
            background: confidencePct >= 70 ? "#4caf50" : confidencePct >= 40 ? "#ff9800" : "#f44336",
            height: "100%",
            borderRadius: 4,
            width: `${confidencePct}%`,
            transition: "width 0.3s",
          }}
        />
      </div>
      {card.source && (
        <a href={card.source} target="_blank" rel="noopener noreferrer" style={sourceLinkStyle}>
          {card.source.length > 60 ? card.source.slice(0, 60) + "…" : card.source}
        </a>
      )}
    </div>
  );
}
