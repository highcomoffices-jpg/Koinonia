import React, { useState, useEffect } from 'react';
import { Smile, Heart, ThumbsUp, Laugh } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface MessageReactionsProps {
  messageId: string;
  onReactionAdded?: (emoji: string) => void;
}

interface Reaction {
  emoji: string;
  count: number;
  userReacted: boolean;
}

const DEFAULT_EMOJIS = ['🙏', '❤️', '👍', '😊', '🎉', '😢', '👏', '🔥'];

export const MessageReactions: React.FC<MessageReactionsProps> = ({ messageId, onReactionAdded }) => {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReactions();
  }, [messageId]);

  const loadReactions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('get_message_reactions', { message_id: messageId });

      if (error) throw error;

      const formattedReactions: Reaction[] = (data || []).map((r: any) => ({
        emoji: r.emoji,
        count: r.count,
        userReacted: r.users?.some((u: any) => u.id === user?.id) || false,
      }));

      setReactions(formattedReactions);
    } catch (error) {
      console.error('Error loading reactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddReaction = async (emoji: string) => {
    try {
      const { error } = await supabase
        .rpc('add_message_reaction', {
          message_id: messageId,
          user_id: user?.id,
          emoji_text: emoji,
        });

      if (error) throw error;

      await loadReactions();
      if (onReactionAdded) onReactionAdded(emoji);
      setShowPicker(false);
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const handleRemoveReaction = async (emoji: string) => {
    try {
      const { error } = await supabase
        .rpc('remove_message_reaction', {
          message_id: messageId,
          user_id: user?.id,
          emoji_text: emoji,
        });

      if (error) throw error;

      await loadReactions();
    } catch (error) {
      console.error('Error removing reaction:', error);
    }
  };

  const handleToggleReaction = (reaction: Reaction) => {
    if (reaction.userReacted) {
      handleRemoveReaction(reaction.emoji);
    } else {
      handleAddReaction(reaction.emoji);
    }
  };

  if (isLoading && reactions.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-1 mt-1">
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          onClick={() => handleToggleReaction(reaction)}
          className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs transition-colors ${
            reaction.userReacted
              ? 'bg-primary-100 text-primary-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <span>{reaction.emoji}</span>
          <span>{reaction.count}</span>
        </button>
      ))}
      
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <Smile className="w-3 h-3" />
        </button>
        
        {showPicker && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowPicker(false)}
            />
            <div className="absolute left-0 bottom-full mb-2 bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-50">
              <div className="grid grid-cols-4 gap-1">
                {DEFAULT_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleAddReaction(emoji)}
                    className="w-8 h-8 hover:bg-gray-100 rounded-lg flex items-center justify-center text-lg transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};