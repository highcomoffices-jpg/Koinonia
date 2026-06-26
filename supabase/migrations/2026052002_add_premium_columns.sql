-- =====================================================
-- MIGRATION : Ajout des colonnes pour les fonctionnalités premium
-- Date : 20/05/2026
-- Exécuter dans l'éditeur SQL Supabase
-- =====================================================

-- 1. Table biblical_paths – Ajout des colonnes pour les parcours IA
ALTER TABLE public.biblical_paths 
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS difficulty text,
ADD COLUMN IF NOT EXISTS duration_days integer,
ADD COLUMN IF NOT EXISTS steps jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS is_ai_generated boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_premium boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS completion_rate integer DEFAULT 0;

-- Contrainte difficulty
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'biblical_paths_difficulty_check') THEN
        ALTER TABLE public.biblical_paths ADD CONSTRAINT biblical_paths_difficulty_check 
        CHECK (difficulty IN ('beginner', 'intermediate', 'advanced'));
    END IF;
END $$;

-- 2. Table location_meditations – Ajout des colonnes géolocalisées
ALTER TABLE public.location_meditations 
ADD COLUMN IF NOT EXISTS bible_verse text,
ADD COLUMN IF NOT EXISTS verse_reference text,
ADD COLUMN IF NOT EXISTS audio_url text,
ADD COLUMN IF NOT EXISTS duration_minutes integer,
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision,
ADD COLUMN IF NOT EXISTS radius_meters integer DEFAULT 100,
ADD COLUMN IF NOT EXISTS location_type text,
ADD COLUMN IF NOT EXISTS language text DEFAULT 'fr',
ADD COLUMN IF NOT EXISTS is_premium boolean DEFAULT false;

-- Contrainte location_type
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'location_meditations_location_type_check') THEN
        ALTER TABLE public.location_meditations ADD CONSTRAINT location_meditations_location_type_check 
        CHECK (location_type IN ('church', 'cross', 'sacred_site', 'cemetery', 'pilgrimage_site'));
    END IF;
END $$;

-- Contrainte language
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'location_meditations_language_check') THEN
        ALTER TABLE public.location_meditations ADD CONSTRAINT location_meditations_language_check 
        CHECK (language IN ('fr', 'fon', 'yoruba'));
    END IF;
END $$;

-- 3. Table prayer_wall – Ajout des colonnes pour les objectifs
ALTER TABLE public.prayer_wall 
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS target_prayer_count integer,
ADD COLUMN IF NOT EXISTS is_answered boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS answered_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS testimony text,
ADD COLUMN IF NOT EXISTS is_premium boolean DEFAULT false;

-- Contrainte category
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'prayer_wall_category_check') THEN
        ALTER TABLE public.prayer_wall ADD CONSTRAINT prayer_wall_category_check 
        CHECK (category IN ('healing', 'family', 'work', 'guidance', 'gratitude', 'forgiveness', 'protection', 'peace'));
    END IF;
END $$;

-- 4. Table challenges – Ajout des colonnes pour les récompenses
ALTER TABLE public.challenges 
ADD COLUMN IF NOT EXISTS current_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS reward_type text,
ADD COLUMN IF NOT EXISTS reward_amount integer,
ADD COLUMN IF NOT EXISTS reward_currency text,
ADD COLUMN IF NOT EXISTS reward_beneficiary_id uuid,
ADD COLUMN IF NOT EXISTS reward_badge_id text,
ADD COLUMN IF NOT EXISTS reward_description text,
ADD COLUMN IF NOT EXISTS is_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone;

-- Contrainte reward_type
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'challenges_reward_type_check') THEN
        ALTER TABLE public.challenges ADD CONSTRAINT challenges_reward_type_check 
        CHECK (reward_type IN ('donation', 'badge', 'premium_access'));
    END IF;
END $$;

-- 5. Table challenge_participants – Ajout de la colonne is_active
ALTER TABLE public.challenge_participants 
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- 6. Index pour performances
CREATE INDEX IF NOT EXISTS idx_biblical_paths_category ON public.biblical_paths(category);
CREATE INDEX IF NOT EXISTS idx_biblical_paths_difficulty ON public.biblical_paths(difficulty);
CREATE INDEX IF NOT EXISTS idx_biblical_paths_is_premium ON public.biblical_paths(is_premium);
CREATE INDEX IF NOT EXISTS idx_location_meditations_location_type ON public.location_meditations(location_type);
CREATE INDEX IF NOT EXISTS idx_location_meditations_language ON public.location_meditations(language);
CREATE INDEX IF NOT EXISTS idx_location_meditations_is_premium ON public.location_meditations(is_premium);
CREATE INDEX IF NOT EXISTS idx_prayer_wall_category ON public.prayer_wall(category);
CREATE INDEX IF NOT EXISTS idx_prayer_wall_is_answered ON public.prayer_wall(is_answered);
CREATE INDEX IF NOT EXISTS idx_challenges_type ON public.challenges(type);
CREATE INDEX IF NOT EXISTS idx_challenges_is_active ON public.challenges(is_active);
CREATE INDEX IF NOT EXISTS idx_challenges_is_completed ON public.challenges(is_completed);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge_id ON public.challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user_id ON public.challenge_participants(user_id);

-- 7. Recréation de la vue spiritual_ranking
DROP VIEW IF EXISTS public.spiritual_ranking;

CREATE VIEW public.spiritual_ranking AS
SELECT 
    p.id as user_id,
    p.first_name,
    p.last_name,
    p.avatar_url,
    COALESCE(SUM(sb.points_value), 0) as total_points,
    COUNT(ub.id) as badges_count,
    RANK() OVER (ORDER BY COALESCE(SUM(sb.points_value), 0) DESC) as rank,
    CASE 
        WHEN COALESCE(SUM(sb.points_value), 0) >= 2500 THEN 'shepherd'
        WHEN COALESCE(SUM(sb.points_value), 0) >= 1000 THEN 'elder'
        WHEN COALESCE(SUM(sb.points_value), 0) >= 500 THEN 'minister'
        WHEN COALESCE(SUM(sb.points_value), 0) >= 200 THEN 'servant'
        WHEN COALESCE(SUM(sb.points_value), 0) >= 50 THEN 'disciple'
        ELSE 'novice'
    END as spiritual_level
FROM public.profiles p
LEFT JOIN public.user_badges ub ON p.id = ub.user_id
LEFT JOIN public.spiritual_badges sb ON ub.badge_id = sb.id
GROUP BY p.id;

-- 8. Insertion des badges initiaux (si non existants)
INSERT INTO public.spiritual_badges (name, description, icon, color, category, rarity, points_value, requirements)
SELECT * FROM (
    VALUES 
        ('Artisan de Paix', 'Décerné pour la participation active aux défis de prière pour la paix', '🕊️', '#10B981', 'prayer', 'rare', 500, '{"type": "prayers", "count": 100}'),
        ('Moissonneur de Bénédictions', 'Pour ceux qui partagent généreusement leurs bénédictions', '🌾', '#F59E0B', 'generosity', 'epic', 1000, '{"type": "donations", "count": 50}'),
        ('Porteur de Lumière', 'Illumine la communauté par ses publications inspirantes', '💡', '#8B5CF6', 'community', 'common', 200, '{"type": "posts", "count": 30}'),
        ('Éclaireur de Nations', 'Guide spirituel reconnu pour son impact international', '🌍', '#EF4444', 'leadership', 'legendary', 2500, '{"type": "formations", "count": 10, "activities": 25}'),
        ('Semeur de Paix', 'Reconnu pour ses contributions à la paix communautaire', '🌱', '#06B6D4', 'service', 'rare', 750, '{"type": "prayers", "count": 50, "donations": 30}')
) AS v(name, description, icon, color, category, rarity, points_value, requirements)
WHERE NOT EXISTS (SELECT 1 FROM public.spiritual_badges LIMIT 1);

-- 9. Activer RLS sur les nouvelles colonnes (RLS déjà activée, on ajoute les policies si nécessaire)
-- Les politiques existantes restent valides

-- 10. Insertion de données de démonstration (optionnel)
INSERT INTO public.biblical_paths (title, description, category, difficulty, duration_days, steps, is_ai_generated, is_premium, image_url)
SELECT 'Soulagement dans l''épreuve', 'Parcours personnalisé pour trouver la paix et l''espoir dans les moments difficiles', 'inner_peace', 'beginner', 7, 
'[{"day": 1, "title": "Dieu est mon refuge", "description": "Découvrez la protection divine", "bibleVerse": "L''Éternel est mon berger", "verseReference": "Psaume 23:1"}]'::jsonb,
true, true, 'https://images.pexels.com/photos/208315/pexels-photo-208315.jpeg'
WHERE NOT EXISTS (SELECT 1 FROM public.biblical_paths LIMIT 1);

INSERT INTO public.location_meditations (location_name, city_id, description, bible_verse, verse_reference, audio_url, duration_minutes, latitude, longitude, radius_meters, location_type, language, is_premium)
SELECT 'Église Sainte-Anne de Porto-Novo', (SELECT id FROM public.cities WHERE name = 'Porto-Novo' LIMIT 1), 
'Méditation spéciale pour les visiteurs de l''Église Sainte-Anne', 'Ne crains rien, car je suis avec toi', 'Isaïe 41:10', 
'https://example.com/audio/meditation.mp3', 5, 6.4969, 2.6283, 100, 'church', 'fr', true
WHERE NOT EXISTS (SELECT 1 FROM public.location_meditations LIMIT 1);

-- Fin de la migration