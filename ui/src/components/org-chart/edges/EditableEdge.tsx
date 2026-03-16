import { memo, useCallback, useMemo } from "react";
import {
  BaseEdge,
  getSmoothStepPath,
  type EdgeProps,
  useReactFlow,
} from "@xyflow/react";

/**
 * Editable edge: renders as a smooth step path.
 * When selected, shows draggable midpoint handles that create waypoints.
 * Waypoints are stored in edge.data.waypoints as {x,y}[].
 */

interface WaypointEdgeData {
  waypoints?: { x: number; y: number }[];
  [key: string]: unknown;
}

function EditableEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  selected,
  data,
}: EdgeProps) {
  const { setEdges } = useReactFlow();
  const edgeData = (data ?? {}) as WaypointEdgeData;
  const waypoints = edgeData.waypoints ?? [];

  // Build path segments through waypoints
  const segments = useMemo(() => {
    if (waypoints.length === 0) {
      const [path] = getSmoothStepPath({
        sourceX, sourceY, targetX, targetY,
        sourcePosition, targetPosition,
        borderRadius: 0,
      });
      return { path, midpoints: [{ x: (sourceX + targetX) / 2, y: (sourceY + targetY) / 2, idx: -1 }] };
    }

    // Build path through waypoints
    let pathStr = `M ${sourceX} ${sourceY}`;
    const allPoints = [
      { x: sourceX, y: sourceY },
      ...waypoints,
      { x: targetX, y: targetY },
    ];

    for (let i = 1; i < allPoints.length; i++) {
      const prev = allPoints[i - 1];
      const curr = allPoints[i];
      // Step path: go vertical first, then horizontal
      const midY = (prev.y + curr.y) / 2;
      pathStr += ` L ${prev.x} ${midY} L ${curr.x} ${midY} L ${curr.x} ${curr.y}`;
    }

    // Midpoints between each segment for adding new waypoints
    const midpoints = [];
    for (let i = 0; i < allPoints.length - 1; i++) {
      midpoints.push({
        x: (allPoints[i].x + allPoints[i + 1].x) / 2,
        y: (allPoints[i].y + allPoints[i + 1].y) / 2,
        idx: i,
      });
    }

    return { path: pathStr, midpoints };
  }, [sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, waypoints]);

  const handleWaypointDrag = useCallback(
    (wpIdx: number, e: React.MouseEvent) => {
      e.stopPropagation();
      const startX = e.clientX;
      const startY = e.clientY;
      const wp = waypoints[wpIdx];
      const origX = wp.x;
      const origY = wp.y;

      const onMove = (me: MouseEvent) => {
        const dx = me.clientX - startX;
        const dy = me.clientY - startY;
        setEdges((eds) =>
          eds.map((edge) => {
            if (edge.id !== id) return edge;
            const wps = [...(((edge.data ?? {}) as WaypointEdgeData).waypoints ?? [])];
            wps[wpIdx] = { x: origX + dx, y: origY + dy };
            return { ...edge, data: { ...edge.data, waypoints: wps } };
          }),
        );
      };

      const onUp = () => {
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [id, waypoints, setEdges],
  );

  const handleAddWaypoint = useCallback(
    (afterIdx: number, x: number, y: number) => {
      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.id !== id) return edge;
          const wps = [...(((edge.data ?? {}) as WaypointEdgeData).waypoints ?? [])];
          wps.splice(afterIdx, 0, { x, y });
          return { ...edge, data: { ...edge.data, waypoints: wps } };
        }),
      );
    },
    [id, setEdges],
  );

  const handleRemoveWaypoint = useCallback(
    (wpIdx: number) => {
      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.id !== id) return edge;
          const wps = [...(((edge.data ?? {}) as WaypointEdgeData).waypoints ?? [])];
          wps.splice(wpIdx, 1);
          return { ...edge, data: { ...edge.data, waypoints: wps } };
        }),
      );
    },
    [id, setEdges],
  );

  return (
    <>
      <BaseEdge
        id={id}
        path={segments.path}
        style={{
          ...style,
          strokeWidth: selected ? 2 : (style?.strokeWidth ?? 1.5),
          stroke: selected ? "var(--foreground)" : (style?.stroke ?? "var(--border)"),
        }}
      />
      {/* Existing waypoint handles (draggable) */}
      {selected && waypoints.map((wp, i) => (
        <g key={`wp-${i}`}>
          <circle
            cx={wp.x}
            cy={wp.y}
            r={5}
            fill="var(--foreground)"
            stroke="var(--background)"
            strokeWidth={2}
            className="cursor-move"
            onMouseDown={(e) => handleWaypointDrag(i, e)}
            onDoubleClick={(e) => { e.stopPropagation(); handleRemoveWaypoint(i); }}
          />
        </g>
      ))}
      {/* Midpoint handles (click to add waypoint) */}
      {selected && segments.midpoints.map((mp, i) => (
        <g key={`mid-${i}`}>
          <circle
            cx={mp.x}
            cy={mp.y}
            r={4}
            fill="var(--muted)"
            stroke="var(--foreground)"
            strokeWidth={1}
            strokeDasharray="2 2"
            className="cursor-pointer opacity-50 hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              handleAddWaypoint(mp.idx + (waypoints.length > 0 ? 0 : 0), mp.x, mp.y);
            }}
          />
        </g>
      ))}
    </>
  );
}

export const EditableEdge = memo(EditableEdgeComponent);
