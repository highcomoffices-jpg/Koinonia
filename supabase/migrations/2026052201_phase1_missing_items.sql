-- =====================================================
-- MIGRATION PHASE 1 : ÉLÉMENTS MANQUANTS
-- Date : 22/05/2026
-- =====================================================

-- =====================================================
-- 1. AJOUT DE default_visibility DANS profiles
-- =====================================================

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS default_visibility text DEFAULT 'public';

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_default_visibility_check'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_default_visibility_check 
        CHECK (default_visibility IN ('public', 'subscribers', 'parish'));
    END IF;
END $$;

-- =====================================================
-- 2. TABLE user_interests
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_interests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    interest text NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, interest)
);

CREATE INDEX IF NOT EXISTS idx_user_interests_user_id ON public.user_interests(user_id);

-- =====================================================
-- 3. TABLE reports (modération)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id uuid NOT NULL,
    content_type text NOT NULL CHECK (content_type IN ('post', 'comment', 'message', 'profile')),
    reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason text NOT NULL,
    details text,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    resolved_by uuid REFERENCES public.profiles(id),
    resolved_at timestamptz,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_content_id ON public.reports(content_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON public.reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

-- =====================================================
-- 4. FONCTION update_updated_at_column ET TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 5. RLS POLITIQUES POUR leader (remplace parish_admin)
-- =====================================================

-- 5.1 leader peut voir les membres de sa paroisse
DROP POLICY IF EXISTS "leader can view members of his parish" ON public.profiles;
CREATE POLICY "leader can view members of his parish"
ON public.profiles FOR SELECT
TO authenticated
USING (
    parish_id = (SELECT parish_id FROM public.profiles WHERE id = auth.uid())
    AND EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND shepherd_grade = 'leader'
    )
);

-- 5.2 leader peut modifier les membres de sa paroisse
DROP POLICY IF EXISTS "leader can update members of his parish" ON public.profiles;
CREATE POLICY "leader can update members of his parish"
ON public.profiles FOR UPDATE
TO authenticated
USING (
    parish_id = (SELECT parish_id FROM public.profiles WHERE id = auth.uid())
    AND EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND shepherd_grade = 'leader'
    )
);

-- =====================================================
-- 6. RLS POLITIQUES POUR superior
-- =====================================================

-- 6.1 superior peut voir les membres de ses paroisses
DROP POLICY IF EXISTS "superior can view members of his region" ON public.profiles;
CREATE POLICY "superior can view members of his region"
ON public.profiles FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.parishes p
        WHERE p.id = profiles.parish_id
        AND p.superior_shepherd_id = auth.uid()
    )
);

-- 6.2 superior peut modifier les membres de ses paroisses
DROP POLICY IF EXISTS "superior can update members of his region" ON public.profiles;
CREATE POLICY "superior can update members of his region"
ON public.profiles FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.parishes p
        WHERE p.id = profiles.parish_id
        AND p.superior_shepherd_id = auth.uid()
    )
);

-- =====================================================
-- 7. RLS POLITIQUES POUR elder (ancien)
-- =====================================================

-- 7.1 elder peut voir tous les profils
DROP POLICY IF EXISTS "elder can view all profiles" ON public.profiles;
CREATE POLICY "elder can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND shepherd_grade = 'elder'
    )
);

-- 7.2 elder peut modifier tous les profils
DROP POLICY IF EXISTS "elder can update all profiles" ON public.profiles;
CREATE POLICY "elder can update all profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND shepherd_grade = 'elder'
    )
);

-- =====================================================
-- 8. RLS POLITIQUES POUR leader SUR parishes
-- =====================================================

DROP POLICY IF EXISTS "leader can manage his parish" ON public.parishes;
CREATE POLICY "leader can manage his parish"
ON public.parishes FOR ALL
TO authenticated
USING (
    id = (SELECT parish_id FROM public.profiles WHERE id = auth.uid())
    AND EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND shepherd_grade = 'leader'
    )
);

-- =====================================================
-- 9. RLS SUR LES NOUVELLES TABLES
-- =====================================================

ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 9.1 RLS pour user_interests
CREATE POLICY "Users can view their own interests" ON public.user_interests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interests" ON public.user_interests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interests" ON public.user_interests
    FOR DELETE USING (auth.uid() = user_id);

-- 9.2 RLS pour reports
CREATE POLICY "Users can create reports" ON public.reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Shepherds can view reports of their jurisdiction" ON public.reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid() 
            AND p.shepherd_grade IN ('leader', 'superior', 'elder')
        )
    );

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================