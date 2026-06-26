-- =====================================================
-- MIGRATION : Table des mots signalés (auto-apprentissage)
-- Date : 25/05/2026
-- =====================================================

-- 1. Table reported_words
CREATE TABLE IF NOT EXISTS public.reported_words (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id uuid NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
    word text NOT NULL,
    context text,
    occurrence_count integer DEFAULT 1,
    is_approved boolean DEFAULT false,
    approved_by uuid REFERENCES public.profiles(id),
    approved_at timestamptz,
    created_at timestamptz DEFAULT now(),
    UNIQUE(report_id, word)
);

-- 2. Index
CREATE INDEX IF NOT EXISTS idx_reported_words_word ON public.reported_words(word);
CREATE INDEX IF NOT EXISTS idx_reported_words_is_approved ON public.reported_words(is_approved);
CREATE INDEX IF NOT EXISTS idx_reported_words_report_id ON public.reported_words(report_id);

-- 3. RLS
ALTER TABLE public.reported_words ENABLE ROW LEVEL SECURITY;

-- Les admins peuvent tout faire
CREATE POLICY "Admins can manage reported words"
ON public.reported_words FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Les utilisateurs peuvent voir les mots qu'ils ont signalés
CREATE POLICY "Users can view their reported words"
ON public.reported_words FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.reports
        WHERE reports.id = reported_words.report_id
        AND reports.reporter_id = auth.uid()
    )
);

-- 4. Fonction pour ajouter un mot signalé automatiquement
CREATE OR REPLACE FUNCTION public.add_reported_word(
    p_report_id uuid,
    p_word text,
    p_context text
)
RETURNS void AS $$
BEGIN
    INSERT INTO public.reported_words (report_id, word, context, occurrence_count)
    VALUES (p_report_id, lower(trim(p_word)), p_context, 1)
    ON CONFLICT (report_id, word) DO UPDATE
    SET occurrence_count = reported_words.occurrence_count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================