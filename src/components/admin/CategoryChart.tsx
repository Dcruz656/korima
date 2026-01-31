import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const data = [
  { categoria: "Medicina", documentos: 2845 },
  { categoria: "Física", documentos: 1923 },
  { categoria: "IA", documentos: 1654 },
  { categoria: "Biología", documentos: 1432 },
  { categoria: "Química", documentos: 1201 },
];

export function CategoryChart() {
  return (
    <div className="card-fb p-6">
      <h3 className="text-lg font-semibold text-foreground mb-6">
        Categorías Científicas Populares
      </h3>
      
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis 
            dataKey="categoria" 
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
          <Bar 
            dataKey="documentos" 
            fill="hsl(var(--primary))" 
            radius={[8, 8, 0, 0]}
            name="Documentos"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
