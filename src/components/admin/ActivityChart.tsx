import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const data = [
  { day: "Lun", cargas: 45, descargas: 120 },
  { day: "Mar", cargas: 52, descargas: 145 },
  { day: "Mié", cargas: 61, descargas: 168 },
  { day: "Jue", cargas: 48, descargas: 132 },
  { day: "Vie", cargas: 70, descargas: 195 },
  { day: "Sáb", cargas: 38, descargas: 98 },
  { day: "Dom", cargas: 35, descargas: 87 },
];

export function ActivityChart() {
  return (
    <div className="card-fb p-6">
      <h3 className="text-lg font-semibold text-foreground mb-6">
        Actividad Semanal
      </h3>
      
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorCargas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorDescargas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis 
            dataKey="day" 
            className="text-xs text-muted-foreground"
            tick={{ fill: 'currentColor' }}
          />
          <YAxis 
            className="text-xs text-muted-foreground"
            tick={{ fill: 'currentColor' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="cargas"
            stroke="#8b5cf6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorCargas)"
            name="Cargas"
          />
          <Area
            type="monotone"
            dataKey="descargas"
            stroke="#10b981"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorDescargas)"
            name="Descargas"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
