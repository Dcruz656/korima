import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, User, ExternalLink, Users, BookOpen, FileText, CheckCircle, Clock, Award, Download, Link as LinkIcon, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { CommentSection } from "./CommentSection";
import { ResponderSolicitudModal } from "./ResponderSolicitudModal";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { LevelBadge } from "./LevelBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useOpenAccessCheck } from "@/hooks/useOpenAccessCheck";
import type { Level } from "./LevelBadge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Respuesta {
  id: string;
  user_id: string;
  tipo: "pdf" | "enlace";
  archivo_url: string | null;
  enlace_descarga: string | null;
  mensaje: string | null;
  es_mejor_respuesta: boolean;
  calificacion: string | null;
  created_at: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
    level: string;
  } | null;
}

interface RequestCardProps {
  id: string;
  title: string;
  userId: string;
  description?: string;
  author: {
    name: string;
    level: Level;
    avatar?: string;
  };
  category: string;
  doi?: string;
  isUrgent?: boolean;
  isResolved?: boolean;
  likesCount: number;
  commentsCount: number;
  responsesCount: number;
  createdAt: string;
  isLiked?: boolean;
  puntosOfrecidos?: number;
  status?: string;
  expiresAt?: string;
  onLike?: () => void;
  onComment?: () => void;
  onRespond?: () => void;
  onRefresh?: () => void;
}

export function RequestCard({
  id,
  title,
  userId,
  description,
  author,
  category,
  doi,
  isUrgent = false,
  isResolved = false,
  likesCount,
  commentsCount,
  responsesCount,
  createdAt,
  isLiked = false,
  puntosOfrecidos = 10,
  status = "activa",
  expiresAt,
  onLike,
  onRespond,
  onRefresh,
}: RequestCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [liked, setLiked] = useState(isLiked);
  const [likes, setLikes] = useState(likesCount);
  const [showComments, setShowComments] = useState(false);
  const [showResponses, setShowResponses] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [localCommentsCount, setLocalCommentsCount] = useState(commentsCount);
  const [localResponsesCount, setLocalResponsesCount] = useState(responsesCount);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [respuestas, setRespuestas] = useState<Respuesta[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [calificando, setCalificando] = useState(false);
  const [respuestaSeleccionada, setRespuestaSeleccionada] = useState<string | null>(null);
  const [tipoCalificacion, setTipoCalificacion] = useState<"mejor_respuesta" | "incorrecto" | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Hook para verificar Open Access
  const openAccessInfo = useOpenAccessCheck(doi);

  // Check if already saved on mount
  useEffect(() => {
    if (user) {
      checkIfSaved();
    }
  }, [user, id]);

  const checkIfSaved = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("saved_solicitudes")
      .select("id")
      .eq("user_id", user.id)
      .eq("solicitud_id", id)
      .maybeSingle();
    
    setIsSaved(!!data);
  };

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para guardar",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    
    try {
      if (isSaved) {
        await supabase
          .from("saved_solicitudes")
          .delete()
          .eq("user_id", user.id)
          .eq("solicitud_id", id);
        
        setIsSaved(false);
        toast({
          title: "Eliminado",
          description: "Solicitud eliminada de guardados",
        });
      } else {
        await supabase
          .from("saved_solicitudes")
          .insert({
            user_id: user.id,
            solicitud_id: id,
          });
        
        setIsSaved(true);
        toast({
          title: "Guardado",
          description: "Solicitud guardada correctamente",
        });
      }
    } catch (error) {
      console.error("Error saving:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la solicitud",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isOwner = user?.id === userId;
  const yaCalificada = status === "completada";
  const estaExpirada = status === "expirada";
  const estaActiva = status === "activa";

  // Fetch respuestas cuando se expanden
  const fetchRespuestas = async () => {
    setLoadingResponses(true);
    try {
      const { data: respuestasData, error: respuestasError } = await supabase
        .from("respuestas")
        .select("*")
        .eq("solicitud_id", id)
        .order("created_at", { ascending: true });

      if (respuestasError) throw respuestasError;

      if (!respuestasData || respuestasData.length === 0) {
        setRespuestas([]);
        setLoadingResponses(false);
        return;
      }

      // Fetch profiles
      const userIds = [...new Set(respuestasData.map(r => r.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, level")
        .in("id", userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      
      const enrichedRespuestas = respuestasData.map(r => ({
        ...r,
        profiles: profilesMap.get(r.user_id) || null
      }));

      setRespuestas(enrichedRespuestas as Respuesta[]);
    } catch (error: any) {
      console.error("Error fetching respuestas:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las respuestas",
        variant: "destructive",
      });
    } finally {
      setLoadingResponses(false);
    }
  };

  const handleToggleResponses = () => {
    if (!showResponses && respuestas.length === 0) {
      fetchRespuestas();
    }
    setShowResponses(!showResponses);
  };

  const handleCalificar = (respuestaId: string, tipo: "mejor_respuesta" | "incorrecto") => {
    setRespuestaSeleccionada(respuestaId);
    setTipoCalificacion(tipo);
    setShowConfirmDialog(true);
  };

  const confirmarCalificacion = async () => {
    if (!respuestaSeleccionada || !tipoCalificacion || !user) return;

    setCalificando(true);

    try {
      if (tipoCalificacion === "mejor_respuesta") {
        const { error } = await supabase.rpc("marcar_mejor_respuesta", {
          p_solicitud_id: id,
          p_respuesta_id: respuestaSeleccionada,
          p_user_id: user.id,
        });

        if (error) throw error;

        toast({
          title: "¡Mejor respuesta seleccionada!",
          description: `Se han transferido ${puntosOfrecidos} puntos al contribuyente`,
        });
      } else {
        const { error } = await supabase
          .from("respuestas")
          .update({ calificacion: "incorrecto" })
          .eq("id", respuestaSeleccionada);

        if (error) throw error;

        await supabase
          .from("solicitudes")
          .update({ status: "completada" })
          .eq("id", id);

        toast({
          title: "Respuesta marcada como incorrecta",
          description: "Los puntos se han perdido según las reglas",
        });
      }

      onRefresh?.();
      fetchRespuestas();
    } catch (error: any) {
      console.error("Error calificando respuesta:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo calificar la respuesta",
        variant: "destructive",
      });
    } finally {
      setCalificando(false);
      setShowConfirmDialog(false);
      setRespuestaSeleccionada(null);
      setTipoCalificacion(null);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `hace ${diffMins} min`;
    if (diffHours < 24) return `hace ${diffHours} h`;
    return `hace ${diffDays} d`;
  };

  // Calculate remaining time
  const getRemainingTime = () => {
    if (!expiresAt) return null;
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffMs = expires.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffMs <= 0) return "Expirada";
    if (diffDays > 0) return `${diffDays}d ${diffHours}h restantes`;
    return `${diffHours}h restantes`;
  };

  const handleLike = () => {
    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);
    onLike?.();
  };

  const handleComment = () => {
    setShowComments(!showComments);
  };

  const handleRespond = () => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para aportar",
        variant: "destructive",
      });
      return;
    }

    if (estaExpirada || yaCalificada) {
      toast({
        title: "Solicitud cerrada",
        description: "Esta solicitud ya no acepta respuestas",
        variant: "destructive",
      });
      return;
    }

    setShowResponseModal(true);
  };

  return (
    <>
      <article className="card-fb">
        {/* Status Banner */}
        {yaCalificada ? (
          <div className="bg-green-500/10 border-b border-green-500/20 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">Resuelto</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-green-600">
              <Award className="w-4 h-4" />
              <span>{puntosOfrecidos} pts transferidos</span>
            </div>
          </div>
        ) : estaExpirada ? (
          <div className="bg-gray-500/10 border-b border-gray-500/20 px-4 py-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-600">Expirada</span>
          </div>
        ) : (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-600">Activa</span>
              {expiresAt && (
                <span className="text-xs text-amber-600/80">· {getRemainingTime()}</span>
              )}
            </div>
            <div className="flex items-center gap-1 text-sm font-semibold text-points">
              <Award className="w-4 h-4" />
              <span>{puntosOfrecidos} pts</span>
            </div>
          </div>
        )}

        {/* Open Access Banner */}
        {openAccessInfo.isOpenAccess && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200 px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-green-100">
                    <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                  </div>
                  <span className="text-sm font-bold text-green-700">
                    ¡Disponible en Open Access! 🎉
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Este documento está disponible gratuitamente de forma legal.
                  {openAccessInfo.version && ` · Versión: ${openAccessInfo.version}`}
                  {openAccessInfo.source && ` · Fuente: ${openAccessInfo.source}`}
                </p>
              </div>
              {openAccessInfo.pdfUrl && (
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white gap-1.5 whitespace-nowrap h-8 text-xs"
                  asChild
                >
                  <a href={openAccessInfo.pdfUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="w-3.5 h-3.5" />
                    Descargar gratis
                  </a>
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="p-4 pb-0">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div 
                onClick={() => navigate(`/perfil/${userId}`)}
                className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
              >
                {author.avatar ? (
                  <img src={author.avatar} alt={author.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-primary" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span 
                    onClick={() => navigate(`/perfil/${userId}`)}
                    className="font-semibold text-foreground hover:underline cursor-pointer"
                  >
                    {author.name}
                  </span>
                  <LevelBadge level={author.level} size="sm" />
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{createdAt}</span>
                  <span>·</span>
                  <span>{category}</span>
                  {isUrgent && (
                    <>
                      <span>·</span>
                      <span className="text-urgent font-medium">🔥 Urgente</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <button className="p-2 hover-fb">
              <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Content - Document info */}
        <div className="px-4 py-3 space-y-2">
          <p className="text-foreground text-[15px] font-semibold leading-relaxed">
            {title}
          </p>
          
          {description && (() => {
            const authorMatch = description.match(/Autores:\s*([^\n]+)/);
            const journalMatch = description.match(/Revista:\s*([^\n]+)/);
            const authors = authorMatch ? authorMatch[1].trim() : null;
            const journal = journalMatch ? journalMatch[1].trim() : null;
            
            return (
              <div className="space-y-1.5">
                {authors && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                    <span>{authors}</span>
                  </div>
                )}
                {journal && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <BookOpen className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" />
                    <span>{journal}</span>
                  </div>
                )}
                {!authors && !journal && (
                  <p className="text-sm text-muted-foreground">{description}</p>
                )}
              </div>
            );
          })()}
          
          {doi && (
            <div className="flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4 flex-shrink-0 text-gray-400" />
              <a
                href={doi.startsWith("http") ? doi : `https://doi.org/${doi}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                {doi}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>

        {/* Stats bar */}
        <div className="px-4 py-2 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            {likes > 0 && (
              <>
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs">
                  ♥
                </span>
                <span>{likes}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span 
              className="hover:underline cursor-pointer"
              onClick={handleComment}
            >
              {localCommentsCount} comentarios
            </span>
            <span 
              className={cn(
                "hover:underline cursor-pointer",
                isOwner && localResponsesCount > 0 && estaActiva && "text-[#1877F2] font-medium"
              )}
              onClick={handleToggleResponses}
            >
              {localResponsesCount} respuestas
              {isOwner && localResponsesCount > 0 && estaActiva && " 👀"}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="px-2 py-1 border-t border-border">
          <div className="flex items-center">
            <button
              onClick={handleLike}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md transition-colors hover-fb",
                liked ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Heart className={cn("w-5 h-5", liked && "fill-primary")} />
              <span className="font-medium text-sm">Me gusta</span>
            </button>

            <button
              onClick={handleComment}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md hover-fb",
                showComments ? "text-primary" : "text-muted-foreground"
              )}
            >
              <MessageCircle className="w-5 h-5" />
              <span className="font-medium text-sm">Comentar</span>
            </button>

            <button
              onClick={handleRespond}
              disabled={!estaActiva}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md hover-fb",
                !estaActiva ? "opacity-50 cursor-not-allowed" : "text-muted-foreground"
              )}
            >
              <Share2 className="w-5 h-5" />
              <span className="font-medium text-sm">Aportar</span>
            </button>

            <button 
              onClick={handleSave}
              disabled={isSaving}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md hover-fb",
                isSaved ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Bookmark className={cn("w-5 h-5", isSaved && "fill-primary")} />
              <span className="font-medium text-sm hidden lg:inline">
                {isSaved ? "Guardado" : "Guardar"}
              </span>
            </button>
          </div>
        </div>

        {/* Comments Section */}
        <CommentSection solicitudId={id} isOpen={showComments} />

        {/* Responses Section */}
        {showResponses && (
          <div className="border-t border-border">
            <div className="p-4 bg-muted/30">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <Share2 className="w-4 h-4" />
                  Respuestas ({localResponsesCount})
                </h4>
                <button onClick={handleToggleResponses} className="p-1 hover:bg-secondary rounded">
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {loadingResponses ? (
                <div className="flex justify-center py-4">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : respuestas.length === 0 ? (
                <p className="text-center text-muted-foreground py-4 text-sm">
                  Aún no hay respuestas
                </p>
              ) : (
                <div className="space-y-3">
                  {respuestas.map((respuesta) => (
                    <div
                      key={respuesta.id}
                      className={`p-3 rounded-lg border ${
                        respuesta.es_mejor_respuesta
                          ? "border-points bg-points/5"
                          : respuesta.calificacion === "incorrecto"
                          ? "border-destructive/50 bg-destructive/5"
                          : "border-border bg-background"
                      }`}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center overflow-hidden">
                            {respuesta.profiles?.avatar_url ? (
                              <img
                                src={respuesta.profiles.avatar_url}
                                alt={respuesta.profiles.full_name || "Usuario"}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-xs font-semibold text-primary-foreground">
                                {(respuesta.profiles?.full_name || "U").charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">
                              {respuesta.profiles?.full_name || "Usuario"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatTimeAgo(respuesta.created_at)}
                            </p>
                          </div>
                        </div>

                        {respuesta.es_mejor_respuesta && (
                          <Badge className="bg-points text-white text-xs">
                            <Award className="w-3 h-3 mr-1" />
                            Mejor
                          </Badge>
                        )}

                        {respuesta.calificacion === "incorrecto" && (
                          <Badge variant="destructive" className="text-xs">
                            Incorrecto
                          </Badge>
                        )}
                      </div>

                      {/* Mensaje */}
                      {respuesta.mensaje && (
                        <p className="text-sm text-muted-foreground mb-2">{respuesta.mensaje}</p>
                      )}

                      {/* Archivo/Enlace - SOLO PARA EL SOLICITANTE */}
                      {isOwner && (
                        <div className="flex gap-2 mb-2">
                          {respuesta.tipo === "pdf" && respuesta.archivo_url && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 text-xs h-8"
                              asChild
                            >
                              <a href={respuesta.archivo_url} target="_blank" rel="noopener noreferrer">
                                <Download className="w-3 h-3 mr-1" />
                                Descargar PDF
                              </a>
                            </Button>
                          )}

                          {respuesta.tipo === "enlace" && respuesta.enlace_descarga && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 text-xs h-8"
                              asChild
                            >
                              <a href={respuesta.enlace_descarga} target="_blank" rel="noopener noreferrer">
                                <LinkIcon className="w-3 h-3 mr-1" />
                                Abrir enlace
                              </a>
                            </Button>
                          )}
                        </div>
                      )}

                      {/* Info para NO solicitantes */}
                      {!isOwner && (respuesta.tipo === "pdf" || respuesta.tipo === "enlace") && (
                        <div className="text-xs text-muted-foreground italic mb-2">
                          📎 {respuesta.tipo === "pdf" ? "Archivo PDF adjunto" : "Enlace compartido"} (solo visible para el solicitante)
                        </div>
                      )}

                      {/* Botones de Calificación - SOLO PARA EL SOLICITANTE */}
                      {isOwner && !yaCalificada && !respuesta.calificacion && estaActiva && (
                        <div className="flex gap-2 pt-2 border-t">
                          <Button
                            size="sm"
                            className="flex-1 text-xs h-8"
                            onClick={() => handleCalificar(respuesta.id, "mejor_respuesta")}
                            disabled={calificando}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Mejor (+{puntosOfrecidos}pts)
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1 text-xs h-8"
                            onClick={() => handleCalificar(respuesta.id, "incorrecto")}
                            disabled={calificando}
                          >
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Incorrecto
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Toggle responses button cuando está colapsado */}
        {!showResponses && localResponsesCount > 0 && (
          <button
            onClick={handleToggleResponses}
            className="w-full px-4 py-2 border-t border-border hover:bg-secondary/50 transition-colors flex items-center justify-center gap-2 text-sm text-muted-foreground"
          >
            <ChevronDown className="w-4 h-4" />
            Ver {localResponsesCount} respuesta{localResponsesCount !== 1 ? 's' : ''}
          </button>
        )}
      </article>

      {/* Responder Modal */}
      <ResponderSolicitudModal
        open={showResponseModal}
        onOpenChange={setShowResponseModal}
        solicitudId={id}
        solicitudTitulo={title}
        puntosOfrecidos={puntosOfrecidos}
        onSuccess={() => {
          setLocalResponsesCount((prev) => prev + 1);
          fetchRespuestas();
          onRespond?.();
          onRefresh?.();
        }}
      />

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {tipoCalificacion === "mejor_respuesta"
                ? "¿Confirmar mejor respuesta?"
                : "¿Marcar como incorrecto?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {tipoCalificacion === "mejor_respuesta" ? (
                <>
                  Se transferirán <strong>{puntosOfrecidos} puntos</strong> al contribuyente
                  y esta acción no se puede deshacer.
                </>
              ) : (
                <>
                  Los <strong>{puntosOfrecidos} puntos se perderán</strong> (no se devuelven).
                  Esta acción no se puede deshacer.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={calificando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarCalificacion} disabled={calificando}>
              {calificando ? "Procesando..." : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
