-- =====================================================
-- MIGRATION : Statut en ligne (user presence)
-- Date : 21/05/2026
-- =====================================================

-- Table user_presence
CREATE TABLE IF NOT EXISTS public.user_presence (
    user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    status text DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'away')),
    last_seen timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_user_presence_status ON public.user_presence(status);
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON public.user_presence(last_seen);

-- Fonction pour mettre à jour le statut
CREATE OR REPLACE FUNCTION update_user_status(user_id uuid, new_status text)
RETURNS void AS $$
BEGIN
    INSERT INTO user_presence (user_id, status, last_seen, updated_at)
    VALUES (user_id, new_status, now(), now())
    ON CONFLICT (user_id) DO UPDATE
    SET status = new_status, last_seen = now(), updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour mettre à jour automatiquement à chaque action utilisateur
CREATE OR REPLACE FUNCTION trigger_update_user_activity()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM update_user_status(NEW.user_id, 'online');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- RLS
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view presence of others" ON public.user_presence
    FOR SELECT USING (true);

CREATE POLICY "Users can update own presence" ON public.user_presence
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own presence" ON public.user_presence
    FOR INSERT WITH CHECK (auth.uid() = user_id);