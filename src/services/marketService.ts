import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type MarketItem = Database['public']['Tables']['market_items']['Row'];
type MarketItemInsert = Database['public']['Tables']['market_items']['Insert'];
type MarketItemUpdate = Database['public']['Tables']['market_items']['Update'];

export interface EnrichedMarketItem extends MarketItem {
  seller: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };
}

class MarketService {
  // Récupérer tous les articles actifs
  async getItems(options?: {
    category?: string;
    limit?: number;
    offset?: number;
    search?: string;
  }): Promise<EnrichedMarketItem[]> {
    try {
      let query = supabase
        .from('market_items')
        .select(`
          *,
          seller:profiles(
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (options?.category) {
        query = query.eq('category', options.category);
      }

      if (options?.search) {
        query = query.or(`title.ilike.%${options.search}%,description.ilike.%${options.search}%`);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset !== undefined) {
        query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as EnrichedMarketItem[];
    } catch (error) {
      console.error('Error fetching market items:', error);
      throw error;
    }
  }

  // Récupérer un article par son ID
  async getItemById(itemId: string): Promise<EnrichedMarketItem | null> {
    try {
      const { data, error } = await supabase
        .from('market_items')
        .select(`
          *,
          seller:profiles(
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('id', itemId)
        .single();

      if (error) throw error;
      return data as EnrichedMarketItem;
    } catch (error) {
      console.error(`Error fetching market item ${itemId}:`, error);
      return null;
    }
  }

  // Récupérer les articles d'un vendeur
  async getItemsBySeller(sellerId: string): Promise<EnrichedMarketItem[]> {
    try {
      const { data, error } = await supabase
        .from('market_items')
        .select(`
          *,
          seller:profiles(
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('seller_id', sellerId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as EnrichedMarketItem[];
    } catch (error) {
      console.error(`Error fetching items for seller ${sellerId}:`, error);
      throw error;
    }
  }

  // Créer un article
  async createItem(itemData: Omit<MarketItemInsert, 'seller_id' | 'created_at' | 'updated_at'>): Promise<EnrichedMarketItem> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('market_items')
        .insert({
          ...itemData,
          seller_id: user.id,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select(`
          *,
          seller:profiles(
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;
      return data as EnrichedMarketItem;
    } catch (error) {
      console.error('Error creating market item:', error);
      throw error;
    }
  }

  // Mettre à jour un article
  async updateItem(itemId: string, updates: MarketItemUpdate): Promise<EnrichedMarketItem> {
    try {
      const { data, error } = await supabase
        .from('market_items')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', itemId)
        .select(`
          *,
          seller:profiles(
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;
      return data as EnrichedMarketItem;
    } catch (error) {
      console.error(`Error updating market item ${itemId}:`, error);
      throw error;
    }
  }

  // Supprimer un article (soft delete)
  async deleteItem(itemId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('market_items')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', itemId);

      if (error) throw error;
    } catch (error) {
      console.error(`Error deleting market item ${itemId}:`, error);
      throw error;
    }
  }

  // Ajouter un like
  async likeItem(itemId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Vérifier si déjà liké
      const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('target_type', 'market_item')
        .eq('target_id', itemId)
        .maybeSingle();

      if (existingLike) {
        // Unlike
        await supabase
          .from('likes')
          .delete()
          .eq('id', existingLike.id);
        
        await supabase.rpc('decrement_market_item_likes', { item_id: itemId });
      } else {
        // Like
        await supabase
          .from('likes')
          .insert({
            user_id: user.id,
            target_type: 'market_item',
            target_id: itemId,
          });
        
        await supabase.rpc('increment_market_item_likes', { item_id: itemId });
      }
    } catch (error) {
      console.error(`Error toggling like on market item ${itemId}:`, error);
      throw error;
    }
  }

  // Compter les likes
  async getLikesCount(itemId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('target_type', 'market_item')
        .eq('target_id', itemId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error(`Error counting likes for item ${itemId}:`, error);
      return 0;
    }
  }

  // Récupérer les catégories distinctes
  async getCategories(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('market_items')
        .select('category')
        .eq('is_active', true)
        .order('category');

      if (error) throw error;
      
      const categories = [...new Set(data.map(item => item.category).filter(Boolean))];
      return categories as string[];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }
}

export const marketService = new MarketService();