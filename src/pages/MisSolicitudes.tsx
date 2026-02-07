import { useState, useEffect } from "react";
import { Navigation } from "@/components/nexus/Navigation";
import { CompactRequestCard } from "@/components/nexus/CompactRequestCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { fetchProfilesCached } from "@/hooks/useProfilesCache";
import { Loader2, FileText, AlertCircle } from "lucide-react";

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

const MisSolicitudes = () => {
    const { user } = useAuth();
    const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchSolicitudes();
        }
    }, [user]);

    const fetchSolicitudes = async () => {
        if (!user) return;

        try {
            setLoading(true);

            const { data: solicitudesData, error } = await supabase
                .from("solicitudes")
                .select(`
          *,
          likes:likes!likes_solicitud_id_fkey (user_id),
          comentarios:comentarios!comentarios_solicitud_id_fkey (id),
          respuestas:respuestas!fk_respuestas_solicitud (id)
        `)
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) throw error;

            const userIds = [...new Set(solicitudesData?.map(s => s.user_id) || [])];
            const profilesMap = await fetchProfilesCached(userIds);

            const enrichedData = solicitudesData?.map(s => ({
                ...s,
                profiles: profilesMap.get(s.user_id) || null
            })) || [];

            setSolicitudes(enrichedData as Solicitud[]);
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
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
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-foreground">Mis Solicitudes</h1>
                            <p className="text-sm text-muted-foreground">
                                {solicitudes.length > 0 && `${solicitudes.length} solicitudes`}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {loading ? (
                            <div className="card-fb p-8 flex justify-center">
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            </div>
                        ) : solicitudes.length === 0 ? (
                            <div className="card-fb p-8 text-center">
                                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                                <p className="text-muted-foreground">No has creado solicitudes</p>
                            </div>
                        ) : (
                            solicitudes.map((solicitud) => (
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
                            ))
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default MisSolicitudes;
