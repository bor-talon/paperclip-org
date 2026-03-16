import { useState, useCallback } from "react";

const STORAGE_KEY = "orgchart-deploy-state";

interface DeployMap {
  [agentId: string]: boolean;
}

function load(): DeployMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DeployMap) : {};
  } catch {
    return {};
  }
}

function save(map: DeployMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function useDeployState() {
  const [deployMap, setDeployMap] = useState<DeployMap>(load);

  const isDeployed = useCallback(
    (agentId: string): boolean => {
      return deployMap[agentId] !== false; // default = deployed
    },
    [deployMap],
  );

  const toggleDeploy = useCallback((agentId: string) => {
    setDeployMap((prev) => {
      const current = prev[agentId] !== false;
      const next = { ...prev, [agentId]: !current };
      save(next);
      return next;
    });
  }, []);

  const getMap = useCallback(() => deployMap, [deployMap]);

  return { isDeployed, toggleDeploy, getMap };
}
