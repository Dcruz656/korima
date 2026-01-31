export interface AnalyticsData {
  // Existing
  categoryCounts: { name: string; value: number }[];
  countryCounts: { name: string; value: number }[];
  hourlyDistribution: { hour: string; count: number }[];
  dailyDistribution: { day: string; count: number }[];
  journalCounts: { name: string; value: number }[];
  monthlyTrend: { month: string; count: number }[];
  
  // Performance metrics
  resolutionRate: number;
  avgResponseTime: number; // in hours
  avgResponsesPerRequest: number;
  bestAnswerRate: number;
  totalResolved: number;
  totalPending: number;
  
  // User metrics
  levelDistribution: { name: string; value: number }[];
  userGrowth: { month: string; count: number }[];
  topActiveUsers: { name: string; requests: number; responses: number; total: number }[];
  institutionDistribution: { name: string; value: number }[];
  
  // Points economy
  totalPointsDistributed: number;
  avgPointsPerUser: number;
  pointsFlow: { month: string; earned: number; spent: number }[];
  
  // Extra analysis
  heatmapData: { day: string; hour: number; count: number }[];
  urgentAnalysis: { 
    urgentCount: number; 
    normalCount: number; 
    urgentResolutionRate: number;
    normalResolutionRate: number;
  };
  doiAnalysis: { withDoi: number; withoutDoi: number };
  avgCommentsPerRequest: number;
}

export const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--points))",
  "hsl(var(--urgent))",
  "#10b981",
  "#8b5cf6",
  "#f59e0b",
  "#ec4899",
  "#06b6d4",
];

export const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
export const DAY_NAMES_FULL = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export const LEVEL_NAMES: Record<string, string> = {
  novato: "Novato",
  colaborador: "Colaborador",
  maestro: "Maestro",
};
