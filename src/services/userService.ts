import { createService } from './baseService';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type UpdateProfileDto = Database['public']['Tables']['profiles']['Update'];

export interface EnrichedProfile extends Profile {
  country?: Database['public']['Tables']['countries']['Row'];
  city?: Database['public']['Tables']['cities']['Row'];
  confession?: Database['public']['Tables']['confessions']['Row'];
  parish?: Database['public']['Tables']['parishes']['Row'];
}

export class UserService {
  private profilesService = createService('profiles');
  private bucketName = 'user-avatars';

  // ============================================
  // PROFILE OPERATIONS
  // ============================================

  // Get user profile by ID
  async getProfile(userId: string): Promise<Profile | null> {
    try {
      return await this.profilesService.findById(userId);
    } catch (error) {
      console.error(`Error fetching profile for user ${userId}:`, error);
      throw error;
    }
  }

  // Get current user's profile
  async getCurrentUserProfile(): Promise<Profile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      return await this.getProfile(user.id);
    } catch (error) {
      console.error('Error fetching current user profile:', error);
      throw error;
    }
  }

  // Update user profile
  async updateProfile(userId: string, data: UpdateProfileDto): Promise<Profile> {
    try {
      // Add updated_at timestamp
      const updateData = {
        ...data,
        updated_at: new Date().toISOString(),
      };

      return await this.profilesService.update(userId, updateData);
    } catch (error) {
      console.error(`Error updating profile for user ${userId}:`, error);
      throw error;
    }
  }

  // Update current user's profile
  async updateCurrentUserProfile(data: UpdateProfileDto): Promise<Profile> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      return await this.updateProfile(user.id, data);
    } catch (error) {
      console.error('Error updating current user profile:', error);
      throw error;
    }
  }

  // Get all users (with pagination and filters)
  async getUsers(options?: {
    limit?: number;
    offset?: number;
    filters?: {
      role?: string;
      level?: string;
      country_id?: string;
      city_id?: string;
      confession_id?: string;
      parish_id?: string;
      profile_complete?: boolean;
    };
    search?: string;
  }): Promise<Profile[]> {
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (options?.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }

      // Apply search
      if (options?.search) {
        query = query.or(`first_name.ilike.%${options.search}%,last_name.ilike.%${options.search}%,email.ilike.%${options.search}%`);
      }

      // Apply pagination
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset !== undefined) {
        const limit = options.limit || 50;
        query = query.range(options.offset, options.offset + limit - 1);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  // Search users by name or email
  async searchUsers(query: string, limit = 10): Promise<Profile[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(limit)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }

  // Get users by role
  async getUsersByRole(role: string): Promise<Profile[]> {
    try {
      return await this.profilesService.findAll({
        filters: { role },
        order: { column: 'created_at', ascending: false },
      });
    } catch (error) {
      console.error(`Error fetching users with role ${role}:`, error);
      throw error;
    }
  }

  // Get users by parish
  async getUsersByParish(parishId: string): Promise<Profile[]> {
    try {
      return await this.profilesService.findAll({
        filters: { parish_id: parishId },
        order: { column: 'created_at', ascending: false },
      });
    } catch (error) {
      console.error(`Error fetching users in parish ${parishId}:`, error);
      throw error;
    }
  }

  // Get users by confession
  async getUsersByConfession(confessionId: string): Promise<Profile[]> {
    try {
      return await this.profilesService.findAll({
        filters: { confession_id: confessionId },
        order: { column: 'created_at', ascending: false },
      });
    } catch (error) {
      console.error(`Error fetching users with confession ${confessionId}:`, error);
      throw error;
    }
  }

  // Count users
  async countUsers(filters?: any): Promise<number> {
    try {
      return await this.profilesService.count(filters);
    } catch (error) {
      console.error('Error counting users:', error);
      throw error;
    }
  }

  // Get user statistics
  async getUserStats(): Promise<{
    total: number;
    byRole: Record<string, number>;
    byLevel: Record<string, number>;
    withCompleteProfile: number;
    recentUsers: number;
  }> {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) throw error;

      const total = profiles?.length || 0;
      const byRole: Record<string, number> = {};
      const byLevel: Record<string, number> = {};
      let withCompleteProfile = 0;
      let recentUsers = 0;

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      profiles?.forEach(profile => {
        const role = profile.role || 'unknown';
        byRole[role] = (byRole[role] || 0) + 1;

        const level = profile.level || 'unknown';
        byLevel[level] = (byLevel[level] || 0) + 1;

        if (profile.profile_complete) {
          withCompleteProfile++;
        }

        const createdAt = new Date(profile.created_at || '');
        if (createdAt > sevenDaysAgo) {
          recentUsers++;
        }
      });

      return {
        total,
        byRole,
        byLevel,
        withCompleteProfile,
        recentUsers,
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }

  // Upload user avatar
  async uploadAvatar(userId: string, file: File): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      // Chemin: userId/fichier.ext (permet les politiques RLS avec foldername)
      const filePath = `${userId}/${fileName}`;

      console.log('📤 Uploading avatar to path:', filePath);

      const { error: uploadError } = await supabase.storage
        .from(this.bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);

      console.log('📤 Avatar uploaded, public URL:', publicUrl);

      await this.updateProfile(userId, {
        avatar_url: publicUrl,
      });

      return publicUrl;
    } catch (error) {
      console.error(`Error uploading avatar for user ${userId}:`, error);
      throw error;
    }
  }

  // Delete user avatar
  async deleteAvatar(userId: string): Promise<void> {
    try {
      const profile = await this.getProfile(userId);
      if (!profile?.avatar_url) return;

      // Extraire le chemin depuis l'URL
      const urlParts = profile.avatar_url.split('/');
      // Format: https://.../storage/v1/object/public/user-avatars/userId/filename.ext
      const filePath = urlParts.slice(-2).join('/');

      console.log('🗑️ Deleting avatar at path:', filePath);

      const { error: deleteError } = await supabase.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (deleteError) {
        console.error('Delete error:', deleteError);
        throw deleteError;
      }

      await this.updateProfile(userId, {
        avatar_url: null,
      });
    } catch (error) {
      console.error(`Error deleting avatar for user ${userId}:`, error);
      throw error;
    }
  }

  // Get user with enriched data (chargement séparé pour éviter l'erreur 406)
  async getEnrichedProfile(userId: string): Promise<EnrichedProfile | null> {
    try {
      console.log(`Fetching enriched profile for user ${userId}`);
      
      // D'abord récupérer le profil de base
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching base profile:', profileError);
        throw profileError;
      }

      if (!profile) {
        console.warn(`Profile not found for user ${userId}`);
        return null;
      }

      // Créer l'objet enrichi
      const enrichedProfile: EnrichedProfile = { ...profile };

      // Charger les relations séparément
      const promises = [];

      // Charger le pays
      if (profile.country_id) {
        promises.push(
          supabase
            .from('countries')
            .select('*')
            .eq('id', profile.country_id)
            .single()
            .then(({ data: country }) => {
              if (country) enrichedProfile.country = country;
            })
            .catch(error => console.warn('Could not load country:', error.message))
        );
      }

      // Charger la ville
      if (profile.city_id) {
        promises.push(
          supabase
            .from('cities')
            .select('*')
            .eq('id', profile.city_id)
            .single()
            .then(({ data: city }) => {
              if (city) enrichedProfile.city = city;
            })
            .catch(error => console.warn('Could not load city:', error.message))
        );
      }

      // Charger la confession
      if (profile.confession_id) {
        promises.push(
          supabase
            .from('confessions')
            .select('*')
            .eq('id', profile.confession_id)
            .single()
            .then(({ data: confession }) => {
              if (confession) enrichedProfile.confession = confession;
            })
            .catch(error => console.warn('Could not load confession:', error.message))
        );
      }

      // Charger la paroisse
      if (profile.parish_id) {
        promises.push(
          supabase
            .from('parishes')
            .select('*')
            .eq('id', profile.parish_id)
            .single()
            .then(({ data: parish }) => {
              if (parish) enrichedProfile.parish = parish;
            })
            .catch(error => console.warn('Could not load parish:', error.message))
        );
      }

      // Attendre que toutes les relations soient chargées
      await Promise.all(promises);

      console.log('Enriched profile loaded successfully:', {
        hasCountry: !!enrichedProfile.country,
        hasCity: !!enrichedProfile.city,
        hasConfession: !!enrichedProfile.confession,
        hasParish: !!enrichedProfile.parish
      });

      return enrichedProfile;

    } catch (error) {
      console.error(`Error fetching enriched profile for user ${userId}:`, error);
      
      // Fallback: retourner le profil de base
      try {
        const basicProfile = await this.getProfile(userId);
        return basicProfile ? { ...basicProfile } : null;
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        return null;
      }
    }
  }

  // Update user role and level (admin function)
  async updateUserRole(userId: string, role: string, level?: string): Promise<Profile> {
    try {
      const updateData: any = {
        role,
        updated_at: new Date().toISOString(),
      };

      if (level) {
        updateData.level = level;
      }

      return await this.updateProfile(userId, updateData);
    } catch (error) {
      console.error(`Error updating role for user ${userId}:`, error);
      throw error;
    }
  }

  // Mark profile as complete
  async markProfileComplete(userId: string): Promise<Profile> {
    try {
      return await this.updateProfile(userId, {
        profile_complete: true,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`Error marking profile complete for user ${userId}:`, error);
      throw error;
    }
  }

  // Check if profile exists
  async profileExists(userId: string): Promise<boolean> {
    try {
      const profile = await this.getProfile(userId);
      return !!profile;
    } catch (error) {
      return false;
    }
  }

  // Get user's full name
  getFullName(profile: Profile): string {
    return `${profile.first_name} ${profile.last_name}`.trim();
  }

  // Format user role for display
  formatRole(role: string | null): string {
    if (!role) return 'Non défini';
    
    const roleMap: Record<string, string> = {
      'brebis': 'Brebis',
      'vigneron': 'Vigneron',
      'admin': 'Administrateur'
    };
    
    return roleMap[role] || role;
  }

  // Format user level for display
  formatLevel(level: string | null): string {
    if (!level) return 'Non défini';
    
    const levelMap: Record<string, string> = {
      'semeur': 'Semeur',
      'moissonneur': 'Moissonneur',
      'berger': 'Berger'
    };
    
    return levelMap[level] || level;
  }
}

// Singleton instance
export const userService = new UserService();