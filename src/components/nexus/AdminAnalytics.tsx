import { Loader2, Download, FileText, FileSpreadsheet } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAnalyticsData } from "./analytics/useAnalyticsData";
import { PerformanceMetrics } from "./analytics/PerformanceMetrics";
import { UserMetrics } from "./analytics/UserMetrics";
import { PointsEconomy } from "./analytics/PointsEconomy";
import { ExtraAnalysis } from "./analytics/ExtraAnalysis";
import { ContentAnalysis } from "./analytics/ContentAnalysis";
import { exportToCSV, exportToPDF } from "./analytics/exportAnalytics";
import { toast } from "sonner";

export function AdminAnalytics() {
  const { loading, data } = useAnalyticsData();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No hay datos suficientes para mostrar analíticas.
      </div>
    );
  }

  const handleExportCSV = () => {
    if (data) {
      exportToCSV(data);
      toast.success("Reporte CSV descargado");
    }
  };

  const handleExportPDF = () => {
    if (data) {
      exportToPDF(data);
      toast.success("Generando PDF...");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with export options */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Dashboard de Analíticas</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              Exportar Reporte
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportCSV} className="gap-2 cursor-pointer">
              <FileSpreadsheet className="w-4 h-4" />
              Exportar como CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportPDF} className="gap-2 cursor-pointer">
              <FileText className="w-4 h-4" />
              Exportar como PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Performance Metrics - Always visible at top */}
      <PerformanceMetrics data={data} />

      {/* Tabbed sections for detailed analysis */}
      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="content">Contenido</TabsTrigger>
          <TabsTrigger value="users">Usuarios</TabsTrigger>
          <TabsTrigger value="points">Puntos</TabsTrigger>
          <TabsTrigger value="extra">Análisis Extra</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="mt-6">
          <ContentAnalysis data={data} />
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <UserMetrics data={data} />
        </TabsContent>

        <TabsContent value="points" className="mt-6">
          <PointsEconomy data={data} />
        </TabsContent>

        <TabsContent value="extra" className="mt-6">
          <ExtraAnalysis data={data} />
        </TabsContent>
      </Tabs>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          label="Categoría #1"
          value={data.categoryCounts[0]?.name || "N/A"}
          subtext={`${data.categoryCounts[0]?.value || 0} solicitudes`}
        />
        <SummaryCard
          label="País #1"
          value={data.countryCounts[0]?.name || "N/A"}
          subtext={`${data.countryCounts[0]?.value || 0} solicitudes`}
        />
        <SummaryCard
          label="Hora pico"
          value={
            data.hourlyDistribution.reduce((max, curr) =>
              curr.count > max.count ? curr : max
            ).hour
          }
          subtext="Mayor actividad"
        />
        <SummaryCard
          label="Día pico"
          value={
            data.dailyDistribution.reduce((max, curr) =>
              curr.count > max.count ? curr : max
            ).day
          }
          subtext="Mayor actividad"
        />
      </div>
    </div>
  );
}

interface SummaryCardProps {
  label: string;
  value: string;
  subtext: string;
}

const SummaryCard = ({ label, value, subtext }: SummaryCardProps) => (
  <div className="card-fb p-4 text-center">
    <p className="text-sm text-muted-foreground mb-1">{label}</p>
    <p className="text-lg font-bold text-foreground truncate">{value}</p>
    <p className="text-xs text-muted-foreground">{subtext}</p>
  </div>
);
