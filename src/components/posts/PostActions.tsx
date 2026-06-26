import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, UserPlus, UserCheck } from 'lucide-react';
import { Post } from '../../types';
import { MicroDonationButton } from '../ui/MicroDonationButton';
import { followService } from '../../services/followService';
import { useAuth } from '../../contexts/AuthContext';

interface PostActionsProps {
  post: Post;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
}

export const PostActions: React.FC<PostActionsProps> = ({ 
  post, 
  onLike, 
  onComment, 
  onShare 
}) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  // Vérifier si l'utilisateur suit l'auteur
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!user || user.id === post.authorId) return;
      const following = await followService.isFollowing(post.authorId);
      setIsFollowing(following);
    };
    checkFollowStatus();
  }, [user, post.authorId]);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    onLike?.(post.id);
  };

  const handleComment = () => {
    onComment?.(post.id);
  };

  const handleShare = () => {
    onShare?.(post.id);
  };

  const handleFollow = async () => {
    if (!user || user.id === post.authorId) return;
    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        await followService.unfollow(post.authorId);
        setIsFollowing(false);
      } else {
        await followService.follow(post.authorId);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setIsFollowLoading(false);
    }
  };

  // Ne pas afficher le bouton "S'abonner" pour ses propres posts
  const showFollowButton = user && user.id !== post.authorId;

  return (
    <div className="flex flex-wrap items-center justify-between pt-4 border-t border-gray-100 gap-3">
      <div className="flex flex-wrap items-center gap-4 sm:gap-6">
        <button 
          onClick={handleLike}
          className={`flex items-center space-x-1.5 transition-colors ${
            isLiked 
              ? 'text-red-600' 
              : 'text-gray-600 hover:text-red-600'
          }`}
        >
          <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
          <span className="text-sm font-medium">{likesCount}</span>
        </button>
        
        <button 
          onClick={handleComment}
          className="flex items-center space-x-1.5 text-gray-600 hover:text-blue-600 transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm font-medium">{post.commentsCount}</span>
        </button>
        
        <button 
          onClick={handleShare}
          className="flex items-center space-x-1.5 text-gray-600 hover:text-green-600 transition-colors"
        >
          <Share2 className="w-5 h-5" />
          <span className="text-sm font-medium">{post.sharesCount}</span>
        </button>

        {/* Bouton de micro-don */}
        <div className="flex-shrink-0">
          <MicroDonationButton 
            targetType="post" 
            targetId={post.id}
          />
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {/* Bouton S'abonner */}
        {showFollowButton && (
          <button
            onClick={handleFollow}
            disabled={isFollowLoading}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isFollowing
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-primary-500 text-white hover:bg-primary-600'
            }`}
          >
            {isFollowing ? (
              <>
                <UserCheck className="w-4 h-4" />
                <span>Abonné</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>S'abonner</span>
              </>
            )}
          </button>
        )}
        
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0">
          <MoreHorizontal className="w-5 h-5 text-gray-500" />
        </button>
      </div>
    </div>
  );
};