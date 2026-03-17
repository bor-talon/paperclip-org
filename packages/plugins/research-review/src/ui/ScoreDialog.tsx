import { useState, type CSSProperties } from "react";

const overlayStyle: CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
};

const dialogStyle: CSSProperties = {
  background: "#fff",
  borderRadius: 16,
  padding: 28,
  width: "90%",
  maxWidth: 380,
  display: "flex",
  flexDirection: "column",
  gap: 16,
};

const titleStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: "#1a1a2e",
  margin: 0,
};

const starRowStyle: CSSProperties = {
  display: "flex",
  gap: 8,
  justifyContent: "center",
};

const starStyle = (active: boolean): CSSProperties => ({
  fontSize: 32,
  cursor: "pointer",
  color: active ? "#ffc107" : "#ddd",
  transition: "color 0.15s",
  userSelect: "none",
});

const textareaStyle: CSSProperties = {
  width: "100%",
  minHeight: 80,
  borderRadius: 8,
  border: "1px solid #ddd",
  padding: 10,
  fontSize: 14,
  fontFamily: "inherit",
  resize: "vertical",
  boxSizing: "border-box",
};

const btnStyle: CSSProperties = {
  padding: "10px 20px",
  borderRadius: 8,
  border: "none",
  background: "#3949ab",
  color: "#fff",
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
};

const btnRowStyle: CSSProperties = {
  display: "flex",
  gap: 10,
  justifyContent: "flex-end",
};

type ScoreDialogProps = {
  direction: "right" | "left" | "up";
  onSubmit: (score: number, feedback: string) => void;
  onCancel: () => void;
};

export function ScoreDialog({ direction, onSubmit, onCancel }: ScoreDialogProps) {
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");

  const prompt =
    direction === "left"
      ? "Why wasn't this useful?"
      : direction === "up"
        ? "What should Cairo dig deeper on?"
        : "Rate this finding";

  return (
    <div style={overlayStyle} onClick={onCancel}>
      <div style={dialogStyle} onClick={(e) => e.stopPropagation()}>
        <h3 style={titleStyle}>{prompt}</h3>
        <div style={starRowStyle}>
          {[1, 2, 3, 4, 5].map((n) => (
            <span key={n} style={starStyle(n <= score)} onClick={() => setScore(n)}>
              ★
            </span>
          ))}
        </div>
        <textarea
          style={textareaStyle}
          placeholder="Optional feedback..."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
        />
        <div style={btnRowStyle}>
          <button
            style={{ ...btnStyle, background: "#e0e0e0", color: "#333" }}
            onClick={onCancel}
          >
            Skip
          </button>
          <button
            style={{ ...btnStyle, opacity: score === 0 ? 0.5 : 1 }}
            disabled={score === 0}
            onClick={() => onSubmit(score, feedback)}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
