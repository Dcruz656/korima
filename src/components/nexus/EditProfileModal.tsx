import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Loader2, User, X, MapPin, Building2, GraduationCap, Globe } from "lucide-react";

const COUNTRIES = [
  "Argentina",
  "Bolivia",
  "Brasil",
  "Canadá",
  "Chile",
  "Colombia",
  "Costa Rica",
  "Cuba",
  "Ecuador",
  "El Salvador",
  "España",
  "Estados Unidos",
  "Guatemala",
  "Honduras",
  "México",
  "Nicaragua",
  "Panamá",
  "Paraguay",
  "Perú",
  "Puerto Rico",
  "República Dominicana",
  "Uruguay",
  "Venezuela",
  "Otro",
];

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export function EditProfileModal({ open, onOpenChange }: EditProfileModalProps) {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");
  const [institution, setInstitution] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch full profile data when modal opens
  useEffect(() => {
    if (open && user) {
      fetchFullProfile();
    }
  }, [open, user]);

  const fetchFullProfile = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (data) {
      setFullName(data.full_name || "");
      setCountry(data.country || "");
      setInstitution(data.institution || "");
      setSpecialty(data.specialty || "");
      setBio(data.bio || "");
      setWebsite(data.website || "");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Tipo de archivo no válido",
        description: "Solo se permiten imágenes",
        variant: "destructive",
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "Imagen demasiado grande",
        description: "El tamaño máximo es 2MB",
        variant: "destructive",
      });
      return;
    }

    setAvatarFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadAvatar = async (file: File): Promise<string | null> => {
    if (!user) return null;

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;

    if (profile?.avatar_url) {
      const oldPath = profile.avatar_url.split("/avatars/")[1];
      if (oldPath) {
        await supabase.storage.from("avatars").remove([oldPath]);
      }
    }

    const { data, error } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error("Upload error:", error);
      throw new Error("Error al subir la imagen");
    }

    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      let avatarUrl = profile?.avatar_url || null;

      if (avatarFile) {
        avatarUrl = await uploadAvatar(avatarFile);
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim() || null,
          country: country.trim() || null,
          institution: institution.trim() || null,
          specialty: specialty.trim() || null,
          bio: bio.trim() || null,
          website: website.trim() || null,
          avatar_url: avatarUrl,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "¡Perfil actualizado! ✨",
        description: "Tus cambios han sido guardados.",
      });

      await refreshProfile();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo actualizar el perfil",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const currentAvatar = avatarPreview || profile?.avatar_url;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-lg border-0 shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-background border-b border-border px-4 py-3 sticky top-0 z-10">
          <DialogHeader className="space-y-0">
            <DialogTitle className="text-xl font-bold text-foreground text-center">
              Editar perfil
            </DialogTitle>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="bg-background p-4 space-y-5">
          {/* Avatar section */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center overflow-hidden cursor-pointer group border-4 border-background shadow-lg"
              >
                {currentAvatar ? (
                  <img 
                    src={currentAvatar} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 text-muted-foreground" />
                )}
                
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </div>
              
              {currentAvatar && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileSelect}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 text-sm text-primary font-semibold hover:underline"
            >
              Cambiar foto
            </button>
          </div>

          {/* Name field */}
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-semibold text-foreground">
              Nombre completo
            </Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Tu nombre"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="bg-secondary border-0 rounded-lg px-4 py-2.5 focus:bg-background focus:ring-2 focus:ring-primary"
              maxLength={100}
            />
          </div>

          {/* Country field */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              País
            </Label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="bg-secondary border-0 rounded-lg px-4 py-2.5 h-auto focus:ring-2 focus:ring-primary">
                <SelectValue placeholder="Selecciona tu país" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {COUNTRIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Institution field */}
          <div className="space-y-2">
            <Label htmlFor="institution" className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              Institución
            </Label>
            <Input
              id="institution"
              type="text"
              placeholder="Universidad o centro de investigación"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              className="bg-secondary border-0 rounded-lg px-4 py-2.5 focus:bg-background focus:ring-2 focus:ring-primary"
              maxLength={200}
            />
          </div>

          {/* Specialty field */}
          <div className="space-y-2">
            <Label htmlFor="specialty" className="text-sm font-semibold text-foreground flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-muted-foreground" />
              Especialidad
            </Label>
            <Input
              id="specialty"
              type="text"
              placeholder="Ej: Medicina, Ingeniería Civil, Derecho..."
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="bg-secondary border-0 rounded-lg px-4 py-2.5 focus:bg-background focus:ring-2 focus:ring-primary"
              maxLength={100}
            />
          </div>

          {/* Bio field */}
          <div className="space-y-2">
            <Label htmlFor="bio" className="text-sm font-semibold text-foreground">
              Biografía
            </Label>
            <Textarea
              id="bio"
              placeholder="Cuéntanos sobre ti y tu trabajo..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="bg-secondary border-0 rounded-lg px-4 py-2.5 focus:bg-background focus:ring-2 focus:ring-primary min-h-[80px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">{bio.length}/500</p>
          </div>

          {/* Website field */}
          <div className="space-y-2">
            <Label htmlFor="website" className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground" />
              Sitio web
            </Label>
            <Input
              id="website"
              type="text"
              placeholder="https://tu-sitio.com"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="bg-secondary border-0 rounded-lg px-4 py-2.5 focus:bg-background focus:ring-2 focus:ring-primary"
              maxLength={200}
            />
          </div>

          {/* Email (read-only) */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground">
              Correo electrónico
            </Label>
            <Input
              type="email"
              value={user?.email || ""}
              disabled
              className="bg-muted border-0 rounded-lg px-4 py-2.5 text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground">El correo no se puede cambiar</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 sticky bottom-0 bg-background pb-2">
            <Button
              type="button"
              variant="ghost"
              className="flex-1 rounded-lg font-semibold"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 rounded-lg font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar cambios"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
