import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/nexus/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { fetchProfilesCached } from "@/hooks/useProfilesCache";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Inbox,
  FileText,
  Clock,
  Download,
  ExternalLink,
  Star,
  Loader2,
  AlertTriangle,
} from "lucide-react";

interface Respuesta {
  id: string;
  message: string | null;
  file_url: string | null;
  file_name: string | null;
  created_at: string;
  expires_at: string;
  is_best_answer: boolean;
  points_earned: number;
  solicitud: {
    id: string;
    titulo: string;
    categoria: string;
  };
  profile: {
    full_name: string | null;
    level: string;
  } | null;
}

export default function Buzon() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [respuestas, setRespuestas] = useState<Respuesta[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedUrls, setSignedUrls] = useState<Map<string, string>>(new Map());
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    
    if (!user) return;

    const fetchRespuestas = async () => {
      try {
        setLoading(true);

        // Get user's solicitudes - USANDO NOMBRES EN ESPAÑOL
        const { data: userSolicitudes, error: solicitudesError } = await supabase
          .from("solicitudes")
          .select("id, titulo, categoria")
          .eq("user_id", user.id);

        if (solicitudesError) {
          console.error("Error fetching solicitudes:", solicitudesError);
          throw solicitudesError;
        }

        if (!userSolicitudes || userSolicitudes.length === 0) {
          setRespuestas([]);
          setLoading(false);
          return;
        }

        const solicitudIds = userSolicitudes.map(s => s.id);

        // Get respuestas for those solicitudes
        const { data: respuestasData, error: respuestasError } = await supabase
          .from("respuestas")
          .select("*")
          .in("solicitud_id", solicitudIds)
          .order("created_at", { ascending: false });

        if (respuestasError) {
          console.error("Error fetching respuestas:", respuestasError);
          throw respuestasError;
        }

        if (!respuestasData || respuestasData.length === 0) {
          setRespuestas([]);
          setLoading(false);
          return;
        }

        // Create solicitudes map
        const solicitudesMap = new Map(userSolicitudes.map(s => [s.id, s]));

        // Get profiles
        const responderIds = [...new Set(respuestasData.map(r => r.user_id))];
        const profilesMap = await fetchProfilesCached(responderIds);

        // Enrich respuestas
        const enrichedRespuestas: Respuesta[] = respuestasData.map(r => ({
          id: r.id,
          message: r.message,
          file_url: r.file_url,
          file_name: r.file_name,
          created_at: r.created_at,
          expires_at: r.expires_at,
          is_best_answer: r.is_best_answer,
          points_earned: r.points_earned,
          solicitud: solicitudesMap.get(r.solicitud_id) || {
            id: r.solicitud_id,
            titulo: "Solicitud eliminada",
            categoria: "General",
          },
          profile: profilesMap.get(r.user_id) || null,
        }));

        setRespuestas(enrichedRespuestas);
      } catch (error: any) {
        console.error("Error in fetchRespuestas:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las respuestas",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRespuestas();
  }, [user, authLoading, navigate, toast]);

  const handleMarkAsBest = async (respuestaId: string) => {
    try {
      const { error } = await supabase
        .from("respuestas")
        .update({ is_best_answer: true })
        .eq("id", respuestaId);

      if (error) throw error;

      toast({
        title: "¡Marcada como mejor respuesta!",
        description: "El colaborador recibirá puntos extra",
      });

      // Reload
      window.location.reload();
    } catch (error) {
      console.error("Error marking as best:", error);
    }
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffMs = expires.getTime() - now.getTime();

    if (diffMs <= 0) return "Expirado";

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diffDays > 0) return `${diffDays} días restantes`;
    return `${diffHours} horas restantes`;
  };

  const getSignedUrl = async (respuestaId: string, filePath: string): Promise<string | null> => {
    const isHttpUrl = filePath.startsWith("http://") || filePath.startsWith("https://");

    let normalizedPath: string = filePath;
    if (isHttpUrl) {
      try {
        const url = new URL(filePath);
        const marker = "/respuestas-docs/";
        const idx = url.pathname.indexOf(marker);
        if (idx !== -1) {
          normalizedPath = decodeURIComponent(url.pathname.slice(idx + marker.length));
        } else {
          return filePath;
        }
      } catch {
        return filePath;
      }
    }

    const cached = signedUrls.get(respuestaId);
    if (cached) return cached;

    try {
      const { data, error } = await supabase.storage
        .from("respuestas-docs")
        .createSignedUrl(normalizedPath, 3600);

      if (error) throw error;

      setSignedUrls(prev => new Map(prev).set(respuestaId, data.signedUrl));
      return data.signedUrl;
    } catch (error) {
      console.error("Error getting signed URL:", error);
      return null;
    }
  };

  const handleOpenFile = async (respuestaId: string, filePath: string) => {
    setDownloadingId(respuestaId);
    try {
      const url = await getSignedUrl(respuestaId, filePath);
      if (url) {
        window.open(url, '_blank');
      } else {
        toast({
          title: "Error",
          description: "No se pudo obtener el enlace del archivo",
          variant: "destructive",
        });
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="pt-20">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-6">
            <Inbox className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Mi Buzón</h1>
              <p className="text-muted-foreground text-sm">
                Respuestas a tus solicitudes de documentos
              </p>
            </div>
          </div>

          {loading ? (
            <div className="card-fb p-8 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : respuestas.length === 0 ? (
            <div className="card-fb p-8 text-center">
              <Inbox className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">
                Tu buzón está vacío
              </p>
              <p className="text-muted-foreground mb-4">
                Cuando alguien responda a tus solicitudes, aparecerán aquí
              </p>
              <Button onClick={() => navigate("/")}>
                Ver solicitudes
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {respuestas.map((respuesta) => (
                <div
                  key={respuesta.id}
                  className={`card-fb p-4 ${
                    respuesta.is_best_answer
                      ? "ring-2 ring-points"
                      : isExpired(respuesta.expires_at)
                      ? "opacity-60"
                      : ""
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium text-foreground">
                          {respuesta.solicitud.titulo}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {respuesta.solicitud.categoria} · {formatDate(respuesta.created_at)}
                        </p>
                      </div>
                    </div>
                    {respuesta.is_best_answer && (
                      <Badge className="bg-points text-points-foreground">
                        <Star className="w-3 h-3 mr-1" />
                        Mejor respuesta
                      </Badge>
                    )}
                  </div>

                  <div className="mb-3">
                    <p className="text-sm text-muted-foreground mb-1">
                      Aportado por: <span className="font-medium">{respuesta.profile?.full_name || "Usuario"}</span>
                    </p>
                    {respuesta.message && (
                      <p className="text-foreground bg-secondary p-2 rounded-md text-sm">
                        {respuesta.message}
                      </p>
                    )}
                  </div>

                  {respuesta.file_url && (
                    <div className="flex items-center justify-between p-3 bg-secondary rounded-lg mb-3">
                      {isExpired(respuesta.expires_at) ? (
                        <div className="flex items-center gap-2 text-destructive">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-sm font-medium">Enlace expirado</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {formatTimeRemaining(respuesta.expires_at)}
                            </span>
                          </div>
                          <button
                            onClick={() => handleOpenFile(respuesta.id, respuesta.file_url!)}
                            disabled={downloadingId === respuesta.id}
                            className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                          >
                            {downloadingId === respuesta.id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Cargando...
                              </>
                            ) : respuesta.file_name ? (
                              <>
                                <Download className="w-4 h-4" />
                                Descargar PDF
                              </>
                            ) : (
                              <>
                                <ExternalLink className="w-4 h-4" />
                                Abrir enlace
                              </>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {!respuesta.is_best_answer && !isExpired(respuesta.expires_at) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkAsBest(respuesta.id)}
                      className="w-full"
                    >
                      <Star className="w-4 h-4 mr-2" />
                      Marcar como mejor respuesta
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
