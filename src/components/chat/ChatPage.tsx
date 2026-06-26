import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Send, Paperclip, Smile, Phone, Video, MoreVertical, Search, Users, MessageCircle, 
  ArrowLeft, Pin, BellOff, Trash2, Flag, Gift, Heart, FileText, Camera, Download,
  Crown, Star, Church, Cross, Loader2, CheckCheck, Eye, Plus, UserPlus
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { chatService, EnrichedConversation, EnrichedMessage } from '../../services/chatService';
import { useChatRealtime } from '../../hooks/useChatRealtime';
import { useUnreadCount } from '../../hooks/useUnreadCount';
import { useUserStatus } from '../../hooks/useUserStatus';
import { MicroDonationButton } from '../ui/MicroDonationButton';
import { ChatType, UserRole } from '../../types';
import { NewConversationModal } from './NewConversationModal';
import { CreateGroupModal } from './CreateGroupModal';
import { userSearchService, SearchUserResult } from '../../services/userSearchService';

// Liste des emojis de réaction disponibles
const QUICK_REACTIONS = ['🙏', '❤️', '👍', '😊', '🎉', '😢'];
const ALL_EMOJIS = ['🙏', '❤️', '👍', '👏', '😊', '🎉', '😢', '😮', '🔥', '💯', '⭐', '✨'];

export const ChatPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<EnrichedConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<EnrichedConversation | null>(null);
  const [messages, setMessages] = useState<EnrichedMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showConversationsList, setShowConversationsList] = useState(true);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  const [showPrayerPanel, setShowPrayerPanel] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [isNewConversationModalOpen, setIsNewConversationModalOpen] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Hook pour les messages non lus
  const { unreadCount: conversationUnreadCount, markAsRead: markConversationAsRead } = 
    useUnreadCount({ conversationId: selectedConversation?.id || '', enabled: !!selectedConversation });

  // Hook pour les statuts en ligne des participants
  const participantIds = selectedConversation?.participants.map(p => p.id) || [];
  const { onlineUsers: participantStatuses, getUserStatus } = useUserStatus(participantIds);

  // Fonction utilitaire pour obtenir le statut d'un participant
  const getParticipantStatus = (participantId: string) => {
    if (!participantStatuses || typeof participantStatuses.get !== 'function') {
      return 'offline';
    }
    return participantStatuses.get(participantId)?.status || 'offline';
  };

  // Charger les conversations
  useEffect(() => {
    const fetchConversations = async () => {
      setIsLoading(true);
      try {
        const data = await chatService.getUserConversations();
        setConversations(data);
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, []);

  // Charger les messages d'une conversation
  useEffect(() => {
    if (!selectedConversation) return;
  
    const fetchMessages = async () => {
      setIsLoadingMessages(true);
      try {
        const data = await chatService.getMessages(selectedConversation.id);
        // data est maintenant un tableau directement
        setMessages(data || []);
        
        await markConversationAsRead();
        await chatService.markConversationAsRead(selectedConversation.id);
        
        setConversations(prev => prev.map(c => 
          c.id === selectedConversation.id ? { ...c, unreadCount: 0 } : c
        ));
      } catch (error) {
        console.error('Error fetching messages:', error);
        setMessages([]);
      } finally {
        setIsLoadingMessages(false);
      }
    };
  
    fetchMessages();
  }, [selectedConversation, markConversationAsRead]);

  // Realtime pour les messages, réactions et typing
  const { sendTyping } = useChatRealtime({
    conversationId: selectedConversation?.id || null,
    onNewMessage: (message) => {
      setMessages(prev => [...prev, message]);
      if (message.sender_id !== user?.id) {
        chatService.markMessageAsRead(message.id);
      }
    },
    onTyping: (userId, isTyping) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        if (isTyping) {
          newSet.add(userId);
        } else {
          newSet.delete(userId);
        }
        return newSet;
      });
    },
    onReaction: (reaction) => {
      setMessages(prev => prev.map(msg => 
        msg.id === reaction.message_id 
          ? { ...msg, reactions: [...(msg.reactions || []), reaction] }
          : msg
      ));
    },
  });

  // Gestion de l'indicateur "en train d'écrire"
  const handleTyping = () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendTyping(true);
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(false);
    }, 2000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: EnrichedMessage = {
      id: tempId,
      conversation_id: selectedConversation.id,
      topic: newMessage.trim().substring(0, 100),
      sender_id: user.id,
      content: newMessage.trim(),
      type: 'text',
      media_url: null,
      is_edited: false,
      private: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      inserted_at: new Date().toISOString(),
      extension: null,
      payload: null,
      event: null,
      sender: {
        id: user.id,
        first_name: user.firstName,
        last_name: user.lastName,
        avatar_url: user.avatar || null,
        role: user.role,
        level: user.level,
      },
      reactions: [],
      isRead: false,
    };

    setMessages(prev => [...prev, optimisticMessage]);
    const messageContent = newMessage.trim();
    setNewMessage('');

    const sentMessage = await chatService.sendMessage(selectedConversation.id, messageContent);
    
    if (sentMessage) {
      setMessages(prev => prev.map(m => m.id === tempId ? sentMessage : m));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    } else if (e.key.length === 1) {
      handleTyping();
    }
  };

  const handleAddReaction = async (messageId: string, emoji: string) => {
    await chatService.addReaction(messageId, emoji);
    setShowReactionPicker(null);
  };

  const handleConversationSelect = (conversation: EnrichedConversation) => {
    setSelectedConversation(conversation);
    setShowConversationsList(false);
  };

  const handleBackToList = () => {
    setShowConversationsList(true);
    setSelectedConversation(null);
  };

  const handleConversationCreated = async (conversationId: string) => {
    const data = await chatService.getUserConversations();
    setConversations(data);
    const newConv = data.find(c => c.id === conversationId);
    if (newConv) {
      setSelectedConversation(newConv);
      setShowConversationsList(false);
    }
  };

  const handleGroupCreated = async (conversationId: string) => {
    const data = await chatService.getUserConversations();
    setConversations(data);
    const newGroup = data.find(c => c.id === conversationId);
    if (newGroup) {
      setSelectedConversation(newGroup);
      setShowConversationsList(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !selectedConversation || !user) return;

    for (const file of files) {
      const messageType = file.type.startsWith('image/') ? 'image' : 
                          file.type.startsWith('video/') ? 'video' : 'file';
      
      const sentMessage = await chatService.sendFileMessage(selectedConversation.id, file, messageType);
      if (sentMessage) {
        setMessages(prev => [...prev, sentMessage]);
      }
    }
  };

  // ============================================
  // ACTIONS DU MENU
  // ============================================

  const handlePinConversation = async () => {
    if (!selectedConversation) return;
    try {
      const newPinnedState = await chatService.togglePinConversation(selectedConversation.id);
      setSelectedConversation(prev => prev ? { ...prev, isPinned: newPinnedState } : null);
      setConversations(prev => prev.map(c => 
        c.id === selectedConversation.id ? { ...c, isPinned: newPinnedState } : c
      ));
      setShowOptionsMenu(false);
    } catch (error) {
      console.error('Error pinning conversation:', error);
    }
  };

  const handleToggleNotifications = async () => {
    if (!selectedConversation) return;
    try {
      const newState = await chatService.toggleNotifications(selectedConversation.id);
      setSelectedConversation(prev => prev ? { ...prev, notificationsEnabled: newState } : null);
      setShowOptionsMenu(false);
    } catch (error) {
      console.error('Error toggling notifications:', error);
    }
  };

  const handleDeleteConversation = async () => {
    if (!selectedConversation) return;
    
    const confirmDelete = window.confirm(
      `Voulez-vous vraiment supprimer cette conversation ?\n\nCette action est irréversible.`
    );
    
    if (!confirmDelete) return;
    
    try {
      const success = await chatService.deleteConversation(selectedConversation.id);
      if (success) {
        setConversations(prev => prev.filter(c => c.id !== selectedConversation.id));
        setSelectedConversation(null);
        setShowConversationsList(true);
        setShowOptionsMenu(false);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('Erreur lors de la suppression de la conversation.');
    }
  };

  const handleReportConversation = () => {
    setShowOptionsMenu(false);
    setShowReportModal(true);
    setReportReason('');
    setReportDetails('');
  };

  const handleSubmitReport = async () => {
    if (!selectedConversation) return;
    if (!reportReason.trim()) {
      alert('Veuillez indiquer une raison pour le signalement.');
      return;
    }
    try {
      const success = await chatService.reportConversation(
        selectedConversation.id,
        reportReason.trim(),
        reportDetails.trim() || undefined
      );
      if (success) {
        alert('Signalement envoyé avec succès.');
        setShowReportModal(false);
        setReportReason('');
        setReportDetails('');
      }
    } catch (error) {
      console.error('Error reporting conversation:', error);
      alert('Erreur lors de l\'envoi du signalement.');
    }
  };

  // ============================================
  // FONCTIONS UTILITAIRES
  // ============================================

  const formatTime = (date: string) => {
    const messageDate = new Date(date);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60));
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    return new Intl.DateTimeFormat('fr', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(messageDate);
  };

  const formatLastMessageTime = (date: string) => {
    const messageDate = new Date(date);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60 * 60));
    if (diffInHours < 24) {
      return new Intl.DateTimeFormat('fr', {
        hour: '2-digit',
        minute: '2-digit'
      }).format(messageDate);
    } else {
      return new Intl.DateTimeFormat('fr', {
        day: 'numeric',
        month: 'short'
      }).format(messageDate);
    }
  };

  const getGroupIcon = (groupName: string) => {
    if (groupName?.toLowerCase().includes('prière')) return Cross;
    if (groupName?.toLowerCase().includes('jeunes')) return Users;
    if (groupName?.toLowerCase().includes('église') || groupName?.toLowerCase().includes('paroisse')) return Church;
    return Users;
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return Crown;
      case UserRole.VIGNERON: return Star;
      default: return null;
    }
  };

  const renderReadReceipt = (message: EnrichedMessage) => {
    if (message.sender_id !== user?.id) return null;
    const otherParticipants = selectedConversation?.participants.filter(p => p.id !== user.id) || [];
    const readByOthers = otherParticipants.filter(p => message.read_by?.includes(p.id));
    if (readByOthers.length === otherParticipants.length && otherParticipants.length > 0) {
      return <CheckCheck className="w-3 h-3 text-blue-500" />;
    }
    if (readByOthers.length > 0) {
      return <CheckCheck className="w-3 h-3 text-gray-400" />;
    }
    return <CheckCheck className="w-3 h-3 text-gray-300" />;
  };

  const renderReactions = (message: EnrichedMessage) => {
    if (!message.reactions || message.reactions.length === 0) return null;
    const reactionMap = new Map<string, { count: number; users: any[] }>();
    message.reactions.forEach(r => {
      if (!reactionMap.has(r.emoji)) {
        reactionMap.set(r.emoji, { count: 0, users: [] });
      }
      const item = reactionMap.get(r.emoji)!;
      item.count++;
      item.users.push(r.users?.[0] || {});
    });
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {Array.from(reactionMap.entries()).map(([emoji, data]) => (
          <div
            key={emoji}
            className="flex items-center space-x-1 px-2 py-0.5 bg-gray-100 rounded-full text-xs"
            title={data.users.map(u => u.name).join(', ')}
          >
            <span>{emoji}</span>
            <span className="text-gray-600">{data.count}</span>
          </div>
        ))}
      </div>
    );
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchTerm) return true;
    if (conv.type === 'group' && conv.name) {
      return conv.name.toLowerCase().includes(searchTerm.toLowerCase());
    } else {
      return conv.participants.some(p => 
        `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  });

  if (isLoading) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Sidebar des conversations */}
      <div className={`${
        showConversationsList ? 'flex' : 'hidden'
      } md:flex w-full md:w-80 bg-white border-r border-gray-200 flex-col`}>
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-spiritual-50 to-primary-50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Messages</h1>
              <p className="text-sm text-gray-600">Communauté spirituelle</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setIsNewConversationModalOpen(true)}
                className="p-2 bg-primary-100 rounded-full hover:bg-primary-200 transition-colors"
                title="Nouveau message"
              >
                <Plus className="w-5 h-5 text-primary-600" />
              </button>
              <button
                onClick={() => setIsCreateGroupModalOpen(true)}
                className="p-2 bg-green-100 rounded-full hover:bg-green-200 transition-colors"
                title="Créer un groupe"
              >
                <Users className="w-5 h-5 text-green-600" />
              </button>
            </div>
          </div>
          <Input
            placeholder="Rechercher une conversation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={Search}
            className="bg-white"
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucune conversation
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const GroupIcon = conversation.type === 'group' ? getGroupIcon(conversation.name || '') : null;
              const isGroupConversation = conversation.type === 'group';
              const mainParticipant = conversation.participants[0];
              const isOnline = mainParticipant && getParticipantStatus(mainParticipant.id) === 'online';
              
              return (
                <div
                  key={conversation.id}
                  onClick={() => handleConversationSelect(conversation)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-all duration-200 ${
                    selectedConversation?.id === conversation.id ? 'bg-gradient-to-r from-spiritual-50 to-primary-50 border-l-4 border-primary-500' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      {isGroupConversation ? (
                        <div className="w-12 h-12 bg-gradient-to-br from-spiritual-400 to-primary-400 rounded-full flex items-center justify-center">
                          {GroupIcon && <GroupIcon className="w-6 h-6 text-white" />}
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-primary-400 to-spiritual-400 relative">
                          {mainParticipant?.avatar_url ? (
                            <img
                              src={mainParticipant.avatar_url}
                              alt={`${mainParticipant.first_name} ${mainParticipant.last_name}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white font-semibold">
                              {mainParticipant?.first_name?.[0]}{mainParticipant?.last_name?.[0]}
                            </div>
                          )}
                          {isOnline && (
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                          )}
                        </div>
                      )}
                      
                      {conversation.unreadCount && conversation.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                          <span className="text-xs text-white font-bold">
                            {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                          </span>
                        </div>
                      )}
                      
                      {conversation.isPinned && (
                        <div className="absolute -top-1 -left-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg">
                          <Pin className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">
                            {isGroupConversation 
                              ? conversation.name 
                              : `${mainParticipant?.first_name || ''} ${mainParticipant?.last_name || ''}`
                            }
                          </h3>
                          {conversation.isPinned && (
                            <Pin className="w-3 h-3 text-yellow-500 flex-shrink-0" />
                          )}
                          {!isGroupConversation && mainParticipant && getRoleIcon(mainParticipant.role as UserRole) && (
                            <div className="flex-shrink-0">
                              {React.createElement(getRoleIcon(mainParticipant.role as UserRole)!, { 
                                className: "w-3 h-3 text-yellow-500" 
                              })}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {conversation.lastMessage && formatLastMessageTime(conversation.lastMessage.created_at)}
                        </span>
                      </div>
                      
                      {conversation.lastMessage && (
                        <p className="text-sm text-gray-600 truncate mt-1">
                          {conversation.lastMessage.sender_id === user?.id && 'Vous: '}
                          {conversation.lastMessage.type === 'image' && '📷 '}
                          {conversation.lastMessage.type === 'video' && '🎥 '}
                          {conversation.lastMessage.type === 'file' && '📎 '}
                          {conversation.lastMessage.content}
                        </p>
                      )}
                      {typingUsers.has(mainParticipant?.id || '') && (
                        <p className="text-xs text-spiritual-600 italic mt-1">
                          En train d'écrire...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Zone de chat principale */}
      <div className={`${
        !showConversationsList ? 'flex' : 'hidden'
      } md:flex flex-1 flex-col bg-white`}>
        {selectedConversation ? (
          <>
            {/* En-tête du chat */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 min-w-0">
                  <button
                    onClick={handleBackToList}
                    className="md:hidden p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-primary-400 to-spiritual-400">
                      {selectedConversation.type === 'group' ? (
                        <div className="w-full h-full flex items-center justify-center">
                          {React.createElement(getGroupIcon(selectedConversation.name || ''), { 
                            className: "w-5 h-5 text-white" 
                          })}
                        </div>
                      ) : selectedConversation.participants[0]?.avatar_url ? (
                        <img
                          src={selectedConversation.participants[0].avatar_url}
                          alt={`${selectedConversation.participants[0].first_name} ${selectedConversation.participants[0].last_name}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white font-semibold text-sm">
                          {selectedConversation.participants[0]?.first_name?.[0]}{selectedConversation.participants[0]?.last_name?.[0]}
                        </div>
                      )}
                      {selectedConversation.isPinned && (
                        <div className="absolute -top-0.5 -left-0.5 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center border-2 border-white">
                          <Pin className="w-2 h-2 text-white" />
                        </div>
                      )}
                      {selectedConversation.type !== 'group' && 
                       getParticipantStatus(selectedConversation.participants[0]?.id || '') === 'online' && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <h2 className="font-semibold text-gray-900 truncate text-sm sm:text-base">
                        {selectedConversation.type === 'group' 
                          ? selectedConversation.name 
                          : `${selectedConversation.participants[0]?.first_name || ''} ${selectedConversation.participants[0]?.last_name || ''}`
                        }
                      </h2>
                      {selectedConversation.isPinned && (
                        <Pin className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
                      )}
                      {selectedConversation.type === 'direct' && 
                       selectedConversation.participants[0] && 
                       getRoleIcon(selectedConversation.participants[0].role as UserRole) && (
                        <div className="flex-shrink-0">
                          {React.createElement(getRoleIcon(selectedConversation.participants[0].role as UserRole)!, { 
                            className: "w-4 h-4 text-yellow-500" 
                          })}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {selectedConversation.type === 'group' 
                        ? `${selectedConversation.participants.length} membres`
                        : getParticipantStatus(selectedConversation.participants[0]?.id || '') === 'online'
                          ? 'En ligne'
                          : 'Hors ligne'
                      }
                      {typingUsers.size > 0 && selectedConversation.type === 'group' && (
                        <span className="ml-2 text-spiritual-600">
                          • {Array.from(typingUsers).map(id => {
                            const user = selectedConversation.participants.find(p => p.id === id);
                            return user?.first_name;
                          }).filter(Boolean).join(', ')} {typingUsers.size === 1 ? 'écrit' : 'écrivent'}...
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1 flex-shrink-0">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowPrayerPanel(!showPrayerPanel)}
                    className="hidden sm:flex text-spiritual-600 hover:bg-spiritual-50 p-2"
                  >
                    🙏
                  </Button>
                  
                  <div className="relative">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      icon={MoreVertical}
                      onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                      className="p-2"
                    />
                    
                    {showOptionsMenu && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                        <button 
                          onClick={handlePinConversation}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                        >
                          <Pin className="w-4 h-4" />
                          <span>{selectedConversation.isPinned ? 'Désépingler' : 'Épingler'}</span>
                        </button>
                        <button 
                          onClick={handleToggleNotifications}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                        >
                          <BellOff className="w-4 h-4" />
                          <span>Désactiver notifications</span>
                        </button>
                        <div className="border-t border-gray-100 my-1"></div>
                        <button 
                          onClick={handleDeleteConversation}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Supprimer</span>
                        </button>
                        <button 
                          onClick={handleReportConversation}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                        >
                          <Flag className="w-4 h-4" />
                          <span>Signaler</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Zone de messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gradient-to-b from-gray-50 to-white">
              {isLoadingMessages ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                </div>
              ) : (
                messages.map((message) => {
                  const isOwnMessage = message.sender_id === user?.id;
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group`}
                    >
                      <div className={`flex items-end space-x-2 max-w-xs sm:max-w-md lg:max-w-lg ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                        {!isOwnMessage && message.sender && (
                          <div className="w-7 h-7 rounded-full overflow-hidden bg-gradient-to-br from-primary-400 to-spiritual-400 flex-shrink-0">
                            {message.sender.avatar_url ? (
                              <img
                                src={message.sender.avatar_url}
                                alt={`${message.sender.first_name} ${message.sender.last_name}`}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white font-semibold text-xs">
                                {message.sender.first_name?.[0]}{message.sender.last_name?.[0]}
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="relative">
                          <div className={`rounded-2xl px-4 py-2.5 shadow-sm ${
                            isOwnMessage 
                              ? 'bg-gradient-to-r from-primary-600 to-spiritual-600 text-white' 
                              : 'bg-white text-gray-900 border border-gray-100'
                          }`}>
                            {message.type === 'text' && (
                              <p className="text-sm leading-relaxed break-words">{message.content}</p>
                            )}
                            
                            {message.type === 'image' && message.media_url && (
                              <div className="space-y-2">
                                <img
                                  src={message.media_url}
                                  alt="Image partagée"
                                  className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => window.open(message.media_url, '_blank')}
                                  loading="lazy"
                                />
                                {message.content !== message.sender?.first_name && (
                                  <p className="text-sm">{message.content}</p>
                                )}
                              </div>
                            )}
                            
                            {message.type === 'video' && message.media_url && (
                              <div className="space-y-2">
                                <video
                                  src={message.media_url}
                                  className="max-w-full h-auto rounded-lg"
                                  controls
                                  preload="metadata"
                                />
                                {message.content !== message.sender?.first_name && (
                                  <p className="text-sm">{message.content}</p>
                                )}
                              </div>
                            )}
                            
                            {message.type === 'file' && message.media_url && (
                              <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                                <FileText className="w-8 h-8 text-gray-500" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{message.content}</p>
                                  <p className="text-xs text-gray-500">Document</p>
                                </div>
                                <a href={message.media_url} download className="p-1 hover:bg-gray-200 rounded">
                                  <Download className="w-4 h-4" />
                                </a>
                              </div>
                            )}
                            
                            {renderReactions(message)}
                          </div>
                          
                          <div className={`flex items-center space-x-1 mt-1 ${
                            isOwnMessage ? 'justify-end' : 'justify-start'
                          }`}>
                            <p className={`text-xs ${isOwnMessage ? 'text-right text-gray-500' : 'text-left text-gray-500'}`}>
                              {formatTime(message.created_at)}
                            </p>
                            {isOwnMessage && (
                              <div className="flex items-center">
                                {renderReadReceipt(message)}
                              </div>
                            )}
                          </div>
                          
                          {/* Bouton de réaction (survol) */}
                          <button
                            onClick={() => setShowReactionPicker(showReactionPicker === message.id ? null : message.id)}
                            className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full shadow-md p-1"
                          >
                            <Smile className="w-3.5 h-3.5 text-gray-500" />
                          </button>
                          
                          {/* Picker de réaction */}
                          {showReactionPicker === message.id && (
                            <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-50">
                              <div className="grid grid-cols-4 gap-1">
                                {QUICK_REACTIONS.map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={() => handleAddReaction(message.id, emoji)}
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
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Zone de saisie - AGRANDIE */}
            <div className="bg-white border-t border-gray-200 p-3 flex-shrink-0 overflow-hidden">
              <div className="flex items-center space-x-1 mb-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors flex-shrink-0"
                  title="Joindre un fichier"
                >
                  <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.accept = 'image/*';
                      fileInputRef.current.click();
                    }
                  }}
                  className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors flex-shrink-0"
                  title="Envoyer une image"
                >
                  <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={() => setShowPrayerPanel(!showPrayerPanel)}
                  className="p-2 text-spiritual-600 hover:bg-spiritual-50 rounded-full transition-colors flex-shrink-0"
                  title="Envoyer une intention de prière"
                >
                  <span className="text-base sm:text-lg">🙏</span>
                </button>
              </div>
              
              <div className="flex items-end space-x-2 sm:space-x-3">
                <div className="flex-1 min-w-0 relative">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Tapez votre message..."
                    rows={2}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3.5 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors resize-none bg-gray-50 hover:bg-white text-sm sm:text-base leading-relaxed"
                    style={{ minHeight: '52px', maxHeight: '150px' }}
                  />
                </div>
                
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 sm:p-3 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors flex-shrink-0"
                >
                  <Smile className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
                
                <Button 
                  variant="spiritual" 
                  size="sm"
                  icon={Send}
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="rounded-full w-10 h-10 sm:w-12 sm:h-12 p-0 flex-shrink-0"
                />
              </div>
              
              {/* Picker d'emoji */}
              {showEmojiPicker && (
                <div className="absolute bottom-24 right-4 bg-white rounded-lg shadow-xl border border-gray-200 p-3 sm:p-4 z-50">
                  <div className="grid grid-cols-6 gap-1 sm:gap-2">
                    {ALL_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => {
                          setNewMessage(prev => prev + emoji);
                          setShowEmojiPicker(false);
                          handleTyping();
                        }}
                        className="w-7 h-7 sm:w-9 sm:h-9 hover:bg-gray-100 rounded-lg flex items-center justify-center text-base sm:text-xl transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-spiritual-50 to-primary-50">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Sélectionnez une conversation
              </h3>
              <p className="text-gray-600 mb-6">
                Choisissez une conversation pour commencer à échanger
              </p>
              <div className="flex justify-center space-x-4">
                <Button 
                  variant="primary" 
                  icon={UserPlus} 
                  onClick={() => setIsNewConversationModalOpen(true)}
                >
                  Nouveau message
                </Button>
                <Button 
                  variant="outline" 
                  icon={Users} 
                  onClick={() => setIsCreateGroupModalOpen(true)}
                >
                  Créer un groupe
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Panneau de prière */}
      {showPrayerPanel && (
        <div className="w-80 bg-white border-l border-gray-200 p-4 hidden lg:block">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Intentions de prière</h3>
            <button
              onClick={() => setShowPrayerPanel(false)}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              ✕
            </button>
          </div>
          <Card padding="sm">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-spiritual-400 to-primary-400 rounded-full flex items-center justify-center mx-auto mb-3">
                🙏
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Envoyer une intention</h4>
              <textarea
                placeholder="Partagez votre intention de prière..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
              />
              <Button variant="spiritual" size="sm" fullWidth className="mt-3">
                Envoyer 🙏
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal de signalement */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Signaler la conversation</h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                ✕
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Pourquoi signalez-vous cette conversation ?
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Raison <span className="text-red-500">*</span>
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Sélectionner une raison...</option>
                  <option value="contenu_inapproprié">Contenu inapproprié</option>
                  <option value="harcèlement">Harcèlement</option>
                  <option value="spam">Spam</option>
                  <option value="contenu_offensant">Contenu offensant</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Détails (optionnel)
                </label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Fournissez plus de détails..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <Button variant="outline" fullWidth onClick={() => setShowReportModal(false)}>
                Annuler
              </Button>
              <Button 
                variant="danger" 
                fullWidth 
                onClick={handleSubmitReport}
                disabled={!reportReason.trim()}
              >
                Signaler
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <NewConversationModal
        isOpen={isNewConversationModalOpen}
        onClose={() => setIsNewConversationModalOpen(false)}
        onConversationCreated={handleConversationCreated}
      />

      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        onGroupCreated={handleGroupCreated}
      />

      {/* Overlays */}
      {(showOptionsMenu || showEmojiPicker || showReactionPicker) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setShowOptionsMenu(false);
            setShowEmojiPicker(false);
            setShowReactionPicker(null);
          }}
        />
      )}
    </div>
  );
};