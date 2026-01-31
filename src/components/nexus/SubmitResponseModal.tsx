import { useState, useRef } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Upload, Link, Gift, FileText, X, AlertCircle } from "lucide-react";

interface SubmitResponseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  solicitudId: string;
  solicitudTitle: string;
  onSuccess?: () => void;
}

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB in bytes

export function SubmitResponseModal({
  open,
  onOpenChange,
  solicitudId,
  solicitudTitle,
  onSuccess,
}: SubmitResponseModalProps) {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [message, setMessage] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadTab, setUploadTab] = useState<"link" | "file">("link");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const potentialRewardPoints = 20;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== "application/pdf") {
      toast({
        title: "Tipo de archivo no válido",
        description: "Solo se permiten archivos PDF",
        variant: "destructive",
      });
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "Archivo demasiado grande",
        description: "El tamaño máximo es 8MB",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    if (!user) return null;

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${solicitudId}-${Date.now()}.${fileExt}`;

    setUploadProgress(10);

    const { data, error } = await supabase.storage
      .from("respuestas-docs")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    setUploadProgress(80);

    if (error) {
      console.error("Upload error:", error);
      throw new Error("Error al subir el archivo");
    }

    setUploadProgress(100);

    // Return the file path - we'll generate signed URLs when displaying
    return data.path;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para aportar",
        variant: "destructive",
      });
      return;
    }

    const hasLink = uploadTab === "link" && fileUrl.trim();
    const hasFile = uploadTab === "file" && selectedFile;

    if (!hasLink && !hasFile && !message.trim()) {
      toast({
        title: "Error",
        description: "Por favor proporciona un enlace, archivo o mensaje",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setUploadProgress(0);

    try {
      let finalFileUrl = fileUrl.trim() || null;
      let fileName = null;

      // Upload file if selected
      if (uploadTab === "file" && selectedFile) {
        finalFileUrl = await uploadFile(selectedFile);
        fileName = selectedFile.name;
      }

      // Create the response - points_earned starts at 0, awarded when marked as best answer
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

      const { error: responseError } = await supabase.from("respuestas").insert({
        solicitud_id: solicitudId,
        user_id: user.id,
        message: message.trim() || null,
        file_url: finalFileUrl,
        file_name: fileName,
        points_earned: 0, // Points awarded when marked as best answer
        expires_at: expiresAt.toISOString(),
      });

      if (responseError) throw responseError;

      toast({
        title: "¡Aporte enviado! 📄",
        description: "Recibirás puntos si el solicitante elige tu respuesta como la mejor.",
      });

      // Reset form
      setMessage("");
      setFileUrl("");
      setSelectedFile(null);
      setUploadTab("link");

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error submitting response:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo enviar tu aporte. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-lg border-0 shadow-xl">
        {/* Facebook-style header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <DialogHeader className="space-y-0">
            <DialogTitle className="text-xl font-bold text-gray-900 text-center">
              Aportar Documento
            </DialogTitle>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="bg-white">
          {/* Request info */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm text-gray-600">
              Comparte el documento solicitado:
            </p>
            <p className="font-semibold text-gray-900 mt-1 text-sm line-clamp-2">
              {solicitudTitle}
            </p>
          </div>

          {/* Facebook-style tabs */}
          <Tabs value={uploadTab} onValueChange={(v) => setUploadTab(v as "link" | "file")}>
            <TabsList className="w-full h-auto p-0 bg-transparent border-b border-gray-200 rounded-none grid grid-cols-2">
              <TabsTrigger 
                value="link" 
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-[#1877F2] data-[state=active]:text-[#1877F2] data-[state=active]:bg-transparent text-gray-500 hover:bg-gray-50 transition-all font-semibold"
              >
                <Link className="w-5 h-5" />
                Enlace
              </TabsTrigger>
              <TabsTrigger 
                value="file" 
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-[#1877F2] data-[state=active]:text-[#1877F2] data-[state=active]:bg-transparent text-gray-500 hover:bg-gray-50 transition-all font-semibold"
              >
                <FileText className="w-5 h-5" />
                Subir PDF
              </TabsTrigger>
            </TabsList>

            <div className="p-4 space-y-4">
              <TabsContent value="link" className="mt-0 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="fileUrl" className="text-sm font-semibold text-gray-700">
                    Enlace al documento
                  </Label>
                  <Input
                    id="fileUrl"
                    type="url"
                    placeholder="https://drive.google.com/... o similar"
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    className="bg-gray-100 border-0 rounded-full px-4 py-2.5 focus:bg-white focus:ring-2 focus:ring-[#1877F2] placeholder:text-gray-500"
                  />
                  <p className="text-xs text-gray-500 px-2">
                    Puedes usar Google Drive, Dropbox, WeTransfer, etc.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="file" className="mt-0 space-y-3">
                <Label className="text-sm font-semibold text-gray-700">
                  Archivo PDF (máx. 8MB)
                </Label>
                
                {!selectedFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-[#1877F2] hover:bg-blue-50/50 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-[#E7F3FF] flex items-center justify-center mx-auto mb-3 transition-colors">
                      <Upload className="w-6 h-6 text-gray-400 group-hover:text-[#1877F2] transition-colors" />
                    </div>
                    <p className="text-sm font-semibold text-gray-700">Haz clic para seleccionar</p>
                    <p className="text-xs text-gray-500 mt-1">Solo archivos PDF</p>
                  </div>
                ) : (
                  <div className="bg-gray-100 rounded-xl p-3 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-[#E7F3FF] flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-[#1877F2]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleRemoveFile}
                      className="rounded-full hover:bg-gray-200 flex-shrink-0"
                    >
                      <X className="w-5 h-5 text-gray-500" />
                    </Button>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="space-y-2">
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#1877F2] transition-all duration-300 rounded-full"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 text-center">
                      Subiendo... {uploadProgress}%
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* Message field */}
              <div className="space-y-2">
                <Label htmlFor="message" className="text-sm font-semibold text-gray-700">
                  Mensaje (opcional)
                </Label>
                <Textarea
                  id="message"
                  placeholder="Añade un mensaje o instrucciones de descarga..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  maxLength={500}
                  className="bg-gray-100 border-0 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-[#1877F2] placeholder:text-gray-500 resize-none"
                />
              </div>

              {/* Points reward - Facebook style */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#E7F3FF]">
                <div className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center flex-shrink-0">
                  <Gift className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">¡Gana puntos por ayudar!</p>
                  <p className="text-xs text-gray-600">
                    Recibirás <span className="font-bold text-[#1877F2]">{potentialRewardPoints} puntos</span> si te eligen como mejor respuesta
                  </p>
                </div>
              </div>

              {/* Important info */}
              <div className="p-3 rounded-xl bg-gray-50 text-sm">
                <p className="font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  Importante
                </p>
                <ul className="text-gray-600 space-y-1 text-xs pl-5">
                  <li className="list-disc">El documento solo será visible para quien hizo la solicitud</li>
                  <li className="list-disc">El acceso expira automáticamente después de 7 días</li>
                  {uploadTab === "file" && (
                    <li className="list-disc">Tamaño máximo: 8MB</li>
                  )}
                </ul>
              </div>
            </div>
          </Tabs>

          {/* Facebook-style footer */}
          <div className="px-4 py-3 border-t border-gray-200 flex gap-2 bg-white">
            <Button
              type="button"
              variant="ghost"
              className="flex-1 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 py-2.5"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 rounded-lg font-semibold bg-[#1877F2] hover:bg-[#166FE5] text-white py-2.5"
              disabled={isLoading || (uploadTab === "link" ? !fileUrl.trim() : !selectedFile) && !message.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {uploadProgress > 0 ? "Subiendo..." : "Enviando..."}
                </>
              ) : (
                "Enviar aporte"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
