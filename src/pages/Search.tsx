import { useState, useEffect } from "react";
import { Navigation } from "@/components/nexus/Navigation";
import { SearchBar } from "@/components/nexus/SearchBar";
import { RequestCard } from "@/components/nexus/RequestCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { fetchProfilesCached } from "@/hooks/useProfilesCache";
import type { Level } from "@/components/nexus/LevelBadge";
import { Loader2, Search as SearchIcon, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Solicitud {
  id: string;
  user_id: string;
  title: string;
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

const categories = [
  "Todas",
  "Medicina",
  "Ingeniería",
  "Derecho",
  "Economía",
  "Psicología",
  "Biología",
  "Química",
  "Física",
  "Matemáticas",
  "Ciencias Sociales",
  "Humanidades",
  "Tecnología",
  "Otro",
];

const SearchPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [sortBy, setSortBy] = useState<"recent" | "popular">("recent");

  const fetchSolicitudes = async (query: string = "") => {
    setLoading(true);
    try {
      let queryBuilder = supabase
        .from("solicitudes")
        .select(`
          *,
          likes:likes!likes_solicitud_id_fkey (user_id),
          comentarios:comentarios!comentarios_solicitud_id_fkey (id),
          respuestas:respuestas!fk_respuestas_solicitud (id)
        `)
        .order("created_at", { ascending: false });

      if (query) {
        queryBuilder = queryBuilder.or(`titulo.ilike.%${query}%,descripcion.ilike.%${query}%`);
      }

      if (selectedCategory !== "Todas") {
        queryBuilder = queryBuilder.eq("categoria", selectedCategory);
      }

      const { data: solicitudesData, error } = await queryBuilder.limit(50);

      if (error) throw error;

      // Fetch profiles with caching
      const userIds = [...new Set(solicitudesData?.map((s) => s.user_id) || [])];
      const profilesMap = await fetchProfilesCached(userIds);

      let enrichedData = solicitudesData?.map((s) => ({
        ...s,
        title: s.titulo,
        description: s.descripcion,
        category: s.categoria,
        profiles: profilesMap.get(s.user_id) || null,
      })) || [];

      // Sort by popularity if selected
      if (sortBy === "popular") {
        enrichedData = enrichedData.sort(
          (a, b) => b.likes.length - a.likes.length
        );
      }

      setSolicitudes(enrichedData as Solicitud[]);
    } catch (error) {
      console.error("Error searching:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los resultados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSolicitudes(searchQuery);
  }, [selectedCategory, sortBy]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    fetchSolicitudes(query);
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
      fetchSolicitudes(searchQuery);
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
              <SearchIcon className="w-6 h-6 text-primary" />
              Buscar Solicitudes
            </h1>
            <p className="text-muted-foreground">
              Encuentra documentos académicos por título o descripción
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <SearchBar onSearch={handleSearch} placeholder="Buscar por título o descripción..." />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as "recent" | "popular")}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Más recientes</SelectItem>
                <SelectItem value="popular">Más populares</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results */}
          {loading ? (
            <div className="card-fb p-8 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : solicitudes.length === 0 ? (
            <div className="card-fb p-8 text-center">
              <SearchIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery
                  ? "No se encontraron resultados para tu búsqueda"
                  : "Realiza una búsqueda para ver resultados"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {solicitudes.length} resultado{solicitudes.length !== 1 ? "s" : ""} encontrado{solicitudes.length !== 1 ? "s" : ""}
              </p>
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
                    onLike={() => handleLike(solicitud.id, isLiked)}
                    onRefresh={() => fetchSolicitudes(searchQuery)}
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

export default SearchPage;
