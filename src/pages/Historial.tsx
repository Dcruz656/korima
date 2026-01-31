import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/nexus/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Clock, FileText, MessageCircle, ThumbsUp, Send, Award } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface ActivityItem {
  id: string;
  type: "solicitud" | "comentario" | "like" | "respuesta";
  title: string;
  description?: string;
  created_at: string;
  reference_id?: string;
}

const Historial = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchActivity();
    }
  }, [user]);

  const fetchActivity = async () => {
    if (!user) return;

    try {
      // Fetch all user activities in parallel
      const [solicitudesRes, comentariosRes, likesRes, respuestasRes] = await Promise.all([
        supabase
          .from("solicitudes")
          .select("id, title, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("comentarios")
          .select("id, content, created_at, solicitud_id, solicitudes(title)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("likes")
          .select("id, created_at, solicitud_id, solicitudes(title)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("respuestas")
          .select("id, message, created_at, solicitud_id, solicitudes(title)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      const allActivities: ActivityItem[] = [];

      // Process solicitudes
      solicitudesRes.data?.forEach((s) => {
        allActivities.push({
          id: `sol-${s.id}`,
          type: "solicitud",
          title: "Creaste una solicitud",
          description: s.title,
          created_at: s.created_at,
          reference_id: s.id,
        });
      });

      // Process comentarios
      comentariosRes.data?.forEach((c) => {
        allActivities.push({
          id: `com-${c.id}`,
          type: "comentario",
          title: "Comentaste en",
          description: (c.solicitudes as any)?.title || "una solicitud",
          created_at: c.created_at,
          reference_id: c.solicitud_id,
        });
      });

      // Process likes
      likesRes.data?.forEach((l) => {
        allActivities.push({
          id: `like-${l.id}`,
          type: "like",
          title: "Te gustó",
          description: (l.solicitudes as any)?.title || "una solicitud",
          created_at: l.created_at,
          reference_id: l.solicitud_id,
        });
      });

      // Process respuestas
      respuestasRes.data?.forEach((r) => {
        allActivities.push({
          id: `resp-${r.id}`,
          type: "respuesta",
          title: "Aportaste documento en",
          description: (r.solicitudes as any)?.title || "una solicitud",
          created_at: r.created_at,
          reference_id: r.solicitud_id,
        });
      });

      // Sort by date
      allActivities.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setActivities(allActivities);
    } catch (error) {
      console.error("Error fetching activity:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar el historial",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: ActivityItem["type"]) => {
    switch (type) {
      case "solicitud":
        return <FileText className="w-5 h-5 text-primary" />;
      case "comentario":
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case "like":
        return <ThumbsUp className="w-5 h-5 text-pink-500" />;
      case "respuesta":
        return <Send className="w-5 h-5 text-green-500" />;
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
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
      <main className="pt-14">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
              <Clock className="w-6 h-6 text-primary" />
              Historial de Actividad
            </h1>
            <p className="text-muted-foreground">
              Tu actividad reciente en la plataforma
            </p>
          </div>

          {/* Content */}
          {loading ? (
            <div className="card-fb p-8 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : activities.length === 0 ? (
            <div className="card-fb p-8 text-center">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No tienes actividad reciente</p>
              <p className="text-sm text-muted-foreground mt-2">
                Empieza a crear solicitudes o aportar documentos
              </p>
            </div>
          ) : (
            <div className="card-fb divide-y divide-border">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="p-4 hover:bg-secondary/50 transition-colors cursor-pointer"
                  onClick={() => activity.reference_id && navigate(`/?highlight=${activity.reference_id}`)}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">
                        {activity.title}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(activity.created_at), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Historial;
