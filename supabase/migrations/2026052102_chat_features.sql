-- =====================================================
-- MIGRATION : Fonctionnalités avancées du chat
-- Date : 21/05/2026
-- Exécuter dans l'éditeur SQL Supabase
-- =====================================================

-- =====================================================
-- 1. TABLE message_reads (suivi des lectures)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.message_reads (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    read_at timestamp with time zone DEFAULT now(),
    UNIQUE(message_id, user_id)
);

-- =====================================================
-- 2. TABLE message_reactions (réactions emoji)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.message_reactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    emoji text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(message_id, user_id, emoji)
);

-- =====================================================
-- 3. TABLE user_presence (statut en ligne)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_presence (
    user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    status text DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'away')),
    last_seen timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- =====================================================
-- 4. FONCTIONS SQL
-- =====================================================

-- Marquer un message comme lu
CREATE OR REPLACE FUNCTION mark_message_as_read(message_id uuid, user_id uuid)
RETURNS void AS $$
BEGIN
    INSERT INTO message_reads (message_id, user_id, read_at)
    VALUES (message_id, user_id, now())
    ON CONFLICT (message_id, user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Compter les messages non lus dans une conversation
CREATE OR REPLACE FUNCTION get_unread_count(conversation_id uuid, user_id uuid)
RETURNS integer AS $$
DECLARE
    unread_count integer;
BEGIN
    SELECT COUNT(*) INTO unread_count
    FROM messages m
    WHERE m.conversation_id = conversation_id
    AND m.sender_id != user_id
    AND NOT EXISTS (
        SELECT 1 FROM message_reads mr
        WHERE mr.message_id = m.id AND mr.user_id = user_id
    );
    RETURN unread_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ajouter une réaction à un message
CREATE OR REPLACE FUNCTION add_message_reaction(message_id uuid, user_id uuid, emoji_text text)
RETURNS void AS $$
BEGIN
    INSERT INTO message_reactions (message_id, user_id, emoji)
    VALUES (message_id, user_id, emoji_text)
    ON CONFLICT (message_id, user_id, emoji_text) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer une réaction
CREATE OR REPLACE FUNCTION remove_message_reaction(message_id uuid, user_id uuid, emoji_text text)
RETURNS void AS $$
BEGIN
    DELETE FROM message_reactions
    WHERE message_id = message_id
    AND user_id = user_id
    AND emoji = emoji_text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Récupérer les réactions d'un message
CREATE OR REPLACE FUNCTION get_message_reactions(message_id uuid)
RETURNS TABLE(emoji text, count bigint, users jsonb) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mr.emoji,
        COUNT(*) as count,
        jsonb_agg(jsonb_build_object('id', p.id, 'name', p.first_name || ' ' || p.last_name)) as users
    FROM message_reactions mr
    JOIN profiles p ON p.id = mr.user_id
    WHERE mr.message_id = message_id
    GROUP BY mr.emoji;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mettre à jour le statut en ligne
CREATE OR REPLACE FUNCTION update_user_status(user_id uuid, new_status text)
RETURNS void AS $$
BEGIN
    INSERT INTO user_presence (user_id, status, last_seen, updated_at)
    VALUES (user_id, new_status, now(), now())
    ON CONFLICT (user_id) DO UPDATE
    SET status = new_status, last_seen = now(), updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. INDEX POUR PERFORMANCES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_message_reads_message_id ON public.message_reads(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reads_user_id ON public.message_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON public.message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON public.message_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_status ON public.user_presence(status);
CREATE INDEX IF NOT EXISTS idx_user_presence_last_seen ON public.user_presence(last_seen);

-- =====================================================
-- FIN DE LA MIGRATION
-- =====================================================