import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { fetchProfilesCached } from "@/hooks/useProfilesCache";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send, User, FileText } from "lucide-react";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  type: "comment";
  profile: {
    full_name: string | null;
    avatar_url: string | null;
    level: string;
  } | null;
}

interface DocumentContribution {
  id: string;
  created_at: string;
  user_id: string;
  type: "document";
  file_name: string | null;
  profile: {
    full_name: string | null;
    avatar_url: string | null;
    level: string;
  } | null;
}

type FeedItem = Comment | DocumentContribution;

interface CommentSectionProps {
  solicitudId: string;
  isOpen: boolean;
}

export function CommentSection({ solicitudId, isOpen }: CommentSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchFeedItems();
    }
  }, [isOpen, solicitudId]);

  const fetchFeedItems = async () => {
    setIsLoading(true);
    try {
      // Fetch comments and responses in parallel
      const [commentsRes, responsesRes] = await Promise.all([
        supabase
          .from("comentarios")
          .select("*")
          .eq("solicitud_id", solicitudId)
          .order("created_at", { ascending: true }),
        supabase
          .from("respuestas")
          .select("id, created_at, user_id, file_name")
          .eq("solicitud_id", solicitudId)
          .order("created_at", { ascending: true }),
      ]);

      if (commentsRes.error) throw commentsRes.error;
      if (responsesRes.error) throw responsesRes.error;

      // Collect all user IDs
      const commentUserIds = commentsRes.data?.map((c) => c.user_id) || [];
      const responseUserIds = responsesRes.data?.map((r) => r.user_id) || [];
      const allUserIds = [...new Set([...commentUserIds, ...responseUserIds])];

      // Fetch profiles with caching
      const profilesMap = await fetchProfilesCached(allUserIds);

      // Transform comments
      const comments: Comment[] = (commentsRes.data || []).map((c) => ({
        id: c.id,
        content: c.content,
        created_at: c.created_at,
        user_id: c.user_id,
        type: "comment" as const,
        profile: profilesMap.get(c.user_id) || null,
      }));

      // Transform responses/contributions
      const contributions: DocumentContribution[] = (responsesRes.data || []).map((r) => ({
        id: r.id,
        created_at: r.created_at,
        user_id: r.user_id,
        type: "document" as const,
        file_name: r.file_name,
        profile: profilesMap.get(r.user_id) || null,
      }));

      // Combine and sort by date
      const allItems: FeedItem[] = [...comments, ...contributions].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      setFeedItems(allItems);
    } catch (error) {
      console.error("Error fetching feed items:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para comentar",
        variant: "destructive",
      });
      return;
    }

    if (!newComment.trim()) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("comentarios").insert({
        solicitud_id: solicitudId,
        user_id: user.id,
        content: newComment.trim(),
      });

      if (error) throw error;

      setNewComment("");
      fetchFeedItems();
    } catch (error) {
      console.error("Error posting comment:", error);
      toast({
        title: "Error",
        description: "No se pudo publicar el comentario",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "ahora";
    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours} h`;
    return `${diffDays} d`;
  };

  if (!isOpen) return null;

  return (
    <div className="px-4 pb-4 pt-2 border-t border-border">
      {/* Comment input */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 flex gap-2">
          <Textarea
            placeholder={user ? "Escribe un comentario..." : "Inicia sesión para comentar"}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={!user || isSubmitting}
            rows={1}
            className="min-h-[40px] resize-none"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!user || isSubmitting || !newComment.trim()}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </form>

      {/* Feed list (comments + document contributions) */}
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : feedItems.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-4">
          No hay comentarios aún. ¡Sé el primero!
        </p>
      ) : (
        <div className="space-y-3">
          {feedItems.map((item) => (
            <div key={`${item.type}-${item.id}`} className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
                {item.profile?.avatar_url ? (
                  <img
                    src={item.profile.avatar_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                {item.type === "comment" ? (
                  // Regular comment
                  <div className="bg-secondary rounded-lg px-3 py-2">
                    <p className="text-sm font-medium">
                      {item.profile?.full_name || "Usuario"}
                    </p>
                    <p className="text-sm text-foreground">{item.content}</p>
                  </div>
                ) : (
                  // Document contribution notification
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-green-600" />
                      <p className="text-sm text-foreground">
                        <span className="font-medium">{item.profile?.full_name || "Usuario"}</span>
                        {" "}ha enviado un documento
                        {item.file_name && (
                          <span className="text-muted-foreground"> ({item.file_name})</span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1 px-1">
                  {formatTimeAgo(item.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
