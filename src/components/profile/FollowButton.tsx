import React, { useState, useEffect } from 'react';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { followService } from '../../services/followService';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';

interface FollowButtonProps {
  userId: string;
  onFollowChange?: (isFollowing: boolean) => void;
  variant?: 'default' | 'small';
}

export const FollowButton: React.FC<FollowButtonProps> = ({ 
  userId, 
  onFollowChange,
  variant = 'default'
}) => {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!user || user.id === userId) return;
      const following = await followService.isFollowing(userId);
      setIsFollowing(following);
    };
    checkFollowStatus();
  }, [user, userId]);

  const handleFollow = async () => {
    if (!user || user.id === userId) return;
    setIsLoading(true);
    try {
      if (isFollowing) {
        await followService.unfollow(userId);
        setIsFollowing(false);
        onFollowChange?.(false);
      } else {
        await followService.follow(userId);
        setIsFollowing(true);
        onFollowChange?.(true);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Ne pas afficher pour son propre profil
  if (!user || user.id === userId) return null;

  if (variant === 'small') {
    return (
      <button
        onClick={handleFollow}
        disabled={isLoading}
        className={`p-1 rounded-full transition-colors ${
          isFollowing
            ? 'text-gray-500 hover:text-gray-700'
            : 'text-primary-500 hover:text-primary-600'
        }`}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isFollowing ? (
          <UserCheck className="w-4 h-4" />
        ) : (
          <UserPlus className="w-4 h-4" />
        )}
      </button>
    );
  }

  return (
    <Button
      onClick={handleFollow}
      variant={isFollowing ? 'outline' : 'primary'}
      size="sm"
      loading={isLoading}
      icon={isFollowing ? UserCheck : UserPlus}
    >
      {isFollowing ? 'Abonné' : 'S\'abonner'}
    </Button>
  );
};