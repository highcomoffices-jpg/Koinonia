-- =====================================================
-- MIGRATION : Hiérarchie des Bergers (3 grades) + Niveaux spirituels
-- Date : 21/05/2026
-- Exécuter dans l'éditeur SQL Supabase
-- =====================================================

-- =====================================================
-- 1. TABLE settings (si elle n'existe pas)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.settings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    key text NOT NULL UNIQUE,
    value jsonb NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Insertion des seuils par défaut
INSERT INTO public.settings (key, value, description) VALUES
('spiritual_level_sower_max', '9999', 'Points maximum pour le niveau Sower'),
('spiritual_level_harvester_min', '10000', 'Points minimum pour le niveau Harvester'),
('spiritual_level_harvester_max', '49999', 'Points maximum pour le niveau Harvester'),
('spiritual_level_friend_min', '50000', 'Points minimum pour le niveau Friend'),
('spiritual_level_friend_max', '99999', 'Points maximum pour le niveau Friend')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- 2. AJOUT DES COLONNES DANS profiles
-- =====================================================

-- Grade du berger (NULL = pas berger)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS shepherd_grade TEXT DEFAULT NULL;

-- Contrainte sur les valeurs possibles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shepherd_grade_check') THEN
        ALTER TABLE public.profiles ADD CONSTRAINT shepherd_grade_check 
        CHECK (shepherd_grade IN ('leader', 'superior', 'elder', NULL));
    END IF;
END $$;

-- Référence vers le supérieur hiérarchique
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS superior_id UUID REFERENCES public.profiles(id) NULL;

-- Validation du grade
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS validated_by UUID REFERENCES public.profiles(id) NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS validation_status TEXT DEFAULT 'pending';

-- Certification vigneron (indépendante du grade)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS vigneron_verified BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS vigneron_certified_by UUID REFERENCES public.profiles(id) NULL;

-- Points spirituels (pour calcul automatique)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS spiritual_points INTEGER DEFAULT 0;

-- =====================================================
-- 3. AJOUT DES COLONNES DANS parishes
-- =====================================================

ALTER TABLE public.parishes ADD COLUMN IF NOT EXISTS leader_shepherd_id UUID REFERENCES public.profiles(id) NULL;
ALTER TABLE public.parishes ADD COLUMN IF NOT EXISTS superior_shepherd_id UUID REFERENCES public.profiles(id) NULL;

-- =====================================================
-- 4. MISE À JOUR DES DONNÉES EXISTANTES
-- =====================================================

-- Votre compte devient Elder (administrateur principal)
UPDATE profiles 
SET 
    shepherd_grade = 'elder',
    validation_status = 'approved',
    validated_by = id
WHERE email = 'synnfallo@gmail.com' AND shepherd_grade IS NULL;

-- Les anciens admins deviennent Elder
UPDATE profiles 
SET shepherd_grade = 'elder' 
WHERE role = 'admin' AND shepherd_grade IS NULL;

-- =====================================================
-- 5. FONCTION DE CALCUL DU NIVEAU SPIRITUEL
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_spiritual_level(points INTEGER)
RETURNS TEXT AS $$
DECLARE
    sower_max INTEGER;
    harvester_min INTEGER;
    harvester_max INTEGER;
    friend_min INTEGER;
BEGIN
    -- Récupérer les seuils depuis settings
    SELECT (value->>0)::INTEGER INTO sower_max FROM settings WHERE key = 'spiritual_level_sower_max';
    SELECT (value->>0)::INTEGER INTO harvester_min FROM settings WHERE key = 'spiritual_level_harvester_min';
    SELECT (value->>0)::INTEGER INTO harvester_max FROM settings WHERE key = 'spiritual_level_harvester_max';
    SELECT (value->>0)::INTEGER INTO friend_min FROM settings WHERE key = 'spiritual_level_friend_min';
    
    -- Valeurs par défaut si settings n'existe pas
    sower_max := COALESCE(sower_max, 9999);
    harvester_min := COALESCE(harvester_min, 10000);
    harvester_max := COALESCE(harvester_max, 49999);
    friend_min := COALESCE(friend_min, 50000);
    
    IF points <= sower_max THEN
        RETURN 'sower';
    ELSIF points >= harvester_min AND points <= harvester_max THEN
        RETURN 'harvester';
    ELSIF points >= friend_min THEN
        RETURN 'friend';
    ELSE
        RETURN 'sower';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. NOUVELLES POLITIQUES RLS
-- =====================================================

-- 6.1 Validation des paroisses – Superior ou Elder uniquement
DROP POLICY IF EXISTS "Only superior or elder can validate parishes" ON public.parishes;

CREATE POLICY "Only superior or elder can validate parishes"
ON public.parishes
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND shepherd_grade IN ('superior', 'elder')
    AND validation_status = 'approved'
  )
);

-- 6.2 Gestion des offrandes – Leader, Superior ou Elder
DROP POLICY IF EXISTS "Financial data visible to shepherds" ON public.donations;

CREATE POLICY "Financial data visible to shepherds"
ON public.donations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND shepherd_grade IN ('leader', 'superior', 'elder')
    AND validation_status = 'approved'
  )
  OR donor_id = auth.uid()
);

-- =====================================================
-- 7. INDEX POUR PERFORMANCES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_profiles_shepherd_grade ON public.profiles(shepherd_grade);
CREATE INDEX IF NOT EXISTS idx_profiles_validation_status ON public.profiles(validation_status);
CREATE INDEX IF NOT EXISTS idx_profiles_superior_id ON public.profiles(superior_id);
CREATE INDEX IF NOT EXISTS idx_profiles_spiritual_points ON public.profiles(spiritual_points);
CREATE INDEX IF NOT EXISTS idx_parishes_leader_shepherd ON public.parishes(leader_shepherd_id);
CREATE INDEX IF NOT EXISTS idx_parishes_superior_shepherd ON public.parishes(superior_shepherd_id);

-- =====================================================
-- 8. FONCTIONS UTILITAIRES
-- =====================================================

-- Vérifier si un utilisateur est berger d’un certain grade
CREATE OR REPLACE FUNCTION is_shepherd_of_grade(user_id uuid, required_grade text)
RETURNS boolean AS $$
DECLARE
  user_grade text;
BEGIN
  SELECT shepherd_grade INTO user_grade FROM public.profiles WHERE id = user_id;
  RETURN user_grade = required_grade;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Obtenir le berger supérieur d’un utilisateur
CREATE OR REPLACE FUNCTION get_superior_shepherd(user_id uuid)
RETURNS uuid AS $$
DECLARE
  superior uuid;
BEGIN
  SELECT superior_id INTO superior FROM public.profiles WHERE id = user_id;
  RETURN superior;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mettre à jour le niveau spirituel d’un utilisateur
CREATE OR REPLACE FUNCTION update_spiritual_level(user_id uuid)
RETURNS void AS $$
DECLARE
  current_points INTEGER;
  new_level TEXT;
BEGIN
  SELECT spiritual_points INTO current_points FROM public.profiles WHERE id = user_id;
  new_level := calculate_spiritual_level(current_points);
  
  UPDATE public.profiles SET level = new_level WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. TRIGGER POUR METTRE À JOUR LE NIVEAU SPIRITUEL
-- =====================================================

CREATE OR REPLACE FUNCTION trigger_update_spiritual_level()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM update_spiritual_level(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_spiritual_level ON public.profiles;
CREATE TRIGGER trigger_update_spiritual_level
AFTER UPDATE OF spiritual_points ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION trigger_update_spiritual_level();

-- =====================================================
-- 10. VÉRIFICATION FINALE
-- =====================================================

-- Afficher les bergers configurés
SELECT id, email, shepherd_grade, validation_status, level, spiritual_points
FROM profiles
WHERE shepherd_grade IS NOT NULL;

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================