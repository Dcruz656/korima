import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Link as LinkIcon, 
  User, 
  Trophy, 
  ExternalLink,
  Clock,
  Loader2,
  CheckCircle2,
  Download
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Response {
  id: string;
  user_id: string;
  message: string | null;
  file_url: string | null;
  file_name: string | null;
  is_best_answer: boolean;
  points_earned: number;
  expires_at: string;
  created_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
    level: string;
  };
}

interface ResponsesListProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  solicitudId: string;
  solicitudTitle: string;
  isOwner: boolean;
  onBestAnswerSelected?: () => void;
}

const REWARD_POINTS = 20;

export function ResponsesList({
  open,
  onOpenChange,
  solicitudId,
  solicitudTitle,
  isOwner,
  onBestAnswerSelected,
}: ResponsesListProps) {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  
  const [responses, setResponses] = useState<Response[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectingBestId, setSelectingBestId] = useState<string | null>(null);
  const [signedUrls, setSignedUrls] = useState<Map<string, string>>(new Map());
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchResponses = async () => {
    setIsLoading(true);
    try {
      // Fetch responses
      const { data: responsesData, error } = await supabase
        .from("respuestas")
        .select("*")
        .eq("solicitud_id", solicitudId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles for each response
      if (responsesData && responsesData.length > 0) {
        const userIds = [...new Set(responsesData.map(r => r.user_id))];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, level")
          .in("id", userIds);

        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
        
        const responsesWithProfiles = responsesData.map(response => ({
          ...response,
          profile: profilesMap.get(response.user_id) || undefined,
        }));

        setResponses(responsesWithProfiles);
      } else {
        setResponses([]);
      }
    } catch (error) {
      console.error("Error fetching responses:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las respuestas",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchResponses();
      setSignedUrls(new Map()); // Reset signed URLs when modal opens
    }
  }, [open, solicitudId]);

  // Function to get signed URL for a file
  const getSignedUrl = useCallback(async (responseId: string, filePath: string): Promise<string | null> => {
    const isHttpUrl = filePath.startsWith("http://") || filePath.startsWith("https://");

    // Backward-compat: older rows stored a "public" storage URL even though the bucket is private.
    // Convert that URL into a storage path so we can generate a signed URL.
    let normalizedPath: string = filePath;
    if (isHttpUrl) {
      try {
        const url = new URL(filePath);
        // Examples:
        // /storage/v1/object/public/respuestas-docs/<path>
        // /storage/v1/object/sign/respuestas-docs/<path>
        const marker = "/respuestas-docs/";
        const idx = url.pathname.indexOf(marker);
        if (idx !== -1) {
          normalizedPath = decodeURIComponent(url.pathname.slice(idx + marker.length));
        } else {
          // Truly external link (Drive, journal site, etc.)
          return filePath;
        }
      } catch {
        return filePath;
      }
    }

    // Check cache first
    const cached = signedUrls.get(responseId);
    if (cached) return cached;

    try {
      const { data, error } = await supabase.storage
        .from("respuestas-docs")
        .createSignedUrl(normalizedPath, 3600); // 1 hour expiry

      if (error) throw error;

      // Cache the signed URL
      setSignedUrls(prev => new Map(prev).set(responseId, data.signedUrl));
      return data.signedUrl;
    } catch (error) {
      console.error("Error getting signed URL:", error);
      return null;
    }
  }, [signedUrls]);

  // Handle download/open file
  const handleOpenFile = async (responseId: string, filePath: string, fileName: string | null) => {
    setDownloadingId(responseId);
    try {
      const url = await getSignedUrl(responseId, filePath);
      if (url) {
        window.open(url, '_blank');
      } else {
        toast({
          title: "Error",
          description: "No se pudo obtener el enlace del archivo",
          variant: "destructive",
        });
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const handleSelectBestAnswer = async (responseId: string, contributorId: string) => {
    if (!user || !isOwner) return;

    setSelectingBestId(responseId);
    try {
      // First, remove any existing best answer
      await supabase
        .from("respuestas")
        .update({ is_best_answer: false, points_earned: 0 })
        .eq("solicitud_id", solicitudId);

      // Mark the new best answer
      const { error: updateError } = await supabase
        .from("respuestas")
        .update({ is_best_answer: true, points_earned: REWARD_POINTS })
        .eq("id", responseId);

      if (updateError) throw updateError;

      // Award points to the contributor
      const { data: contributorProfile } = await supabase
        .from("profiles")
        .select("points")
        .eq("id", contributorId)
        .single();

      if (contributorProfile) {
        const newPoints = (contributorProfile.points || 0) + REWARD_POINTS;
        await supabase
          .from("profiles")
          .update({ points: newPoints })
          .eq("id", contributorId);
      }

      // Mark solicitud as resolved
      await supabase
        .from("solicitudes")
        .update({ is_resolved: true })
        .eq("id", solicitudId);

      toast({
        title: "¡Mejor respuesta seleccionada! 🏆",
        description: `El colaborador ha recibido ${REWARD_POINTS} puntos.`,
      });

      await refreshProfile();
      await fetchResponses();
      onBestAnswerSelected?.();
    } catch (error) {
      console.error("Error selecting best answer:", error);
      toast({
        title: "Error",
        description: "No se pudo seleccionar la mejor respuesta",
        variant: "destructive",
      });
    } finally {
      setSelectingBestId(null);
    }
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const hasBestAnswer = responses.some(r => r.is_best_answer);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden rounded-lg border-0 shadow-xl max-h-[80vh]">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <DialogHeader className="space-y-0">
            <DialogTitle className="text-xl font-bold text-gray-900 text-center">
              Respuestas ({responses.length})
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 text-center mt-1 line-clamp-1">
            {solicitudTitle}
          </p>
        </div>

        {/* Content */}
        <div className="bg-white overflow-y-auto max-h-[calc(80vh-80px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#1877F2]" />
            </div>
          ) : responses.length === 0 ? (
            <div className="text-center py-12 px-4">
              <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">Aún no hay respuestas</p>
              <p className="text-sm text-gray-400 mt-1">
                Sé el primero en aportar un documento
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {responses.map((response) => {
                const expired = isExpired(response.expires_at);
                const profile = response.profile;
                
                return (
                  <div 
                    key={response.id} 
                    className={`p-4 ${response.is_best_answer ? 'bg-green-50' : ''}`}
                  >
                    {/* Best answer badge */}
                    {response.is_best_answer && (
                      <div className="flex items-center gap-2 mb-3 text-green-600">
                        <Trophy className="w-5 h-5" />
                        <span className="font-semibold text-sm">Mejor Respuesta</span>
                        <span className="text-xs bg-green-100 px-2 py-0.5 rounded-full">
                          +{response.points_earned} pts
                        </span>
                      </div>
                    )}

                    {/* User info */}
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {profile?.avatar_url ? (
                          <img 
                            src={profile.avatar_url} 
                            alt={profile.full_name || "Usuario"} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <User className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900 text-sm">
                            {profile?.full_name || "Usuario"}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                            {profile?.level || "Novato"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatDistanceToNow(new Date(response.created_at), { 
                            addSuffix: true, 
                            locale: es 
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Message */}
                    {response.message && (
                      <p className="text-sm text-gray-700 mt-3 bg-gray-50 rounded-lg p-3">
                        {response.message}
                      </p>
                    )}

                    {/* File/Link */}
                    {response.file_url && (
                      <div className="mt-3">
                        {expired ? (
                          <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg text-gray-500">
                            <Clock className="w-5 h-5" />
                            <span className="text-sm">Enlace expirado</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenFile(response.id, response.file_url!, response.file_name)}
                            disabled={downloadingId === response.id}
                            className="flex items-center gap-3 p-3 bg-[#E7F3FF] rounded-lg hover:bg-[#D4E9FF] transition-colors group w-full text-left"
                          >
                            <div className="w-10 h-10 rounded-lg bg-[#1877F2] flex items-center justify-center flex-shrink-0">
                              {downloadingId === response.id ? (
                                <Loader2 className="w-5 h-5 text-white animate-spin" />
                              ) : response.file_name ? (
                                <FileText className="w-5 h-5 text-white" />
                              ) : (
                                <LinkIcon className="w-5 h-5 text-white" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-gray-900 truncate">
                                {response.file_name || "Ver documento"}
                              </p>
                              <p className="text-xs text-gray-500">
                                Expira {formatDistanceToNow(new Date(response.expires_at), { 
                                  addSuffix: true, 
                                  locale: es 
                                })}
                              </p>
                            </div>
                            {response.file_name ? (
                              <Download className="w-5 h-5 text-[#1877F2] group-hover:translate-y-0.5 transition-transform" />
                            ) : (
                              <ExternalLink className="w-5 h-5 text-[#1877F2] group-hover:translate-x-0.5 transition-transform" />
                            )}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Select best answer button */}
                    {isOwner && !hasBestAnswer && !expired && response.file_url && (
                      <div className="mt-3">
                        <Button
                          onClick={() => handleSelectBestAnswer(response.id, response.user_id)}
                          disabled={selectingBestId === response.id}
                          className="w-full bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold"
                        >
                          {selectingBestId === response.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Seleccionando...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Elegir como mejor respuesta
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
