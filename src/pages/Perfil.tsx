import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/nexus/Navigation";
import { LevelBadge } from "@/components/nexus/LevelBadge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { EditProfileModal } from "@/components/nexus/EditProfileModal";
import { 
  Loader2, 
  MapPin, 
  Building2, 
  GraduationCap, 
  Globe, 
  Award,
  FileText,
  MessageCircle,
  Heart,
  Calendar,
  ArrowLeft,
  Pencil,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProfileData {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  points: number;
  level: string;
  country: string | null;
  institution: string | null;
  specialty: string | null;
  bio: string | null;
  website: string | null;
  created_at: string;
}

interface UserStats {
  solicitudesCount: number;
  respuestasCount: number;
  likesReceived: number;
}

const Perfil = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<UserStats>({ solicitudesCount: 0, respuestasCount: 0, likesReceived: 0 });
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const isOwnProfile = user?.id === userId;

  useEffect(() => {
    if (userId) {
      fetchProfile();
      fetchStats();
    }
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Get solicitudes count
      const { count: solicitudesCount } = await supabase
        .from("solicitudes")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      // Get respuestas count
      const { count: respuestasCount } = await supabase
        .from("respuestas")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      // Get likes received on user's solicitudes
      const { data: userSolicitudes } = await supabase
        .from("solicitudes")
        .select("id")
        .eq("user_id", userId);

      let likesReceived = 0;
      if (userSolicitudes && userSolicitudes.length > 0) {
        const solicitudIds = userSolicitudes.map(s => s.id);
        const { count } = await supabase
          .from("likes")
          .select("*", { count: "exact", head: true })
          .in("solicitud_id", solicitudIds);
        likesReceived = count || 0;
      }

      setStats({
        solicitudesCount: solicitudesCount || 0,
        respuestasCount: respuestasCount || 0,
        likesReceived,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-14 flex items-center justify-center min-h-[calc(100vh-56px)]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-14">
          <div className="max-w-2xl mx-auto px-4 py-12 text-center">
            <User className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Usuario no encontrado</h1>
            <p className="text-muted-foreground mb-6">Este perfil no existe o ha sido eliminado.</p>
            <Button onClick={() => navigate("/")} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al inicio
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const displayName = profile.full_name || profile.email?.split("@")[0] || "Usuario";

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="pt-14">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Volver</span>
          </button>

          {/* Profile Card */}
          <div className="card-fb overflow-hidden">
            {/* Cover gradient */}
            <div className="h-32 bg-gradient-to-r from-primary to-primary/70" />
            
            {/* Profile info */}
            <div className="px-6 pb-6">
              {/* Avatar */}
              <div className="relative -mt-16 mb-4">
                <div className="w-32 h-32 rounded-full border-4 border-background bg-secondary overflow-hidden">
                  {profile.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl font-bold text-primary">
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                
                {isOwnProfile && (
                  <Button
                    onClick={() => setShowEditModal(true)}
                    size="sm"
                    className="absolute bottom-0 right-0 rounded-full"
                  >
                    <Pencil className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                )}
              </div>

              {/* Name and level */}
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
                <LevelBadge level={profile.level as "novato" | "colaborador" | "experto" | "maestro" | "leyenda"} />
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="text-foreground mb-4">{profile.bio}</p>
              )}

              {/* Info items */}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
                {profile.country && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    <span>{profile.country}</span>
                  </div>
                )}
                {profile.institution && (
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" />
                    <span>{profile.institution}</span>
                  </div>
                )}
                {profile.specialty && (
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4" />
                    <span>{profile.specialty}</span>
                  </div>
                )}
                {profile.website && (
                  <a 
                    href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-primary hover:underline"
                  >
                    <Globe className="w-4 h-4" />
                    <span>Sitio web</span>
                  </a>
                )}
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>Se unió en {formatDate(profile.created_at)}</span>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-secondary rounded-xl p-4 text-center">
                  <Award className="w-6 h-6 text-points mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{profile.points}</p>
                  <p className="text-xs text-muted-foreground">Puntos</p>
                </div>
                <div className="bg-secondary rounded-xl p-4 text-center">
                  <FileText className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{stats.solicitudesCount}</p>
                  <p className="text-xs text-muted-foreground">Solicitudes</p>
                </div>
                <div className="bg-secondary rounded-xl p-4 text-center">
                  <MessageCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{stats.respuestasCount}</p>
                  <p className="text-xs text-muted-foreground">Respuestas</p>
                </div>
                <div className="bg-secondary rounded-xl p-4 text-center">
                  <Heart className="w-6 h-6 text-red-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{stats.likesReceived}</p>
                  <p className="text-xs text-muted-foreground">Likes recibidos</p>
                </div>
              </div>
            </div>
          </div>

          {/* Empty state for no additional info */}
          {isOwnProfile && !profile.bio && !profile.country && !profile.institution && !profile.specialty && (
            <div className="card-fb p-6 mt-4 text-center">
              <p className="text-muted-foreground mb-3">
                Completa tu perfil para que otros usuarios te conozcan mejor
              </p>
              <Button onClick={() => setShowEditModal(true)} variant="outline">
                <Pencil className="w-4 h-4 mr-2" />
                Completar perfil
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Edit Profile Modal */}
      <EditProfileModal 
        open={showEditModal} 
        onOpenChange={setShowEditModal}
      />
    </div>
  );
};

export default Perfil;
