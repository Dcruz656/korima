import { useState, useEffect } from "react";
import { Navigation } from "@/components/nexus/Navigation";
import { CompactRequestCard } from "@/components/nexus/CompactRequestCard";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfilesCached } from "@/hooks/useProfilesCache";
import { Loader2, CheckCircle } from "lucide-react";

interface Solicitud {
  id: string;
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

const Resueltas = () => {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    fetchSolicitudes(true);
  }, []);

  const fetchSolicitudes = async (isInitial: boolean = false) => {
    try {
      if (isInitial) {
        setLoading(true);
        setSolicitudes([]);
      } else {
        setLoadingMore(true);
      }

      const offset = isInitial ? 0 : solicitudes.length;

      const { data: solicitudesData, error: solicitudesError } = await supabase
        .from("solicitudes")
        .select(`
          *,
          likes (user_id),
          comentarios (id),
          respuestas (id)
        `)
        .eq("is_resolved", true)
        .order("created_at", { ascending: false })
        .range(offset, offset + ITEMS_PER_PAGE - 1);

      if (solicitudesError) throw solicitudesError;

      setHasMore((solicitudesData?.length || 0) === ITEMS_PER_PAGE);

      // Fetch profiles with caching
      const userIds = [...new Set(solicitudesData?.map(s => s.user_id) || [])];
      const profilesMap = await fetchProfilesCached(userIds);

      const enrichedData = solicitudesData?.map(s => ({
        ...s,
        profiles: profilesMap.get(s.user_id) || null
      })) || [];

      if (isInitial) {
        setSolicitudes(enrichedData as Solicitud[]);
      } else {
        setSolicitudes(prev => [...prev, ...(enrichedData as Solicitud[])]);
      }
    } catch (error) {
      console.error("Error fetching solicitudes:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="pt-14">
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Solicitudes Resueltas</h1>
              <p className="text-sm text-muted-foreground">
                {solicitudes.length > 0 && `${solicitudes.length} solicitudes`}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            {loading ? (
              <div className="card-fb p-8 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : solicitudes.length === 0 ? (
              <div className="card-fb p-8 text-center">
                <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  No hay solicitudes resueltas aún
                </p>
              </div>
            ) : (
              <>
                {solicitudes.map((solicitud) => (
                  <CompactRequestCard
                    key={solicitud.id}
                    id={solicitud.id}
                    title={solicitud.title}
                    userId={solicitud.user_id}
                    author={{
                      name: solicitud.profiles?.full_name || "Usuario",
                      level: (solicitud.profiles?.level as "novato" | "colaborador" | "experto" | "maestro" | "leyenda") || "novato",
                      avatar: solicitud.profiles?.avatar_url || undefined,
                    }}
                    category={solicitud.category}
                    isUrgent={solicitud.is_urgent}
                    isResolved={solicitud.is_resolved}
                    likesCount={solicitud.likes.length}
                    commentsCount={solicitud.comentarios.length}
                    responsesCount={solicitud.respuestas.length}
                    createdAt={formatTimeAgo(solicitud.created_at)}
                  />
                ))}
                
                {hasMore && (
                  <button
                    onClick={() => fetchSolicitudes(false)}
                    disabled={loadingMore}
                    className="w-full card-fb p-3 text-center text-primary font-semibold hover:bg-secondary/50 transition-colors disabled:opacity-50 text-sm"
                  >
                    {loadingMore ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Cargando...
                      </span>
                    ) : (
                      "Ver más"
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Resueltas;
