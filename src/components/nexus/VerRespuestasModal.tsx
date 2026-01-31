import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, Link as LinkIcon, Award, X, CheckCircle, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Respuesta {
  id: string;
  user_id: string;
  tipo: "pdf" | "enlace";
  archivo_url: string | null;
  enlace_descarga: string | null;
  mensaje: string | null;
  es_mejor_respuesta: boolean;
  calificacion: string | null;
  created_at: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
    level: string;
  } | null;
}

interface VerRespuestasModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  solicitudId: string;
  solicitudTitulo: string;
  puntosOfrecidos: number;
  esSolicitante: boolean;
  yaCalificada: boolean;
  onSuccess?: () => void;
}

export function VerRespuestasModal({
  open,
  onOpenChange,
  solicitudId,
  solicitudTitulo,
  puntosOfrecidos,
  esSolicitante,
  yaCalificada,
  onSuccess,
}: VerRespuestasModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [respuestas, setRespuestas] = useState<Respuesta[]>([]);
  const [loading, setLoading] = useState(true);
  const [calificando, setCalificando] = useState(false);
  const [respuestaSeleccionada, setRespuestaSeleccionada] = useState<string | null>(null);
  const [tipoCalificacion, setTipoCalificacion] = useState<"mejor_respuesta" | "incorrecto" | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    if (open) {
      fetchRespuestas();
    }
  }, [open, solicitudId]);

  const fetchRespuestas = async () => {
    setLoading(true);
    try {
      const { data: respuestasData, error: respuestasError } = await supabase
        .from("respuestas")
        .select("*")
        .eq("solicitud_id", solicitudId)
        .order("created_at", { ascending: true });

      if (respuestasError) throw respuestasError;

      if (!respuestasData || respuestasData.length === 0) {
        setRespuestas([]);
        setLoading(false);
        return;
      }

      // Fetch profiles separately
      const userIds = [...new Set(respuestasData.map(r => r.user_id))];
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, level")
        .in("id", userIds);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
      }

      // Map profiles to respuestas
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      
      const enrichedRespuestas = respuestasData.map(r => ({
        ...r,
        profiles: profilesMap.get(r.user_id) || null
      }));

      setRespuestas(enrichedRespuestas as Respuesta[]);
    } catch (error: any) {
      console.error("Error fetching respuestas:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar las respuestas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCalificar = (respuestaId: string, tipo: "mejor_respuesta" | "incorrecto") => {
    setRespuestaSeleccionada(respuestaId);
    setTipoCalificacion(tipo);
    setShowConfirmDialog(true);
  };

  const confirmarCalificacion = async () => {
    if (!respuestaSeleccionada || !tipoCalificacion || !user) return;

    setCalificando(true);

    try {
      if (tipoCalificacion === "mejor_respuesta") {
        const { error } = await supabase.rpc("marcar_mejor_respuesta", {
          p_solicitud_id: solicitudId,
          p_respuesta_id: respuestaSeleccionada,
          p_user_id: user.id,
        });

        if (error) throw error;

        toast({
          title: "¡Mejor respuesta seleccionada!",
          description: `Se han transferido ${puntosOfrecidos} puntos al contribuyente`,
        });
      } else {
        const { error } = await supabase
          .from("respuestas")
          .update({ calificacion: "incorrecto" })
          .eq("id", respuestaSeleccionada);

        if (error) throw error;

        await supabase
          .from("solicitudes")
          .update({ status: "completada" })
          .eq("id", solicitudId);

        toast({
          title: "Respuesta marcada como incorrecta",
          description: "Los puntos se han perdido según las reglas",
        });
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error calificando respuesta:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo calificar la respuesta",
        variant: "destructive",
      });
    } finally {
      setCalificando(false);
      setShowConfirmDialog(false);
      setRespuestaSeleccionada(null);
      setTipoCalificacion(null);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `hace ${diffMins} min`;
    if (diffHours < 24) return `hace ${diffHours} h`;
    return `hace ${diffDays} d`;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Respuestas Recibidas</DialogTitle>
            <DialogDescription className="space-y-1">
              <p className="font-medium text-foreground">{solicitudTitulo}</p>
              {esSolicitante && !yaCalificada && (
                <p className="text-sm text-muted-foreground">
                  Revisa las respuestas y selecciona la mejor para transferir los {puntosOfrecidos} puntos
                </p>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto max-h-[50vh] pr-2">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : respuestas.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Aún no hay respuestas para esta solicitud
              </p>
            ) : (
              respuestas.map((respuesta) => (
                <div
                  key={respuesta.id}
                  className={`p-4 rounded-lg border-2 ${
                    respuesta.es_mejor_respuesta
                      ? "border-points bg-points/5"
                      : respuesta.calificacion === "incorrecto"
                      ? "border-destructive/50 bg-destructive/5"
                      : "border-border"
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center overflow-hidden">
                        {respuesta.profiles?.avatar_url ? (
                          <img
                            src={respuesta.profiles.avatar_url}
                            alt={respuesta.profiles.full_name || "Usuario"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-semibold text-primary-foreground">
                            {(respuesta.profiles?.full_name || "U").charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">
                          {respuesta.profiles?.full_name || "Usuario"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTimeAgo(respuesta.created_at)}
                        </p>
                      </div>
                    </div>

                    {respuesta.es_mejor_respuesta && (
                      <Badge className="bg-points text-white">
                        <Award className="w-3 h-3 mr-1" />
                        Mejor Respuesta
                      </Badge>
                    )}

                    {respuesta.calificacion === "incorrecto" && (
                      <Badge variant="destructive">
                        <X className="w-3 h-3 mr-1" />
                        Incorrecto
                      </Badge>
                    )}
                  </div>

                  {/* Mensaje */}
                  {respuesta.mensaje && (
                    <p className="text-sm text-muted-foreground mb-3">{respuesta.mensaje}</p>
                  )}

                  {/* Archivo/Enlace */}
                  <div className="flex gap-2">
                    {respuesta.tipo === "pdf" && respuesta.archivo_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        asChild
                      >
                        <a href={respuesta.archivo_url} target="_blank" rel="noopener noreferrer">
                          <Download className="w-4 h-4 mr-2" />
                          Descargar PDF
                        </a>
                      </Button>
                    )}

                    {respuesta.tipo === "enlace" && respuesta.enlace_descarga && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        asChild
                      >
                        <a href={respuesta.enlace_descarga} target="_blank" rel="noopener noreferrer">
                          <LinkIcon className="w-4 h-4 mr-2" />
                          Abrir enlace
                        </a>
                      </Button>
                    )}
                  </div>

                  {/* Botones de Calificación */}
                  {esSolicitante && !yaCalificada && !respuesta.calificacion && (
                    <div className="flex gap-2 mt-3 pt-3 border-t">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleCalificar(respuesta.id, "mejor_respuesta")}
                        disabled={calificando}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mejor Respuesta (+{puntosOfrecidos} pts)
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleCalificar(respuesta.id, "incorrecto")}
                        disabled={calificando}
                      >
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Incorrecto
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end pt-2 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {tipoCalificacion === "mejor_respuesta"
                ? "¿Confirmar mejor respuesta?"
                : "¿Marcar como incorrecto?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {tipoCalificacion === "mejor_respuesta" ? (
                <>
                  Se transferirán <strong>{puntosOfrecidos} puntos</strong> al contribuyente
                  y esta acción no se puede deshacer. Los demás archivos se eliminarán en 24 horas.
                </>
              ) : (
                <>
                  Los <strong>{puntosOfrecidos} puntos se perderán</strong> (no se devuelven).
                  Esta acción no se puede deshacer.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={calificando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarCalificacion} disabled={calificando}>
              {calificando ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                "Confirmar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
