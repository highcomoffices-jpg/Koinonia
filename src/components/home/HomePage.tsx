import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Plus, Filter, Eye, Calendar, Users, Heart } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { PostCard } from './PostCard';
import { CreatePostModal } from '../posts/CreatePostModal';
import { CompleteProfileModal } from '../profile/CompleteProfileModal';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { supabase } from '../../lib/supabase';
import { Post } from '../../types';

interface LiveEvent {
  id: string;
  title: string;
  description: string;
  stream_url: string;
  viewer_count: number;
  thumbnail_url?: string;
  started_at: string;
  organizer?: {
    first_name: string;
    last_name: string;
  };
}

export const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [liveNow, setLiveNow] = useState<LiveEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [isCompleteProfileModalOpen, setIsCompleteProfileModalOpen] = useState(false);
  const [selectedLive, setSelectedLive] = useState<LiveEvent | null>(null);

  // Charger les posts depuis Supabase
  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
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
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
          const formattedPosts: Post[] = data.map((post: any) => ({
            id: post.id,
            authorId: post.author_id,
            author: {
              id: post.author?.id || '',
              firstName: post.author?.first_name || 'Utilisateur',
              lastName: post.author?.last_name || '',
              email: '',
              profileComplete: true,
              role: post.author?.role || 'brebis',
              level: post.author?.level || 'semeur',
              avatar: post.author?.avatar_url || null,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            content: post.content,
            mediaUrls: post.media_urls || [],
            videoUrls: post.video_urls || [],
            visibility: post.visibility,
            likesCount: post.likes_count || 0,
            commentsCount: post.comments_count || 0,
            sharesCount: post.shares_count || 0,
            createdAt: new Date(post.created_at),
            updatedAt: new Date(post.updated_at)
          }));
          setPosts(formattedPosts);
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Charger les lives en direct
  useEffect(() => {
    const fetchLiveNow = async () => {
      try {
        const { data, error } = await supabase
          .from('live_celebrations')
          .select(`
            id,
            title,
            description,
            stream_url,
            viewer_count,
            thumbnail_url,
            started_at,
            organizer:profiles!organizer_id(
              first_name,
              last_name
            )
          `)
          .eq('status', 'live')
          .order('started_at', { ascending: true })
          .limit(5);

        if (error) throw error;
        setLiveNow(data || []);
      } catch (error) {
        console.error('Error fetching live events:', error);
      }
    };

    fetchLiveNow();

    // Abonnement en temps réel aux changements de statut des lives
    const channel = supabase
      .channel('live-celebrations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_celebrations',
          filter: 'status=eq.live',
        },
        () => {
          fetchLiveNow();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handlePostCreated = (newPost: Post) => {
    setPosts(prev => [newPost, ...prev]);
  };

  const handleLike = async (postId: string) => {
    console.log('Like post:', postId);
  };

  const handleComment = (postId: string) => {
    console.log('Comment on post:', postId);
  };

  const handleShare = (postId: string) => {
    console.log('Share post:', postId);
  };

  const handleCreatePost = () => {
    if (!user?.profileComplete) {
      setIsCompleteProfileModalOpen(true);
    } else {
      setIsCreatePostModalOpen(true);
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 max-w-4xl">
        {user && !user.profileComplete && (
          <Card className="bg-gradient-to-r from-warm-50 to-primary-50 border-warm-200 mb-6">
            <div className="text-center py-3 px-4">
              <h2 className="text-base font-semibold text-warm-800 mb-1">
                {t('profile.incomplete.title')}
              </h2>
              <p className="text-sm text-warm-700 mb-3">
                {t('profile.incomplete.message')}
              </p>
              <Button 
                variant="primary" 
                size="sm"
                onClick={() => setIsCompleteProfileModalOpen(true)}
              >
                {t('profile.incomplete.complete')}
              </Button>
            </div>
          </Card>
        )}

        {/* En-tête avec titre et boutons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              {t('home')}
            </h1>
            <p className="text-sm text-gray-600">
              Découvrez les derniers contenus de votre communauté
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" icon={Filter} className="whitespace-nowrap">
              Filtrer
            </Button>
            <Button 
              variant="primary" 
              size="sm" 
              icon={Plus}
              onClick={handleCreatePost}
              className="whitespace-nowrap"
            >
              {t('create')}
            </Button>
          </div>
        </div>

        {/* Section Lives en direct */}
        {liveNow.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                En direct maintenant
              </h2>
              <Link to="/live-celebrations" className="text-sm text-primary-600 hover:text-primary-700">
                Voir tout
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveNow.slice(0, 3).map((live) => (
                <LiveCard key={live.id} live={live} />
              ))}
            </div>
          </div>
        )}

        {/* Posts */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <p className="mt-2 text-gray-600">Chargement des publications...</p>
          </div>
        )}

        {!isLoading && (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard 
                key={post.id} 
                post={post}
                onLike={handleLike}
                onComment={handleComment}
                onShare={handleShare}
              />
            ))}
          </div>
        )}

        {!isLoading && posts.length === 0 && (
          <Card className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Plus className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              Aucun contenu pour le moment
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Soyez le premier à partager quelque chose avec votre communauté !
            </p>
            <Button variant="primary" icon={Plus} onClick={handleCreatePost}>
              {t('create')}
            </Button>
          </Card>
        )}

        <CreatePostModal
          isOpen={isCreatePostModalOpen}
          onClose={() => setIsCreatePostModalOpen(false)}
          onPostCreated={handlePostCreated}
        />

        <CompleteProfileModal
          isOpen={isCompleteProfileModalOpen}
          onClose={() => setIsCompleteProfileModalOpen(false)}
          onComplete={() => {
            setIsCompleteProfileModalOpen(false);
            window.location.reload();
          }}
        />
      </div>
    </div>
  );
};

// Composant LiveCard
interface LiveCardProps {
  live: LiveEvent;
}

const LiveCard: React.FC<LiveCardProps> = ({ live }) => {
  const [imageError, setImageError] = useState(false);

  const formatViewerCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
      <div className="relative">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-gray-800 overflow-hidden">
          {live.thumbnail_url && !imageError ? (
            <img
              src={live.thumbnail_url}
              alt={live.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900">
              <Eye className="w-12 h-12 text-gray-500" />
            </div>
          )}
          
          {/* Badge LIVE */}
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
            LIVE
          </div>
          
          {/* Compteur de viewers */}
          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
            <Users className="w-3 h-3" />
            <span>{formatViewerCount(live.viewer_count || 0)}</span>
          </div>
        </div>
      </div>
      
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">
          {live.title}
        </h3>
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
          {live.description}
        </p>
        {live.organizer && (
          <p className="text-xs text-spiritual-600 mt-2">
            Par {live.organizer.first_name} {live.organizer.last_name}
          </p>
        )}
        <Button 
          variant="primary" 
          size="sm" 
          fullWidth 
          className="mt-3"
          onClick={() => window.location.href = `/live-celebrations`}
        >
          <Eye className="w-4 h-4 mr-1" />
          Regarder
        </Button>
      </div>
    </Card>
  );
};