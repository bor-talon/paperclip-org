import { useState } from "react";
import { ChevronDown, ChevronRight, FileText } from "lucide-react";
import { AGENT_FILES, type AgentFileName } from "../types";

interface AgentFilesEditorProps {
  agentId: string;
  getFile: (agentId: string, fileName: AgentFileName) => string;
  setFile: (agentId: string, fileName: AgentFileName, content: string) => void;
}

export function AgentFilesEditor({ agentId, getFile, setFile }: AgentFilesEditorProps) {
  const [expandedFile, setExpandedFile] = useState<AgentFileName | null>(null);

  return (
    <div className="px-4 py-3">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        Agent Files
      </h4>
      <div className="space-y-1">
        {AGENT_FILES.map((fileName) => (
          <FileEntry
            key={fileName}
            fileName={fileName}
            expanded={expandedFile === fileName}
            onToggle={() =>
              setExpandedFile(expandedFile === fileName ? null : fileName)
            }
            content={getFile(agentId, fileName)}
            onChange={(content) => setFile(agentId, fileName, content)}
          />
        ))}
      </div>
    </div>
  );
}

function FileEntry({
  fileName,
  expanded,
  onToggle,
  content,
  onChange,
}: {
  fileName: AgentFileName;
  expanded: boolean;
  onToggle: () => void;
  content: string;
  onChange: (content: string) => void;
}) {
  const Chevron = expanded ? ChevronDown : ChevronRight;

  return (
    <div className="border border-border">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 w-full px-2.5 py-2 text-xs hover:bg-accent/50 transition-colors"
      >
        <Chevron className="h-3 w-3 shrink-0" />
        <FileText className="h-3 w-3 shrink-0 text-muted-foreground" />
        <span className="font-mono">{fileName}</span>
      </button>
      {expanded && (
        <div className="px-2.5 pb-2.5">
          <textarea
            value={content}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`# ${fileName}\n\nWrite your agent's ${fileName} here...`}
            className="w-full h-40 bg-muted/30 border border-border p-2 text-xs font-mono resize-y focus:outline-none focus:ring-1 focus:ring-foreground/20"
          />
        </div>
      )}
    </div>
  );
}
