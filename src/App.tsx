import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AuthCallback from "./pages/AuthCallback";
import Buzon from "./pages/Buzon";
import Search from "./pages/Search";
import Guardados from "./pages/Guardados";
import Historial from "./pages/Historial";
import Tendencias from "./pages/Tendencias";
import Grupos from "./pages/Grupos";
import Perfil from "./pages/Perfil";
import Pendientes from "./pages/Pendientes";
import Resueltas from "./pages/Resueltas";
import MisSolicitudes from "./pages/MisSolicitudes";
import AdminDashboard from "./pages/AdminDashboard";
import Politicas from "./pages/Politicas";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Component to protect admin routes
function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();

  if (!profile) {
    return <Navigate to="/auth" replace />;
  }

  if (profile.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// Component to handle OAuth redirects at the router level
function OAuthRedirectHandler({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check for OAuth tokens in URL hash or query params
    const hash = window.location.hash;
    const searchParams = new URLSearchParams(window.location.search);

    const hasOAuthTokens = hash && (
      hash.includes("access_token") ||
      hash.includes("refresh_token") ||
      hash.includes("error")
    );
    const hasAuthCallback = searchParams.get("code") || searchParams.get("error");

    // If we're on a non-existent route with OAuth params, redirect to home
    if ((hasOAuthTokens || hasAuthCallback) && location.pathname !== "/" && location.pathname !== "/auth" && location.pathname !== "/auth/callback") {
      console.log("OAuth redirect detected at router level, navigating to callback...");
      navigate("/auth/callback", { replace: true });
    }
  }, [location, navigate]);

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <OAuthRedirectHandler>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/buzon" element={<Buzon />} />
        <Route path="/search" element={<Search />} />
        <Route path="/guardados" element={<Guardados />} />
        <Route path="/historial" element={<Historial />} />
        <Route path="/tendencias" element={<Tendencias />} />
        <Route path="/grupos" element={<Grupos />} />
        <Route path="/perfil/:userId" element={<Perfil />} />
        <Route path="/pendientes" element={<Pendientes />} />
        <Route path="/resueltas" element={<Resueltas />} />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          }
        />
        <Route path="/politicas" element={<Politicas />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </OAuthRedirectHandler>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
