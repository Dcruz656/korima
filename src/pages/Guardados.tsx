import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/nexus/Navigation";
import { RequestCard } from "@/components/nexus/RequestCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { fetchProfilesCached } from "@/hooks/useProfilesCache";
import { Loader2, Bookmark, BookmarkX } from "lucide-react";

interface SavedSolicitud {
  id: string;
  solicitud_id: string;
  created_at: string;
  solicitudes: {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    category: string;
    doi: string | null;
    is_urgent: boolean;
    is_resolved: boolean;
    created_at: string;
  };
}

interface EnrichedSolicitud {
  id: string;
  saved_id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string;
  doi: string | null;
  is_urgent: boolean;
  is_resolved: boolean;
  created_at: string;
  profiles: {
    full_name: string | null;
    level: string;
    avatar_url: string | null;
  } | null;
  likes: { user_id: string }[];
  comentarios: { id: string }[];
  respuestas: { id: string }[];
}

const Guardados = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [solicitudes, setSolicitudes] = useState<EnrichedSolicitud[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchSavedSolicitudes();
    }
  }, [user]);

  const fetchSavedSolicitudes = async () => {
    if (!user) return;

    try {
      // Fetch saved solicitudes
      const { data: savedData, error: savedError } = await supabase
        .from("saved_solicitudes")
        .select(`
          id,
          solicitud_id,
          created_at,
          solicitudes (*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (savedError) throw savedError;

      if (!savedData || savedData.length === 0) {
        setSolicitudes([]);
        setLoading(false);
        return;
      }

      // Get solicitud IDs
      const solicitudIds = savedData.map((s) => s.solicitud_id);

      // Fetch likes, comments, responses
      const [likesRes, comentariosRes, respuestasRes] = await Promise.all([
        supabase.from("likes").select("solicitud_id, user_id").in("solicitud_id", solicitudIds),
        supabase.from("comentarios").select("solicitud_id, id").in("solicitud_id", solicitudIds),
        supabase.from("respuestas").select("solicitud_id, id").in("solicitud_id", solicitudIds),
      ]);

      // Fetch profiles with caching
      const userIds = [...new Set(savedData.map((s) => (s.solicitudes as any)?.user_id).filter(Boolean))];
      const profilesMap = await fetchProfilesCached(userIds);

      // Group likes, comments, responses by solicitud_id
      const likesMap = new Map<string, { user_id: string }[]>();
      const comentariosMap = new Map<string, { id: string }[]>();
      const respuestasMap = new Map<string, { id: string }[]>();

      likesRes.data?.forEach((l) => {
        const arr = likesMap.get(l.solicitud_id) || [];
        arr.push({ user_id: l.user_id });
        likesMap.set(l.solicitud_id, arr);
      });

      comentariosRes.data?.forEach((c) => {
        const arr = comentariosMap.get(c.solicitud_id) || [];
        arr.push({ id: c.id });
        comentariosMap.set(c.solicitud_id, arr);
      });

      respuestasRes.data?.forEach((r) => {
        const arr = respuestasMap.get(r.solicitud_id) || [];
        arr.push({ id: r.id });
        respuestasMap.set(r.solicitud_id, arr);
      });

      // Enrich data
      const enrichedData: EnrichedSolicitud[] = savedData
        .filter((s) => s.solicitudes)
        .map((s) => {
          const sol = s.solicitudes as any;
          return {
            id: sol.id,
            saved_id: s.id,
            user_id: sol.user_id,
            title: sol.title,
            description: sol.description,
            category: sol.category,
            doi: sol.doi,
            is_urgent: sol.is_urgent,
            is_resolved: sol.is_resolved,
            created_at: sol.created_at,
            profiles: profilesMap.get(sol.user_id) || null,
            likes: likesMap.get(sol.id) || [],
            comentarios: comentariosMap.get(sol.id) || [],
            respuestas: respuestasMap.get(sol.id) || [],
          };
        });

      setSolicitudes(enrichedData);
    } catch (error) {
      console.error("Error fetching saved solicitudes:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar tus guardados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (solicitudId: string, isLiked: boolean) => {
    if (!user) return;

    try {
      if (isLiked) {
        await supabase.from("likes").delete().eq("solicitud_id", solicitudId).eq("user_id", user.id);
      } else {
        await supabase.from("likes").insert({ solicitud_id: solicitudId, user_id: user.id });
      }
      fetchSavedSolicitudes();
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours} h`;
    return `${diffDays} d`;
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
              <Bookmark className="w-6 h-6 text-primary" />
              Guardados
            </h1>
            <p className="text-muted-foreground">
              Solicitudes que has guardado para ver después
            </p>
          </div>

          {/* Content */}
          {loading ? (
            <div className="card-fb p-8 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : solicitudes.length === 0 ? (
            <div className="card-fb p-8 text-center">
              <BookmarkX className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No tienes solicitudes guardadas
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Guarda solicitudes para acceder a ellas fácilmente
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {solicitudes.map((solicitud) => {
                const isLiked = user
                  ? solicitud.likes.some((l) => l.user_id === user.id)
                  : false;

                return (
                  <RequestCard
                    key={solicitud.id}
                    id={solicitud.id}
                    title={solicitud.title}
                    userId={solicitud.user_id}
                    description={solicitud.description || undefined}
                    author={{
                      name: solicitud.profiles?.full_name || "Usuario",
                      level: (solicitud.profiles?.level as "novato" | "colaborador" | "experto" | "maestro" | "leyenda") || "novato",
                      avatar: solicitud.profiles?.avatar_url || undefined,
                    }}
                    category={solicitud.category}
                    doi={solicitud.doi || undefined}
                    isUrgent={solicitud.is_urgent}
                    isResolved={solicitud.is_resolved}
                    likesCount={solicitud.likes.length}
                    commentsCount={solicitud.comentarios.length}
                    responsesCount={solicitud.respuestas.length}
                    createdAt={formatTimeAgo(solicitud.created_at)}
                    isLiked={isLiked}
                    onLike={() => handleLike(solicitud.id, isLiked)}
                    onRefresh={fetchSavedSolicitudes}
                  />
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Guardados;
