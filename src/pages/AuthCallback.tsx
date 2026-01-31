import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error en callback:', error);
          navigate('/auth');
          return;
        }

        if (session) {
          // Usuario autenticado correctamente
          navigate('/');
        } else {
          navigate('/auth');
        }
      } catch (err) {
        console.error('Error inesperado:', err);
        navigate('/auth');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-auth-background flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-auth-text-muted">Completando inicio de sesión...</p>
      </div>
    </div>
  );
}
