-- =====================================================
-- MIGRATION : Enrichissement de la table reports
-- Date : 25/05/2026
-- =====================================================

-- 1. Ajouter les colonnes manquantes à reports
ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS reported_word text;

ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS context text;

ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS auto_extracted boolean DEFAULT false;

-- 2. Mettre à jour la contrainte CHECK de status
DO $$ 
BEGIN
    ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_status_check;
    ALTER TABLE public.reports 
    ADD CONSTRAINT reports_status_check 
    CHECK (status IN ('pending', 'approved', 'rejected', 'word_added'));
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Contrainte reports_status_check créée différemment.';
END $$;

-- 3. Index pour recherche par mot signalé
CREATE INDEX IF NOT EXISTS idx_reports_reported_word ON public.reports(reported_word);
CREATE INDEX IF NOT EXISTS idx_reports_auto_extracted ON public.reports(auto_extracted);

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================