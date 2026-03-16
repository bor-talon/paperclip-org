import { STATUS_COLORS, STATUS_COLOR_DEFAULT } from "./constants";
import { cn } from "../../lib/utils";

interface StatusDotProps {
  status: string;
  className?: string;
}

export function StatusDot({ status, className }: StatusDotProps) {
  const color = STATUS_COLORS[status] ?? STATUS_COLOR_DEFAULT;

  return (
    <span
      className={cn("inline-flex h-2 w-2 rounded-full shrink-0", color, className)}
      title={status}
    />
  );
}
