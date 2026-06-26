-- =====================================================
-- MIGRATION : Audit logs pour les actions administratives
-- Date : 30/05/2026
-- =====================================================

-- 1. Table admin_audit_logs
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_email text NOT NULL,
    user_role text NOT NULL,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid,
    details jsonb,
    ip_address text,
    user_agent text,
    created_at timestamptz DEFAULT now()
);

-- 2. Index pour performances
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_user_id ON public.admin_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON public.admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_entity ON public.admin_audit_logs(entity_type, entity_id);

-- 3. RLS
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Seul le super_admin peut voir les logs
CREATE POLICY "Only super_admin can view audit logs"
ON public.admin_audit_logs FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'super_admin'
    )
);

-- Seul le super_admin peut insérer (le système aussi)
CREATE POLICY "Only super_admin can insert audit logs"
ON public.admin_audit_logs FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'super_admin'
    )
);

-- 4. Fonction pour logger automatiquement les actions
CREATE OR REPLACE FUNCTION public.log_admin_action(
    p_user_id uuid,
    p_user_email text,
    p_user_role text,
    p_action text,
    p_entity_type text,
    p_entity_id uuid DEFAULT NULL,
    p_details jsonb DEFAULT NULL,
    p_ip_address text DEFAULT NULL,
    p_user_agent text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
    log_id uuid;
BEGIN
    INSERT INTO public.admin_audit_logs (
        user_id,
        user_email,
        user_role,
        action,
        entity_type,
        entity_id,
        details,
        ip_address,
        user_agent
    ) VALUES (
        p_user_id,
        p_user_email,
        p_user_role,
        p_action,
        p_entity_type,
        p_entity_id,
        p_details,
        p_ip_address,
        p_user_agent
    )
    RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Vue pour les statistiques d'audit
CREATE OR REPLACE VIEW public.audit_stats AS
SELECT
    DATE(created_at) as action_date,
    action,
    COUNT(*) as action_count,
    COUNT(DISTINCT user_id) as unique_users
FROM public.admin_audit_logs
GROUP BY DATE(created_at), action
ORDER BY action_date DESC;

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================