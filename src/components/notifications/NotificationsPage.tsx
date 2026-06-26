import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { notificationService, Notification } from '../../services/notificationService';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await notificationService.getNotifications({
        onlyUnread: filter === 'unread',
        limit: 50,
      });
      setNotifications(data);
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [filter]);

  const handleMarkAsRead = async (id: string) => {
    await notificationService.markAsRead(id);
    await loadNotifications();
  };

  const handleMarkAllAsRead = async () => {
    await notificationService.markAllAsRead();
    await loadNotifications();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Supprimer cette notification ?')) {
      await notificationService.deleteNotification(id);
      await loadNotifications();
    }
  };

  const handleDeleteAll = async () => {
    if (confirm('Supprimer toutes les notifications ?')) {
      await notificationService.deleteAllNotifications();
      await loadNotifications();
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await notificationService.markAsRead(notification.id);
    }
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'like': return '❤️';
      case 'comment': return '💬';
      case 'follow': return '👤';
      case 'share': return '🔄';
      case 'post_validated': return '✅';
      case 'post_rejected': return '❌';
      case 'system': return '🔔';
      default: return '📢';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6" />
            Notifications
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
              </span>
            )}
          </h1>
          <p className="text-gray-600 text-sm">Restez informé de votre activité</p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              icon={CheckCheck}
              onClick={handleMarkAllAsRead}
            >
              Tout lire
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              icon={Trash2}
              onClick={handleDeleteAll}
              className="text-red-600 hover:text-red-700"
            >
              Tout supprimer
            </Button>
          )}
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            filter === 'all'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Toutes
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
            filter === 'unread'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Non lues
          {unreadCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-500 text-white rounded-full">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Liste des notifications */}
      {notifications.length === 0 ? (
        <Card className="text-center py-12">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Aucune notification
          </h3>
          <p className="text-gray-500">
            {filter === 'unread' 
              ? 'Vous avez lu toutes vos notifications.' 
              : 'Vous n\'avez pas encore de notifications.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`p-4 rounded-lg cursor-pointer transition-colors ${
                notification.is_read
                  ? 'bg-white hover:bg-gray-50 border border-gray-100'
                  : 'bg-primary-50 hover:bg-primary-100 border-l-4 border-l-primary-500'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl flex-shrink-0">
                  {getIconForType(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className={`font-medium ${!notification.is_read ? 'text-primary-900' : 'text-gray-900'}`}>
                        {notification.title}
                      </h4>
                      <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
                        {notification.content}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {!notification.is_read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification.id);
                          }}
                          className="p-1 text-gray-400 hover:text-primary-600 rounded"
                          title="Marquer comme lue"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(notification.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};