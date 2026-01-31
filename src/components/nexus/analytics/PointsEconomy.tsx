import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Coins, TrendingUp, Users } from "lucide-react";
import { AnalyticsData } from "./AnalyticsTypes";

interface PointsEconomyProps {
  data: AnalyticsData;
}

export function PointsEconomy({ data }: PointsEconomyProps) {
  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-lg flex items-center gap-2">
        <Coins className="w-5 h-5 text-points" />
        Economía de Puntos
      </h3>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card-fb p-4 bg-gradient-to-br from-points/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-points/20 flex items-center justify-center">
              <Coins className="w-6 h-6 text-points" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Puntos Totales Distribuidos</p>
              <p className="text-3xl font-black text-points">
                {data.totalPointsDistributed.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="card-fb p-4 bg-gradient-to-br from-primary/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Promedio por Usuario</p>
              <p className="text-3xl font-black text-primary">
                {data.avgPointsPerUser.toFixed(0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Points Flow Chart */}
      <div className="card-fb p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h4 className="font-semibold">Flujo de Puntos (últimos 6 meses)</h4>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.pointsFlow}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar dataKey="earned" name="Ganados" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="spent" name="Gastados" fill="hsl(var(--urgent))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-sm text-muted-foreground mt-2 text-center">
          Los puntos se ganan por check-in diario (+10) y mejores respuestas (+20). Se gastan en solicitudes (-5 normal, -10 urgente).
        </p>
      </div>
    </div>
  );
}
