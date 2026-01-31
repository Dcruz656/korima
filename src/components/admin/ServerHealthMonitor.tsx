import { Cpu, HardDrive } from "lucide-react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

const cpuData = [
  { value: 45 },
  { value: 52 },
  { value: 48 },
  { value: 61 },
  { value: 55 },
  { value: 58 },
  { value: 62 },
];

const memoryData = [
  { value: 68 },
  { value: 70 },
  { value: 72 },
  { value: 69 },
  { value: 75 },
  { value: 73 },
  { value: 71 },
];

export function ServerHealthMonitor() {
  return (
    <div className="card-fb p-6">
      <h3 className="text-lg font-semibold text-foreground mb-6">
        Salud del Servidor
      </h3>

      <div className="space-y-6">
        {/* CPU Usage */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Cpu className="w-4 h-4 text-blue-500" />
              </div>
              <span className="text-sm font-medium text-foreground">CPU</span>
            </div>
            <span className="text-2xl font-bold text-foreground">62%</span>
          </div>
          
          <ResponsiveContainer width="100%" height={60}>
            <LineChart data={cpuData}>
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
          
          <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: "62%" }}
            />
          </div>
        </div>

        {/* Memory Usage */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <HardDrive className="w-4 h-4 text-purple-500" />
              </div>
              <span className="text-sm font-medium text-foreground">RAM</span>
            </div>
            <span className="text-2xl font-bold text-foreground">71%</span>
          </div>
          
          <ResponsiveContainer width="100%" height={60}>
            <LineChart data={memoryData}>
              <Line
                type="monotone"
                dataKey="value"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
          
          <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-purple-500 transition-all duration-300"
              style={{ width: "71%" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
