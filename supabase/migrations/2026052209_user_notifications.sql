-- =====================================================
-- MIGRATION : Table des notifications utilisateur
-- Date : 28/05/2026
-- =====================================================

-- 1. Table user_notifications
CREATE TABLE IF NOT EXISTS public.user_notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN (
        'like', 'comment', 'share', 'follow', 
        'post_validated', 'post_rejected', 'post_disabled',
        'report_resolved', 'mention', 'system'
    )),
    title text NOT NULL,
    content text NOT NULL,
    target_id uuid,
    target_type text CHECK (target_type IN ('post', 'comment', 'profile', 'report')),
    action_url text,
    is_read boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Index pour performances
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_is_read ON public.user_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON public.user_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_unread ON public.user_notifications(user_id, is_read);

-- 3. Trigger updated_at
CREATE TRIGGER update_user_notifications_updated_at
    BEFORE UPDATE ON public.user_notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 4. RLS
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leurs propres notifications
CREATE POLICY "Users can view their own notifications"
ON public.user_notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Les utilisateurs peuvent mettre à jour leurs propres notifications (marquer comme lu)
CREATE POLICY "Users can update their own notifications"
ON public.user_notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leurs propres notifications
CREATE POLICY "Users can delete their own notifications"
ON public.user_notifications FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Seul le système peut insérer des notifications (via Edge Function ou trigger)
CREATE POLICY "System can insert notifications"
ON public.user_notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- 5. Fonction pour compter les notifications non lues
CREATE OR REPLACE FUNCTION public.count_unread_notifications(user_id uuid)
RETURNS integer AS $$
DECLARE
    unread_count integer;
BEGIN
    SELECT COUNT(*) INTO unread_count
    FROM public.user_notifications
    WHERE user_notifications.user_id = user_id
    AND is_read = false;
    
    RETURN unread_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Fonction pour marquer toutes comme lues
CREATE OR REPLACE FUNCTION public.mark_all_notifications_read(user_id uuid)
RETURNS void AS $$
BEGIN
    UPDATE public.user_notifications
    SET is_read = true, updated_at = now()
    WHERE user_notifications.user_id = user_id
    AND is_read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================