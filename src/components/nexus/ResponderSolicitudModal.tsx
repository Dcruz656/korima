import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Upload, Link as LinkIcon, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ResponderSolicitudModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  solicitudId: string;
  solicitudTitulo: string;
  puntosOfrecidos: number;
  onSuccess?: () => void;
}

export function ResponderSolicitudModal({
  open,
  onOpenChange,
  solicitudId,
  solicitudTitulo,
  puntosOfrecidos,
  onSuccess,
}: ResponderSolicitudModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [tipoRespuesta, setTipoRespuesta] = useState<"pdf" | "enlace">("pdf");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [enlace, setEnlace] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8 MB

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (file.type !== "application/pdf") {
      toast({
        title: "Archivo no válido",
        description: "Solo se permiten archivos PDF",
        variant: "destructive",
      });
      return;
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "Archivo muy grande",
        description: "El archivo no puede superar los 8 MB",
        variant: "destructive",
      });
      return;
    }

    setArchivo(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para responder",
        variant: "destructive",
      });
      return;
    }

    // Validaciones
    if (tipoRespuesta === "pdf" && !archivo) {
      toast({
        title: "Error",
        description: "Debes seleccionar un archivo PDF",
        variant: "destructive",
      });
      return;
    }

    if (tipoRespuesta === "enlace" && !enlace.trim()) {
      toast({
        title: "Error",
        description: "Debes proporcionar un enlace de descarga",
        variant: "destructive",
      });
      return;
    }

    // Validar formato de URL
    if (tipoRespuesta === "enlace") {
      try {
        new URL(enlace);
      } catch {
        toast({
          title: "Enlace inválido",
          description: "Por favor ingresa una URL válida",
          variant: "destructive",
        });
        return;
      }
    }

    setIsLoading(true);

    try {
      let archivoUrl = null;

      // Si es PDF, subirlo a Storage
      if (tipoRespuesta === "pdf" && archivo) {
        const fileName = `${user.id}/${Date.now()}_${archivo.name}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("respuestas-pdfs")
          .upload(fileName, archivo);

        if (uploadError) throw uploadError;

        // Obtener URL pública
        const { data: { publicUrl } } = supabase.storage
          .from("respuestas-pdfs")
          .getPublicUrl(fileName);

        archivoUrl = publicUrl;
      }

      // Crear respuesta en la base de datos
      const { error: insertError } = await supabase
        .from("respuestas")
        .insert({
          solicitud_id: solicitudId,
          user_id: user.id,
          tipo: tipoRespuesta,
          archivo_url: tipoRespuesta === "pdf" ? archivoUrl : null,
          enlace_descarga: tipoRespuesta === "enlace" ? enlace.trim() : null,
          mensaje: mensaje.trim() || null,
        });

      if (insertError) throw insertError;

      toast({
        title: "¡Respuesta enviada!",
        description: `Puedes ganar ${puntosOfrecidos} puntos si el solicitante elige tu respuesta como la mejor`,
      });

      // Reset form
      setArchivo(null);
      setEnlace("");
      setMensaje("");
      setTipoRespuesta("pdf");

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Error enviando respuesta:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar la respuesta. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Responder Solicitud</DialogTitle>
          <DialogDescription className="space-y-1">
            <p className="font-medium text-foreground">{solicitudTitulo}</p>
            <p className="text-sm text-points">
              🏆 Recompensa: {puntosOfrecidos} puntos si eres seleccionado
            </p>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo de Respuesta */}
          <div className="space-y-3">
            <Label>Tipo de respuesta</Label>
            <RadioGroup
              value={tipoRespuesta}
              onValueChange={(value) => setTipoRespuesta(value as "pdf" | "enlace")}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="cursor-pointer">
                  <Upload className="w-4 h-4 inline mr-2" />
                  Subir archivo PDF (máx. 8 MB)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="enlace" id="enlace" />
                <Label htmlFor="enlace" className="cursor-pointer">
                  <LinkIcon className="w-4 h-4 inline mr-2" />
                  Proporcionar enlace de descarga
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Upload PDF */}
          {tipoRespuesta === "pdf" && (
            <div className="space-y-2">
              <Label htmlFor="file">Seleccionar archivo PDF *</Label>
              <Input
                id="file"
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                required
              />
              {archivo && (
                <p className="text-sm text-muted-foreground">
                  📄 {archivo.name} ({(archivo.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
          )}

          {/* Enlace */}
          {tipoRespuesta === "enlace" && (
            <div className="space-y-2">
              <Label htmlFor="enlace">Enlace de descarga *</Label>
              <Input
                id="enlace"
                type="url"
                placeholder="https://drive.google.com/file/..."
                value={enlace}
                onChange={(e) => setEnlace(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Puede ser Google Drive, Dropbox, OneDrive, etc.
              </p>
            </div>
          )}

          {/* Mensaje */}
          <div className="space-y-2">
            <Label htmlFor="mensaje">Mensaje adicional (opcional)</Label>
            <Textarea
              id="mensaje"
              placeholder="Añade información sobre el documento, versión, idioma, etc."
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              rows={3}
              maxLength={300}
            />
          </div>

          {/* Info Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Importante:</strong> Solo ganarás los puntos si el solicitante 
              marca tu respuesta como "Mejor Respuesta". Si no eres seleccionado, 
              tu archivo se eliminará automáticamente 24 horas después de la calificación.
            </AlertDescription>
          </Alert>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar respuesta"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
