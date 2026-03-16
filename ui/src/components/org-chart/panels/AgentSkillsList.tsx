import { Puzzle } from "lucide-react";

interface AgentSkillsListProps {
  capabilities: string | null;
}

export function AgentSkillsList({ capabilities }: AgentSkillsListProps) {
  const skills = capabilities
    ? capabilities.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="px-4 py-3 border-b border-border">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        Skills
      </h4>
      {skills.length === 0 ? (
        <p className="text-xs text-muted-foreground/60 italic">No skills configured</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {skills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted text-xs text-foreground/80 border border-border"
            >
              <Puzzle className="h-2.5 w-2.5" />
              {skill}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
