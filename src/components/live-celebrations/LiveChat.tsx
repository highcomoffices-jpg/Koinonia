import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Heart, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';

interface LiveChatProps {
  liveId: string;
}

interface ChatMessage {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  message: string;
  created_at: string;
}

const MESSAGES_PER_PAGE = 30;

export const LiveChat: React.FC<LiveChatProps> = ({ liveId }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [newMessagesCount, setNewMessagesCount] = useState(0);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Vérifier si l'utilisateur est proche du bas pour auto-scroll
  const handleScroll = useCallback(() => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setAutoScroll(isNearBottom);
      if (isNearBottom && newMessagesCount > 0) {
        setNewMessagesCount(0);
      }
    }
  }, [newMessagesCount]);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Auto-scroll en bas
  useEffect(() => {
    if (autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else if (messages.length > 0 && !autoScroll) {
      setNewMessagesCount(prev => prev + 1);
    }
  }, [messages, autoScroll]);

  // Charger les messages initiaux
  useEffect(() => {
    const loadInitialMessages = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('live_chat_messages')
        .select(`
          id,
          user_id,
          message,
          created_at,
          user:profiles!user_id(
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('live_id', liveId)
        .order('created_at', { ascending: false })
        .limit(MESSAGES_PER_PAGE);

      if (!error && data) {
        const formattedMessages: ChatMessage[] = data.reverse().map((msg: any) => ({
          id: msg.id,
          user_id: msg.user_id,
          user_name: `${msg.user?.first_name || ''} ${msg.user?.last_name || ''}`.trim() || 'Anonyme',
          user_avatar: msg.user?.avatar_url || null,
          message: msg.message,
          created_at: msg.created_at,
        }));
        setMessages(formattedMessages);
        setHasMore(data.length === MESSAGES_PER_PAGE);
      }
      setIsLoading(false);
    };

    loadInitialMessages();

    // Subscription Realtime pour les nouveaux messages
    const channel = supabase
      .channel(`chat-${liveId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'live_chat_messages',
          filter: `live_id=eq.${liveId}`,
        },
        async (payload) => {
          const { user_id, message, created_at } = payload.new;
          const { data: profile } = await supabase
            .from('profiles')
            .select('first_name, last_name, avatar_url')
            .eq('id', user_id)
            .single();
          
          const newMsg: ChatMessage = {
            id: payload.new.id,
            user_id,
            user_name: profile ? `${profile.first_name} ${profile.last_name}`.trim() : 'Anonyme',
            user_avatar: profile?.avatar_url || null,
            message,
            created_at,
          };
          setMessages(prev => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [liveId]);

  // Charger plus de messages (scroll infini vers le haut)
  const loadMoreMessages = async () => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const oldestMessage = messages[0];
    
    if (!oldestMessage) {
      setIsLoadingMore(false);
      return;
    }

    const { data, error } = await supabase
      .from('live_chat_messages')
      .select(`
        id,
        user_id,
        message,
        created_at,
        user:profiles!user_id(
          first_name,
          last_name,
          avatar_url
        )
      `)
      .eq('live_id', liveId)
      .lt('created_at', oldestMessage.created_at)
      .order('created_at', { ascending: false })
      .limit(MESSAGES_PER_PAGE);

    if (!error && data && data.length > 0) {
      const olderMessages: ChatMessage[] = data.reverse().map((msg: any) => ({
        id: msg.id,
        user_id: msg.user_id,
        user_name: `${msg.user?.first_name || ''} ${msg.user?.last_name || ''}`.trim() || 'Anonyme',
        user_avatar: msg.user?.avatar_url || null,
        message: msg.message,
        created_at: msg.created_at,
      }));
      
      // Sauvegarder la position de scroll avant ajout
      const container = chatContainerRef.current;
      const scrollHeightBefore = container?.scrollHeight || 0;
      
      setMessages(prev => [...olderMessages, ...prev]);
      setHasMore(data.length === MESSAGES_PER_PAGE);
      
      // Restaurer la position de scroll
      setTimeout(() => {
        if (container) {
          const newScrollHeight = container.scrollHeight;
          container.scrollTop = newScrollHeight - scrollHeightBefore;
        }
      }, 50);
    } else {
      setHasMore(false);
    }
    setIsLoadingMore(false);
  };

  // Détecter quand l'utilisateur scroll en haut pour charger plus
  const handleScrollTop = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollTop === 0 && !isLoadingMore && hasMore) {
      loadMoreMessages();
    }
  }, [isLoadingMore, hasMore]);

  // Indicateur de frappe
  const handleTyping = () => {
    if (!user) return;
    
    // Broadcast de l'événement "typing"
    const channel = supabase.channel(`chat-typing-${liveId}`);
    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: user.id, user_name: `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() }
    });
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      channel.send({
        type: 'broadcast',
        event: 'stopped_typing',
        payload: { user_id: user.id }
      });
    }, 1000);
  };

  // Subscription pour les indicateurs de frappe
  useEffect(() => {
    const channel = supabase.channel(`chat-typing-${liveId}`);
    
    channel.on('broadcast', { event: 'typing' }, ({ payload }) => {
      setTypingUsers(prev => new Set(prev).add(payload.user_name));
      setTimeout(() => {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(payload.user_name);
          return newSet;
        });
      }, 3000);
    });
    
    channel.subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [liveId]);

  const handleSendMessage = async () => {
    if (!user || !newMessage.trim()) return;

    setIsSending(true);
    try {
      const { error } = await supabase.from('live_chat_messages').insert({
        live_id: liveId,
        user_id: user.id,
        message: newMessage.trim(),
      });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <div className="bg-gray-900 rounded-xl h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-gray-800">
        <h3 className="text-white font-semibold">Chat en direct</h3>
        <p className="text-xs text-gray-400">{messages.length} messages</p>
      </div>

      {/* Messages */}
      <div 
        ref={chatContainerRef} 
        onScroll={handleScrollTop}
        className="flex-1 overflow-y-auto p-3 space-y-3"
      >
        {isLoadingMore && (
          <div className="flex justify-center py-2">
            <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
          </div>
        )}
        
        {!hasMore && messages.length > 0 && (
          <div className="text-center text-xs text-gray-500 py-2">
            Début des messages
          </div>
        )}
        
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Heart className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Soyez le premier à envoyer un message !</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-spiritual-400 flex-shrink-0 overflow-hidden">
                {msg.user_avatar ? (
                  <img src={msg.user_avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                    {msg.user_name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white text-sm">{msg.user_name}</span>
                  <span className="text-xs text-gray-500">{formatTime(msg.created_at)}</span>
                </div>
                <p className="text-gray-300 text-sm break-words whitespace-pre-wrap">
                  {msg.message}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
        
        {/* Indicateur de frappe */}
        {typingUsers.size > 0 && (
          <div className="text-xs text-gray-500 italic">
            {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'écrit...' : 'écrivent...'}
          </div>
        )}
        
        {/* Bouton pour revenir en bas */}
        {newMessagesCount > 0 && (
          <button
            onClick={() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
              setNewMessagesCount(0);
              setAutoScroll(true);
            }}
            className="fixed bottom-24 right-4 lg:right-auto lg:left-1/2 lg:-translate-x-1/2 bg-primary-600 text-white text-xs px-3 py-1 rounded-full shadow-lg hover:bg-primary-700 transition-colors z-40"
          >
            {newMessagesCount} nouveau{newMessagesCount > 1 ? 'x' : ''} message{newMessagesCount > 1 ? 's' : ''} ↓
          </button>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-800">
        <div className="flex gap-2">
          <textarea
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyDown={handleKeyPress}
            placeholder={user ? "Écrivez un message..." : "Connectez-vous pour participer"}
            rows={1}
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={!user}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!user || !newMessage.trim() || isSending}
            size="sm"
            variant="primary"
            icon={Send}
          >
            Envoyer
          </Button>
        </div>
        {!user && (
          <p className="text-xs text-gray-500 mt-2 text-center">
            Connectez-vous pour participer au chat
          </p>
        )}
      </div>
    </div>
  );
};