import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Globe, Users, Church, Camera, Video } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { PostVisibility } from '../../types';
import { supabase } from '../../lib/supabase';
import { uploadMultipleToR2 } from '../../lib/r2';
import { Toast } from '../ui/Toast';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: (post: any) => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ 
  isOpen, 
  onClose,
  onPostCreated 
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<PostVisibility>(PostVisibility.GLOBAL);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const visibilityOptions = [
    { 
      value: PostVisibility.GLOBAL, 
      label: 'Public - Visible par tous',
      icon: Globe,
      description: 'Votre post sera visible par tous les utilisateurs de Koinonia'
    },
    { 
      value: PostVisibility.SUBSCRIBERS, 
      label: 'Abonnés - Mes abonnés uniquement',
      icon: Users,
      description: 'Visible uniquement par les personnes qui vous suivent'
    },
    { 
      value: PostVisibility.RESTRICTED, 
      label: 'Paroisse - Ma paroisse uniquement',
      icon: Church,
      description: 'Visible uniquement par les membres de votre paroisse'
    },
    { 
      value: PostVisibility.EXTENDED, 
      label: 'Étendu - Ma confession religieuse',
      icon: Users,
      description: 'Visible par tous les membres de votre confession religieuse'
    }
  ];

  const resetForm = () => {
    setContent('');
    setVisibility(PostVisibility.GLOBAL);
    setMediaFiles([]);
    setVideoFiles([]);
    setErrors({});
  };

  // Appel à la Edge Function publish-content (modération uniquement)
  const callModeration = async (text: string): Promise<{ isApproved: boolean; message?: string }> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Non authentifié');
    }

    const response = await fetch(
      'https://yombfuigszyxjwodukkr.supabase.co/functions/v1/publish-content',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: text }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur lors de la modération');
    }

    return await response.json();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setErrors({ content: 'Le contenu du post est requis' });
      return;
    }

    if (!user?.profileComplete) {
      setErrors({ general: 'Vous devez compléter votre profil pour publier' });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      let mediaUrls: string[] = [];
      let videoUrls: string[] = [];

      // Upload des images vers R2
      if (mediaFiles.length > 0) {
        try {
          mediaUrls = await uploadMultipleToR2(mediaFiles);
          console.log('Images uploaded:', mediaUrls);
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          throw new Error('Erreur lors de l\'upload des images');
        }
      }

      // Upload des vidéos vers R2
      if (videoFiles.length > 0) {
        try {
          videoUrls = await uploadMultipleToR2(videoFiles);
          console.log('Videos uploaded:', videoUrls);
        } catch (uploadError) {
          console.error('Video upload failed:', uploadError);
          throw new Error('Erreur lors de l\'upload des vidéos');
        }
      }

      // 1. Modérer le contenu via Edge Function
      const moderation = await callModeration(content.trim());
      console.log('📤 Résultat modération:', moderation);

      const isApproved = moderation.isApproved;
      const moderationMessage = moderation.message || null;

      // Si le contenu est rejeté, afficher le toast et arrêter
      if (!isApproved) {
        setToast({ 
          message: moderationMessage || 'Votre message contient des termes inappropriés. Veuillez le modifier.', 
          type: 'error' 
        });
        setIsSubmitting(false);
        return; // ← CRITIQUE : ne pas insérer
      }

      // 2. Insérer uniquement si approuvé
      const postData = {
        author_id: user.id,
        content: content.trim(),
        media_urls: mediaUrls.length > 0 ? mediaUrls : null,
        video_urls: videoUrls.length > 0 ? videoUrls : null,
        visibility: visibility,
        parish_ids: visibility === PostVisibility.RESTRICTED && user.parish ? [user.parish.id] : [],
        confession_ids: visibility === PostVisibility.EXTENDED && user.confession ? [user.confession.id] : [],
        type: 'post',
        moderation_status: 'approved',
        moderation_message: null,
        is_active: true,
        likes_count: 0,
        comments_count: 0,
        shares_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('📤 Insertion directe:', postData);

      const { data: post, error: insertError } = await supabase
        .from('posts')
        .insert(postData)
        .select('*, author:profiles!author_id(*)')
        .single();

      if (insertError) {
        console.error('❌ Insert error:', insertError);
        throw new Error(insertError.message);
      }

      console.log('✅ Post créé avec succès:', post);

      // Afficher un toast de succès
      setToast({ 
        message: 'Votre publication a été créée avec succès !', 
        type: 'success' 
      });

      // Formater le post pour l'état local
      const formattedPost = {
        id: post.id,
        authorId: post.author_id,
        author: {
          id: post.author.id,
          firstName: post.author.first_name,
          lastName: post.author.last_name,
          email: '',
          profileComplete: true,
          role: post.author.role,
          level: post.author.level,
          avatar: post.author.avatar_url,
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
      };

      onPostCreated(formattedPost);
      resetForm();
      
      // Fermer le modal après un court délai pour voir le toast
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error: any) {
      console.error('❌ Erreur:', error);
      setToast({ 
        message: error.message || 'Erreur lors de la création du post', 
        type: 'error' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFilesOnly = files.filter(file => file.type.startsWith('image/'));
    
    if (mediaFiles.length + imageFilesOnly.length > 4) {
      setErrors({ media: 'Maximum 4 images autorisées' });
      return;
    }
    
    setMediaFiles(prev => [...prev, ...imageFilesOnly]);
    setErrors(prev => ({ ...prev, media: '' }));
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const videoFilesOnly = files.filter(file => file.type.startsWith('video/'));
    
    if (videoFiles.length + videoFilesOnly.length > 2) {
      setErrors({ video: 'Maximum 2 vidéos autorisées' });
      return;
    }
    
    const oversizedFiles = videoFilesOnly.filter(file => file.size > 100 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setErrors({ video: 'Taille maximum 100MB par vidéo' });
      return;
    }
    
    setVideoFiles(prev => [...prev, ...videoFilesOnly]);
    setErrors(prev => ({ ...prev, video: '' }));
  };

  const removeImage = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeVideo = (index: number) => {
    setVideoFiles(prev => prev.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display font-bold text-gray-900">
            Créer un post
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {!user?.profileComplete && (
          <div className="bg-warm-50 border border-warm-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-warm-800 font-medium">
              Profil incomplet
            </p>
            <p className="text-xs text-warm-600 mt-1">
              Complétez votre profil pour pouvoir publier des posts
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-spiritual-400 rounded-full flex items-center justify-center">
              {user?.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={`${user.firstName} ${user.lastName}`}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div className="text-white text-sm font-bold">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-sm text-gray-500">
                {t(`role.${user?.role}`)} • {t(`level.${user?.level}`)}
              </p>
            </div>
          </div>

          <div>
            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                if (errors.content) setErrors(prev => ({ ...prev, content: '' }));
              }}
              placeholder="Que voulez-vous partager avec votre communauté ?"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors resize-none"
              disabled={!user?.profileComplete}
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-600">{errors.content}</p>
            )}
          </div>

          {/* Section images */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">
                Images (optionnel, max 4)
              </label>
              <label className="cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={!user?.profileComplete}
                />
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                  <Camera className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-600">Ajouter</span>
                </div>
              </label>
            </div>
            
            {mediaFiles.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {mediaFiles.map((file, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Aperçu ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {errors.media && (
              <p className="mt-1 text-sm text-red-600">{errors.media}</p>
            )}
          </div>

          {/* Section vidéos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">
                Vidéos (optionnel, max 100MB chacune)
              </label>
              <label className="cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                  disabled={!user?.profileComplete}
                />
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors">
                  <Video className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-600">Ajouter</span>
                </div>
              </label>
            </div>
            
            {videoFiles.length > 0 && (
              <div className="space-y-2">
                {videoFiles.map((file, index) => (
                  <div key={index} className="relative bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center space-x-3">
                      <Video className="w-8 h-8 text-blue-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(file.size / (1024 * 1024)).toFixed(1)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeVideo(index)}
                        className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {errors.video && (
              <p className="mt-1 text-sm text-red-600">{errors.video}</p>
            )}
          </div>

          {/* Visibilité */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Visibilité du post
            </label>
            <div className="space-y-2">
              {visibilityOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = visibility === option.value;
                const isDisabled = !user?.profileComplete || 
                  (option.value === PostVisibility.RESTRICTED && !user?.parish) ||
                  (option.value === PostVisibility.EXTENDED && !user?.confession);
                
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => !isDisabled && setVisibility(option.value)}
                    disabled={isDisabled}
                    className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${
                      isSelected 
                        ? 'border-primary-500 bg-primary-50' 
                        : isDisabled
                        ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <Icon className={`w-5 h-5 mt-0.5 ${
                        isSelected ? 'text-primary-600' : 'text-gray-400'
                      }`} />
                      <div>
                        <p className={`font-medium ${
                          isSelected ? 'text-primary-900' : 'text-gray-900'
                        }`}>
                          {option.label}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={onClose}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="spiritual"
              fullWidth
              loading={isSubmitting}
              disabled={!user?.profileComplete}
            >
              Publier
            </Button>
          </div>
        </form>
      </Card>
      
      {/* Toast notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
};