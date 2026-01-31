import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Navigation } from '@/components/nexus/Navigation';
import { KPICard } from "@/components/admin/KPICard";
import { ActivityChart } from "@/components/admin/ActivityChart";
import { CategoryChart } from "@/components/admin/CategoryChart";
import { UserRolesChart } from "@/components/admin/UserRolesChart";
import { RecentActivityTable } from "@/components/admin/RecentActivityTable";
import { ServerHealthMonitor } from "@/components/admin/ServerHealthMonitor";
import { ModerationPanel } from "@/components/admin/ModerationPanel";
import { 
  Users, 
  FileText, 
  Download, 
  Database,
  TrendingUp,
  TrendingDown,
  Loader2
} from "lucide-react";

export default function AdminDashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Mock data - reemplazar con datos reales de la API
  const kpiData = [
    {
      title: "Usuarios Activos",
      value: "2,547",
      change: 12.5,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "PDFs Subidos",
      value: "15,892",
      change: 8.3,
      icon: FileText,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Descargas Totales",
      value: "48,230",
      change: 15.7,
      icon: Download,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Almacenamiento",
      value: "234 GB",
      change: -2.1,
      icon: Database,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
  ];

  useEffect(() => {
    if (!authLoading) {
      // Verificar si el usuario es admin
      if (!user || profile?.role !== "admin") {
        navigate("/");
        return;
      }
      setLoading(false);
    }
  }, [user, profile, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="pt-14">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Panel de Administración
            </h1>
            <p className="text-muted-foreground">
              Monitorea y gestiona la actividad de la plataforma en tiempo real
            </p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {kpiData.map((kpi, index) => (
              <KPICard key={index} {...kpi} />
            ))}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <ActivityChart />
            <CategoryChart />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <UserRolesChart />
            <ServerHealthMonitor />
            <ModerationPanel />
          </div>

          {/* Recent Activity Table */}
          <RecentActivityTable />
        </div>
      </main>
    </div>
  );
}
