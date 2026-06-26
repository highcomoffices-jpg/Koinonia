-- =====================================================
-- MIGRATION : Ajout des colonnes manquantes à parishes
-- Date : 26/05/2026
-- =====================================================

-- 1. Ajouter les colonnes de contact et description
ALTER TABLE public.parishes 
ADD COLUMN IF NOT EXISTS phone text;

ALTER TABLE public.parishes 
ADD COLUMN IF NOT EXISTS email text;

ALTER TABLE public.parishes 
ADD COLUMN IF NOT EXISTS website text;

ALTER TABLE public.parishes 
ADD COLUMN IF NOT EXISTS description text;

-- 2. Mettre à jour la politique RLS pour permettre la proposition de paroisses
-- (les utilisateurs authentifiés peuvent proposer des paroisses)
DROP POLICY IF EXISTS "Users can propose parishes" ON public.parishes;

CREATE POLICY "Users can propose parishes"
ON public.parishes FOR INSERT
TO authenticated
WITH CHECK (validated = false);

-- 3. Les bergers (leader, superior, elder) peuvent modifier les paroisses
DROP POLICY IF EXISTS "Shepherds can update parishes" ON public.parishes;

CREATE POLICY "Shepherds can update parishes"
ON public.parishes FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND shepherd_grade IN ('leader', 'superior', 'elder')
    )
);

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================