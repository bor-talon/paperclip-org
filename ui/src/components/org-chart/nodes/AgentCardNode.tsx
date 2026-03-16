import { memo, useCallback, useRef, useState } from "react";
import { Handle, Position } from "@xyflow/react";
import { Loader2 } from "lucide-react";
import { AGENT_ROLE_LABELS } from "@paperclipai/shared";
import { assetsApi } from "../../../api/assets";
import { agentsApi } from "../../../api/agents";

const roleLabels = AGENT_ROLE_LABELS as Record<string, string>;

const STATUS_DOT: Record<string, string> = {
  running: "bg-cyan-400",
  active: "bg-green-400",
  paused: "bg-yellow-400",
  idle: "bg-yellow-400",
  error: "bg-red-400",
  terminated: "bg-neutral-400",
  pending_approval: "bg-amber-400",
};

interface AgentCardData {
  name: string;
  role: string;
  status: string;
  title: string | null;
  icon: string | null;
  adapterType: string;
  tier: string;
  avatar: string | null;
  companyId?: string;
  agentId?: string;
  deployed?: boolean;
  onToggleDeploy?: (agentId: string) => void;
}

function getInitials(name: string): string {
  return name.split(/\s+/).map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function AgentCardNodeComponent({ data }: { data: AgentCardData }) {
  const roleText = data.title ?? roleLabels[data.role] ?? data.role;
  const dotClass = STATUS_DOT[data.status] ?? "bg-neutral-400";
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);

  const avatar = localAvatar ?? data.avatar;

  const isDeployed = data.deployed !== false;

  const tierBorder =
    data.tier === "oversight"
      ? "border-l-2 border-l-blue-500/50"
      : data.tier === "senior"
        ? "border-l-2 border-l-emerald-500/40"
        : "";

  const handleAvatarClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    fileRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !data.companyId || !data.agentId) return;

    setUploading(true);
    try {
      const asset = await assetsApi.uploadImage(data.companyId, file, "avatars");
      const avatarUrl = asset.contentPath;

      await agentsApi.update(data.agentId, {
        metadata: { avatarUrl },
      }, data.companyId);

      setLocalAvatar(avatarUrl);
    } catch {
      // silently fail
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }, [data]);

  return (
    <>
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-border !border-0" />
      <div
        className={`
          bg-card border border-border w-[190px] min-h-[56px] cursor-pointer
          transition-all duration-150 select-none
          hover:border-foreground/20 hover:shadow-sm
          ${tierBorder}
          ${!isDeployed ? "opacity-30" : ""}
        `}
      >
        <div className="flex items-center px-2.5 py-1.5 gap-2">
          {/* Clickable avatar */}
          <div
            className="relative w-8 h-8 rounded-full shrink-0 cursor-pointer group"
            onClick={handleAvatarClick}
          >
            {avatar ? (
              <img src={avatar} alt={data.name} className="w-8 h-8 rounded-2xl object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-2xl bg-muted flex items-center justify-center">
                <span className="text-[11px] font-medium text-foreground/60">
                  {getInitials(data.name)}
                </span>
              </div>
            )}
            <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              {uploading ? (
                <Loader2 className="h-3 w-3 text-white animate-spin" />
              ) : (
                <span className="text-white text-[8px] font-medium">Edit</span>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-foreground truncate">{data.name}</span>
              <span className={`inline-flex h-2 w-2 rounded-full shrink-0 ${dotClass}`} />
            </div>
            <p className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
              {roleText}
            </p>
          </div>
          {/* Deploy toggle */}
          {data.onToggleDeploy && (
            <button
              className={`shrink-0 w-5 h-5 rounded flex items-center justify-center transition-colors ${isDeployed ? "text-green-500 hover:text-green-600" : "text-muted-foreground/40 hover:text-muted-foreground"}`}
              onClick={(e) => { e.stopPropagation(); data.onToggleDeploy?.(data.agentId ?? ""); }}
              title={isDeployed ? "Deployed — click to undeploy" : "Not deployed — click to deploy"}
            >
              <span className={`inline-block w-2 h-2 rounded-full ${isDeployed ? "bg-green-500" : "bg-muted-foreground/30 ring-1 ring-muted-foreground/20"}`} />
            </button>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-border !border-0" />
    </>
  );
}

export const AgentCardNode = memo(AgentCardNodeComponent);
