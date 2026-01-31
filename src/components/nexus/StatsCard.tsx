import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "primary" | "points" | "urgent";
}

const variantStyles = {
  default: {
    iconBg: "bg-secondary",
    iconColor: "text-secondary-foreground",
  },
  primary: {
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  points: {
    iconBg: "bg-points/10",
    iconColor: "text-points",
  },
  urgent: {
    iconBg: "bg-urgent/10",
    iconColor: "text-urgent",
  },
};

export function StatsCard({ icon: Icon, label, value, trend, variant = "default" }: StatsCardProps) {
  const styles = variantStyles[variant];

  return (
    <div className="card-nexus p-6 hover:shadow-nexus-lg transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", styles.iconBg)}>
          <Icon className={cn("w-6 h-6", styles.iconColor)} />
        </div>
        {trend && (
          <span
            className={cn(
              "text-sm font-semibold px-2 py-1 rounded-lg",
              trend.isPositive ? "text-success bg-success/10" : "text-urgent bg-urgent/10"
            )}
          >
            {trend.isPositive ? "+" : ""}{trend.value}%
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
        <p className="text-3xl font-black text-foreground mt-1">{value}</p>
      </div>
    </div>
  );
}
