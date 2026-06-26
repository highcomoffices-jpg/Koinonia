import { supabase } from '../lib/supabase';
import { Post } from '../types';

export interface PostWithAuthor extends Post {
  author: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    role: string;
    level: string;
  };
}

class PostService {
  // Récupérer tous les posts (avec auteur)
  async getPosts(options?: {
    limit?: number;
    offset?: number;
    visibility?: string;
    parishId?: string;
    confessionId?: string;
    authorId?: string;
  }): Promise<PostWithAuthor[]> {
    try {
      let query = supabase
        .from('posts')
        .select(`
          id,
          author_id,
          content,
          media_urls,
          video_urls,
          visibility,
          likes_count,
          comments_count,
          shares_count,
          created_at,
          updated_at,
          author:profiles!author_id(
            id,
            first_name,
            last_name,
            avatar_url,
            role,
            level
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset !== undefined) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      if (options?.visibility) {
        query = query.eq('visibility', options.visibility);
      }

      if (options?.parishId) {
        query = query.contains('parish_ids', [options.parishId]);
      }

      if (options?.confessionId) {
        query = query.contains('confession_ids', [options.confessionId]);
      }

      if (options?.authorId) {
        query = query.eq('author_id', options.authorId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as PostWithAuthor[];
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  }

  // Récupérer les posts des personnes suivies par l'utilisateur
  async getFollowingPosts(limit?: number): Promise<PostWithAuthor[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Récupérer les IDs des personnes suivies
      const { data: following } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (!following || following.length === 0) return [];

      const followingIds = following.map(f => f.following_id);

      let query = supabase
        .from('posts')
        .select(`
          id,
          author_id,
          content,
          media_urls,
          video_urls,
          visibility,
          likes_count,
          comments_count,
          shares_count,
          created_at,
          updated_at,
          author:profiles!author_id(
            id,
            first_name,
            last_name,
            avatar_url,
            role,
            level
          )
        `)
        .eq('is_active', true)
        .eq('moderation_status', 'approved')
        .in('author_id', followingIds)
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as PostWithAuthor[];
    } catch (error) {
      console.error('Error fetching following posts:', error);
      return [];
    }
  }

  // Récupérer un post par son ID
  async getPostById(postId: string): Promise<PostWithAuthor | null> {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          author_id,
          content,
          media_urls,
          video_urls,
          visibility,
          likes_count,
          comments_count,
          shares_count,
          created_at,
          updated_at,
          author:profiles!author_id(
            id,
            first_name,
            last_name,
            avatar_url,
            role,
            level
          )
        `)
        .eq('id', postId)
        .single();

      if (error) throw error;
      return data as PostWithAuthor;
    } catch (error) {
      console.error(`Error fetching post ${postId}:`, error);
      return null;
    }
  }

  // Créer un nouveau post
  async createPost(postData: {
    content: string;
    media_urls?: string[];
    video_urls?: string[];
    visibility?: string;
    confession_ids?: string[];
    parish_ids?: string[];
    type?: string;
  }): Promise<PostWithAuthor> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('posts')
        .insert({
          author_id: user.id,
          content: postData.content,
          media_urls: postData.media_urls || [],
          video_urls: postData.video_urls || [],
          visibility: postData.visibility || 'global',
          confession_ids: postData.confession_ids || [],
          parish_ids: postData.parish_ids || [],
          type: postData.type || 'post',
          moderation_status: 'approved',
          is_active: true,
          likes_count: 0,
          comments_count: 0,
          shares_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select(`
          id,
          author_id,
          content,
          media_urls,
          video_urls,
          visibility,
          likes_count,
          comments_count,
          shares_count,
          created_at,
          updated_at,
          author:profiles!author_id(
            id,
            first_name,
            last_name,
            avatar_url,
            role,
            level
          )
        `)
        .single();

      if (error) throw error;
      return data as PostWithAuthor;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  // Mettre à jour un post
  async updatePost(postId: string, updates: {
    content?: string;
    visibility?: string;
    moderation_status?: string;
    is_active?: boolean;
  }): Promise<PostWithAuthor> {
    try {
      const { data, error } = await supabase
        .from('posts')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)
        .select(`
          id,
          author_id,
          content,
          media_urls,
          video_urls,
          visibility,
          likes_count,
          comments_count,
          shares_count,
          created_at,
          updated_at,
          author:profiles!author_id(
            id,
            first_name,
            last_name,
            avatar_url,
            role,
            level
          )
        `)
        .single();

      if (error) throw error;
      return data as PostWithAuthor;
    } catch (error) {
      console.error(`Error updating post ${postId}:`, error);
      throw error;
    }
  }

  // Supprimer un post
  async deletePost(postId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
    } catch (error) {
      console.error(`Error deleting post ${postId}:`, error);
      throw error;
    }
  }

  // Désactiver un post (modération par berger)
  async disablePost(postId: string, reason?: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('posts')
        .update({
          moderation_status: 'disabled_by_shepherd',
          moderation_message: reason || null,
          moderated_by: user.id,
          moderated_at: new Date().toISOString(),
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId);

      if (error) throw error;
    } catch (error) {
      console.error(`Error disabling post ${postId}:`, error);
      throw error;
    }
  }

  // Ajouter un like
  async likePost(postId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('target_type', 'post')
        .eq('target_id', postId)
        .maybeSingle();

      if (existingLike) {
        await supabase
          .from('likes')
          .delete()
          .eq('id', existingLike.id);
        await supabase.rpc('decrement_post_likes', { post_id: postId });
      } else {
        await supabase
          .from('likes')
          .insert({
            user_id: user.id,
            target_type: 'post',
            target_id: postId
          });
        await supabase.rpc('increment_post_likes', { post_id: postId });
      }
    } catch (error) {
      console.error(`Error toggling like on post ${postId}:`, error);
      throw error;
    }
  }

  async getLikesCount(postId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('target_type', 'post')
        .eq('target_id', postId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error(`Error counting likes for post ${postId}:`, error);
      return 0;
    }
  }

  async hasUserLikedPost(postId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('target_type', 'post')
        .eq('target_id', postId)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error(`Error checking like for post ${postId}:`, error);
      return false;
    }
  }
}

export const postService = new PostService();