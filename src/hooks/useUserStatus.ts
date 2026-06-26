import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { chatService } from '../services/chatService';

interface UserStatus {
  status: 'online' | 'offline' | 'away';
  last_seen: string;
}

export const useUserStatus = (userIds: string[]) => {
  const [statuses, setStatuses] = useState<Map<string, UserStatus>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const hasUpdatedOwnStatus = useRef(false);

  const fetchStatuses = useCallback(async () => {
    if (!userIds.length) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const statusMap = await chatService.getUsersStatus(userIds);
      setStatuses(statusMap);
      
      const online = new Set<string>();
      statusMap.forEach((status, id) => {
        if (status.status === 'online') {
          online.add(id);
        }
      });
      setOnlineUsers(online);
    } catch (error) {
      console.error('Error fetching user statuses:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userIds]);

  // Mettre à jour son propre statut en ligne (UNE SEULE FOIS)
  useEffect(() => {
    if (hasUpdatedOwnStatus.current) return;
    hasUpdatedOwnStatus.current = true;

    const updateOwnStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await chatService.updateUserStatus('online');
        
        // Mettre à jour le statut à "offline" quand la page se ferme
        const handleBeforeUnload = () => {
          chatService.updateUserStatus('offline');
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        
        return () => {
          window.removeEventListener('beforeunload', handleBeforeUnload);
          chatService.updateUserStatus('offline');
        };
      }
    };

    updateOwnStatus();
  }, []);

  // S'abonner aux changements de statut en temps réel
  useEffect(() => {
    if (!userIds.length) return;

    const channel = supabase
      .channel('user-status-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_presence',
        },
        (payload) => {
          const userId = payload.new.user_id;
          if (userIds.includes(userId)) {
            const newStatus: UserStatus = {
              status: payload.new.status,
              last_seen: payload.new.last_seen,
            };
            setStatuses(prev => new Map(prev).set(userId, newStatus));
            
            setOnlineUsers(prev => {
              const newSet = new Set(prev);
              if (payload.new.status === 'online') {
                newSet.add(userId);
              } else {
                newSet.delete(userId);
              }
              return newSet;
            });
          }
        }
      )
      .subscribe();

    fetchStatuses();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userIds, fetchStatuses]);

  const getUserStatus = useCallback((userId: string): UserStatus | null => {
    return statuses.get(userId) || null;
  }, [statuses]);

  const isUserOnline = useCallback((userId: string): boolean => {
    return onlineUsers.has(userId);
  }, [onlineUsers]);

  return {
    statuses,
    onlineUsers,
    isLoading,
    getUserStatus,
    isUserOnline,
    refetch: fetchStatuses,
  };
};