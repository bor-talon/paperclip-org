import { useCallback } from "react";
import { X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Agent } from "@paperclipai/shared";
import { AGENT_ROLE_LABELS } from "@paperclipai/shared";
import { StatusDot } from "../StatusDot";
import { ADAPTER_LABELS } from "../constants";
import { AgentFilesEditor } from "./AgentFilesEditor";
import { AgentSkillsList } from "./AgentSkillsList";
import { AvatarUploader } from "./AvatarUploader";
import { assetsApi } from "../../../api/assets";
import { agentsApi } from "../../../api/agents";
import { useCompany } from "../../../context/CompanyContext";
import { queryKeys } from "../../../lib/queryKeys";
import type { AgentFileName } from "../types";

const roleLabels = AGENT_ROLE_LABELS as Record<string, string>;

interface AgentDetailPanelProps {
  agent: Agent;
  onClose: () => void;
  onAvatarChange: (agentId: string, url: string) => void;
  getFile: (agentId: string, fileName: AgentFileName) => string;
  setFile: (agentId: string, fileName: AgentFileName, content: string) => void;
}

export function AgentDetailPanel({
  agent,
  onClose,
  onAvatarChange,
  getFile,
  setFile,
}: AgentDetailPanelProps) {
  const { selectedCompanyId } = useCompany();
  const queryClient = useQueryClient();
  const metadata = (agent.metadata ?? {}) as Record<string, unknown>;
  const avatar = (metadata.avatarUrl as string) ?? null;
  const roleText = agent.title ?? roleLabels[agent.role] ?? agent.role;

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!selectedCompanyId) throw new Error("No company selected");
      // Upload image to Paperclip assets
      const asset = await assetsApi.uploadImage(selectedCompanyId, file, "avatars");
      const avatarUrl = asset.contentPath;
      // Store URL in agent metadata
      await agentsApi.update(agent.id, {
        metadata: { ...metadata, avatarUrl },
      }, selectedCompanyId);
      return avatarUrl;
    },
    onSuccess: (avatarUrl) => {
      onAvatarChange(agent.id, avatarUrl);
      if (selectedCompanyId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.agents.list(selectedCompanyId) });
      }
    },
  });

  const handleUpload = useCallback(
    async (file: File) => {
      await uploadMutation.mutateAsync(file);
    },
    [uploadMutation],
  );

  return (
    <div className="w-[380px] h-full bg-card border-l border-border flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold">Agent Details</h3>
        <button onClick={onClose} className="p-1 hover:bg-accent rounded transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Profile */}
        <div className="px-4 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <AvatarUploader
              icon={agent.icon}
              avatar={avatar}
              name={agent.name}
              onUpload={handleUpload}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-foreground">{agent.name}</span>
                <StatusDot status={agent.status} />
              </div>
              <p className="text-xs text-muted-foreground">{roleText}</p>
            </div>
          </div>
          {uploadMutation.isError && (
            <p className="text-xs text-red-500 mt-2">Upload failed. Try again.</p>
          )}
        </div>

        {/* Skills */}
        <AgentSkillsList capabilities={agent.capabilities} />

        {/* Files */}
        <AgentFilesEditor agentId={agent.id} getFile={getFile} setFile={setFile} />
      </div>
    </div>
  );
}
