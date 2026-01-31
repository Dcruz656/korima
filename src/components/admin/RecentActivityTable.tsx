import { Badge } from "@/components/ui/badge";
import { FileText, Clock, CheckCircle, XCircle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Activity {
  id: string;
  fileName: string;
  user: string;
  category: string;
  status: "pending" | "approved" | "rejected";
  uploadedAt: string;
}

const activities: Activity[] = [
  {
    id: "1",
    fileName: "Quantum_Mechanics_Fundamentals.pdf",
    user: "Dr. María González",
    category: "Física",
    status: "approved",
    uploadedAt: "Hace 5 min",
  },
  {
    id: "2",
    fileName: "Neural_Networks_Deep_Learning.pdf",
    user: "Carlos Mendoza",
    category: "IA",
    status: "pending",
    uploadedAt: "Hace 12 min",
  },
  {
    id: "3",
    fileName: "Organic_Chemistry_Advanced.pdf",
    user: "Ana Rodríguez",
    category: "Química",
    status: "approved",
    uploadedAt: "Hace 18 min",
  },
  {
    id: "4",
    fileName: "Cell_Biology_Molecular.pdf",
    user: "Luis Martínez",
    category: "Biología",
    status: "rejected",
    uploadedAt: "Hace 25 min",
  },
  {
    id: "5",
    fileName: "Clinical_Medicine_Practice.pdf",
    user: "Dra. Carmen Silva",
    category: "Medicina",
    status: "pending",
    uploadedAt: "Hace 32 min",
  },
];

const statusConfig = {
  pending: {
    label: "Pendiente",
    icon: Clock,
    color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
  },
  approved: {
    label: "Aprobado",
    icon: CheckCircle,
    color: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  },
  rejected: {
    label: "Rechazado",
    icon: XCircle,
    color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  },
};

export function RecentActivityTable() {
  return (
    <div className="card-fb p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">
          Actividad Reciente
        </h3>
        <Button variant="ghost" size="sm">
          Ver todo
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                Archivo
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                Usuario
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                Categoría
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                Estado
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground">
                Subido
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-muted-foreground">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {activities.map((activity) => {
              const StatusIcon = statusConfig[activity.status].icon;
              return (
                <tr
                  key={activity.id}
                  className="border-b border-border hover:bg-secondary/50 transition-colors"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium text-foreground max-w-[200px] truncate">
                        {activity.fileName}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-foreground">
                      {activity.user}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <Badge variant="outline" className="text-xs">
                      {activity.category}
                    </Badge>
                  </td>
                  <td className="py-4 px-4">
                    <div
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        statusConfig[activity.status].color
                      }`}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      {statusConfig[activity.status].label}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-muted-foreground">
                      {activity.uploadedAt}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
