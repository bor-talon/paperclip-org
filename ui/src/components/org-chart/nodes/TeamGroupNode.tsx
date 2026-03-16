import { memo } from "react";

interface TeamGroupData {
  label: string;
  color: string;
}

function TeamGroupNodeComponent({ data }: { data: TeamGroupData }) {
  return (
    <div
      className="w-full h-full rounded-lg border relative"
      style={{
        backgroundColor: data.color + "06",
        borderColor: data.color + "25",
      }}
    >
      <div
        className="absolute -top-2.5 left-3 px-2 py-0.5 rounded text-[9px] font-semibold tracking-wider uppercase whitespace-nowrap"
        style={{
          backgroundColor: data.color + "15",
          color: data.color,
        }}
      >
        {data.label}
      </div>
    </div>
  );
}

export const TeamGroupNode = memo(TeamGroupNodeComponent);
