-- =============================================
-- NexuS Database Schema
-- Academic Document Sharing Platform
-- =============================================

-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- =============================================
-- 1. PROFILES TABLE (user profiles)
-- =============================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    points INTEGER NOT NULL DEFAULT 100,
    level TEXT NOT NULL DEFAULT 'novato' CHECK (level IN ('novato', 'colaborador', 'maestro')),
    last_checkin DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- =============================================
-- 2. USER_ROLES TABLE (admin roles - separate from profiles)
-- =============================================
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 3. HELPER FUNCTIONS (Security Definer)
-- =============================================

-- Check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role = _role
    )
$$;

-- Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    )
$$;

-- User_roles policies (only admins can manage)
CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.is_admin() OR user_id = auth.uid());

CREATE POLICY "Admins can insert roles"
ON public.user_roles FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete roles"
ON public.user_roles FOR DELETE
TO authenticated
USING (public.is_admin());

-- =============================================
-- 4. SOLICITUDES TABLE (document requests)
-- =============================================
CREATE TABLE public.solicitudes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'General',
    doi TEXT,
    is_urgent BOOLEAN NOT NULL DEFAULT false,
    points_cost INTEGER NOT NULL DEFAULT 20,
    is_resolved BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.solicitudes ENABLE ROW LEVEL SECURITY;

-- Solicitudes policies
CREATE POLICY "Anyone can view solicitudes"
ON public.solicitudes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create solicitudes"
ON public.solicitudes FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own solicitudes"
ON public.solicitudes FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can delete own solicitudes"
ON public.solicitudes FOR DELETE
TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

-- =============================================
-- 5. RESPUESTAS TABLE (responses with documents)
-- =============================================
CREATE TABLE public.respuestas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    solicitud_id UUID NOT NULL REFERENCES public.solicitudes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_url TEXT,
    file_name TEXT,
    message TEXT,
    is_best_answer BOOLEAN NOT NULL DEFAULT false,
    points_earned INTEGER NOT NULL DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.respuestas ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user can view response
CREATE OR REPLACE FUNCTION public.can_view_respuesta(_respuesta_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.respuestas r
        JOIN public.solicitudes s ON r.solicitud_id = s.id
        WHERE r.id = _respuesta_id
        AND (
            r.user_id = auth.uid() -- response owner
            OR s.user_id = auth.uid() -- solicitud owner
            OR public.is_admin()
        )
    )
$$;

-- Respuestas policies
CREATE POLICY "Users can view relevant respuestas"
ON public.respuestas FOR SELECT
TO authenticated
USING (
    user_id = auth.uid() -- own responses
    OR solicitud_id IN (SELECT id FROM public.solicitudes WHERE user_id = auth.uid()) -- responses to own requests
    OR public.is_admin()
);

CREATE POLICY "Authenticated users can create respuestas"
ON public.respuestas FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own respuestas"
ON public.respuestas FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can delete own respuestas"
ON public.respuestas FOR DELETE
TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

-- =============================================
-- 6. COMENTARIOS TABLE (comments on requests)
-- =============================================
CREATE TABLE public.comentarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    solicitud_id UUID NOT NULL REFERENCES public.solicitudes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.comentarios ENABLE ROW LEVEL SECURITY;

-- Comentarios policies
CREATE POLICY "Anyone can view comentarios"
ON public.comentarios FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create comentarios"
ON public.comentarios FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own comentarios"
ON public.comentarios FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own comentarios"
ON public.comentarios FOR DELETE
TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

-- =============================================
-- 7. LIKES TABLE
-- =============================================
CREATE TABLE public.likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    solicitud_id UUID NOT NULL REFERENCES public.solicitudes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(solicitud_id, user_id)
);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- Likes policies
CREATE POLICY "Anyone can view likes"
ON public.likes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create likes"
ON public.likes FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own likes"
ON public.likes FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- =============================================
-- 8. TRIGGERS AND FUNCTIONS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_solicitudes_updated_at
    BEFORE UPDATE ON public.solicitudes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_comentarios_updated_at
    BEFORE UPDATE ON public.comentarios
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for auto-creating profile
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Function to update user level based on points
CREATE OR REPLACE FUNCTION public.update_user_level()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.points >= 500 THEN
        NEW.level = 'maestro';
    ELSIF NEW.points >= 150 THEN
        NEW.level = 'colaborador';
    ELSE
        NEW.level = 'novato';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_level_on_points_change
    BEFORE UPDATE OF points ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_user_level();

-- =============================================
-- 9. INDEXES for performance
-- =============================================
CREATE INDEX idx_solicitudes_user_id ON public.solicitudes(user_id);
CREATE INDEX idx_solicitudes_category ON public.solicitudes(category);
CREATE INDEX idx_solicitudes_created_at ON public.solicitudes(created_at DESC);
CREATE INDEX idx_respuestas_solicitud_id ON public.respuestas(solicitud_id);
CREATE INDEX idx_respuestas_user_id ON public.respuestas(user_id);
CREATE INDEX idx_comentarios_solicitud_id ON public.comentarios(solicitud_id);
CREATE INDEX idx_likes_solicitud_id ON public.likes(solicitud_id);
CREATE INDEX idx_likes_user_id ON public.likes(user_id);