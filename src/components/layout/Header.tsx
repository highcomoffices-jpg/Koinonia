import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Cross, Bell, User, Settings, LogOut, ChevronDown, Globe, Menu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  onAdminModalOpen?: (modal: string) => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onAdminModalOpen,
  isSidebarOpen = false,
  onToggleSidebar
}) => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setShowUserMenu(false);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-100 fixed top-0 left-0 right-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-12 sm:h-14">
          {/* Logo avec bouton menu hamburger */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Bouton menu hamburger - visible sur mobile uniquement */}
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="md:hidden p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Menu"
              >
                <Menu className="w-5 h-5 text-gray-700" />
              </button>
            )}
            
            <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-spiritual-600 rounded-lg flex items-center justify-center">
              <Cross className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-display font-semibold text-gray-900">
                Koinonia
              </h1>
              <p className="text-xs text-gray-500 hidden sm:block">Communauté Chrétienne</p>
            </div>
          </div>

          {/* Actions utilisateur */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-7 h-7 bg-gradient-to-br from-primary-400 to-spiritual-400 rounded-full flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {t(`role.${user.role}`)} • {t(`level.${user.level}`)}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {/* Menu déroulant */}
              {showUserMenu && (
                <>
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    {/* Profil utilisateur (visible sur mobile) */}
                    <div className="px-4 py-3 border-b border-gray-100 sm:hidden">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-spiritual-400 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {t(`role.${user.role}`)} • {t(`level.${user.level}`)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Sélecteur de langue */}
                    <div className="px-4 py-2">
                      <div className="flex items-center space-x-2 mb-2">
                        <Globe className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Langue</span>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => changeLanguage('fr')}
                          className={`px-2 py-1 text-xs rounded ${
                            i18n.language === 'fr' ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          FR
                        </button>
                        <button
                          onClick={() => changeLanguage('en')}
                          className={`px-2 py-1 text-xs rounded ${
                            i18n.language === 'en' ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          EN
                        </button>
                        <button
                          onClick={() => changeLanguage('sw')}
                          className={`px-2 py-1 text-xs rounded ${
                            i18n.language === 'sw' ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          SW
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 my-2"></div>

                    {/* Actions */}
                    <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
                      <Bell className="w-4 h-4" />
                      <span>Notifications</span>
                    </button>
                    
                    <button 
                      onClick={() => {
                        setShowUserMenu(false);
                        if (onAdminModalOpen) onAdminModalOpen('settings');
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Paramètres</span>
                    </button>

                    <div className="border-t border-gray-100 my-2"></div>

                    <button 
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{t('logout')}</span>
                    </button>
                  </div>
                  
                  {/* Overlay pour fermer le menu */}
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};