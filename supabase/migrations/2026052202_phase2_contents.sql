-- =====================================================
-- MIGRATION PHASE 2 : CONTENUS & FLUX SOCIAL
-- Date : 23/05/2026
-- =====================================================

-- =====================================================
-- 1. TABLE follows (système d'abonnés)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.follows (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    UNIQUE(follower_id, following_id)
);

-- =====================================================
-- 2. AJOUT DES COLONNES MANQUANTES À posts
-- =====================================================

-- 2.1 Type de contenu (post, story, live)
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS type text DEFAULT 'post'
CHECK (type IN ('post', 'story', 'live'));

-- 2.2 Expiration des stories (24h)
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- 2.3 Validation par bergerie
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS validation_status text DEFAULT 'pending'
CHECK (validation_status IN ('pending', 'approved', 'rejected'));

ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS validated_by uuid REFERENCES public.profiles(id);

ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS validated_at timestamptz;

-- 2.4 Badge du contenu (classement)
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS badge text DEFAULT 'free'
CHECK (badge IN ('free', 'genial', 'exclusive', 'celestial'));

-- 2.5 Poids (score de popularité)
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS weight integer DEFAULT 0;

-- 2.6 Soft delete
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- =====================================================
-- 3. TABLE content_interactions
-- =====================================================

CREATE TABLE IF NOT EXISTS public.content_interactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('view', 'like', 'vote', 'share')),
    created_at timestamptz DEFAULT now(),
    UNIQUE(content_id, user_id, type)
);

-- =====================================================
-- 4. FONCTION DE CALCUL DU POIDS
-- =====================================================

CREATE OR REPLACE FUNCTION public.calculate_content_weight(content_id uuid)
RETURNS integer AS $$
DECLARE
    vues integer;
    likes integer;
    votes integer;
    partages integer;
BEGIN
    SELECT COALESCE(COUNT(*), 0) INTO vues 
    FROM public.content_interactions 
    WHERE content_interactions.content_id = content_id AND type = 'view';
    
    SELECT COALESCE(COUNT(*), 0) INTO likes 
    FROM public.content_interactions 
    WHERE content_interactions.content_id = content_id AND type = 'like';
    
    SELECT COALESCE(COUNT(*), 0) INTO votes 
    FROM public.content_interactions 
    WHERE content_interactions.content_id = content_id AND type = 'vote';
    
    SELECT COALESCE(COUNT(*), 0) INTO partages 
    FROM public.content_interactions 
    WHERE content_interactions.content_id = content_id AND type = 'share';
    
    -- Poids = vues + 2×likes + 3×votes + 5×partages
    RETURN vues + (2 * likes) + (3 * votes) + (5 * partages);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. TRIGGER DE MISE À JOUR DU POIDS
-- =====================================================

CREATE OR REPLACE FUNCTION public.trigger_update_content_weight()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.posts 
    SET weight = public.calculate_content_weight(NEW.content_id)
    WHERE id = NEW.content_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_weight_on_interaction ON public.content_interactions;
CREATE TRIGGER update_weight_on_interaction
    AFTER INSERT ON public.content_interactions
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_update_content_weight();

-- =====================================================
-- 6. FONCTION D'EXPIRATION DES STORIES
-- =====================================================

CREATE OR REPLACE FUNCTION public.expire_stories()
RETURNS void AS $$
BEGIN
    UPDATE public.posts
    SET is_active = false
    WHERE type = 'story'
    AND expires_at < now()
    AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Note: pg_cron configuration à faire manuellement dans Supabase Dashboard
-- Dashboard → Database → Extensions → Activer pg_cron
-- Puis: SELECT cron.schedule('expire-stories', '0 * * * *', 'SELECT expire_stories();');

-- =====================================================
-- 7. RLS POLITIQUES
-- =====================================================

-- 7.1 RLS pour follows
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own follows" ON public.follows
    FOR SELECT USING (auth.uid() = follower_id OR auth.uid() = following_id);

CREATE POLICY "Users can follow others" ON public.follows
    FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow" ON public.follows
    FOR DELETE USING (auth.uid() = follower_id);

-- 7.2 RLS pour content_interactions
ALTER TABLE public.content_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view interactions" ON public.content_interactions
    FOR SELECT USING (true);

CREATE POLICY "Users can create interactions" ON public.content_interactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 7.3 RLS pour posts (visibilité)
DROP POLICY IF EXISTS "Posts are viewable by authenticated users" ON public.posts;
CREATE POLICY "Posts are viewable by authenticated users"
ON public.posts FOR SELECT
TO authenticated
USING (
    validation_status = 'approved'
    AND is_active = true
    AND (
        -- Cas 1: Public (global ou public)
        visibility IN ('global', 'public')
        OR
        -- Cas 2: Abonnés (subscribers) - nécessite follows
        (visibility = 'subscribers' AND EXISTS (
            SELECT 1 FROM public.follows
            WHERE following_id = posts.author_id
            AND follower_id = auth.uid()
        ))
        OR
        -- Cas 3: Même paroisse (restricted ou parish)
        (visibility IN ('restricted', 'parish') AND EXISTS (
            SELECT 1 FROM public.profiles p1, public.profiles p2
            WHERE p1.id = auth.uid()
            AND p2.id = posts.author_id
            AND p1.parish_id = p2.parish_id
            AND p1.parish_id IS NOT NULL
        ))
        OR
        -- Cas 4: Même confession (extended - conservé définitivement)
        (visibility = 'extended' AND EXISTS (
            SELECT 1 FROM public.profiles p1, public.profiles p2
            WHERE p1.id = auth.uid()
            AND p2.id = posts.author_id
            AND p1.confession_id = p2.confession_id
            AND p1.confession_id IS NOT NULL
        ))
    )
);

-- 7.4 RLS pour validation par bergerie
CREATE POLICY "Shepherds can validate content"
ON public.posts FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND shepherd_grade IN ('leader', 'superior', 'elder')
    )
)
WITH CHECK (
    validation_status IN ('approved', 'rejected')
);

-- =====================================================
-- 8. ÉTENDRE LA CONTRAINTE CHECK DE visibility
-- =====================================================

DO $$ 
BEGIN
    -- Supprimer l'ancienne contrainte si elle existe
    ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_visibility_check;
    
    -- Créer la nouvelle contrainte avec toutes les valeurs acceptées
    ALTER TABLE public.posts 
    ADD CONSTRAINT posts_visibility_check 
    CHECK (visibility IN ('global', 'public', 'restricted', 'parish', 'extended', 'subscribers'));
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'La contrainte posts_visibility_check a été créée différemment ou n''existe pas.';
END $$;

-- =====================================================
-- 9. INDEX POUR PERFORMANCES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_posts_type ON public.posts(type);
CREATE INDEX IF NOT EXISTS idx_posts_validation_status ON public.posts(validation_status);
CREATE INDEX IF NOT EXISTS idx_posts_weight ON public.posts(weight DESC);
CREATE INDEX IF NOT EXISTS idx_posts_expires_at ON public.posts(expires_at);
CREATE INDEX IF NOT EXISTS idx_posts_is_active ON public.posts(is_active);
CREATE INDEX IF NOT EXISTS idx_content_interactions_content_id ON public.content_interactions(content_id);
CREATE INDEX IF NOT EXISTS idx_content_interactions_user_id ON public.content_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_content_interactions_type ON public.content_interactions(type);
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================