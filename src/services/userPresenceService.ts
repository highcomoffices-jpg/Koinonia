import { supabase } from '../lib/supabase';

export type UserStatus = 'online' | 'offline' | 'away';

class UserPresenceService {
  private presenceChannel: any = null;
  private heartbeatInterval: any = null;

  // Mettre à jour la présence de l'utilisateur courant
  async updatePresence(status: UserStatus = 'online'): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('user_presence')
        .upsert({
          user_id: user.id,
          status: status,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  }

  // Récupérer le statut d'un utilisateur
  async getUserStatus(userId: string): Promise<UserStatus | null> {
    try {
      const { data, error } = await supabase
        .from('user_presence')
        .select('status, last_seen')
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !data) return null;

      // Si last_seen > 5 minutes, considérer comme offline
      const lastSeen = new Date(data.last_seen);
      const now = new Date();
      const diffMinutes = (now.getTime() - lastSeen.getTime()) / 60000;

      if (diffMinutes > 5) return 'offline';
      return data.status as UserStatus;
    } catch (error) {
      console.error('Error getting user status:', error);
      return null;
    }
  }

  // Récupérer les statuts de plusieurs utilisateurs
  async getUsersStatuses(userIds: string[]): Promise<Record<string, UserStatus>> {
    if (!userIds.length) return {};

    try {
      const { data, error } = await supabase
        .from('user_presence')
        .select('user_id, status, last_seen')
        .in('user_id', userIds);

      if (error || !data) return {};

      const result: Record<string, UserStatus> = {};
      const now = new Date();

      data.forEach(item => {
        const lastSeen = new Date(item.last_seen);
        const diffMinutes = (now.getTime() - lastSeen.getTime()) / 60000;
        result[item.user_id] = diffMinutes > 5 ? 'offline' : (item.status as UserStatus);
      });

      return result;
    } catch (error) {
      console.error('Error getting users statuses:', error);
      return {};
    }
  }

  // Démarrer le heartbeat (mise à jour toutes les 30 secondes)
  startHeartbeat(userId: string): void {
    // Nettoyer l'ancien heartbeat si existant
    this.stopHeartbeat();

    // Mise à jour initiale
    this.updatePresence('online');

    // Mise à jour périodique
    this.heartbeatInterval = setInterval(() => {
      this.updatePresence('online');
    }, 30000);

    // Ajouter un listener pour la fermeture de la page
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.updatePresence('offline');
      });
    }
  }

  // Arrêter le heartbeat
  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Mettre à jour le statut et arrêter le heartbeat (pour logout)
  async setOfflineAndStop(): Promise<void> {
    await this.updatePresence('offline');
    this.stopHeartbeat();
  }

  // Abonnement en temps réel aux changements de statut
  subscribeToPresenceChanges(
    userIds: string[],
    callback: (data: { user_id: string; status: UserStatus }) => void
  ): (() => void) {
    if (!userIds.length) return () => {};

    const channel = supabase
      .channel('user-presence-changes-' + Date.now())
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_presence',
          filter: `user_id=in.(${userIds.join(',')})`,
        },
        (payload) => {
          const lastSeen = new Date(payload.new.last_seen);
          const now = new Date();
          const diffMinutes = (now.getTime() - lastSeen.getTime()) / 60000;
          const status = diffMinutes > 5 ? 'offline' : payload.new.status;
          callback({ user_id: payload.new.user_id, status });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const userPresenceService = new UserPresenceService();