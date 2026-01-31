import { Award, Star, Crown, Sparkles, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export type Level = "novato" | "colaborador" | "experto" | "maestro" | "leyenda";

interface LevelBadgeProps {
  level: Level;
  size?: "xs" | "sm" | "md" | "lg";
}

const levelConfig = {
  novato: {
    label: "Novato",
    icon: Star,
    gradient: "from-gray-400 to-gray-500",
    shadow: "shadow-gray-400/30",
    textColor: "text-gray-600",
  },
  colaborador: {
    label: "Colaborador",
    icon: Award,
    gradient: "from-primary to-teal-400",
    shadow: "shadow-primary/30",
    textColor: "text-primary",
  },
  experto: {
    label: "Experto",
    icon: Sparkles,
    gradient: "from-violet-500 to-purple-600",
    shadow: "shadow-violet-500/30",
    textColor: "text-violet-600",
  },
  maestro: {
    label: "Maestro",
    icon: Trophy,
    gradient: "from-amber-400 to-orange-500",
    shadow: "shadow-amber-400/30",
    textColor: "text-amber-600",
  },
  leyenda: {
    label: "Leyenda",
    icon: Crown,
    gradient: "from-yellow-400 via-amber-500 to-red-500",
    shadow: "shadow-yellow-400/40",
    textColor: "text-yellow-600",
  },
};

const sizeConfig = {
  xs: {
    container: "px-1.5 py-0.5 gap-1",
    icon: "w-2.5 h-2.5",
    text: "text-[10px]",
  },
  sm: {
    container: "px-2 py-1 gap-1",
    icon: "w-3 h-3",
    text: "text-[11px]",
  },
  md: {
    container: "px-4 py-2 gap-2",
    icon: "w-4 h-4",
    text: "text-sm",
  },
  lg: {
    container: "px-5 py-2.5 gap-2.5",
    icon: "w-5 h-5",
    text: "text-base",
  },
};

export function LevelBadge({ level, size = "md" }: LevelBadgeProps) {
  const config = levelConfig[level];
  const sizes = sizeConfig[size];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full font-semibold",
        `bg-gradient-to-r ${config.gradient}`,
        `shadow-lg ${config.shadow}`,
        sizes.container,
        sizes.text
      )}
    >
      <Icon className={cn(sizes.icon, "text-white")} />
      <span className="text-white">{config.label}</span>
    </div>
  );
}
