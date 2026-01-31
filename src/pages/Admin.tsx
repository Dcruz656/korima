import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/nexus/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  FileText,
  TrendingUp,
  Shield,
  Trash2,
  UserCheck,
  UserX,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Clock,
  MessageSquare,
  ThumbsUp,
  Search,
  BarChart3,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AdminAnalytics } from "@/components/nexus/AdminAnalytics";

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  points: number;
  level: string;
  created_at: string;
}

interface UserRole {
  user_id: string;
  role: "admin" | "moderator" | "user";
}

interface Solicitud {
  id: string;
  title: string;
  category: string;
  is_resolved: boolean;
  is_urgent: boolean;
  created_at: string;
  user_id: string;
  profiles: { full_name: string | null } | null;
}

interface Stats {
  totalUsers: number;
  totalSolicitudes: number;
  resolvedSolicitudes: number;
  pendingSolicitudes: number;
  totalResponses: number;
  totalComments: number;
  totalLikes: number;
  newUsersToday: number;
  newSolicitudesToday: number;
}

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const [userRoles, setUserRoles] = useState<Map<string, string>>(new Map());
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!authLoading && user) {
      checkAdminStatus();
    } else if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading]);

  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase.rpc("is_admin");
      if (error) throw error;
      setIsAdmin(data);
      if (data) {
        await Promise.all([fetchStats(), fetchUsers(), fetchSolicitudes()]);
      }
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];

      const [
        usersRes,
        solicitudesRes,
        responsesRes,
        commentsRes,
        likesRes,
        newUsersRes,
        newSolicitudesRes,
      ] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("solicitudes").select("id, is_resolved", { count: "exact" }),
        supabase.from("respuestas").select("id", { count: "exact", head: true }),
        supabase.from("comentarios").select("id", { count: "exact", head: true }),
        supabase.from("likes").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", today),
        supabase.from("solicitudes").select("id", { count: "exact", head: true }).gte("created_at", today),
      ]);

      const resolved = solicitudesRes.data?.filter((s) => s.is_resolved).length || 0;
      const total = solicitudesRes.count || 0;

      setStats({
        totalUsers: usersRes.count || 0,
        totalSolicitudes: total,
        resolvedSolicitudes: resolved,
        pendingSolicitudes: total - resolved,
        totalResponses: responsesRes.count || 0,
        totalComments: commentsRes.count || 0,
        totalLikes: likesRes.count || 0,
        newUsersToday: newUsersRes.count || 0,
        newSolicitudesToday: newSolicitudesRes.count || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
      ]);

      if (usersRes.data) setUsers(usersRes.data);
      if (rolesRes.data) {
        const rolesMap = new Map(rolesRes.data.map((r) => [r.user_id, r.role]));
        setUserRoles(rolesMap);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchSolicitudes = async () => {
    try {
      const { data: solicitudesData } = await supabase
        .from("solicitudes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (!solicitudesData) return;

      // Fetch profiles separately
      const userIds = [...new Set(solicitudesData.map((s) => s.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      const profilesMap = new Map(profilesData?.map((p) => [p.id, p]) || []);

      const enrichedData = solicitudesData.map((s) => ({
        ...s,
        profiles: profilesMap.get(s.user_id) || null,
      }));

      setSolicitudes(enrichedData as Solicitud[]);
    } catch (error) {
      console.error("Error fetching solicitudes:", error);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const currentRole = userRoles.get(userId);

      if (currentRole) {
        // Update existing role
        const { error } = await supabase
          .from("user_roles")
          .update({ role: newRole as "admin" | "moderator" | "user" })
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role: newRole as "admin" | "moderator" | "user" });
        if (error) throw error;
      }

      setUserRoles(new Map(userRoles.set(userId, newRole)));
      toast({ title: "Rol actualizado", description: `Rol cambiado a ${newRole}` });
    } catch (error) {
      console.error("Error updating role:", error);
      toast({ title: "Error", description: "No se pudo actualizar el rol", variant: "destructive" });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      // Delete profile (cascade will handle related data)
      const { error } = await supabase.from("profiles").delete().eq("id", userId);
      if (error) throw error;

      setUsers(users.filter((u) => u.id !== userId));
      toast({ title: "Usuario eliminado" });
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({ title: "Error", description: "No se pudo eliminar el usuario", variant: "destructive" });
    }
  };

  const handleDeleteSolicitud = async (solicitudId: string) => {
    try {
      const { error } = await supabase.from("solicitudes").delete().eq("id", solicitudId);
      if (error) throw error;

      setSolicitudes(solicitudes.filter((s) => s.id !== solicitudId));
      toast({ title: "Solicitud eliminada" });
      fetchStats();
    } catch (error) {
      console.error("Error deleting solicitud:", error);
      toast({ title: "Error", description: "No se pudo eliminar la solicitud", variant: "destructive" });
    }
  };

  const handleToggleResolved = async (solicitudId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("solicitudes")
        .update({ is_resolved: !currentStatus })
        .eq("id", solicitudId);
      if (error) throw error;

      setSolicitudes(
        solicitudes.map((s) =>
          s.id === solicitudId ? { ...s, is_resolved: !currentStatus } : s
        )
      );
      toast({ title: currentStatus ? "Marcada como pendiente" : "Marcada como resuelta" });
      fetchStats();
    } catch (error) {
      console.error("Error updating solicitud:", error);
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSolicitudes = solicitudes.filter((s) =>
    s.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-14">
          <div className="max-w-2xl mx-auto px-4 py-20 text-center">
            <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Acceso Denegado</h1>
            <p className="text-muted-foreground mb-4">
              No tienes permisos de administrador para acceder a esta sección.
            </p>
            <Button onClick={() => navigate("/")}>Volver al inicio</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="pt-14">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Panel de Administración</h1>
              <p className="text-muted-foreground">Gestiona usuarios, contenido y estadísticas</p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Estadísticas
              </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Usuarios
              </TabsTrigger>
              <TabsTrigger value="content" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Contenido
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Analítica
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard
                  icon={Users}
                  label="Usuarios totales"
                  value={stats?.totalUsers || 0}
                  subtext={`+${stats?.newUsersToday || 0} hoy`}
                  color="text-primary"
                />
                <StatCard
                  icon={FileText}
                  label="Solicitudes"
                  value={stats?.totalSolicitudes || 0}
                  subtext={`+${stats?.newSolicitudesToday || 0} hoy`}
                  color="text-points"
                />
                <StatCard
                  icon={CheckCircle}
                  label="Resueltas"
                  value={stats?.resolvedSolicitudes || 0}
                  subtext={`${Math.round(((stats?.resolvedSolicitudes || 0) / (stats?.totalSolicitudes || 1)) * 100)}% del total`}
                  color="text-green-500"
                />
                <StatCard
                  icon={Clock}
                  label="Pendientes"
                  value={stats?.pendingSolicitudes || 0}
                  subtext="Esperando respuesta"
                  color="text-urgent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card-fb p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="font-semibold">Respuestas</span>
                  </div>
                  <p className="text-3xl font-bold">{stats?.totalResponses || 0}</p>
                  <p className="text-sm text-muted-foreground">Documentos compartidos</p>
                </div>
                <div className="card-fb p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    <span className="font-semibold">Comentarios</span>
                  </div>
                  <p className="text-3xl font-bold">{stats?.totalComments || 0}</p>
                  <p className="text-sm text-muted-foreground">Interacciones</p>
                </div>
                <div className="card-fb p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <ThumbsUp className="w-5 h-5 text-primary" />
                    <span className="font-semibold">Likes</span>
                  </div>
                  <p className="text-3xl font-bold">{stats?.totalLikes || 0}</p>
                  <p className="text-sm text-muted-foreground">Me gusta totales</p>
                </div>
              </div>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users">
              <div className="card-fb p-4 mb-4">
                <div className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar usuarios por nombre o email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border-0 bg-transparent focus-visible:ring-0"
                  />
                </div>
              </div>

              <div className="card-fb overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-secondary">
                      <tr>
                        <th className="text-left p-4 font-semibold">Usuario</th>
                        <th className="text-left p-4 font-semibold">Email</th>
                        <th className="text-left p-4 font-semibold">Nivel</th>
                        <th className="text-left p-4 font-semibold">Puntos</th>
                        <th className="text-left p-4 font-semibold">Rol</th>
                        <th className="text-left p-4 font-semibold">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="border-t border-border hover:bg-secondary/30">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center overflow-hidden">
                                {u.avatar_url ? (
                                  <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-sm font-semibold text-primary-foreground">
                                    {(u.full_name || "U").charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <span className="font-medium">{u.full_name || "Sin nombre"}</span>
                            </div>
                          </td>
                          <td className="p-4 text-muted-foreground">{u.email}</td>
                          <td className="p-4 capitalize">{u.level}</td>
                          <td className="p-4 text-points font-semibold">{u.points}</td>
                          <td className="p-4">
                            <Select
                              value={userRoles.get(u.id) || "user"}
                              onValueChange={(val) => handleRoleChange(u.id, val)}
                              disabled={u.id === user?.id}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">
                                  <span className="flex items-center gap-2">
                                    <UserCheck className="w-4 h-4" /> Usuario
                                  </span>
                                </SelectItem>
                                <SelectItem value="moderator">
                                  <span className="flex items-center gap-2">
                                    <UserX className="w-4 h-4" /> Moderador
                                  </span>
                                </SelectItem>
                                <SelectItem value="admin">
                                  <span className="flex items-center gap-2">
                                    <Shield className="w-4 h-4" /> Admin
                                  </span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-4">
                            {u.id !== user?.id && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta acción eliminará permanentemente a {u.full_name || u.email} y todo su contenido.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteUser(u.id)}>
                                      Eliminar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            {/* Content Tab */}
            <TabsContent value="content">
              <div className="card-fb p-4 mb-4">
                <div className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar solicitudes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border-0 bg-transparent focus-visible:ring-0"
                  />
                </div>
              </div>

              <div className="card-fb overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-secondary">
                      <tr>
                        <th className="text-left p-4 font-semibold">Título</th>
                        <th className="text-left p-4 font-semibold">Autor</th>
                        <th className="text-left p-4 font-semibold">Categoría</th>
                        <th className="text-left p-4 font-semibold">Estado</th>
                        <th className="text-left p-4 font-semibold">Fecha</th>
                        <th className="text-left p-4 font-semibold">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSolicitudes.map((s) => (
                        <tr key={s.id} className="border-t border-border hover:bg-secondary/30">
                          <td className="p-4 max-w-xs truncate font-medium">{s.title}</td>
                          <td className="p-4 text-muted-foreground">{s.profiles?.full_name || "Anónimo"}</td>
                          <td className="p-4">
                            <span className="px-2 py-1 bg-secondary rounded-full text-xs">
                              {s.category}
                            </span>
                          </td>
                          <td className="p-4">
                            <span
                              className={`flex items-center gap-1 text-sm ${
                                s.is_resolved ? "text-green-500" : "text-urgent"
                              }`}
                            >
                              {s.is_resolved ? (
                                <>
                                  <CheckCircle className="w-4 h-4" /> Resuelta
                                </>
                              ) : (
                                <>
                                  <Clock className="w-4 h-4" /> Pendiente
                                </>
                              )}
                            </span>
                          </td>
                          <td className="p-4 text-muted-foreground text-sm">
                            {new Date(s.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleResolved(s.id, s.is_resolved)}
                              >
                                {s.is_resolved ? "Reabrir" : "Resolver"}
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="sm">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>¿Eliminar solicitud?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta acción eliminará permanentemente esta solicitud y todas sus respuestas.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteSolicitud(s.id)}>
                                      Eliminar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics">
              <AdminAnalytics />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  subtext: string;
  color: string;
}

const StatCard = ({ icon: Icon, label, value, subtext, color }: StatCardProps) => (
  <div className="card-fb p-4">
    <div className="flex items-center gap-3 mb-2">
      <Icon className={`w-5 h-5 ${color}`} />
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
    <p className="text-3xl font-bold">{value.toLocaleString()}</p>
    <p className="text-sm text-muted-foreground">{subtext}</p>
  </div>
);

export default Admin;
