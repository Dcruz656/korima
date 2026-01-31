import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Medal, Award } from "lucide-react";

interface Contributor {
  user_id: string;
  response_count: number;
  full_name: string | null;
  avatar_url: string | null;
  level: string;
}

export function TopContributors() {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopContributors();
  }, []);

  const fetchTopContributors = async () => {
    try {
      // Use RPC function that bypasses RLS for consistent results
      const { data, error } = await supabase.rpc("get_top_contributors", {
        limit_count: 6,
      });

      if (error) throw error;

      const topContributors: Contributor[] = (data || []).map((row: any) => ({
        user_id: row.user_id,
        response_count: Number(row.response_count),
        full_name: row.full_name,
        avatar_url: row.avatar_url,
        level: row.level || "novato",
      }));

      setContributors(topContributors);
    } catch (error) {
      console.error("Error fetching top contributors:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="w-4 h-4 text-yellow-500" />;
      case 1:
        return <Medal className="w-4 h-4 text-gray-400" />;
      case 2:
        return <Medal className="w-4 h-4 text-amber-600" />;
      default:
        return <Award className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <div className="card-fb p-4">
        <h3 className="font-semibold text-foreground mb-3">Top Contribuidores</h3>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-secondary" />
              <div className="flex-1 h-4 bg-secondary rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (contributors.length === 0) {
    return (
      <div className="card-fb p-4">
        <h3 className="font-semibold text-foreground mb-3">Top Contribuidores</h3>
        <p className="text-sm text-muted-foreground text-center py-2">
          Aún no hay contribuidores
        </p>
      </div>
    );
  }

  return (
    <div className="card-fb p-4">
      <h3 className="font-semibold text-foreground mb-3">Top Contribuidores</h3>
      <div className="space-y-2">
        {contributors.map((contributor, index) => (
          <div
            key={contributor.user_id}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors"
          >
            <div className="flex items-center justify-center w-5">
              {getRankIcon(index)}
            </div>
            {contributor.avatar_url ? (
              <img
                src={contributor.avatar_url}
                alt={contributor.full_name || "Usuario"}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-xs font-semibold text-primary-foreground">
                  {getInitials(contributor.full_name)}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {contributor.full_name || "Usuario"}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {contributor.level || "novato"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-primary">
                {contributor.response_count}
              </p>
              <p className="text-xs text-muted-foreground">aportes</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
