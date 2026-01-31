import { useNavigate } from "react-router-dom";
import { Heart, MessageCircle, FileText, User, Clock, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Level } from "./LevelBadge";

interface CompactRequestCardProps {
  id: string;
  title: string;
  userId: string;
  author: {
    name: string;
    level: Level;
    avatar?: string;
  };
  category: string;
  isUrgent?: boolean;
  isResolved?: boolean;
  likesCount: number;
  commentsCount: number;
  responsesCount: number;
  createdAt: string;
  onClick?: () => void;
}

const levelColors: Record<Level, string> = {
  novato: "text-muted-foreground",
  colaborador: "text-blue-500",
  experto: "text-violet-500",
  maestro: "text-amber-500",
  leyenda: "text-yellow-500",
};

export function CompactRequestCard({
  id,
  title,
  userId,
  author,
  category,
  isUrgent = false,
  isResolved = false,
  likesCount,
  commentsCount,
  responsesCount,
  createdAt,
  onClick,
}: CompactRequestCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/`);
    }
  };

  return (
    <article 
      onClick={handleClick}
      className="card-fb p-3 cursor-pointer hover:bg-secondary/30 transition-colors"
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div 
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/perfil/${userId}`);
          }}
          className="w-10 h-10 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all"
        >
          {author.avatar ? (
            <img src={author.avatar} alt={author.name} className="w-full h-full object-cover" />
          ) : (
            <User className="w-5 h-5 text-primary" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-foreground text-sm line-clamp-2 flex-1">
              {isUrgent && <span className="text-urgent mr-1">🔥</span>}
              {title}
            </h3>
            {/* Status indicator */}
            <div className={cn(
              "flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1",
              isResolved 
                ? "bg-green-500/10 text-green-600" 
                : "bg-amber-500/10 text-amber-600"
            )}>
              {isResolved ? (
                <>
                  <CheckCircle className="w-3 h-3" />
                  <span className="hidden sm:inline">Resuelto</span>
                </>
              ) : (
                <>
                  <Clock className="w-3 h-3" />
                  <span className="hidden sm:inline">Pendiente</span>
                </>
              )}
            </div>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <span 
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/perfil/${userId}`);
              }}
              className={cn("hover:underline cursor-pointer", levelColors[author.level])}
            >
              {author.name}
            </span>
            <span>·</span>
            <span>{category}</span>
            <span>·</span>
            <span>{createdAt}</span>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5" />
              <span>{likesCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{commentsCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              <span>{responsesCount} respuestas</span>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
