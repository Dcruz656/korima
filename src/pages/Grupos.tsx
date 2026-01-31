import { useState } from "react";
import { Navigation } from "@/components/nexus/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Users, Lock, Globe, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Mock data for groups (will be replaced with real data when groups table is created)
const mockGroups = [
  {
    id: "1",
    name: "Medicina General",
    description: "Grupo para compartir artículos y documentos de medicina general",
    members: 234,
    isPrivate: false,
    category: "Medicina",
  },
  {
    id: "2",
    name: "Ingeniería Civil UNAM",
    description: "Estudiantes y profesionales de ingeniería civil",
    members: 156,
    isPrivate: false,
    category: "Ingeniería",
  },
  {
    id: "3",
    name: "Derecho Constitucional",
    description: "Documentos y casos de derecho constitucional",
    members: 89,
    isPrivate: true,
    category: "Derecho",
  },
  {
    id: "4",
    name: "Psicología Clínica",
    description: "Artículos y estudios de psicología clínica",
    members: 178,
    isPrivate: false,
    category: "Psicología",
  },
  {
    id: "5",
    name: "Economía Latinoamericana",
    description: "Análisis económico de la región",
    members: 92,
    isPrivate: false,
    category: "Economía",
  },
];

const Grupos = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredGroups = mockGroups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-14">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
                <Users className="w-6 h-6 text-primary" />
                Grupos
              </h1>
              <p className="text-muted-foreground">
                Únete a comunidades de tu interés
              </p>
            </div>
            {user && (
              <Button className="rounded-full">
                <Plus className="w-4 h-4 mr-2" />
                Crear grupo
              </Button>
            )}
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Buscar grupos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-full"
            />
          </div>

          {/* Coming Soon Banner */}
          <div className="card-fb p-6 mb-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Grupos - Próximamente
                </h3>
                <p className="text-sm text-muted-foreground">
                  Estamos trabajando en esta funcionalidad. Pronto podrás crear y unirte a grupos temáticos.
                </p>
              </div>
            </div>
          </div>

          {/* Groups List */}
          <div className="space-y-4">
            {filteredGroups.map((group) => (
              <div
                key={group.id}
                className="card-fb p-4 hover:bg-secondary/30 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-lg flex-shrink-0">
                    {group.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground truncate">
                        {group.name}
                      </h3>
                      {group.isPrivate ? (
                        <Lock className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Globe className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {group.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs text-muted-foreground">
                        {group.members} miembros
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-secondary rounded-full">
                        {group.category}
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-full" disabled>
                    Unirse
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Grupos;
