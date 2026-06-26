import { supabase } from '../lib/supabase';

export interface UserSettings {
  id: string;
  user_id: string;
  language: 'fr' | 'en' | 'sw';
  theme: 'light' | 'dark' | 'system';
  font_size: 'small' | 'medium' | 'large';
  confirm_before_publish: boolean;
  default_visibility: 'public' | 'subscribers' | 'parish';
  notifications_push_like: boolean;
  notifications_push_comment: boolean;
  notifications_push_follow: boolean;
  notifications_push_share: boolean;
  notifications_push_validation: boolean;
  notifications_email_summary: boolean;
  two_factor_enabled: boolean;
  auto_play_videos: boolean;
  show_birthday: boolean;
  created_at: string;
  updated_at: string;
}

class SettingsService {
  // Récupérer les paramètres de l'utilisateur (avec création auto si inexistants)
  async getSettings(): Promise<UserSettings | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Utiliser la fonction get_user_settings qui crée automatiquement les paramètres par défaut
      const { data, error } = await supabase
        .rpc('get_user_settings', { user_id: user.id });

      if (error) throw error;
      
      // La fonction retourne un setof, donc data est un tableau
      const settings = Array.isArray(data) && data.length > 0 ? data[0] : null;
      return settings;
    } catch (error) {
      console.error('Error fetching settings:', error);
      return null;
    }
  }

  // Mettre à jour les paramètres
  async updateSettings(updates: Partial<UserSettings>): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Nettoyer les champs non modifiables
      const { id, user_id, created_at, ...cleanUpdates } = updates as any;

      const { error } = await supabase
        .from('user_settings')
        .update({
          ...cleanUpdates,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating settings:', error);
      return false;
    }
  }

  // Réinitialiser les paramètres par défaut
  async resetSettings(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const defaultSettings = {
        language: 'fr',
        theme: 'light',
        font_size: 'medium',
        confirm_before_publish: true,
        default_visibility: 'public',
        notifications_push_like: true,
        notifications_push_comment: true,
        notifications_push_follow: true,
        notifications_push_share: true,
        notifications_push_validation: true,
        notifications_email_summary: false,
        two_factor_enabled: false,
        auto_play_videos: true,
        show_birthday: true,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('user_settings')
        .update(defaultSettings)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error resetting settings:', error);
      return false;
    }
  }

  // Mettre à jour la langue
  async setLanguage(language: 'fr' | 'en' | 'sw'): Promise<boolean> {
    return this.updateSettings({ language });
  }

  // Mettre à jour le thème
  async setTheme(theme: 'light' | 'dark' | 'system'): Promise<boolean> {
    return this.updateSettings({ theme });
  }

  // Mettre à jour la visibilité par défaut
  async setDefaultVisibility(visibility: 'public' | 'subscribers' | 'parish'): Promise<boolean> {
    return this.updateSettings({ default_visibility: visibility });
  }
}

export const settingsService = new SettingsService();