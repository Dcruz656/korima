import { AlertTriangle, Flag, Copyright } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ModerationPanel() {
  return (
    <div className="card-fb p-6">
      <h3 className="text-lg font-semibold text-foreground mb-6">
        Moderación
      </h3>

      <div className="space-y-4">
        {/* Reportes de Usuarios */}
        <div className="flex items-center justify-between p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/20">
              <Flag className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Reportes de usuarios
              </p>
              <p className="text-xs text-muted-foreground">
                Requieren atención
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-2xl font-bold text-orange-500">12</span>
            <Button size="sm" variant="ghost" className="h-6 text-xs">
              Revisar
            </Button>
          </div>
        </div>

        {/* Infracciones de Copyright */}
        <div className="flex items-center justify-between p-4 bg-red-500/10 rounded-lg border border-red-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/20">
              <Copyright className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Copyright
              </p>
              <p className="text-xs text-muted-foreground">
                Archivos marcados
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-2xl font-bold text-red-500">5</span>
            <Button size="sm" variant="ghost" className="h-6 text-xs">
              Revisar
            </Button>
          </div>
        </div>

        {/* Contenido Pendiente */}
        <div className="flex items-center justify-between p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/20">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Pendientes
              </p>
              <p className="text-xs text-muted-foreground">
                Validación requerida
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="text-2xl font-bold text-yellow-500">28</span>
            <Button size="sm" variant="ghost" className="h-6 text-xs">
              Revisar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
