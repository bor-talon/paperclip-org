import { useCallback, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import type { ResearchCard } from "../constants.js";
import { ReviewCardDisplay } from "./ReviewCard.js";

const SWIPE_THRESHOLD = 100;
const SWIPE_UP_THRESHOLD = 80;

const containerStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  maxWidth: 420,
  minHeight: 380,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0 auto",
};

const emptyStyle: CSSProperties = {
  textAlign: "center",
  color: "#999",
  fontSize: 16,
  padding: 40,
};

const hintStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  width: "100%",
  maxWidth: 420,
  margin: "8px auto 0",
  fontSize: 12,
  color: "#aaa",
};

const flashColors: Record<string, string> = {
  right: "rgba(76, 175, 80, 0.25)",
  left: "rgba(244, 67, 54, 0.25)",
  up: "rgba(33, 150, 243, 0.25)",
};

const overlayLabels: Record<string, { text: string; color: string }> = {
  right: { text: "APPROVE", color: "#4caf50" },
  left: { text: "REJECT", color: "#f44336" },
  up: { text: "DIG DEEPER", color: "#2196f3" },
};

type CardStackProps = {
  cards: ResearchCard[];
  onSwipe: (card: ResearchCard, direction: "right" | "left" | "up") => void;
};

export function CardStack({ cards, onSwipe }: CardStackProps) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const startRef = useRef({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const topCard = cards[0] ?? null;

  const getDirection = useCallback((): "right" | "left" | "up" | null => {
    if (offset.y < -SWIPE_UP_THRESHOLD && Math.abs(offset.y) > Math.abs(offset.x)) return "up";
    if (offset.x > SWIPE_THRESHOLD) return "right";
    if (offset.x < -SWIPE_THRESHOLD) return "left";
    return null;
  }, [offset]);

  const onPointerDown = useCallback(
    (e: PointerEvent) => {
      if (!topCard) return;
      setIsDragging(true);
      startRef.current = { x: e.clientX, y: e.clientY };
      cardRef.current?.setPointerCapture(e.pointerId);
    },
    [topCard],
  );

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDragging) return;
      setOffset({
        x: e.clientX - startRef.current.x,
        y: e.clientY - startRef.current.y,
      });
    },
    [isDragging],
  );

  const onPointerUp = useCallback(() => {
    if (!isDragging || !topCard) return;
    setIsDragging(false);
    const dir = getDirection();
    if (dir) {
      setFlash(dir);
      setTimeout(() => setFlash(null), 300);
      setOffset({ x: 0, y: 0 });
      onSwipe(topCard, dir);
    } else {
      setOffset({ x: 0, y: 0 });
    }
  }, [isDragging, topCard, getDirection, onSwipe]);

  const rotation = isDragging ? offset.x * 0.08 : 0;
  const cardTransform = isDragging
    ? `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg)`
    : "translate(0, 0) rotate(0deg)";

  const activeDir = isDragging ? getDirection() : null;

  if (!topCard) {
    return (
      <div style={containerStyle}>
        <div style={emptyStyle}>
          No pending research cards.
          <br />
          Cairo will submit new findings soon.
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        style={{
          ...containerStyle,
          background: flash ? flashColors[flash] : "transparent",
          borderRadius: 20,
          transition: flash ? "background 0.3s" : "none",
        }}
      >
        {/* Direction overlay label */}
        {activeDir && (
          <div
            style={{
              position: "absolute",
              top: 20,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 10,
              fontSize: 24,
              fontWeight: 800,
              color: overlayLabels[activeDir]!.color,
              letterSpacing: 3,
              opacity: 0.8,
              pointerEvents: "none",
            }}
          >
            {overlayLabels[activeDir]!.text}
          </div>
        )}

        {/* Background card (next in stack) */}
        {cards[1] && (
          <div
            style={{
              position: "absolute",
              transform: "scale(0.95)",
              opacity: 0.5,
              pointerEvents: "none",
            }}
          >
            <ReviewCardDisplay card={cards[1]} />
          </div>
        )}

        {/* Top card (draggable) */}
        <div
          ref={cardRef}
          style={{
            transform: cardTransform,
            transition: isDragging ? "none" : "transform 0.3s ease",
            cursor: isDragging ? "grabbing" : "grab",
            touchAction: "none",
            zIndex: 5,
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <ReviewCardDisplay card={topCard} />
        </div>
      </div>
      <div style={hintStyle}>
        <span>← Reject</span>
        <span>↑ Dig Deeper</span>
        <span>Approve →</span>
      </div>
    </>
  );
}
