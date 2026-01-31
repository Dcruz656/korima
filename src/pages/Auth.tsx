import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  Loader2, 
  Users, 
  Zap,
  Globe,
  Shield,
  ArrowRight,
  ArrowLeft,
  CheckCircle
} from "lucide-react";
import { KorimaLogo } from "@/components/nexus/KorimaLogo";


type AuthMode = "login" | "register" | "forgot" | "reset";


export default function Auth() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "reset" ? "reset" : "login";
  
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(false);


  const { signIn, signUp, user, loading: authLoading, resetPassword, updatePassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();


  useEffect(() => {
    // Check if coming from password reset link
    if (searchParams.get("mode") === "reset") {
      setMode("reset");
    }
  }, [searchParams]);


  useEffect(() => {
    if (!authLoading && user && mode !== "reset") {
      navigate("/");
    }
  }, [user, authLoading, navigate, mode]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);


    try {
      if (mode === "login") {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              title: "Error de inicio de sesión",
              description: "Email o contraseña incorrectos",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Error",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "¡Bienvenido!",
            description: "Has iniciado sesión correctamente",
          });
          navigate("/");
        }
      } else if (mode === "register") {
        if (!acceptedTerms) {
          toast({
            title: "Error",
            description: "Debes aceptar los términos y condiciones para registrarte",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        
        if (password.length < 6) {
          toast({
            title: "Error",
            description: "La contraseña debe tener al menos 6 caracteres",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }


        const { error } = await signUp(email, password, fullName);
        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              title: "Error",
              description: "Este email ya está registrado",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Error",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "¡Cuenta creada!",
            description: "Tu cuenta ha sido creada exitosamente",
          });
          navigate("/");
        }
      } else if (mode === "forgot") {
        const { error } = await resetPassword(email);
        if (error) {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        } else {
          setResetEmailSent(true);
        }
      } else if (mode === "reset") {
        if (password !== confirmPassword) {
          toast({
            title: "Error",
            description: "Las contraseñas no coinciden",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
        
        if (password.length < 6) {
          toast({
            title: "Error",
            description: "La contraseña debe tener al menos 6 caracteres",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }


        const { error } = await updatePassword(password);
        if (error) {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        } else {
          setPasswordResetSuccess(true);
          toast({
            title: "¡Contraseña actualizada!",
            description: "Ya puedes iniciar sesión con tu nueva contraseña",
          });
        }
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message || "No se pudo iniciar sesión con Google",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Ocurrió un error al conectar con Google",
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };


  if (authLoading) {
    return (
      <div className="min-h-screen bg-auth-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }


  const features = [
    {
      icon: Users,
      title: "Comunidad Global",
      description: "Conecta con investigadores de todo el mundo"
    },
    {
      icon: Zap,
      title: "Acceso Instantáneo",
      description: "Obtén documentos en minutos, no días"
    },
    {
      icon: Shield,
      title: "100% Seguro",
      description: "Tu información está protegida"
    },
    {
      icon: Globe,
      title: "Sin Fronteras",
      description: "Conocimiento sin barreras geográficas"
    }
  ];


  return (
    <div className="min-h-screen bg-auth-background overflow-hidden relative">
      {/* Subtle Background Pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Soft gradient orbs */}
        <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-auth-gradient-start/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-auth-gradient-mid/10 rounded-full blur-[100px]" />
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--auth-border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--auth-border)) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>


      <div className="relative z-10 min-h-screen flex flex-col lg:flex-row">
        {/* Left Panel - Hero with Logo */}
        <div className="lg:w-1/2 flex flex-col items-center justify-center py-12 lg:py-0 px-6 lg:px-12">
          {/* Logo prominente */}
          <div className="relative mb-8 animate-fade-in">
            <KorimaLogo 
              className="w-72 lg:w-96 h-auto animate-heartbeat" 
            />
          </div>


          {/* Tagline */}
          <div className="text-center max-w-md animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <h1 className="text-3xl lg:text-4xl font-bold text-auth-text leading-tight mb-4">
              El conocimiento{" "}
              <span className="bg-gradient-to-r from-auth-gradient-start via-auth-gradient-mid to-auth-gradient-end bg-clip-text text-transparent">
                se comparte
              </span>
            </h1>
            <p className="text-auth-text-muted text-base lg:text-lg">
              Únete a la comunidad donde investigadores y estudiantes colaboran 
              para democratizar el acceso al conocimiento científico.
            </p>
          </div>


          {/* Stats - solo desktop */}
          <div className="hidden lg:flex items-center gap-8 mt-12 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="text-center">
              <p className="text-2xl font-bold text-auth-text">500+</p>
              <p className="text-sm text-auth-text-muted">Documentos</p>
            </div>
            <div className="w-px h-10 bg-auth-border" />
            <div className="text-center">
              <p className="text-2xl font-bold text-auth-text">1.2K</p>
              <p className="text-sm text-auth-text-muted">Miembros</p>
            </div>
            <div className="w-px h-10 bg-auth-border" />
            <div className="text-center">
              <p className="text-2xl font-bold text-auth-text">98%</p>
              <p className="text-sm text-auth-text-muted">Éxito</p>
            </div>
          </div>


          {/* Features - solo desktop */}
          <div className="hidden lg:flex flex-wrap justify-center gap-3 mt-8 max-w-lg animate-fade-in" style={{ animationDelay: "0.3s" }}>
            {features.map((feature, index) => (
              <div 
                key={index}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-auth-surface border border-auth-border shadow-sm"
              >
                <feature.icon className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-auth-text">{feature.title}</span>
              </div>
            ))}
          </div>
        </div>


        {/* Right Panel - Auth Form */}
        <div className="lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-auth-surface lg:shadow-xl">
          <div className="w-full max-w-md animate-fade-in" style={{ animationDelay: "0.2s" }}>


            {/* Form Card */}
            <div className="relative">
              <div className="bg-auth-surface rounded-2xl p-8 shadow-lg border border-auth-border">
                {/* Header */}
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-auth-text mb-2">
                    {mode === "login" && "Bienvenido de nuevo"}
                    {mode === "register" && "Crear cuenta"}
                    {mode === "forgot" && "Recuperar contraseña"}
                    {mode === "reset" && "Nueva contraseña"}
                  </h2>
                  <p className="text-auth-text-muted text-sm">
                    {mode === "login" && "Ingresa tus datos para continuar"}
                    {mode === "register" && "Únete a nuestra comunidad académica"}
                    {mode === "forgot" && "Te enviaremos un enlace para restablecer tu contraseña"}
                    {mode === "reset" && "Ingresa tu nueva contraseña"}
                  </p>
                </div>


                {/* Reset Email Sent Success */}
                {mode === "forgot" && resetEmailSent ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-auth-text mb-2">¡Correo enviado!</h3>
                    <p className="text-auth-text-muted text-sm mb-6">
                      Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
                    </p>
                    <Button
                      onClick={() => {
                        setMode("login");
                        setResetEmailSent(false);
                        setEmail("");
                      }}
                      variant="outline"
                      className="rounded-xl"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Volver al inicio de sesión
                    </Button>
                  </div>
                ) : mode === "reset" && passwordResetSuccess ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-auth-text mb-2">¡Contraseña actualizada!</h3>
                    <p className="text-auth-text-muted text-sm mb-6">
                      Tu contraseña ha sido actualizada correctamente.
                    </p>
                    <Button
                      onClick={() => {
                        setMode("login");
                        setPasswordResetSuccess(false);
                        setPassword("");
                        setConfirmPassword("");
                        navigate("/auth");
                      }}
                      className="rounded-xl bg-gradient-to-r from-auth-gradient-start to-auth-gradient-mid"
                    >
                      Iniciar sesión
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === "register" && (
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-auth-text-muted text-sm font-medium">Nombre completo</Label>
                        <div className="relative group">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-auth-text-muted group-focus-within:text-primary transition-colors" />
                          <Input
                            id="fullName"
                            type="text"
                            placeholder="Tu nombre"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="pl-11 h-12 bg-background border-auth-border text-auth-text placeholder:text-auth-text-muted/50 rounded-xl focus:border-primary focus:ring-primary/20 transition-all"
                          />
                        </div>
                      </div>
                    )}


                    {(mode === "login" || mode === "register" || mode === "forgot") && (
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-auth-text-muted text-sm font-medium">Email</Label>
                        <div className="relative group">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-auth-text-muted group-focus-within:text-primary transition-colors" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="tu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-11 h-12 bg-background border-auth-border text-auth-text placeholder:text-auth-text-muted/50 rounded-xl focus:border-primary focus:ring-primary/20 transition-all"
                            required
                          />
                        </div>
                      </div>
                    )}


                    {(mode === "login" || mode === "register" || mode === "reset") && (
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-auth-text-muted text-sm font-medium">
                          {mode === "reset" ? "Nueva contraseña" : "Contraseña"}
                        </Label>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-auth-text-muted group-focus-within:text-primary transition-colors" />
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-11 pr-11 h-12 bg-background border-auth-border text-auth-text placeholder:text-auth-text-muted/50 rounded-xl focus:border-primary focus:ring-primary/20 transition-all"
                            required
                            minLength={6}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-auth-text-muted hover:text-auth-text transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )}


                    {mode === "reset" && (
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-auth-text-muted text-sm font-medium">
                          Confirmar contraseña
                        </Label>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-auth-text-muted group-focus-within:text-primary transition-colors" />
                          <Input
                            id="confirmPassword"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="pl-11 pr-11 h-12 bg-background border-auth-border text-auth-text placeholder:text-auth-text-muted/50 rounded-xl focus:border-primary focus:ring-primary/20 transition-all"
                            required
                            minLength={6}
                          />
                        </div>
                      </div>
                    )}


                    {/* Forgot Password Link - only on login */}
                    {mode === "login" && (
                      <div className="text-right">
                        <button
                          type="button"
                          onClick={() => setMode("forgot")}
                          className="text-sm text-primary hover:underline"
                        >
                          ¿Olvidaste tu contraseña?
                        </button>
                      </div>
                    )}


                    {/* Terms Checkbox - only show on register */}
                    {mode === "register" && (
                      <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                        <Checkbox
                          id="terms"
                          checked={acceptedTerms}
                          onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                          className="mt-0.5"
                        />
                        <label htmlFor="terms" className="text-sm text-auth-text-muted leading-tight cursor-pointer">
                          Acepto los{" "}
                          <Link to="/politicas" target="_blank" className="text-primary hover:underline">
                            Términos y Condiciones
                          </Link>
                          {" "}y la{" "}
                          <Link to="/politicas" target="_blank" className="text-primary hover:underline">
                            Política de Privacidad
                          </Link>
                        </label>
                      </div>
                    )}


                    <Button
                      type="submit"
                      className="w-full h-12 bg-gradient-to-r from-auth-gradient-start to-auth-gradient-mid hover:from-auth-gradient-start/90 hover:to-auth-gradient-mid/90 text-white font-semibold rounded-xl shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 group"
                      disabled={isLoading || (mode === "register" && !acceptedTerms)}
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          {mode === "login" && "Iniciar sesión"}
                          {mode === "register" && "Crear cuenta"}
                          {mode === "forgot" && "Enviar enlace"}
                          {mode === "reset" && "Actualizar contraseña"}
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </Button>


                    {/* Divider and Google - only on login/register */}
                    {(mode === "login" || mode === "register") && (
                      <>
                        <div className="relative my-6">
                          <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-auth-border" />
                          </div>
                          <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-auth-surface px-3 text-auth-text-muted">o continúa con</span>
                          </div>
                        </div>


                        <Button
                          type="button"
                          variant="outline"
                          className="w-full h-12 bg-background border-auth-border text-auth-text hover:bg-auth-surface-hover rounded-xl transition-all"
                          onClick={handleGoogleSignIn}
                          disabled={isGoogleLoading || isLoading}
                        >
                          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                          </svg>
                          {isGoogleLoading ? "Conectando..." : "Continuar con Google"}
                        </Button>
                      </>
                    )}
                  </form>
                )}


                {/* Footer links */}
                <div className="mt-6 text-center space-y-2">
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => setMode("register")}
                      className="text-auth-text-muted hover:text-auth-text text-sm transition-colors"
                    >
                      ¿No tienes cuenta?{" "}
                      <span className="text-primary font-medium hover:underline">Regístrate</span>
                    </button>
                  )}
                  {mode === "register" && (
                    <button
                      type="button"
                      onClick={() => setMode("login")}
                      className="text-auth-text-muted hover:text-auth-text text-sm transition-colors"
                    >
                      ¿Ya tienes cuenta?{" "}
                      <span className="text-primary font-medium hover:underline">Inicia sesión</span>
                    </button>
                  )}
                  {(mode === "forgot" && !resetEmailSent) && (
                    <button
                      type="button"
                      onClick={() => setMode("login")}
                      className="text-auth-text-muted hover:text-auth-text text-sm transition-colors flex items-center justify-center gap-1"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Volver al inicio de sesión
                    </button>
                  )}
                </div>
              </div>
            </div>


            {/* Footer */}
            <p className="text-center text-xs text-auth-text-muted mt-6">
              Al continuar, aceptas los{" "}
              <Link to="/politicas" className="text-primary hover:underline">
                Términos
              </Link>
              {" "}y la{" "}
              <Link to="/politicas" className="text-primary hover:underline">
                Política de Privacidad
              </Link>
            </p>


            {/* Mobile Features */}
            <div className="mt-8 lg:hidden">
              <div className="flex flex-wrap justify-center gap-2">
                {features.map((feature, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-auth-surface border border-auth-border"
                  >
                    <feature.icon className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-medium text-auth-text-muted">{feature.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
