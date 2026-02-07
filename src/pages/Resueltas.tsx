import { useState, useEffect } from "react";
import { Navigation } from "@/components/nexus/Navigation";
import { CompactRequestCard } from "@/components/nexus/CompactRequestCard";
import { supabase } from "@/integrations/supabase/client";
import { fetchProfilesCached } from "@/hooks/useProfilesCache";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface Solicitud {
  id: string;
  user_id: string;
  titulo: string;
  descripcion: string | null;
  categoria: string;
  doi: string | null;
  status: string;
  puntos_ofrecidos: number;
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
  const [error, setError] = useState<string | null>(null);

  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    fetchSolicitudes(true);
  }, []);

  const fetchSolicitudes = async (isInitial: boolean = false) => {
    try {
      if (isInitial) {
        setLoading(true);
        setError(null);
        setSolicitudes([]);
      } else {
        setLoadingMore(true);
      }

      const offset = isInitial ? 0 : solicitudes.length;
      console.log("Fetching solicitudes resueltas...", { isInitial, offset });

      const { data: solicitudesData, error: solicitudesError } = await supabase
        .from("solicitudes")
        .select(`
          *,
          likes (user_id),
          comentarios (id),
          respuestas:respuestas!solicitud_id (id)
        `)
        .eq("status", "completada")
        .order("created_at", { ascending: false })
        .range(offset, offset + ITEMS_PER_PAGE - 1);

      if (solicitudesError) {
        console.error("Supabase error fetching solicitudes:", solicitudesError);
        throw solicitudesError;
      }

      console.log("Raw solicitudes data:", solicitudesData);

      if (!solicitudesData || solicitudesData.length === 0) {
        console.log("No data returned from query");
      }

      setHasMore((solicitudesData?.length || 0) === ITEMS_PER_PAGE);

      // Fetch profiles with caching
      const userIds = [...new Set(solicitudesData?.map(s => s.user_id) || [])];

      console.log("Fetching profiles for User IDs:", userIds);
      const profilesMap = await fetchProfilesCached(userIds);

      const enrichedData = solicitudesData?.map(s => ({
        ...s,
        profiles: profilesMap.get(s.user_id) || null
      })) || [];

      console.log("Enriched data:", enrichedData);

      if (isInitial) {
        setSolicitudes(enrichedData as Solicitud[]);
      } else {
        setSolicitudes(prev => [...prev, ...(enrichedData as Solicitud[])]);
      }
    } catch (error: any) {
      console.error("Error fetching solicitudes (catch block):", error);
      setError(error.message || "Error desconocido al cargar las solicitudes");
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
            {error && (
              <div className="card-fb p-4 border-destructive/50 bg-destructive/10 text-destructive mb-4">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertCircle className="w-5 h-5" />
                  <h4>Error al cargar</h4>
                </div>
                <p className="text-sm mt-1 opacity-90">{error}</p>
                <button
                  onClick={() => fetchSolicitudes(true)}
                  className="mt-3 text-xs font-semibold hover:underline"
                >
                  Intentar de nuevo
                </button>
              </div>
            )}
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
                    title={solicitud.titulo}
                    userId={solicitud.user_id}
                    author={{
                      name: solicitud.profiles?.full_name || "Usuario",
                      level: (solicitud.profiles?.level as "novato" | "colaborador" | "experto" | "maestro" | "leyenda") || "novato",
                      avatar: solicitud.profiles?.avatar_url || undefined,
                    }}
                    category={solicitud.categoria}
                    status={solicitud.status}
                    puntosOfrecidos={solicitud.puntos_ofrecidos}
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
