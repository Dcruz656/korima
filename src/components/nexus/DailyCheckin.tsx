import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Award, Check, Loader2 } from "lucide-react";

interface DailyCheckinProps {
  onSuccess?: () => void;
}

export function DailyCheckin({ onSuccess }: DailyCheckinProps) {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const checkinPoints = 10;

  const canCheckin = () => {
    if (!profile?.last_checkin) return true;

    const lastCheckin = new Date(profile.last_checkin);
    const now = new Date();

    // Check if 24 hours have passed since last check-in
    const hoursSinceLastCheckin = (now.getTime() - lastCheckin.getTime()) / (1000 * 60 * 60);

    return hoursSinceLastCheckin >= 24;
  };

  const hasCheckedIn = !canCheckin();

  const handleCheckIn = async () => {
        // Verificar sesión de Supabase primero
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
                toast({
                          title: "Error",
                          description: "Debes iniciar sesión para hacer check-in",
                          variant: "destructive",
                        });
                return;
              }

    if (!canCheckin()) {
      toast({
        title: "Ya hiciste check-in hoy",
        description: "Vuelve mañana para obtener más puntos",
      });
      return;
    }

    setIsLoading(true);

    try {
      const newPoints = profile.points + checkinPoints;
      const now = new Date().toISOString();

      const { error } = await supabase
        .from("profiles")
        .update({
          points: newPoints,
          last_checkin: now,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "¡Check-in exitoso! 🎉",
        description: `Has ganado ${checkinPoints} puntos. Total: ${newPoints} puntos`,
      });

      await refreshProfile();
      onSuccess?.();
    } catch (error) {
      console.error("Error during checkin:", error);
      toast({
        title: "Error",
        description: "No se pudo realizar el check-in. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCheckin}
      disabled={isLoading || hasCheckedIn}
      className="w-full"
      variant={hasCheckedIn ? "secondary" : "default"}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Procesando...
        </>
      ) : hasCheckedIn ? (
        <>
          <Check className="w-4 h-4 mr-2" />
          Check-in completado
        </>
      ) : (
        <>
          <Award className="w-4 h-4 mr-2" />
          Check-in diario (+{checkinPoints} pts)
        </>
      )}
    </Button>
  );
}
