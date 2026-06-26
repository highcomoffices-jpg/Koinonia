// Version complète corrigée - remplacer tout le fichier

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Post } from '../../types';
import { Card } from '../ui/Card';
import { PostActions } from '../posts/PostActions';

interface PostCardProps {
  post: Post;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ 
  post, 
  onLike, 
  onComment, 
  onShare 
}) => {
  const { t } = useTranslation();
  const [playingVideo, setPlayingVideo] = React.useState<string | null>(null);
  const [isMuted, setIsMuted] = React.useState(true);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'À l\'instant';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      if (days < 7) {
        return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
      } else {
        return new Intl.DateTimeFormat('fr', {
          day: 'numeric',
          month: 'short',
          year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        }).format(date);
      }
    }
  };

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case 'global': return 'bg-green-100 text-green-800';
      case 'restricted': return 'bg-blue-100 text-blue-800';
      case 'extended': return 'bg-purple-100 text-purple-800';
      case 'subscribers': return 'bg-warm-100 text-warm-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVisibilityLabel = (visibility: string) => {
    switch (visibility) {
      case 'global': return 'Public';
      case 'restricted': return 'Paroisse';
      case 'extended': return 'Étendu';
      case 'subscribers': return 'Abonnés';
      default: return visibility;
    }
  };

  const handleVideoPlay = (videoId: string) => {
    setPlayingVideo(playingVideo === videoId ? null : videoId);
  };

  return (
    <Card className="mb-4 overflow-hidden w-full max-w-full">
      <div className="p-4">
        {/* En-tête du post */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-gradient-to-br from-primary-400 to-spiritual-400 flex-shrink-0">
              {post.author.avatar ? (
                <img 
                  src={post.author.avatar} 
                  alt={`${post.author.firstName} ${post.author.lastName}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-semibold text-sm sm:text-base">
                  {post.author.firstName[0]}{post.author.lastName[0]}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                  {post.author.firstName} {post.author.lastName}
                </h3>
                <span className={`px-2 py-0.5 text-xs rounded-full ${getVisibilityColor(post.visibility)} self-start sm:self-auto w-fit`}>
                  {getVisibilityLabel(post.visibility)}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 text-xs sm:text-sm text-gray-500">
                <span className="truncate">{t(`role.${post.author.role}`)} • {t(`level.${post.author.level}`)}</span>
                <span className="hidden sm:inline">•</span>
                <span className="whitespace-nowrap">{formatDate(post.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu du post - avec coupure de mots */}
        <div className="mb-4">
          <p className="text-sm sm:text-base text-gray-800 leading-relaxed whitespace-pre-wrap break-words">
            {post.content}
          </p>
        </div>

        {/* Médias responsives */}
        {post.mediaUrls && post.mediaUrls.length > 0 && (
          <div className="mb-4">
            <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
              {post.mediaUrls.map((url, index) => (
                <div 
                  key={index} 
                  className="rounded-lg overflow-hidden"
                >
                  <img 
                    src={url} 
                    alt={`Média ${index + 1}`}
                    className="w-full h-auto max-h-64 object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vidéos responsives */}
        {post.videoUrls && post.videoUrls.length > 0 && (
          <div className="mb-4">
            <div className="space-y-4">
              {post.videoUrls.map((url, index) => {
                const videoId = `${post.id}-video-${index}`;
                const isPlaying = playingVideo === videoId;
                
                return (
                  <div key={index} className="relative rounded-lg overflow-hidden bg-black w-full">
                    <video
                      className="w-full h-auto max-h-80 object-cover"
                      poster="https://images.pexels.com/photos/1624496/pexels-photo-1624496.jpeg?auto=compress&cs=tinysrgb&w=800"
                      muted={isMuted}
                      loop
                      playsInline
                      ref={(video) => {
                        if (video) {
                          if (isPlaying) {
                            video.play();
                          } else {
                            video.pause();
                          }
                        }
                      }}
                    >
                      <source src={url} type="video/mp4" />
                      Votre navigateur ne supporte pas la lecture vidéo.
                    </video>
                    
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button
                        onClick={() => handleVideoPlay(videoId)}
                        className="w-12 h-12 sm:w-16 sm:h-16 bg-black bg-opacity-50 rounded-full flex items-center justify-center hover:bg-opacity-70 transition-all"
                      >
                        {isPlaying ? (
                          <Pause className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                        ) : (
                          <Play className="w-6 h-6 sm:w-8 sm:h-8 text-white ml-1" />
                        )}
                      </button>
                    </div>
                    
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="absolute bottom-2 right-2 w-8 h-8 sm:w-10 sm:h-10 bg-black bg-opacity-50 rounded-full flex items-center justify-center hover:bg-opacity-70 transition-all"
                    >
                      {isMuted ? (
                        <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      ) : (
                        <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      )}
                    </button>
                    
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black bg-opacity-50 rounded text-white text-xs">
                      {Math.floor(Math.random() * 5) + 1}:{String(Math.floor(Math.random() * 60)).padStart(2, '0')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <PostActions 
          post={post}
          onLike={onLike}
          onComment={onComment}
          onShare={onShare}
        />
      </div>
    </Card>
  );
};