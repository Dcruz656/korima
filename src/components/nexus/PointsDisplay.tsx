import { Coins, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface PointsDisplayProps {
  points: number;
  level: "novato" | "colaborador" | "maestro";
  compact?: boolean;
}

const levelConfig = {
  novato: {
    label: "Novato",
    color: "text-level-novato",
    bg: "bg-level-novato/10",
    min: 0,
  },
  colaborador: {
    label: "Colaborador",
    color: "text-level-colaborador",
    bg: "bg-level-colaborador/10",
    min: 150,
  },
  maestro: {
    label: "Maestro",
    color: "text-level-maestro",
    bg: "bg-level-maestro/10",
    min: 500,
  },
};

export function PointsDisplay({ points, level, compact = false }: PointsDisplayProps) {
  const config = levelConfig[level];

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-points/10">
        <Coins className="w-4 h-4 text-points" />
        <span className="font-bold text-sm text-points">{points}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Level Badge */}
      <div className={cn("px-4 py-2 rounded-full font-semibold text-sm", config.bg, config.color)}>
        {config.label}
      </div>

      {/* Points */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-points/10 shadow-points">
        <Coins className="w-5 h-5 text-points" />
        <span className="font-bold text-lg text-points">{points}</span>
        <TrendingUp className="w-4 h-4 text-points/60" />
      </div>
    </div>
  );
}
