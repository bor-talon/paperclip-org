import { useCallback } from "react";
import type { OrgChartPositions } from "../../components/org-chart/types";
import { POSITIONS_STORAGE_KEY } from "../../components/org-chart/constants";

function storageKey(companyId: string): string {
  return `${POSITIONS_STORAGE_KEY}-${companyId}`;
}

export function useOrgPositions(companyId: string | null) {
  const loadPositions = useCallback((): OrgChartPositions => {
    if (!companyId) return {};
    try {
      const raw = localStorage.getItem(storageKey(companyId));
      return raw ? (JSON.parse(raw) as OrgChartPositions) : {};
    } catch {
      return {};
    }
  }, [companyId]);

  const savePositions = useCallback(
    (positions: OrgChartPositions) => {
      if (!companyId) return;
      try {
        localStorage.setItem(storageKey(companyId), JSON.stringify(positions));
      } catch {
        // localStorage full — silently ignore
      }
    },
    [companyId],
  );

  const clearPositions = useCallback(() => {
    if (!companyId) return;
    localStorage.removeItem(storageKey(companyId));
  }, [companyId]);

  return { loadPositions, savePositions, clearPositions };
}
