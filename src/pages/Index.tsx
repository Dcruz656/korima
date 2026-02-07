import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Navigation } from "@/components/nexus/Navigation";
import { RequestCard } from "@/components/nexus/RequestCard";
import { CreateRequestModal } from "@/components/nexus/CreateRequestModal";
import { DailyCheckin } from "@/components/nexus/DailyCheckin";
import { TopContributors } from "@/components/nexus/TopContributors";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { fetchProfilesCached } from "@/hooks/useProfilesCache";
import { LevelProgress } from "@/components/nexus/LevelProgress";
import type { Level } from "@/components/nexus/LevelBadge";
import {
  FileText,
  Smile,
  Users,
  Bookmark,
  Clock,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Award,
  Loader2,
  Inbox,
  CheckCircle,
  AlertCircle,
  ScrollText
} from "lucide-react";

interface Solicitud {
  id: string;
  user_id: string;
  titulo: string;
  description: string | null;
  category: string;
  doi: string | null;
  is_urgent: boolean;
  is_resolved: boolean;
  status: string;
  puntos_ofrecidos: number;
  expires_at: string;
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

const sidebarLinks = [
  { icon: FileText, label: "Mis Solicitudes", href: "/mis-solicitudes" },
  { icon: Inbox, label: "Mi Buzón", href: "/buzon" },
  { icon: AlertCircle, label: "Ver Pendientes", href: "/pendientes" },
  { icon: CheckCircle, label: "Ver Resueltas", href: "/resueltas" },
  { icon: Users, label: "Grupos", href: "/grupos" },
  { icon: Bookmark, label: "Guardados", href: "/guardados" },
  { icon: Clock, label: "Historial", href: "/historial" },
  { icon: TrendingUp, label: "Tendencias", href: "/tendencias" },
];

const extraLinks = [
  { icon: ScrollText, label: "Políticas", href: "/politicas" },
];

const Index = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMoreLinks, setShowMoreLinks] = useState(false);
  const [highlightedSolicitudId, setHighlightedSolicitudId] = useState<string | null>(null);
  const solicitudRefs = useRef<Map<string, HTMLElement>>(new Map());

  const ITEMS_PER_PAGE = 10;

  // Handle scroll to solicitud from URL param
  useEffect(() => {
    const solicitudId = searchParams.get("solicitud");
    if (solicitudId && !loading) {
      setHighlightedSolicitudId(solicitudId);

      const exists = solicitudes.some(s => s.id === solicitudId);

      if (exists) {
        setTimeout(() => {
          const element = solicitudRefs.current.get(solicitudId);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 100);

        setTimeout(() => {
          setSearchParams({}, { replace: true });
        }, 500);

        setTimeout(() => {
          setHighlightedSolicitudId(null);
        }, 3000);
      } else {
        fetchSpecificSolicitud(solicitudId);
      }
    }
  }, [searchParams, loading, solicitudes]);

  const fetchSpecificSolicitud = async (solicitudId: string) => {
    try {
      const { data, error } = await supabase
        .from("solicitudes")
        .select(`
          *,
          likes:likes!likes_solicitud_id_fkey (user_id),
          comentarios:comentarios!comentarios_solicitud_id_fkey (id),
          respuestas:respuestas!fk_respuestas_solicitud (id)
        `)
        .eq("id", solicitudId)
        .single();

      if (error || !data) {
        toast({
          titulo: "Solicitud no encontrada",
          description: "La solicitud ya no existe o fue eliminada",
          variant: "destructive",
        });
        setSearchParams({}, { replace: true });
        return;
      }

      const profilesMap = await fetchProfilesCached([data.user_id]);

      const enrichedSolicitud = {
        ...data,
        profiles: profilesMap.get(data.user_id) || null
      } as Solicitud;

      setSolicitudes(prev => {
        const exists = prev.some(s => s.id === solicitudId);
        if (exists) return prev;
        return [enrichedSolicitud, ...prev];
      });

      setTimeout(() => {
        const element = solicitudRefs.current.get(solicitudId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);

      setTimeout(() => {
        setSearchParams({}, { replace: true });
      }, 500);

      setTimeout(() => {
        setHighlightedSolicitudId(null);
      }, 3000);

    } catch (error) {
      console.error("Error fetching specific solicitud:", error);
    }
  };

  useEffect(() => {
    fetchSolicitudes(true);
  }, [user]);

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
          likes:likes!likes_solicitud_id_fkey (user_id),
          comentarios:comentarios!comentarios_solicitud_id_fkey (id),
          respuestas:respuestas!fk_respuestas_solicitud (id)
        `)
        .order("created_at", { ascending: false })
        .range(offset, offset + ITEMS_PER_PAGE - 1);

      if (solicitudesError) throw solicitudesError;

      // Verificar si hay más resultados
      setHasMore((solicitudesData?.length || 0) === ITEMS_PER_PAGE);

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
      toast({
        titulo: "Error",
        description: "No se pudieron cargar las solicitudes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchSolicitudes(false);
    }
  };

  const handleLike = async (solicitudId: string, isLiked: boolean) => {
    if (!user) {
      toast({
        titulo: "Inicia sesión",
        description: "Debes iniciar sesión para dar me gusta",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isLiked) {
        await supabase
          .from("likes")
          .delete()
          .eq("solicitud_id", solicitudId)
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("likes")
          .insert({ solicitud_id: solicitudId, user_id: user.id });
      }
      fetchSolicitudes(true);
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

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Usuario";
  const userPoints = profile?.points || 100;

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
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

            {/* Left Sidebar */}
            <aside className="hidden lg:block">
              <div className="sticky top-[88px] space-y-1">
                {/* User Card */}
                {user ? (
                  <a href="#" className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary transition-colors">
                    <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center overflow-hidden">
                      {profile?.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt={displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-semibold text-primary-foreground">
                          {displayName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="font-medium text-foreground">{displayName}</span>
                  </a>
                ) : (
                  <a
                    href="/auth"
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
                      <Users className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <span className="font-medium text-foreground">Iniciar sesión</span>
                  </a>
                )}

                {sidebarLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.href}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
                      <link.icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-medium text-foreground">{link.label}</span>
                  </a>
                ))}

                <button
                  onClick={() => setShowMoreLinks(!showMoreLinks)}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary transition-colors w-full text-left"
                >
                  <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
                    {showMoreLinks ? (
                      <ChevronUp className="w-5 h-5 text-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-foreground" />
                    )}
                  </div>
                  <span className="font-medium text-foreground">
                    {showMoreLinks ? "Ver menos" : "Ver más"}
                  </span>
                </button>

                {showMoreLinks && (
                  <div className="mt-1 space-y-1">
                    {extraLinks.map((link, index) => (
                      <a
                        key={index}
                        href={link.href}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary transition-colors pl-4"
                      >
                        <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
                          <link.icon className="w-5 h-5 text-primary" />
                        </div>
                        <span className="font-medium text-foreground">{link.label}</span>
                      </a>
                    ))}
                  </div>
                )}

                <hr className="my-2 border-border" />

                <p className="px-2 text-xs text-muted-foreground">
                  Kórima © 2025 · Red de Conocimiento Académico
                </p>
              </div>
            </aside>

            {/* Main Feed */}
            <div className="lg:col-span-2 space-y-4">
              {/* Create Post Card */}
              <div className="card-fb p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center overflow-hidden">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-semibold text-primary-foreground">
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => user ? setShowCreateModal(true) : navigate("/auth")}
                    className="flex-1 text-left px-4 py-2.5 bg-secondary rounded-full text-muted-foreground hover:bg-secondary/80 transition-colors"
                  >
                    ¿Qué documento necesitas?
                  </button>
                </div>
                <hr className="my-3 border-border" />
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => user ? setShowCreateModal(true) : navigate("/auth")}
                    className="flex items-center gap-2 px-6 py-2 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="font-medium text-sm text-muted-foreground">
                      Solicitud
                    </span>
                  </button>
                  <button
                    onClick={() => user ? setShowCreateModal(true) : navigate("/auth")}
                    className="flex items-center gap-2 px-6 py-2 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <Smile className="w-5 h-5 text-urgent" />
                    <span className="font-medium text-sm text-muted-foreground">
                      Urgente
                    </span>
                  </button>
                </div>
              </div>

              {/* Loading state */}
              {loading ? (
                <div className="card-fb p-8 flex justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : solicitudes.length === 0 ? (
                <div className="card-fb p-8 text-center">
                  <p className="text-muted-foreground">
                    No hay solicitudes aún. ¡Sé el primero en crear una!
                  </p>
                </div>
              ) : (
                <>
                  {solicitudes.map((solicitud) => {
                    const isLiked = user
                      ? solicitud.likes.some((l) => l.user_id === user.id)
                      : false;
                    const isHighlighted = highlightedSolicitudId === solicitud.id;

                    return (
                      <div
                        key={solicitud.id}
                        ref={(el) => {
                          if (el) solicitudRefs.current.set(solicitud.id, el);
                        }}
                        className={`transition-all duration-500 ${isHighlighted ? "ring-2 ring-primary ring-offset-2 rounded-lg" : ""}`}
                      >
                        <RequestCard
                          id={solicitud.id}
                          title={solicitud.titulo}
                          userId={solicitud.user_id}
                          description={solicitud.description || undefined}
                          author={{
                            name: solicitud.profiles?.full_name || "Usuario",
                            level: (solicitud.profiles?.level as Level) || "novato",
                            avatar: solicitud.profiles?.avatar_url || undefined,
                          }}
                          category={solicitud.category}
                          doi={solicitud.doi || undefined}
                          isUrgent={solicitud.is_urgent}
                          isResolved={solicitud.is_resolved}
                          status={solicitud.status}
                          puntosOfrecidos={solicitud.puntos_ofrecidos}
                          expiresAt={solicitud.expires_at}
                          likesCount={solicitud.likes.length}
                          commentsCount={solicitud.comentarios.length}
                          responsesCount={solicitud.respuestas.length}
                          createdAt={formatTimeAgo(solicitud.created_at)}
                          isLiked={isLiked}
                          onLike={() => fetchSolicitudes(true)}
                          onRefresh={() => fetchSolicitudes(true)}
                        />
                      </div>
                    );
                  })}

                  {/* Load More Button */}
                  {hasMore && (
                    <button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="w-full card-fb p-4 text-center text-primary font-semibold hover:bg-secondary/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingMore ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Cargando más publicaciones...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <ChevronDown className="w-5 h-5" />
                          Ver más publicaciones
                        </span>
                      )}
                    </button>
                  )}

                  {/* End message */}
                  {!hasMore && solicitudes.length > 0 && (
                    <div className="card-fb p-4 text-center text-muted-foreground text-sm">
                      Has visto todas las publicaciones disponibles
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Right Sidebar */}
            <aside className="hidden lg:block">
              <div className="sticky top-[88px] space-y-4">
                {/* Points Card */}
                {user && (
                  <div className="card-fb p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-points/10 flex items-center justify-center">
                        <Award className="w-6 h-6 text-points" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-points">{userPoints}</p>
                        <p className="text-xs text-muted-foreground">puntos</p>
                      </div>
                    </div>

                    <LevelProgress
                      currentPoints={userPoints}
                      currentLevel={(profile?.level as Level) || "novato"}
                    />

                    <hr className="my-4 border-border" />

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Check-in diario</span>
                        <span className="text-points font-medium">+10 pts</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Mejor respuesta</span>
                        <span className="text-points font-medium">10-50 pts</span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <DailyCheckin onSuccess={() => { }} />
                    </div>
                  </div>
                )}

                <TopContributors />

                <div className="card-fb p-4">
                  <h3 className="font-semibold text-foreground mb-3">Categorías populares</h3>
                  <div className="flex flex-wrap gap-2">
                    {["Medicina", "Ingeniería", "Derecho", "Economía", "Psicología"].map((cat) => (
                      <span
                        key={cat}
                        className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-full text-sm font-medium hover:bg-secondary/80 cursor-pointer transition-colors"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="card-fb p-4">
                  <h3 className="font-semibold text-foreground mb-3">Estadísticas de la red</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Usuarios activos</span>
                      <span className="font-semibold">2,547</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Documentos compartidos</span>
                      <span className="font-semibold">15,892</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Solicitudes hoy</span>
                      <span className="font-semibold">{solicitudes.length}</span>
                    </div>
                  </div>
                </div>

                {!user && (
                  <div className="card-fb p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-3">
                      Únete a la comunidad académica
                    </p>
                    <a
                      href="/auth"
                      className="block w-full py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
                    >
                      Crear cuenta
                    </a>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>

      <CreateRequestModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={() => fetchSolicitudes(true)}
      />
    </div>
  );
};

export default Index;