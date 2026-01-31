import { CheckCircle, Clock, MessageSquare, Award, TrendingUp, TrendingDown } from "lucide-react";
import { AnalyticsData } from "./AnalyticsTypes";

interface PerformanceMetricsProps {
  data: AnalyticsData;
}

export function PerformanceMetrics({ data }: PerformanceMetricsProps) {
  const formatTime = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)} min`;
    if (hours < 24) return `${hours.toFixed(1)} hrs`;
    return `${(hours / 24).toFixed(1)} días`;
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-primary" />
        Métricas de Rendimiento
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={CheckCircle}
          label="Tasa de Resolución"
          value={`${data.resolutionRate.toFixed(1)}%`}
          subtext={`${data.totalResolved} resueltas / ${data.totalPending} pendientes`}
          variant={data.resolutionRate > 50 ? "success" : "warning"}
        />
        
        <MetricCard
          icon={Clock}
          label="Tiempo Promedio Respuesta"
          value={formatTime(data.avgResponseTime)}
          subtext="Hasta primera respuesta"
          variant={data.avgResponseTime < 24 ? "success" : "warning"}
        />
        
        <MetricCard
          icon={MessageSquare}
          label="Respuestas por Solicitud"
          value={data.avgResponsesPerRequest.toFixed(1)}
          subtext="Promedio"
          variant={data.avgResponsesPerRequest > 1 ? "success" : "neutral"}
        />
        
        <MetricCard
          icon={Award}
          label="Tasa Mejor Respuesta"
          value={`${data.bestAnswerRate.toFixed(1)}%`}
          subtext="Respuestas seleccionadas"
          variant={data.bestAnswerRate > 30 ? "success" : "neutral"}
        />
      </div>
    </div>
  );
}

interface MetricCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  subtext: string;
  variant: "success" | "warning" | "neutral";
}

const MetricCard = ({ icon: Icon, label, value, subtext, variant }: MetricCardProps) => {
  const variantStyles = {
    success: "text-success",
    warning: "text-points",
    neutral: "text-primary",
  };

  return (
    <div className="card-fb p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${variantStyles[variant]}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${variantStyles[variant]}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
    </div>
  );
};
