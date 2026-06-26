import React, { useState } from 'react';
import { Download, Smile, Eye, CheckCheck } from 'lucide-react';
import { EnrichedMessage } from '../../services/chatService';
import { useAuth } from '../../contexts/AuthContext';

interface ChatMessageItemProps {
  message: EnrichedMessage;
  isOwnMessage: boolean;
  onReaction: (messageId: string, emoji: string) => void;
  onReply?: (message: EnrichedMessage) => void;
}

const QUICK_REACTIONS = ['🙏', '❤️', '👍', '😊', '🎉', '😢'];

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  isOwnMessage,
  onReaction,
  onReply,
}) => {
  const { user } = useAuth();
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const formatTime = (date: string) => {
    return new Intl.DateTimeFormat('fr', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const formatFullDate = (date: string) => {
    return new Intl.DateTimeFormat('fr', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const renderReadReceipt = () => {
    if (!isOwnMessage) return null;
    
    // Simuler les accusés de lecture
    const hasBeenRead = message.isRead;
    
    if (hasBeenRead) {
      return <CheckCheck className="w-3 h-3 text-blue-500" title="Lu" />;
    }
    return <CheckCheck className="w-3 h-3 text-gray-400" title="Envoyé" />;
  };

  const renderReactions = () => {
    if (!message.reactions || message.reactions.length === 0) return null;
    
    const reactionMap = new Map<string, { count: number; users: any[] }>();
    message.reactions.forEach(r => {
      if (!reactionMap.has(r.emoji)) {
        reactionMap.set(r.emoji, { count: 0, users: [] });
      }
      const item = reactionMap.get(r.emoji)!;
      item.count++;
      if (r.users) item.users.push(...r.users);
    });
    
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {Array.from(reactionMap.entries()).map(([emoji, data]) => (
          <div
            key={emoji}
            className="flex items-center space-x-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs cursor-pointer hover:bg-gray-200"
            title={data.users.map(u => u.name).join(', ')}
          >
            <span>{emoji}</span>
            <span className="text-gray-600">{data.count}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderContent = () => {
    switch (message.type) {
      case 'image':
        return (
          <div className="space-y-2">
            <img
              src={message.media_url || ''}
              alt="Image partagée"
              className="max-w-full max-h-64 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(message.media_url || '', '_blank')}
            />
            {message.content !== message.sender?.first_name && (
              <p className="text-sm">{message.content}</p>
            )}
          </div>
        );
      case 'video':
        return (
          <div className="space-y-2">
            <video
              src={message.media_url || ''}
              className="max-w-full max-h-64 rounded-lg"
              controls
              preload="metadata"
            />
            {message.content !== message.sender?.first_name && (
              <p className="text-sm">{message.content}</p>
            )}
          </div>
        );
      case 'file':
        return (
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-lg">📄</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{message.content}</p>
              <p className="text-xs text-gray-500">Document</p>
            </div>
            <a
              href={message.media_url || '#'}
              download
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <Download className="w-4 h-4 text-gray-500" />
            </a>
          </div>
        );
      default:
        return <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>;
    }
  };

  return (
    <div
      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group`}
      onMouseEnter={() => setShowDetails(true)}
      onMouseLeave={() => setShowDetails(false)}
    >
      <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {/* Avatar */}
        {!isOwnMessage && message.sender && (
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-primary-400 to-spiritual-400 flex-shrink-0">
            {message.sender.avatar_url ? (
              <img
                src={message.sender.avatar_url}
                alt={`${message.sender.first_name} ${message.sender.last_name}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-semibold text-xs">
                {message.sender.first_name?.[0]}{message.sender.last_name?.[0]}
              </div>
            )}
          </div>
        )}
        
        {/* Message bubble */}
        <div className="relative">
          <div
            className={`rounded-2xl px-4 py-2 shadow-sm ${
              isOwnMessage
                ? 'bg-gradient-to-r from-primary-600 to-spiritual-600 text-white'
                : 'bg-white text-gray-900 border border-gray-100'
            }`}
            onClick={() => setShowDetails(!showDetails)}
          >
            {renderContent()}
            {renderReactions()}
          </div>
          
          {/* Timestamp et statut */}
          <div className={`flex items-center space-x-1 mt-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
            <p className={`text-xs ${isOwnMessage ? 'text-right text-gray-500' : 'text-left text-gray-500'}`}>
              {formatTime(message.created_at)}
            </p>
            {renderReadReceipt()}
          </div>
          
          {/* Détails (survol ou clic) */}
          {showDetails && (
            <div className={`absolute bottom-full ${isOwnMessage ? 'right-0' : 'left-0'} mb-2 bg-gray-800 text-white text-xs rounded-lg py-1 px-2 whitespace-nowrap z-10`}>
              <div className="flex items-center space-x-2">
                <Eye className="w-3 h-3" />
                <span>Vu par</span>
                <span className="font-medium">
                  {message.read_by?.length || 0} personne(s)
                </span>
              </div>
            </div>
          )}
          
          {/* Bouton de réaction (survol) */}
          <button
            onClick={() => setShowReactionPicker(!showReactionPicker)}
            className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full shadow-md p-1"
          >
            <Smile className="w-4 h-4 text-gray-500" />
          </button>
          
          {/* Picker de réaction */}
          {showReactionPicker && (
            <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-50">
              <div className="grid grid-cols-4 gap-1">
                {QUICK_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      onReaction(message.id, emoji);
                      setShowReactionPicker(false);
                    }}
                    className="w-8 h-8 hover:bg-gray-100 rounded-lg flex items-center justify-center text-lg transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};