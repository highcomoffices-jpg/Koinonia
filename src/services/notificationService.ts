import { supabase } from '../lib/supabase';

export interface Notification {
  id: string;
  user_id: string;
  type: 'like' | 'comment' | 'share' | 'follow' | 'post_validated' | 'post_rejected' | 'post_disabled' | 'report_resolved' | 'mention' | 'system';
  title: string;
  content: string;
  target_id: string | null;
  target_type: 'post' | 'comment' | 'profile' | 'report' | null;
  action_url: string | null;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

class NotificationService {
  // Récupérer les notifications de l'utilisateur
  async getNotifications(options?: {
    limit?: number;
    offset?: number;
    onlyUnread?: boolean;
  }): Promise<Notification[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      let query = supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (options?.onlyUnread) {
        query = query.eq('is_read', false);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset !== undefined) {
        query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  // Compter les notifications non lues
  async getUnreadCount(): Promise<number> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { data, error } = await supabase
        .rpc('count_unread_notifications', { user_id: user.id });

      if (error) throw error;
      return data || 0;
    } catch (error) {
      console.error('Error counting unread notifications:', error);
      return 0;
    }
  }

  // Marquer une notification comme lue
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  // Marquer toutes les notifications comme lues
  async markAllAsRead(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .rpc('mark_all_notifications_read', { user_id: user.id });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  // Supprimer une notification
  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  // Supprimer toutes les notifications
  async deleteAllNotifications(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('user_notifications')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting all notifications:', error);
      return false;
    }
  }

  // Créer une notification (utile pour les tests)
  async createNotification(data: {
    user_id: string;
    type: Notification['type'];
    title: string;
    content: string;
    target_id?: string;
    target_type?: Notification['target_type'];
    action_url?: string;
  }): Promise<Notification | null> {
    try {
      const { data: notification, error } = await supabase
        .from('user_notifications')
        .insert({
          user_id: data.user_id,
          type: data.type,
          title: data.title,
          content: data.content,
          target_id: data.target_id || null,
          target_type: data.target_type || null,
          action_url: data.action_url || null,
          is_read: false,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }
}

export const notificationService = new NotificationService();