import { AgentIcon } from "../AgentIconPicker";

interface AgentAvatarProps {
  icon: string | null;
  avatar: string | null;
  name: string;
  size?: "sm" | "md";
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
};

const iconSizes = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
};

export function AgentAvatar({ icon, avatar, name, size = "sm" }: AgentAvatarProps) {
  const containerClass = sizeClasses[size];

  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className={`${containerClass} rounded-2xl object-cover shrink-0`}
      />
    );
  }

  return (
    <div className={`${containerClass} rounded-2xl bg-muted flex items-center justify-center shrink-0`}>
      <AgentIcon icon={icon} className={`${iconSizes[size]} text-foreground/70`} />
    </div>
  );
}
