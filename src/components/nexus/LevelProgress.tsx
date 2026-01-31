import { Progress } from "@/components/ui/progress";
import { LevelBadge, type Level } from "./LevelBadge";

interface LevelProgressProps {
  currentPoints: number;
  currentLevel: Level;
}

const levelThresholds: { level: Level; minPoints: number }[] = [
  { level: "novato", minPoints: 0 },
  { level: "colaborador", minPoints: 500 },
  { level: "experto", minPoints: 1000 },
  { level: "maestro", minPoints: 1500 },
  { level: "leyenda", minPoints: 2000 },
];

export function LevelProgress({ currentPoints, currentLevel }: LevelProgressProps) {
  const currentIndex = levelThresholds.findIndex((t) => t.level === currentLevel);
  const isMaxLevel = currentIndex === levelThresholds.length - 1;
  
  const currentThreshold = levelThresholds[currentIndex];
  const nextThreshold = isMaxLevel ? null : levelThresholds[currentIndex + 1];
  
  const pointsInCurrentLevel = currentPoints - currentThreshold.minPoints;
  const pointsNeededForNext = nextThreshold 
    ? nextThreshold.minPoints - currentThreshold.minPoints 
    : 0;
  const progress = isMaxLevel ? 100 : (pointsInCurrentLevel / pointsNeededForNext) * 100;
  const pointsRemaining = nextThreshold ? nextThreshold.minPoints - currentPoints : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <LevelBadge level={currentLevel} size="sm" />
        {!isMaxLevel && nextThreshold && (
          <span className="text-xs text-muted-foreground">
            Siguiente: <span className="font-medium capitalize">{nextThreshold.level}</span>
          </span>
        )}
      </div>
      
      <div className="space-y-1.5">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          {isMaxLevel ? (
            <span className="text-points font-medium">¡Nivel máximo alcanzado! 🏆</span>
          ) : (
            <>
              <span>{currentPoints} pts</span>
              <span className="text-points font-medium">
                Faltan {pointsRemaining} pts
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
