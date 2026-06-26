import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter, Users, Plus, Lock, Globe, EyeOff, MessageCircle, Heart, Crown, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Card } from '../ui/Card';
import { Pagination } from '../ui/Pagination';
import { usePagination } from '../../hooks/usePagination';
import { groupService, EnrichedGroup } from '../../services/groupService';
import { GroupType, GroupVisibility } from '../../types';

const getVisibilityIcon = (visibility: GroupVisibility) => {
  switch (visibility) {
    case GroupVisibility.PUBLIC: return Globe;
    case GroupVisibility.PRIVATE: return Lock;
    case GroupVisibility.SECRET: return EyeOff;
    default: return Globe;
  }
};

const getVisibilityColor = (visibility: GroupVisibility) => {
  switch (visibility) {
    case GroupVisibility.PUBLIC: return 'bg-green-100 text-green-800';
    case GroupVisibility.PRIVATE: return 'bg-blue-100 text-blue-800';
    case GroupVisibility.SECRET: return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const GroupsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [groups, setGroups] = useState<EnrichedGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userGroups, setUserGroups] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<GroupType | ''>('');
  const [selectedVisibility, setSelectedVisibility] = useState<GroupVisibility | ''>('');
  const [showMyGroups, setShowMyGroups] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    public: 0,
    private: 0,
    secret: 0,
    totalMembers: 0
  });

  // Charger les groupes depuis Supabase
  useEffect(() => {
    const fetchGroups = async () => {
      setIsLoading(true);
      try {
        const data = await groupService.getGroups();
        setGroups(data);
        
        // Charger les stats
        const groupStats = await groupService.getGroupStats();
        setStats(groupStats);
        
        // Charger les groupes de l'utilisateur
        if (user) {
          const userGroupsList = await groupService.getUserGroups(user.id);
          setUserGroups(userGroupsList.map(g => g.id));
        }
      } catch (error) {
        console.error('Error fetching groups:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroups();
  }, [user]);

  // Filtrer les groupes
  const filteredGroups = useMemo(() => {
    let filtered = [...groups];

    if (searchTerm) {
      filtered = filtered.filter(g => 
        g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (g.description && g.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedType) {
      filtered = filtered.filter(g => g.type === selectedType);
    }

    if (selectedVisibility) {
      filtered = filtered.filter(g => g.visibility === selectedVisibility);
    }

    // Filtrer mes groupes
    if (showMyGroups) {
      filtered = filtered.filter(g => userGroups.includes(g.id));
    }

    // Filtrer par confession de l'utilisateur
    if (user?.confession?.id) {
      filtered = filtered.filter(g => 
        !g.confession_ids || g.confession_ids.length === 0 || 
        g.confession_ids.includes(user.confession!.id)
      );
    }

    return filtered;
  }, [groups, searchTerm, selectedType, selectedVisibility, showMyGroups, userGroups, user]);

  // Pagination
  const {
    currentPage,
    totalPages,
    paginatedData: paginatedGroups,
    goToPage,
    resetPagination
  } = usePagination({ data: filteredGroups, itemsPerPage: 20 });

  React.useEffect(() => {
    resetPagination();
  }, [searchTerm, selectedType, selectedVisibility, showMyGroups, resetPagination]);

  const groupTypeOptions = [
    { value: '', label: 'Tous les types' },
    { value: GroupType.PRAYER, label: 'Prière' },
    { value: GroupType.BIBLE_STUDY, label: 'Étude biblique' },
    { value: GroupType.YOUTH, label: 'Jeunesse' },
    { value: GroupType.FAMILY, label: 'Famille' },
    { value: GroupType.MINISTRY, label: 'Ministère' },
    { value: GroupType.SUPPORT, label: 'Soutien' },
    { value: GroupType.DISCUSSION, label: 'Discussion' },
    { value: GroupType.PROFESSIONAL, label: 'Professionnel' },
    { value: GroupType.REGIONAL, label: 'Régional' },
    { value: GroupType.OTHER, label: 'Autre' }
  ];

  const visibilityOptions = [
    { value: '', label: 'Toutes visibilités' },
    { value: GroupVisibility.PUBLIC, label: 'Public' },
    { value: GroupVisibility.PRIVATE, label: 'Privé' },
    { value: GroupVisibility.SECRET, label: 'Secret' }
  ];

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedType('');
    setSelectedVisibility('');
    setShowMyGroups(false);
  };

  const handleJoinGroup = async (groupId: string) => {
    const success = await groupService.joinGroup(groupId);
    if (success) {
      setUserGroups(prev => [...prev, groupId]);
      // Mettre à jour le compteur local
      setGroups(prev => prev.map(g => 
        g.id === groupId ? { ...g, member_count: (g.member_count || 0) + 1 } : g
      ));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* En-tête */}
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div className="text-center lg:text-left">
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">
              Groupes Communautaires
            </h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">
              Rejoignez des groupes de discussion et d'entraide chrétienne
            </p>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <Button variant="outline" icon={MessageCircle} className="w-full sm:w-auto">
              Mes conversations
            </Button>
            <Button variant="primary" icon={Plus} className="w-full sm:w-auto">
              Créer un groupe
            </Button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card padding="sm" className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-primary-600">{stats.total}</div>
            <div className="text-xs sm:text-sm text-gray-600">Groupes disponibles</div>
          </Card>
          <Card padding="sm" className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-spiritual-600">{userGroups.length}</div>
            <div className="text-xs sm:text-sm text-gray-600">Mes groupes</div>
          </Card>
          <Card padding="sm" className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-warm-600">{stats.public}</div>
            <div className="text-xs sm:text-sm text-gray-600">Groupes publics</div>
          </Card>
          <Card padding="sm" className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.totalMembers}</div>
            <div className="text-xs sm:text-sm text-gray-600">Membres total</div>
          </Card>
        </div>

        {/* Filtres - Version améliorée avec bouton "Mes groupes" mieux intégré */}
        <Card>
          <div className="space-y-4">
            {/* Ligne de recherche */}
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Rechercher un groupe..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon={Search}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={showMyGroups ? "primary" : "outline"}
                  size="sm"
                  icon={Users}
                  onClick={() => setShowMyGroups(!showMyGroups)}
                  className="whitespace-nowrap"
                >
                  <span className="flex items-center gap-1.5">
                    {showMyGroups && <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
                    Mes groupes
                  </span>
                </Button>
                {(searchTerm || selectedType || selectedVisibility || showMyGroups) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </Button>
                )}
              </div>
            </div>

            {/* Ligne des filtres */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as GroupType | '')}
                options={groupTypeOptions}
                className="flex-1"
              />
              <Select
                value={selectedVisibility}
                onChange={(e) => setSelectedVisibility(e.target.value as GroupVisibility | '')}
                options={visibilityOptions}
                className="flex-1"
              />
            </div>

            {/* Résultats */}
            {(searchTerm || selectedType || selectedVisibility || showMyGroups) && (
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <p className="text-sm text-gray-600">
                  {filteredGroups.length} groupe{filteredGroups.length > 1 ? 's' : ''} trouvé{filteredGroups.length > 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Liste des groupes */}
        {filteredGroups.length === 0 ? (
          <Card className="text-center py-8 sm:py-12">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucun groupe trouvé
            </h3>
            <p className="text-gray-600 mb-4 text-sm sm:text-base px-4">
              Aucun groupe ne correspond à vos critères de recherche.
            </p>
            <Button variant="primary" icon={Plus}>
              Créer un groupe
            </Button>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {paginatedGroups.map((group) => (
                <GroupCard 
                  key={group.id} 
                  group={group}
                  isMember={userGroups.includes(group.id)}
                  onJoin={() => handleJoinGroup(group.id)}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={goToPage}
                totalItems={filteredGroups.length}
                itemsPerPage={20}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

interface GroupCardProps {
  group: EnrichedGroup;
  isMember: boolean;
  onJoin: () => void;
}

const GroupCard: React.FC<GroupCardProps> = ({ group, isMember, onJoin }) => {
  const [isLiked, setIsLiked] = useState(false);
  
  const VisibilityIcon = getVisibilityIcon(group.visibility as GroupVisibility);
  const isFull = group.max_members && (group.member_count || 0) >= group.max_members;
  const isCreator = false; // À vérifier avec l'utilisateur connecté

  const handleLike = () => {
    setIsLiked(!isLiked);
  };

  const handleJoin = () => {
    onJoin();
  };

  const handleChat = () => {
    console.log('Ouvrir le chat du groupe:', group.id);
  };

  return (
    <Card hover className="h-full flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="w-10 h-10 bg-gradient-to-br from-spiritual-400 to-primary-400 rounded-lg flex items-center justify-center flex-shrink-0">
            {group.image_url ? (
              <img
                src={group.image_url}
                alt={group.name}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <Users className="w-5 h-5 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-1">
              {group.name}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`px-2 py-1 text-xs rounded-full ${getVisibilityColor(group.visibility as GroupVisibility)}`}>
                <VisibilityIcon className="w-3 h-3 inline mr-1" />
                {group.visibility}
              </span>
              {isMember && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  Membre
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={handleLike}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
        </button>
      </div>

      <div className="flex-1 space-y-3">
        <p className="text-sm text-gray-600 line-clamp-3">
          {group.description}
        </p>

        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <div className="w-5 h-5 bg-gradient-to-br from-primary-400 to-spiritual-400 rounded-full flex items-center justify-center">
            <span className="text-xs text-white font-bold">
              {group.creator?.first_name?.[0] || 'U'}
            </span>
          </div>
          <span>Créé par {group.creator?.first_name || 'Utilisateur'} {group.creator?.last_name || ''}</span>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4" />
            <span>
              {group.member_count || 0}{group.max_members ? `/${group.max_members}` : ''} membres
            </span>
          </div>
          <div className="text-xs">
            {group.created_at ? new Intl.DateTimeFormat('fr', { 
              day: 'numeric', 
              month: 'short' 
            }).format(new Date(group.created_at)) : 'Nouveau'}
          </div>
        </div>

        {group.confession_ids && group.confession_ids.length > 0 && (
          <div className="text-xs text-gray-500">
            <span className="font-medium">Confessions :</span> 
            {group.confession_ids.length === 1 ? ' Spécifique' : ' Multi-confessionnel'}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
        <div className="text-sm text-gray-500">
          {group.type}
        </div>
        <div className="flex space-x-2">
          {isMember ? (
            <Button variant="primary" size="sm" onClick={handleChat}>
              <MessageCircle className="w-4 h-4 mr-1" />
              Chat
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleJoin}
              disabled={isFull}
            >
              {isFull ? 'Complet' : group.visibility === 'private' ? 'Demander' : 'Rejoindre'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};