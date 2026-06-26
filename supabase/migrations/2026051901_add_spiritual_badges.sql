-- =====================================================
-- MIGRATION : Ajout des badges spirituels et classement
-- Date : 19/05/2026
-- Exécuter dans l'éditeur SQL Supabase (ordre séquentiel)
-- =====================================================

-- 1. Table des badges spirituels
CREATE TABLE IF NOT EXISTS public.spiritual_badges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    icon text,
    color text,
    category text NOT NULL,
    rarity text NOT NULL,
    points_value integer DEFAULT 0,
    requirements jsonb,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

-- 2. Table des badges obtenus par les utilisateurs
CREATE TABLE IF NOT EXISTS public.user_badges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    badge_id uuid NOT NULL,
    unlocked_at timestamp with time zone DEFAULT now(),
    is_visible boolean DEFAULT true,
    PRIMARY KEY (id),
    CONSTRAINT fk_user_badges_user FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_badges_badge FOREIGN KEY (badge_id) REFERENCES public.spiritual_badges(id) ON DELETE CASCADE,
    UNIQUE(user_id, badge_id)
);

-- 3. Vue du classement spirituel (calcul dynamique)
CREATE OR REPLACE VIEW public.spiritual_ranking AS
SELECT 
    p.id as user_id,
    p.first_name,
    p.last_name,
    p.avatar_url,
    COALESCE(SUM(sb.points_value), 0) as total_points,
    COUNT(ub.id) as badges_count,
    RANK() OVER (ORDER BY COALESCE(SUM(sb.points_value), 0) DESC) as rank
FROM public.profiles p
LEFT JOIN public.user_badges ub ON p.id = ub.user_id
LEFT JOIN public.spiritual_badges sb ON ub.badge_id = sb.id
GROUP BY p.id;

-- 4. Insertion des badges initiaux (inspirés des mocks)
INSERT INTO public.spiritual_badges (name, description, icon, color, category, rarity, points_value, requirements)
VALUES
    ('Artisan de Paix', 'Décerné pour la participation active aux défis de prière pour la paix', '🕊️', '#10B981', 'prayer', 'rare', 500, '{"type": "prayers", "count": 100}'),
    ('Moissonneur de Bénédictions', 'Pour ceux qui partagent généreusement leurs bénédictions', '🌾', '#F59E0B', 'generosity', 'epic', 1000, '{"type": "donations", "count": 50}'),
    ('Porteur de Lumière', 'Illumine la communauté par ses publications inspirantes', '💡', '#8B5CF6', 'community', 'common', 200, '{"type": "posts", "count": 30}'),
    ('Éclaireur de Nations', 'Guide spirituel reconnu pour son impact international', '🌍', '#EF4444', 'leadership', 'legendary', 2500, '{"type": "formations", "count": 10, "activities": 25}'),
    ('Semeur de Paix', 'Reconnu pour ses contributions à la paix communautaire', '🌱', '#06B6D4', 'service', 'rare', 750, '{"type": "prayers", "count": 50, "donations": 30}');

-- 5. Activation RLS sur les nouvelles tables
ALTER TABLE public.spiritual_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- 6. Politiques RLS pour spiritual_badges (lecture publique)
CREATE POLICY "Badges are viewable by everyone" ON public.spiritual_badges
    FOR SELECT USING (true);

-- 7. Politiques RLS pour user_badges
CREATE POLICY "Users can view own badges" ON public.user_badges
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own badges" ON public.user_badges
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own badges visibility" ON public.user_badges
    FOR UPDATE USING (auth.uid() = user_id);

-- 8. Index pour performances
CREATE INDEX idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX idx_user_badges_badge_id ON public.user_badges(badge_id);
CREATE INDEX idx_spiritual_badges_category ON public.spiritual_badges(category);
CREATE INDEX idx_spiritual_badges_rarity ON public.spiritual_badges(rarity);