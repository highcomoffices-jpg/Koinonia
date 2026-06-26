import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Eye, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { postService } from '../../services/postService';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';

interface PostToModerate {
  id: string;
  content: string;
  author_id: string;
  author_name: string;
  author_email: string;
  created_at: string;
  moderation_status: string;
  is_active: boolean;
}

export const ModeratePostPanel: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostToModerate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<PostToModerate | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'reported'>('all');

  const canModerate = user?.shepherdGrade === 'leader' || 
                      user?.shepherdGrade === 'superior' || 
                      user?.shepherdGrade === 'elder';

  const loadPosts = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('posts')
        .select(`
          id,
          content,
          author_id,
          created_at,
          moderation_status,
          is_active,
          author:profiles!author_id(
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (filter === 'pending') {
        query = query.eq('moderation_status', 'pending');
      } else if (filter === 'reported') {
        // Récupérer les posts avec des signalements
        const { data: reportedContentIds } = await supabase
          .from('reports')
          .select('content_id')
          .eq('status', 'pending');
        
        const ids = reportedContentIds?.map(r => r.content_id) || [];
        if (ids.length > 0) {
          query = query.in('id', ids);
        } else {
          setPosts([]);
          setIsLoading(false);
          return;
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      const formatted = (data || []).map((p: any) => ({
        id: p.id,
        content: p.content,
        author_id: p.author_id,
        author_name: `${p.author?.first_name || ''} ${p.author?.last_name || ''}`.trim(),
        author_email: p.author?.email || '',
        created_at: p.created_at,
        moderation_status: p.moderation_status,
        is_active: p.is_active
      }));

      setPosts(formatted);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (canModerate) {
      loadPosts();
    }
  }, [canModerate, filter]);

  const handleDisable = async (post: PostToModerate, reason?: string) => {
    setIsProcessing(true);
    try {
      await postService.disablePost(post.id, reason);
      await loadPosts();
      setSelectedPost(null);
    } catch (error) {
      console.error('Error disabling post:', error);
      alert('Erreur lors de la désactivation');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!canModerate) {
    return (
      <Card className="text-center py-8">
        <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <p className="text-gray-600">
          Vous n'avez pas les droits pour modérer les contenus.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Cette fonctionnalité est réservée aux bergers (Leader, Supérieur, Ancien).
        </p>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Modération des contenus</h2>
          <p className="text-sm text-gray-500">Désactivez les publications inappropriées</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Tous
          </Button>
          <Button
            variant={filter === 'pending' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('pending')}
          >
            En attente
          </Button>
          <Button
            variant={filter === 'reported' ? 'primary' : 'outline'}
            size="sm"}
            onClick={() => setFilter('reported')}
          >
            Signalés
          </Button>
          <Button variant="ghost" size="sm" icon={RefreshCw} onClick={loadPosts} />
        </div>
      </div>

      {posts.length === 0 ? (
        <Card className="text-center py-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <p className="text-gray-600">Aucun contenu à modérer.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <Card key={post.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="font-medium text-gray-900">{post.author_name}</span>
                    <span className="text-xs text-gray-400">{post.author_email}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                    {!post.is_active && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-800">
                        Désactivé
                      </span>
                    )}
                    {post.moderation_status === 'rejected' && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-800">
                        Rejeté par IA
                      </span>
                    )}
                  </div>
                  <p className="text-gray-700 line-clamp-3">{post.content}</p>
                </div>
                <div className="flex space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Eye}
                    onClick={() => setSelectedPost(post)}
                  >
                    Voir
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de visualisation et désactivation */}
      {selectedPost && (
        <Modal
          isOpen={!!selectedPost}
          onClose={() => setSelectedPost(null)}
          title="Détail du contenu"
          size="lg"
        >
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-1">Auteur</p>
              <p className="font-medium">{selectedPost.author_name}</p>
              <p className="text-xs text-gray-400">{selectedPost.author_email}</p>
              <p className="text-xs text-gray-400 mt-1">
                Publié le {new Date(selectedPost.created_at).toLocaleString()}
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-2">Contenu</p>
              <p className="text-gray-800 whitespace-pre-wrap">{selectedPost.content}</p>
            </div>

            {selectedPost.moderation_status === 'rejected' && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-sm text-orange-800">
                  ⚠️ Ce post a été automatiquement rejeté par le filtre IA.
                </p>
              </div>
            )}

            {selectedPost.is_active ? (
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="danger"
                  onClick={() => handleDisable(selectedPost, 'Désactivé par modération')}
                  loading={isProcessing}
                >
                  Désactiver le post
                </Button>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800">
                  ✅ Ce post a déjà été désactivé.
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};