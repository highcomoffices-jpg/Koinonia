import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Home, Church, Plus, Heart, User, Bell, Settings, ShoppingBag, BookOpen, 
  Users, MessageCircle, Calendar, Award, Menu, X, Sparkles, MapPin, Zap,
  Shield, Flag, DollarSign, UserPlus, Crown, LayoutDashboard, Filter, Video,
  Building2, LogOut
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ShepherdGrade } from '../../types';
import { supabase } from '../../lib/supabase';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onAdminModalOpen?: (modal: string) => void;
  shepherdGrade?: ShepherdGrade;
  isAdmin?: boolean;
  isSidebarOpen?: boolean;
  onCloseSidebar?: () => void;
}

type CategoryType = 'principal' | 'communaute';

// Clé pour le stockage en sessionStorage
const STORAGE_KEY = 'koinonia_active_category';

export const Navigation: React.FC<NavigationProps> = ({ 
  activeTab, 
  onTabChange, 
  onAdminModalOpen,
  shepherdGrade,
  isAdmin,
  isSidebarOpen = false,
  onCloseSidebar
}) => {
  const { t } = useTranslation();
  const { user, isLoading: authLoading, isSuperAdmin, isShepherd, logout } = useAuth();
  console.log('🔍 [Navigation] isSuperAdmin:', isSuperAdmin);
  console.log('🔍 [Navigation] isShepherd:', isShepherd);
  console.log('🔍 [Navigation] user?.role:', user?.role);
  console.log('🔍 [Navigation] user?.shepherdGrade:', user?.shepherdGrade);
  const [isMobile, setIsMobile] = useState(false);
  const [unreadCount, setUnreadCount] = useState(5);
  const [liveNowCount, setLiveNowCount] = useState(0);
  
  // Ne pas afficher le menu tant que l'authentification n'est pas chargée
  if (authLoading) {
    return null;
  }

  // Récupérer la catégorie sauvegardée dans sessionStorage ou utiliser 'principal' par défaut
  const getSavedCategory = (): CategoryType => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved === 'principal' || saved === 'communaute') {
        return saved;
      }
    } catch (error) {
      console.error('Error reading sessionStorage:', error);
    }
    return 'principal';
  };

  const [activeCategory, setActiveCategory] = useState<CategoryType>(getSavedCategory);

  // Sauvegarder la catégorie dans sessionStorage à chaque changement
  const handleCategoryChange = (category: CategoryType) => {
    setActiveCategory(category);
    try {
      sessionStorage.setItem(STORAGE_KEY, category);
    } catch (error) {
      console.error('Error saving to sessionStorage:', error);
    }
  };

  // Détecter la taille de l'écran
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Charger le nombre de lives en direct
  useEffect(() => {
    const fetchLiveCount = async () => {
      try {
        const { count, error } = await supabase
          .from('live_celebrations')
          .select('*', { count: 'exact', head: true })
          .eq('live_status', 'live');

        if (error) throw error;
        setLiveNowCount(count || 0);
      } catch (error) {
        console.error('Error fetching live count:', error);
      }
    };

    fetchLiveCount();

    // Abonnement en temps réel aux changements
    const channel = supabase
      .channel('live-count-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_celebrations',
        },
        () => {
          fetchLiveCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Items de la catégorie "Principal"
  const principalItems = [
    { id: 'home', label: t('home'), icon: Home, link: '/' },
    { id: 'parishes', label: t('parishes'), icon: Church, link: '/parishes' },
    { id: 'market', label: 'Market', icon: ShoppingBag, link: '/market' },
    { id: 'spirituality', label: 'Spiritualité', icon: Sparkles, link: '/spirituality' },
    { id: 'formations', label: 'Formations', icon: Award, link: '/formations' },
  ];

  // Items de la catégorie "Communauté"
  const communauteItems = [
    { id: 'activities', label: 'Activités', icon: Calendar, link: '/activities' },
    { id: 'groups', label: 'Groupes', icon: Users, link: '/groups' },
    { id: 'live-celebrations', label: 'Live', icon: Zap, link: '/live-celebrations' },
    { id: 'chat', label: 'Chat', icon: MessageCircle, link: '/chat' },
    { id: 'create', label: t('create'), icon: Plus, link: '/create' },
    { id: 'subscriptions', label: t('subscriptions'), icon: Heart, link: '/subscriptions' },
  ];

  const userNavigationItems = [
    { id: 'profile', label: t('profile'), icon: User, link: '/profile' },
    { id: 'notifications', label: t('notifications'), icon: Bell, link: '/notifications', badge: unreadCount },
    { id: 'settings', label: t('settings'), icon: Settings, link: '/settings' },
  ];

  // ============================================
  // BOUTONS ADMINISTRATIFS UNIQUES ET REMARQUABLES
  // ============================================

  // Bouton Dashboard Admin (super_admin uniquement) - style remarquable
  const adminButton = isSuperAdmin && (
    <Link
      to="/admin/koinonia"
      onClick={() => handleTabChange('koinonia-admin')}
      className="flex items-center justify-center gap-3 w-full mt-4 mb-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg font-semibold"
    >
      <Shield className="w-5 h-5" />
      <span>Dashboard Admin</span>
    </Link>
  );

  // Bouton Gestion de l'Église (bergers uniquement) - style remarquable
  const parishButton = isShepherd && (
    <Link
      to="/admin/parish"
      onClick={() => handleTabChange('parish-management')}
      className="flex items-center justify-center gap-3 w-full mt-4 mb-2 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg font-semibold"
    >
      <Building2 className="w-5 h-5" />
      <span>Gestion de l'Église</span>
    </Link>
  );

  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    // Fermer la sidebar si la fonction onCloseSidebar est fournie (mobile)
    if (onCloseSidebar) {
      onCloseSidebar();
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      if (onCloseSidebar) {
        onCloseSidebar();
      }
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  // Rendu des items de navigation selon la catégorie active
  const renderNavItems = (items: typeof principalItems) => {
    return items.map((item) => {
      const Icon = item.icon;
      const isActive = activeTab === item.id;
      const isLiveItem = item.id === 'live-celebrations';
      
      return (
        <button
          key={item.id}
          onClick={() => handleTabChange(item.id)}
          className={`flex items-center space-x-3 w-full px-3 py-2.5 rounded-lg transition-colors text-left mb-1 ${
            isActive
              ? 'text-primary-600 bg-primary-50'
              : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Icon className="w-4 h-4" />
          <span className="text-sm font-medium">{item.label}</span>
          {item.id === 'spirituality' && (
            <span className="ml-auto text-xs bg-gradient-to-r from-spiritual-500 to-primary-500 text-white px-1.5 py-0.5 rounded-full">
              Premium
            </span>
          )}
          {item.id === 'chat' && (
            <span className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">3</span>
          )}
          {isLiveItem && liveNowCount > 0 && (
            <span className="ml-auto bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full animate-pulse">
              LIVE
            </span>
          )}
        </button>
      );
    });
  };

  // ============================================
  // Rendu du contenu de la sidebar (commun pour mobile et desktop)
  // ============================================
  const renderSidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* En-tête avec boutons de catégorie */}
      <div className="sticky top-0 bg-white z-10 p-4 border-b border-gray-200">
        {isMobile && (
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
            <button
              onClick={() => onCloseSidebar && onCloseSidebar()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        )}
        
        {/* Boutons de catégorie */}
        <div className="flex gap-2">
          <button
            onClick={() => handleCategoryChange('principal')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeCategory === 'principal'
                ? 'bg-gradient-to-r from-primary-600 to-spiritual-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Principal
          </button>
          <button
            onClick={() => handleCategoryChange('communaute')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeCategory === 'communaute'
                ? 'bg-gradient-to-r from-primary-600 to-spiritual-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Communauté
          </button>
        </div>
      </div>

      {/* Contenu avec filtrage par catégorie */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Message profil incomplet */}
        {!user?.profileComplete && (
          <div className="bg-warm-50 border border-warm-200 rounded-lg p-3">
            <p className="text-sm text-warm-800 font-medium">
              Profil incomplet
            </p>
            <p className="text-xs text-warm-600 mt-1">
              Votre accès est limité. Complétez votre profil.
            </p>
            {isMobile && (
              <button
                onClick={() => handleTabChange('profile')}
                className="mt-2 text-xs text-primary-600 font-medium hover:underline"
              >
                Compléter mon profil →
              </button>
            )}
          </div>
        )}

        {/* Section principale (filtrée par catégorie) */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">
            {activeCategory === 'principal' ? 'Principal' : 'Communauté'}
          </h3>
          {activeCategory === 'principal' 
            ? principalItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`flex items-center space-x-3 w-full px-3 py-3 rounded-lg transition-colors text-left ${
                      isActive
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={isMobile ? 'w-5 h-5' : 'w-4 h-4'} />
                    <span className="font-medium">{item.label}</span>
                    {item.id === 'spirituality' && (
                      <span className="ml-auto text-xs bg-gradient-to-r from-spiritual-500 to-primary-500 text-white px-2 py-0.5 rounded-full">
                        Premium
                      </span>
                    )}
                  </button>
                );
              })
            : communauteItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const isLiveItem = item.id === 'live-celebrations';
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`flex items-center space-x-3 w-full px-3 py-3 rounded-lg transition-colors text-left ${
                      isActive
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={isMobile ? 'w-5 h-5' : 'w-4 h-4'} />
                    <span className="font-medium">{item.label}</span>
                    {item.id === 'chat' && (
                      <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">3</span>
                    )}
                    {isLiveItem && liveNowCount > 0 && (
                      <span className="ml-auto bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
                        LIVE
                      </span>
                    )}
                  </button>
                );
              })
          }
        </div>

        {/* Bouton Gestion de l'Église (berger) */}
        {parishButton}

        {/* Bouton Dashboard Admin (super_admin) */}
        {adminButton}

        {/* Section personnel (toujours visible) */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">
            Personnel
          </h3>
          {userNavigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`flex items-center space-x-3 w-full px-3 py-3 rounded-lg transition-colors text-left ${
                  isActive
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className={isMobile ? 'w-5 h-5' : 'w-4 h-4'} />
                <span className="font-medium">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
          
          {/* Bouton de déconnexion */}
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full px-3 py-3 rounded-lg transition-colors text-left text-red-600 hover:bg-red-50 mt-2"
          >
            <LogOut className={isMobile ? 'w-5 h-5' : 'w-4 h-4'} />
            <span className="font-medium">Déconnexion</span>
          </button>
        </div>
      </div>
    </div>
  );

  // ============================================
  // VERSION MOBILE : Sidebar en tiroir contrôlée par le parent
  // ============================================
  if (isMobile) {
    return (
      <>
        {/* Sidebar mobile latérale (glisse depuis la gauche) - contrôlée par le parent */}
        {isSidebarOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300"
              onClick={() => onCloseSidebar && onCloseSidebar()}
            />
            <div className="fixed top-0 left-0 bottom-0 w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-out overflow-y-auto">
              {renderSidebarContent()}
            </div>
          </>
        )}
      </>
    );
  }

  // ============================================
  // VERSION DESKTOP : Sidebar fixe à gauche
  // ============================================
  return (
    <nav className="hidden md:block fixed left-0 top-14 bottom-0 w-64 bg-white border-r border-gray-200 overflow-y-auto z-30">
      <div className="p-4">
        {renderSidebarContent()}
      </div>
    </nav>
  );
};