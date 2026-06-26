import React, { useState, useEffect } from 'react';
import { Settings, Moon, Sun, Monitor, Bell, Lock, Globe, Eye, Volume2, Database, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { settingsService, UserSettings } from '../../services/settingsService';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { EditProfileModal } from '../profile/EditProfileModal';

export const SettingsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const data = await settingsService.getSettings();
      setSettings(data);
      setIsLoading(false);
    };
    loadSettings();
  }, []);

  const handleUpdate = async (key: keyof UserSettings, value: any) => {
    setIsSaving(true);
    const success = await settingsService.updateSettings({ [key]: value });
    if (success) {
      setSettings(prev => prev ? { ...prev, [key]: value } : null);
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const languageOptions = [
    { value: 'fr', label: 'Français' },
    { value: 'en', label: 'English' },
    { value: 'sw', label: 'Kiswahili' },
  ];

  const themeOptions = [
    { value: 'light', label: 'Clair', icon: Sun },
    { value: 'dark', label: 'Sombre', icon: Moon },
    { value: 'system', label: 'Système', icon: Monitor },
  ];

  const fontSizeOptions = [
    { value: 'small', label: 'Petite' },
    { value: 'medium', label: 'Moyenne' },
    { value: 'large', label: 'Grande' },
  ];

  const visibilityOptions = [
    { value: 'public', label: 'Public – Tout le monde' },
    { value: 'subscribers', label: 'Abonnés – Mes abonnés uniquement' },
    { value: 'parish', label: 'Paroisse – Ma paroisse uniquement' },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="w-6 h-6" />
          Paramètres
        </h1>
        <p className="text-gray-600 text-sm">Gérez vos préférences et votre compte</p>
      </div>

      {/* Section Profil */}
      <Card>
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-spiritual-400 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{user?.firstName} {user?.lastName}</h3>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsEditProfileOpen(true)}>
            Modifier le profil
          </Button>
        </div>
      </Card>

      {/* Section Apparence */}
      <Card>
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Sun className="w-4 h-4 text-purple-600" />
            </div>
            Apparence
          </h3>
        </div>
        <div className="p-4 space-y-4">
          <Select
            label="Thème"
            value={settings?.theme || 'light'}
            onChange={(e) => handleUpdate('theme', e.target.value)}
            options={themeOptions}
          />
          <Select
            label="Taille de police"
            value={settings?.font_size || 'medium'}
            onChange={(e) => handleUpdate('font_size', e.target.value)}
            options={fontSizeOptions}
          />
        </div>
      </Card>

      {/* Section Confidentialité */}
      <Card>
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Eye className="w-4 h-4 text-blue-600" />
            </div>
            Confidentialité
          </h3>
        </div>
        <div className="p-4 space-y-4">
          <Select
            label="Visibilité par défaut des publications"
            value={settings?.default_visibility || 'public'}
            onChange={(e) => handleUpdate('default_visibility', e.target.value)}
            options={visibilityOptions}
          />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Confirmation avant publication</p>
              <p className="text-sm text-gray-500">Demander confirmation avant de publier un post</p>
            </div>
            <button
              onClick={() => handleUpdate('confirm_before_publish', !settings?.confirm_before_publish)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings?.confirm_before_publish ? 'bg-primary-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings?.confirm_before_publish ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </Card>

      {/* Section Notifications */}
      <Card>
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Bell className="w-4 h-4 text-green-600" />
            </div>
            Notifications
          </h3>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Likes</p>
              <p className="text-sm text-gray-500">Être notifié quand quelqu'un aime votre post</p>
            </div>
            <button
              onClick={() => handleUpdate('notifications_push_like', !settings?.notifications_push_like)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings?.notifications_push_like ? 'bg-primary-600' : 'bg-gray-300'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings?.notifications_push_like ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Commentaires</p>
              <p className="text-sm text-gray-500">Être notifié quand quelqu'un commente</p>
            </div>
            <button
              onClick={() => handleUpdate('notifications_push_comment', !settings?.notifications_push_comment)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings?.notifications_push_comment ? 'bg-primary-600' : 'bg-gray-300'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings?.notifications_push_comment ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Nouveaux abonnés</p>
              <p className="text-sm text-gray-500">Être notifié quand quelqu'un vous suit</p>
            </div>
            <button
              onClick={() => handleUpdate('notifications_push_follow', !settings?.notifications_push_follow)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings?.notifications_push_follow ? 'bg-primary-600' : 'bg-gray-300'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings?.notifications_push_follow ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Résumé quotidien par email</p>
              <p className="text-sm text-gray-500">Recevoir un résumé de votre activité par email</p>
            </div>
            <button
              onClick={() => handleUpdate('notifications_email_summary', !settings?.notifications_email_summary)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings?.notifications_email_summary ? 'bg-primary-600' : 'bg-gray-300'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings?.notifications_email_summary ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </Card>

      {/* Section Langue */}
      <Card>
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Globe className="w-4 h-4 text-yellow-600" />
            </div>
            Langue
          </h3>
        </div>
        <div className="p-4">
          <Select
            label="Langue de l'interface"
            value={settings?.language || 'fr'}
            onChange={(e) => handleUpdate('language', e.target.value)}
            options={languageOptions}
          />
        </div>
      </Card>

      {/* Section Compte */}
      <Card>
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <Lock className="w-4 h-4 text-red-600" />
            </div>
            Compte
          </h3>
        </div>
        <div className="p-4 space-y-3">
          <Button variant="outline" fullWidth icon={Database} onClick={() => alert('Export des données - À implémenter')}>
            Exporter mes données
          </Button>
          <Button variant="danger" fullWidth icon={LogOut} onClick={logout}>
            Se déconnecter
          </Button>
        </div>
      </Card>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        onUpdate={() => {
          setIsEditProfileOpen(false);
          window.location.reload();
        }}
      />
    </div>
  );
};