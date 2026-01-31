import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  level: string;
  institution: string | null;
}

// In-memory cache
const profilesCache = new Map<string, Profile>();

export const fetchProfilesCached = async (
  userIds: string[]
): Promise<Map<string, Profile>> => {
  const result = new Map<string, Profile>();
  const uncachedIds: string[] = [];

  // Check cache first
  userIds.forEach((id) => {
    const cached = profilesCache.get(id);
    if (cached) {
      result.set(id, cached);
    } else {
      uncachedIds.push(id);
    }
  });

  // Fetch uncached profiles
  if (uncachedIds.length > 0) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, level, institution")
        .in("id", uncachedIds);

      if (error) throw error;

      data?.forEach((profile) => {
        profilesCache.set(profile.id, profile);
        result.set(profile.id, profile);
      });
    } catch (error) {
      console.error("Error fetching profiles:", error);
    }
  }

  return result;
};

export const clearProfilesCache = () => {
  profilesCache.clear();
};
