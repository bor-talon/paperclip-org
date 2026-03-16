import { useState, useCallback } from "react";
import { FILES_STORAGE_KEY } from "../../components/org-chart/constants";
import { AGENT_FILES, type AgentFileName } from "../../components/org-chart/types";

interface AgentFilesMap {
  [agentId: string]: { [file: string]: string };
}

function loadFromStorage(): AgentFilesMap {
  try {
    const raw = localStorage.getItem(FILES_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AgentFilesMap) : {};
  } catch {
    return {};
  }
}

function saveToStorage(data: AgentFilesMap): void {
  try {
    localStorage.setItem(FILES_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function useAgentFiles() {
  const [filesMap, setFilesMap] = useState<AgentFilesMap>(loadFromStorage);

  const getFile = useCallback(
    (agentId: string, fileName: AgentFileName): string => {
      return filesMap[agentId]?.[fileName] ?? "";
    },
    [filesMap],
  );

  const setFile = useCallback(
    (agentId: string, fileName: AgentFileName, content: string) => {
      setFilesMap((prev) => {
        const next = {
          ...prev,
          [agentId]: { ...prev[agentId], [fileName]: content },
        };
        saveToStorage(next);
        return next;
      });
    },
    [],
  );

  const getFilesForAgent = useCallback(
    (agentId: string) => {
      return AGENT_FILES.map((name) => ({
        name,
        content: filesMap[agentId]?.[name] ?? "",
      }));
    },
    [filesMap],
  );

  return { getFile, setFile, getFilesForAgent };
}
