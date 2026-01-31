import { useState, useEffect } from "react";
import { Navigation } from "@/components/nexus/Navigation";
import { RequestCard } from "@/components/nexus/RequestCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { fetchProfilesCached } from "@/hooks/useProfilesCache";
import { Loader2, TrendingUp, Flame, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

const Tendencias = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"today" | "week" | "month">("week");

  useEffect(() => {
    fetchTrending();
  }, [period]);

  const fetchTrending = async () => {
    setLoading(true);
    try {
      // Calculate date filter
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case "today":
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case "week":
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case "month":
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
      }

      const { data: solicitudesData, error } = await supabase
        .from("solicitudes")
        .select(`
          *,
          likes (user_id),
          comentarios (id),
          respuestas (id)
        `)
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch profiles with caching (instant if already cached from Index)
      const userIds = [...new Set(solicitudesData?.map((s) => s.user_id) || [])];
      const profilesMap = await fetchProfilesCached(userIds);

      // Enrich and sort by engagement
      const enrichedData = solicitudesData
        ?.map((s) => ({
          ...s,
          profiles: profilesMap.get(s.user_id) || null,
          engagement: s.likes.length + s.comentarios.length + s.respuestas.length,
        }))
        .sort((a, b) => b.engagement - a.engagement) || [];

      setSolicitudes(enrichedData as Solicitud[]);
    } catch (error) {
      console.error("Error fetching trending:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las tendencias",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (solicitudId: string, isLiked: boolean) => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para dar me gusta",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isLiked) {
        await supabase.from("likes").delete().eq("solicitud_id", solicitudId).eq("user_id", user.id);
      } else {
        await supabase.from("likes").insert({ solicitud_id: solicitudId, user_id: user.id });
      }
      fetchTrending();
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-14">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-primary" />
              Tendencias
            </h1>
            <p className="text-muted-foreground">
              Las solicitudes más populares de la comunidad
            </p>
          </div>

          {/* Period Tabs */}
          <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)} className="mb-6">
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="today" className="flex items-center gap-2">
                <Flame className="w-4 h-4" />
                Hoy
              </TabsTrigger>
              <TabsTrigger value="week" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Semana
              </TabsTrigger>
              <TabsTrigger value="month" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Mes
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Content */}
          {loading ? (
            <div className="card-fb p-8 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : solicitudes.length === 0 ? (
            <div className="card-fb p-8 text-center">
              <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No hay tendencias en este período
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {solicitudes.map((solicitud, index) => {
                const isLiked = user
                  ? solicitud.likes.some((l) => l.user_id === user.id)
                  : false;

                return (
                  <div key={solicitud.id} className="relative">
                    {index < 3 && (
                      <div className="absolute -left-3 top-4 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm z-10">
                        {index + 1}
                      </div>
                    )}
                    <RequestCard
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
                      onRefresh={fetchTrending}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Tendencias;
