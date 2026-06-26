-- =====================================================
-- MIGRATION : Table des mots interdits
-- Date : 25/05/2026
-- =====================================================

-- 1. Table forbidden_words
CREATE TABLE IF NOT EXISTS public.forbidden_words (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    word text NOT NULL UNIQUE,
    category text NOT NULL CHECK (category IN ('insult', 'spam', 'hate', 'violence', 'discrimination', 'other')),
    severity integer DEFAULT 1 CHECK (severity >= 1 AND severity <= 5),
    created_by uuid REFERENCES public.profiles(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    is_active boolean DEFAULT true
);

-- 2. Index
CREATE INDEX IF NOT EXISTS idx_forbidden_words_word ON public.forbidden_words(word);
CREATE INDEX IF NOT EXISTS idx_forbidden_words_category ON public.forbidden_words(category);
CREATE INDEX IF NOT EXISTS idx_forbidden_words_is_active ON public.forbidden_words(is_active);

-- 3. Trigger updated_at
CREATE TRIGGER update_forbidden_words_updated_at
    BEFORE UPDATE ON public.forbidden_words
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 4. RLS
ALTER TABLE public.forbidden_words ENABLE ROW LEVEL SECURITY;

-- Les admins peuvent tout faire
CREATE POLICY "Admins can manage forbidden words"
ON public.forbidden_words FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Tout le monde peut lire les mots actifs (pour la modération)
CREATE POLICY "Anyone can view active forbidden words"
ON public.forbidden_words FOR SELECT
TO authenticated
USING (is_active = true);

-- 5. Insertion de mots initiaux (exemples)
INSERT INTO public.forbidden_words (word, category, severity, is_active) VALUES
    ('insulte', 'insult', 3, true),
    ('spam', 'spam', 1, true),
    ('haine', 'hate', 5, true),
    ('violence', 'violence', 5, true),
    ('discrimination', 'discrimination', 5, true)
ON CONFLICT (word) DO NOTHING;

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================