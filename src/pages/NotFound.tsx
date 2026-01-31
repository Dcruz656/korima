import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Detectar si es una redirección OAuth con tokens en la URL
    const hash = window.location.hash;
    if (hash && (hash.includes("access_token") || hash.includes("refresh_token") || hash.includes("error"))) {
      console.log("OAuth redirect detected, navigating to home...");
      // Redirigir al home para que AuthContext procese los tokens
      navigate("/", { replace: true });
      return;
    }

    // También verificar query params para otros flujos de auth
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("code") || searchParams.get("error")) {
      console.log("Auth callback detected, navigating to home...");
      navigate("/", { replace: true });
      return;
    }

    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Página no encontrada</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Volver al inicio
        </a>
      </div>
    </div>
  );
};

export default NotFound;
