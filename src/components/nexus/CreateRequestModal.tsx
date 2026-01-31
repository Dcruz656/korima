import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CrossRefSearchModal } from "./CrossRefSearchModal";
import { CrossRefResult } from "@/hooks/useCrossRef";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Loader2, AlertTriangle, AlertCircle, Award, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CreateRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const categories = [
  "Medicina",
  "Ingeniería",
  "Derecho",
  "Economía",
  "Psicología",
  "Biología",
  "Química",
  "Física",
  "Matemáticas",
  "Ciencias Sociales",
  "Humanidades",
  "Tecnología",
  "Otro",
];

// Map CrossRef subjects to our categories
const mapSubjectToCategory = (subjects?: string[]): string => {
  if (!subjects || subjects.length === 0) return "";
  
  const subject = subjects[0].toLowerCase();
  
  if (subject.includes("medicine") || subject.includes("health") || subject.includes("clinical")) return "Medicina";
  if (subject.includes("engineering")) return "Ingeniería";
  if (subject.includes("law") || subject.includes("legal")) return "Derecho";
  if (subject.includes("economics") || subject.includes("business") || subject.includes("finance")) return "Economía";
  if (subject.includes("psychology")) return "Psicología";
  if (subject.includes("biology") || subject.includes("life science")) return "Biología";
  if (subject.includes("chemistry")) return "Química";
  if (subject.includes("physics")) return "Física";
  if (subject.includes("mathematics") || subject.includes("statistics")) return "Matemáticas";
  if (subject.includes("social") || subject.includes("sociology") || subject.includes("political")) return "Ciencias Sociales";
  if (subject.includes("humanities") || subject.includes("history") || subject.includes("philosophy") || subject.includes("literature")) return "Humanidades";
  if (subject.includes("computer") || subject.includes("technology") || subject.includes("information")) return "Tecnología";
  
  return "Otro";
};

export function CreateRequestModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateRequestModalProps) {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [puntosOfrecidos, setPuntosOfrecidos] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [showCrossRefModal, setShowCrossRefModal] = useState(false);
  const [solicitudesHoy, setSolicitudesHoy] = useState(0);
  const [canCreate, setCanCreate] = useState(true);

  const userPoints = profile?.points || 0;
  const LIMITE_DIARIO = 5;
  const solicitudesRestantes = LIMITE_DIARIO - solicitudesHoy;

  // Verificar límite diario al abrir el modal
  useEffect(() => {
    if (open && user) {
      verificarLimiteDiario();
    }
  }, [open, user]);

  const verificarLimiteDiario = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("limite_solicitudes_diario")
        .select("cantidad")
        .eq("user_id", user.id)
        .eq("fecha", new Date().toISOString().split('T')[0])
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error("Error verificando límite:", error);
        return;
      }

      const cantidad = data?.cantidad || 0;
      setSolicitudesHoy(cantidad);
      setCanCreate(cantidad < LIMITE_DIARIO);

    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleCrossRefSelect = (result: CrossRefResult) => {
    setTitle(result.title);
    
    // Build description from metadata
    const descParts: string[] = [];
    if (result.authors) descParts.push(`Autores: ${result.authors}`);
    if (result.journal) descParts.push(`Revista: ${result.journal}`);
    if (result.year) descParts.push(`Año: ${result.year}`);
    if (result.publisher) descParts.push(`Editorial: ${result.publisher}`);
    if (result.doi) descParts.push(`DOI: ${result.doi}`);
    
    if (descParts.length > 0) {
      setDescription(descParts.join("\n"));
    }

    // Try to map category
    const mappedCategory = mapSubjectToCategory(result.subjects);
    if (mappedCategory && categories.includes(mappedCategory)) {
      setCategory(mappedCategory);
    }

    toast({
      title: "Datos importados",
      description: "Los datos del documento han sido autocompletados desde CrossRef",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para crear una solicitud",
        variant: "destructive",
      });
      return;
    }

    if (!canCreate) {
      toast({
        title: "Límite alcanzado",
        description: `Has alcanzado el límite de ${LIMITE_DIARIO} solicitudes por día`,
        variant: "destructive",
      });
      return;
    }

    if (userPoints < puntosOfrecidos) {
      toast({
        title: "Puntos insuficientes",
        description: `Necesitas ${puntosOfrecidos} puntos. Tienes ${userPoints}`,
        variant: "destructive",
      });
      return;
    }

    if (!title.trim() || !category) {
      toast({
        title: "Error",
        description: "Por favor completa el título y la categoría",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Llamar a la función de Supabase que maneja todo
      const { data, error } = await supabase.rpc('crear_solicitud', {
        p_user_id: user.id,
        p_titulo: title.trim(),
        p_descripcion: description.trim() || null,
        p_puntos_ofrecidos: puntosOfrecidos,
        p_categoria: category
      });

      if (error) throw error;

      toast({
        title: "¡Solicitud creada!",
        description: `Se han descontado ${puntosOfrecidos} puntos de tu cuenta`,
      });

      // Actualizar perfil para reflejar puntos
      await refreshProfile();

      // Reset form
      setTitle("");
      setDescription("");
      setCategory("");
      setIsUrgent(false);
      setPuntosOfrecidos(10);

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error creating solicitud:", error);
      
      // Mostrar mensaje de error específico
      const errorMessage = error.message || "No se pudo crear la solicitud. Intenta de nuevo.";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const canAfford = userPoints >= puntosOfrecidos;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Solicitud de Documento</DialogTitle>
            <DialogDescription>
              Ofrece puntos para que la comunidad te ayude a encontrar el documento
            </DialogDescription>
          </DialogHeader>

          {/* Límite Diario Alert */}
          {solicitudesHoy > 0 && (
            <Alert className={solicitudesRestantes <= 1 ? "border-orange-500 bg-orange-50 dark:bg-orange-950" : ""}>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Has creado <strong>{solicitudesHoy}</strong> de {LIMITE_DIARIO} solicitudes hoy.
                {solicitudesRestantes > 0 ? (
                  <> Te quedan <strong>{solicitudesRestantes}</strong> disponibles.</>
                ) : (
                  <strong className="text-destructive"> Has alcanzado el límite diario.</strong>
                )}
              </AlertDescription>
            </Alert>
          )}

          {!canCreate && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Has alcanzado el límite de {LIMITE_DIARIO} solicitudes por día. Vuelve mañana.
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Puntos a Ofrecer */}
            <div className="space-y-3 p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-points" />
                  <Label className="text-base font-semibold">Puntos a ofrecer</Label>
                </div>
                <span className="text-2xl font-bold text-points">{puntosOfrecidos} pts</span>
              </div>
              
              <Slider
                value={[puntosOfrecidos]}
                onValueChange={(value) => setPuntosOfrecidos(value[0])}
                min={10}
                max={50}
                step={5}
                className="w-full"
                disabled={!canCreate}
              />
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Mín: 10 pts</span>
                <span>Máx: 50 pts</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm text-muted-foreground">Tus puntos disponibles</span>
                <span className={`text-lg font-bold ${canAfford ? "text-foreground" : "text-destructive"}`}>
                  {userPoints} pts
                </span>
              </div>

              {!canAfford && (
                <p className="text-sm text-destructive">
                  ⚠️ No tienes suficientes puntos para esta oferta
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title" className="flex items-center gap-2">
                Título del documento *
                <button
                  type="button"
                  onClick={() => setShowCrossRefModal(true)}
                  className="text-xs text-primary hover:underline"
                >
                  🔍 Buscar en CrossRef
                </button>
              </Label>
              <Input
                id="title"
                placeholder="Ej: Introduction to Machine Learning - 3rd Edition"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={200}
                disabled={!canCreate}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Textarea
                id="description"
                placeholder="Añade detalles adicionales: autores, año, editorial, DOI, etc."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                maxLength={500}
                disabled={!canCreate}
              />
              <p className="text-xs text-muted-foreground">
                Cuantos más detalles, más fácil será para la comunidad ayudarte
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoría *</Label>
              <Select value={category} onValueChange={setCategory} required disabled={!canCreate}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Información Importante */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs space-y-1">
                <p><strong>📌 Importante:</strong></p>
                <ul className="list-disc list-inside space-y-0.5 ml-2">
                  <li>Los puntos se descuentan al crear la solicitud</li>
                  <li>Duración: 5 días para recibir respuestas</li>
                  <li>Si no recibes respuestas, los puntos NO se devuelven</li>
                  <li>Debes calificar "Mejor Respuesta" para transferir puntos al contribuyente</li>
                </ul>
              </AlertDescription>
            </Alert>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isLoading || !canAfford || !canCreate}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  `Crear solicitud (-${puntosOfrecidos} pts)`
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* CrossRef Search Modal */}
      <CrossRefSearchModal
        open={showCrossRefModal}
        onOpenChange={setShowCrossRefModal}
        onSelect={handleCrossRefSelect}
        initialQuery={title}
      />
    </>
  );
}
