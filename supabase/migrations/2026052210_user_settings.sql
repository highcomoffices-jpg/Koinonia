-- =====================================================
-- MIGRATION : Table des paramètres utilisateur
-- Date : 28/05/2026
-- =====================================================

-- 1. Table user_settings
CREATE TABLE IF NOT EXISTS public.user_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    language text DEFAULT 'fr' CHECK (language IN ('fr', 'en', 'sw')),
    theme text DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
    font_size text DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large')),
    confirm_before_publish boolean DEFAULT true,
    default_visibility text DEFAULT 'public' CHECK (default_visibility IN ('public', 'subscribers', 'parish')),
    -- Notifications push
    notifications_push_like boolean DEFAULT true,
    notifications_push_comment boolean DEFAULT true,
    notifications_push_follow boolean DEFAULT true,
    notifications_push_share boolean DEFAULT true,
    notifications_push_validation boolean DEFAULT true,
    -- Notifications email (résumé quotidien)
    notifications_email_summary boolean DEFAULT false,
    -- Sécurité
    two_factor_enabled boolean DEFAULT false,
    -- Préférences supplémentaires
    auto_play_videos boolean DEFAULT true,
    show_birthday boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id)
);

-- 2. Index
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);

-- 3. Trigger updated_at
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 4. RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir/modifier leurs propres paramètres
CREATE POLICY "Users can view their own settings"
ON public.user_settings FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
ON public.user_settings FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
ON public.user_settings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 5. Fonction pour obtenir les paramètres (avec création automatique si inexistants)
CREATE OR REPLACE FUNCTION public.get_user_settings(user_id uuid)
RETURNS SETOF public.user_settings AS $$
BEGIN
    -- Vérifier si les paramètres existent
    IF NOT EXISTS (SELECT 1 FROM public.user_settings WHERE user_settings.user_id = user_id) THEN
        -- Créer les paramètres par défaut
        INSERT INTO public.user_settings (user_id)
        VALUES (user_id);
    END IF;
    
    RETURN QUERY
    SELECT * FROM public.user_settings WHERE user_settings.user_id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================