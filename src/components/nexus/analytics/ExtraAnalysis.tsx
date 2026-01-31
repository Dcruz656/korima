import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Flame, FileText, MessageCircle, Grid3X3 } from "lucide-react";
import { AnalyticsData, CHART_COLORS, DAY_NAMES } from "./AnalyticsTypes";

interface ExtraAnalysisProps {
  data: AnalyticsData;
}

export function ExtraAnalysis({ data }: ExtraAnalysisProps) {
  const doiData = [
    { name: "Con DOI", value: data.doiAnalysis.withDoi },
    { name: "Sin DOI", value: data.doiAnalysis.withoutDoi },
  ];

  const urgentData = [
    { name: "Urgentes", value: data.urgentAnalysis.urgentCount },
    { name: "Normales", value: data.urgentAnalysis.normalCount },
  ];

  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-lg flex items-center gap-2">
        <Grid3X3 className="w-5 h-5 text-primary" />
        Análisis Adicional
      </h3>

      {/* Heatmap */}
      <div className="card-fb p-4">
        <div className="flex items-center gap-2 mb-4">
          <Grid3X3 className="w-5 h-5 text-urgent" />
          <h4 className="font-semibold">Mapa de Calor: Actividad por Hora y Día</h4>
        </div>
        <HeatmapGrid data={data.heatmapData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Urgent Analysis */}
        <div className="card-fb p-4">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-urgent" />
            <h4 className="font-semibold">Solicitudes Urgentes</h4>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={urgentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={50}
                  paddingAngle={3}
                  dataKey="value"
                >
                  <Cell fill="hsl(var(--urgent))" />
                  <Cell fill="hsl(var(--primary))" />
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center text-sm space-y-1">
            <p>
              <span className="text-urgent font-semibold">{data.urgentAnalysis.urgentResolutionRate.toFixed(0)}%</span>
              {" "}resolución urgentes
            </p>
            <p>
              <span className="text-primary font-semibold">{data.urgentAnalysis.normalResolutionRate.toFixed(0)}%</span>
              {" "}resolución normales
            </p>
          </div>
        </div>

        {/* DOI Analysis */}
        <div className="card-fb p-4">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-primary" />
            <h4 className="font-semibold">DOI vs Sin DOI</h4>
          </div>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={doiData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={50}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  <Cell fill="hsl(var(--success))" />
                  <Cell fill="hsl(var(--muted-foreground))" />
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center text-sm">
            <span className="text-success font-semibold">{data.doiAnalysis.withDoi}</span> con DOI
            {" / "}
            <span className="text-muted-foreground font-semibold">{data.doiAnalysis.withoutDoi}</span> sin DOI
          </div>
        </div>

        {/* Comments Engagement */}
        <div className="card-fb p-4">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle className="w-5 h-5 text-points" />
            <h4 className="font-semibold">Engagement Comentarios</h4>
          </div>
          <div className="flex flex-col items-center justify-center h-40">
            <p className="text-5xl font-black text-points">
              {data.avgCommentsPerRequest.toFixed(1)}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              comentarios promedio por solicitud
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

interface HeatmapGridProps {
  data: { day: string; hour: number; count: number }[];
}

function HeatmapGrid({ data }: HeatmapGridProps) {
  // Find max for color scaling
  const maxCount = Math.max(...data.map(d => d.count), 1);
  
  // Create grid
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  const getColor = (count: number) => {
    if (count === 0) return "bg-muted/30";
    const intensity = count / maxCount;
    if (intensity < 0.25) return "bg-primary/20";
    if (intensity < 0.5) return "bg-primary/40";
    if (intensity < 0.75) return "bg-primary/60";
    return "bg-primary";
  };

  const getCount = (day: string, hour: number) => {
    const item = data.find(d => d.day === day && d.hour === hour);
    return item?.count || 0;
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Hours header */}
        <div className="flex mb-1">
          <div className="w-10" />
          {hours.filter((_, i) => i % 3 === 0).map(hour => (
            <div key={hour} className="flex-1 text-center text-xs text-muted-foreground">
              {hour.toString().padStart(2, "0")}
            </div>
          ))}
        </div>
        
        {/* Grid rows */}
        {DAY_NAMES.map(day => (
          <div key={day} className="flex items-center mb-1">
            <div className="w-10 text-xs text-muted-foreground pr-2 text-right">{day}</div>
            <div className="flex flex-1 gap-0.5">
              {hours.map(hour => {
                const count = getCount(day, hour);
                return (
                  <div
                    key={hour}
                    className={`flex-1 h-5 rounded-sm ${getColor(count)} transition-colors`}
                    title={`${day} ${hour}:00 - ${count} solicitudes`}
                  />
                );
              })}
            </div>
          </div>
        ))}
        
        {/* Legend */}
        <div className="flex items-center justify-end mt-3 gap-2 text-xs text-muted-foreground">
          <span>Menos</span>
          <div className="flex gap-0.5">
            <div className="w-4 h-4 rounded-sm bg-muted/30" />
            <div className="w-4 h-4 rounded-sm bg-primary/20" />
            <div className="w-4 h-4 rounded-sm bg-primary/40" />
            <div className="w-4 h-4 rounded-sm bg-primary/60" />
            <div className="w-4 h-4 rounded-sm bg-primary" />
          </div>
          <span>Más</span>
        </div>
      </div>
    </div>
  );
}
