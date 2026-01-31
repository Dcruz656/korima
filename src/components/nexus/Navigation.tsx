import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Search, Inbox, Menu, Users, ChevronDown, LogOut, User, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { EditProfileModal } from "./EditProfileModal";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { ThemeToggle } from "./ThemeToggle";
import { KorimaLogo } from "./KorimaLogo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { path: "/", icon: Home, label: "Inicio" },
  { path: "/search", icon: Search, label: "Buscar" },
  { path: "/buzon", icon: Inbox, label: "Buzón" },
  { path: "/grupos", icon: Users, label: "Grupos" },
];

export function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Usuario";
  const points = profile?.points || 0;
  
  const isAdmin = profile?.role === 'admin';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card border-b border-border shadow-sm">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Search - LOGO GRANDE */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <KorimaLogo className="h-16 w-auto animate-heartbeat" />
            </Link>
            <div className="hidden lg:block ml-2">
              <input
                type="text"
                placeholder="Buscar en Kórima"
                className="input-fb w-60 text-sm"
              />
            </div>
          </div>

          {/* Center Nav */}
          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center justify-center w-24 h-12 rounded-lg transition-colors",
                    isActive
                      ? "text-primary border-b-2 border-primary bg-transparent"
                      : "text-muted-foreground hover:bg-secondary"
                  )}
                >
                  <item.icon className="w-6 h-6" />
                </Link>
              );
            })}
          </div>

          {/* Right - User & Points */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <ThemeToggle />

            {user ? (
              <>
                {/* Points Badge */}
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-points/10 text-points font-semibold text-sm">
                  <span>{points} pts</span>
                </div>

                {/* Notifications */}
                <NotificationsDropdown />

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-secondary transition-colors">
                      <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center overflow-hidden">
                        {profile?.avatar_url ? (
                          <img 
                            src={profile.avatar_url} 
                            alt={displayName} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-semibold text-primary-foreground">
                            {displayName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <ChevronDown className="w-4 h-4 text-muted-foreground hidden sm:block" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-3 py-2">
                      <p className="font-semibold">{displayName}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-sm text-points font-medium mt-1">{points} puntos · {profile?.level || "novato"}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowEditProfile(true)} className="cursor-pointer">
                      <User className="w-4 h-4 mr-2" />
                      Editar perfil
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem onClick={() => navigate("/admin/dashboard")} className="cursor-pointer">
                        <Shield className="w-4 h-4 mr-2 text-purple-600" />
                        Panel de Administración
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                      <LogOut className="w-4 h-4 mr-2" />
                      Cerrar sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Edit Profile Modal */}
                <EditProfileModal
                  open={showEditProfile}
                  onOpenChange={setShowEditProfile}
                />
              </>
            ) : (
              <Link
                to="/auth"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
              >
                Iniciar sesión
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-card">
          <div className="flex justify-around py-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex flex-col items-center gap-1 px-4 py-2 rounded-lg",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <item.icon className="w-6 h-6" />
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
