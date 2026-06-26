-- =====================================================
-- MIGRATION : Amélioration de la table live_celebrations
-- Date : 29/05/2026
-- =====================================================

-- 1. Ajouter les colonnes pour la programmation des lives
ALTER TABLE public.live_celebrations 
ADD COLUMN IF NOT EXISTS scheduled_start timestamptz;

ALTER TABLE public.live_celebrations 
ADD COLUMN IF NOT EXISTS scheduled_end timestamptz;

-- 2. Ajouter le statut du live
ALTER TABLE public.live_celebrations 
ADD COLUMN IF NOT EXISTS live_status text DEFAULT 'scheduled'
CHECK (live_status IN ('scheduled', 'live', 'ended', 'cancelled'));

-- 3. Ajouter les paroisses participantes (si plusieurs paroisses)
ALTER TABLE public.live_celebrations 
ADD COLUMN IF NOT EXISTS parish_ids uuid[] DEFAULT '{}';

-- 4. Ajouter la visibilité
ALTER TABLE public.live_celebrations 
ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'public'
CHECK (visibility IN ('public', 'subscribers', 'parish'));

-- 5. Ajouter la bannière/image du live
ALTER TABLE public.live_celebrations 
ADD COLUMN IF NOT EXISTS image_url text;

-- 6. Mettre à jour la contrainte de validation pour les lives programmés
-- Un live peut être créé avec scheduled_start dans le futur
-- Il n'est actif que si is_active = true

-- 7. Index pour performances
CREATE INDEX IF NOT EXISTS idx_live_celebrations_live_status ON public.live_celebrations(live_status);
CREATE INDEX IF NOT EXISTS idx_live_celebrations_scheduled_start ON public.live_celebrations(scheduled_start);
CREATE INDEX IF NOT EXISTS idx_live_celebrations_organizer_id ON public.live_celebrations(organizer_id);
CREATE INDEX IF NOT EXISTS idx_live_celebrations_is_active ON public.live_celebrations(is_active);

-- 8. Mettre à jour les politiques RLS
-- Les bergers peuvent créer/modifier les lives de leur paroisse
DROP POLICY IF EXISTS "Shepherds can manage live celebrations" ON public.live_celebrations;

CREATE POLICY "Shepherds can manage live celebrations"
ON public.live_celebrations FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND shepherd_grade IN ('leader', 'superior', 'elder')
    )
);

-- Tout le monde peut voir les lives actifs
DROP POLICY IF EXISTS "Anyone can view live celebrations" ON public.live_celebrations;

CREATE POLICY "Anyone can view live celebrations"
ON public.live_celebrations FOR SELECT
TO authenticated
USING (
    is_active = true
    AND (
        -- Live programmé ou en direct (non terminé)
        live_status IN ('scheduled', 'live')
        -- Ou terminé mais public
        OR (live_status = 'ended' AND visibility = 'public')
    )
);

-- 9. Fonction pour démarrer un live programmé
CREATE OR REPLACE FUNCTION public.start_live_celebration(live_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE public.live_celebrations
    SET 
        live_status = 'live',
        started_at = now(),
        updated_at = now()
    WHERE id = live_id
    AND live_status = 'scheduled'
    AND (scheduled_start IS NULL OR scheduled_start <= now());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Fonction pour terminer un live
CREATE OR REPLACE FUNCTION public.end_live_celebration(live_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE public.live_celebrations
    SET 
        live_status = 'ended',
        ended_at = now(),
        updated_at = now()
    WHERE id = live_id
    AND live_status = 'live';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Vue pour les lives en direct
CREATE OR REPLACE VIEW public.live_now AS
SELECT *
FROM public.live_celebrations
WHERE live_status = 'live'
AND is_active = true
ORDER BY started_at DESC;

-- 12. Vue pour les lives à venir
CREATE OR REPLACE VIEW public.upcoming_lives AS
SELECT *
FROM public.live_celebrations
WHERE live_status = 'scheduled'
AND is_active = true
AND (scheduled_start IS NULL OR scheduled_start > now())
ORDER BY scheduled_start ASC;

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================