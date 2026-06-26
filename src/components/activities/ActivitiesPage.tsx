import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter, Calendar, MapPin, Clock, Users, Plus, Church, BookOpen, Heart, Music, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Card } from '../ui/Card';
import { activityService, EnrichedActivity } from '../../services/activityService';
import { ActivityType } from '../../types';

export const ActivitiesPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activities, setActivities] = useState<EnrichedActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [registeredActivities, setRegisteredActivities] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<ActivityType | ''>('');
  const [selectedParish, setSelectedParish] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [stats, setStats] = useState({
    totalUpcoming: 0,
    totalMasses: 0,
    totalCharity: 0,
    totalParticipants: 0
  });

  // Charger les activités depuis Supabase
  useEffect(() => {
    const fetchActivities = async () => {
      setIsLoading(true);
      try {
        const data = await activityService.getActivities({
          dateFilter: dateFilter === 'all' ? undefined : dateFilter as any
        });
        setActivities(data);
        
        // Charger les stats
        const activityStats = await activityService.getActivityStats();
        setStats(activityStats);
        
        // Charger les inscriptions de l'utilisateur
        if (user) {
          const userActivities = await activityService.getUserActivities(user.id);
          setRegisteredActivities(userActivities.map(a => a.id));
        }
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, [user]);

  // Filtrer les activités (re-filtrage côté client pour les filtres dynamiques)
  const filteredActivities = useMemo(() => {
    let filtered = [...activities];

    if (searchTerm) {
      filtered = filtered.filter(a => 
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.description && a.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedType) {
      filtered = filtered.filter(a => a.activity_type === selectedType);
    }

    if (selectedParish) {
      filtered = filtered.filter(a => a.parish_id === selectedParish);
    }

    return filtered;
  }, [activities, searchTerm, selectedType, selectedParish]);

  const activityTypeOptions = [
    { value: '', label: 'Tous les types' },
    { value: ActivityType.MASS, label: 'Messes' },
    { value: ActivityType.PRAYER_MEETING, label: 'Réunions de prière' },
    { value: ActivityType.BIBLE_STUDY, label: 'Études bibliques' },
    { value: ActivityType.YOUTH_GATHERING, label: 'Rassemblements jeunes' },
    { value: ActivityType.CHARITY_EVENT, label: 'Événements caritatifs' },
    { value: ActivityType.PILGRIMAGE, label: 'Pèlerinages' },
    { value: ActivityType.RETREAT, label: 'Retraites' },
    { value: ActivityType.CONFERENCE, label: 'Conférences' },
    { value: ActivityType.CONCERT, label: 'Concerts' },
    { value: ActivityType.FESTIVAL, label: 'Festivals' },
    { value: ActivityType.COMMUNITY_SERVICE, label: 'Services communautaires' },
    { value: ActivityType.OTHER, label: 'Autres' }
  ];

  // Options de paroisses (à charger dynamiquement ou statique pour MVP)
  const parishOptions = [
    { value: '', label: 'Toutes paroisses' },
    { value: '1', label: 'Cathédrale Notre-Dame de Miséricorde' },
    { value: '4', label: 'Église Évangélique du Bénin' }
  ];

  const dateFilterOptions = [
    { value: 'all', label: 'À venir' },
    { value: 'today', label: 'Aujourd\'hui' },
    { value: 'week', label: 'Cette semaine' },
    { value: 'month', label: 'Ce mois' }
  ];

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedType('');
    setSelectedParish('');
    setDateFilter('all');
    // Recharger les activités avec le nouveau filtre
    const fetchActivities = async () => {
      const data = await activityService.getActivities({ dateFilter: 'all' });
      setActivities(data);
    };
    fetchActivities();
  };

  const handleDateFilterChange = async (value: string) => {
    setDateFilter(value);
    const data = await activityService.getActivities({ 
      dateFilter: value === 'all' ? undefined : value as any 
    });
    setActivities(data);
  };

  const handleRegister = async (activityId: string) => {
    const success = await activityService.registerForActivity(activityId);
    if (success) {
      setRegisteredActivities(prev => [...prev, activityId]);
      // Mettre à jour le compteur local
      setActivities(prev => prev.map(a => 
        a.id === activityId ? { ...a, current_participants: (a.current_participants || 0) + 1 } : a
      ));
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case ActivityType.MASS: return Church;
      case ActivityType.BIBLE_STUDY: return BookOpen;
      case ActivityType.CONCERT: return Music;
      case ActivityType.PRAYER_MEETING: return Heart;
      default: return Calendar;
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
              Activités Paroissiales
            </h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">
              Découvrez et participez aux activités de votre communauté
            </p>
          </div>
          <Button variant="primary" icon={Plus} className="w-full lg:w-auto">
            Proposer une activité
          </Button>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card padding="sm" className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-primary-600">{stats.totalUpcoming}</div>
            <div className="text-xs sm:text-sm text-gray-600">Activités à venir</div>
          </Card>
          <Card padding="sm" className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-spiritual-600">{stats.totalMasses}</div>
            <div className="text-xs sm:text-sm text-gray-600">Messes programmées</div>
          </Card>
          <Card padding="sm" className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-warm-600">{stats.totalCharity}</div>
            <div className="text-xs sm:text-sm text-gray-600">Actions caritatives</div>
          </Card>
          <Card padding="sm" className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.totalParticipants}</div>
            <div className="text-xs sm:text-sm text-gray-600">Participants inscrits</div>
          </Card>
        </div>

        {/* Filtres */}
        <Card>
          <div className="space-y-4">
            <div className="flex flex-col space-y-4 xl:flex-row xl:items-center xl:space-y-0 xl:space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="Rechercher une activité..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon={Search}
                />
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <Select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as ActivityType | '')}
                  options={activityTypeOptions}
                  className="w-full sm:min-w-[180px]"
                />
                <Select
                  value={selectedParish}
                  onChange={(e) => setSelectedParish(e.target.value)}
                  options={parishOptions}
                  className="w-full sm:min-w-[200px]"
                />
                <Select
                  value={dateFilter}
                  onChange={(e) => handleDateFilterChange(e.target.value)}
                  options={dateFilterOptions}
                  className="w-full sm:min-w-[150px]"
                />
              </div>
            </div>
            
            {(searchTerm || selectedType || selectedParish || dateFilter !== 'all') && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <p className="text-sm text-gray-600 text-center sm:text-left">
                  {filteredActivities.length} activité{filteredActivities.length > 1 ? 's' : ''} trouvée{filteredActivities.length > 1 ? 's' : ''}
                </p>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Effacer les filtres
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Liste des activités */}
        {filteredActivities.length === 0 ? (
          <Card className="text-center py-8 sm:py-12">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucune activité trouvée
            </h3>
            <p className="text-gray-600 mb-4 text-sm sm:text-base px-4">
              Aucune activité ne correspond à vos critères de recherche.
            </p>
            <Button variant="primary" icon={Plus}>
              Proposer une activité
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {filteredActivities.map((activity) => (
              <ActivityCard 
                key={activity.id} 
                activity={activity}
                isRegistered={registeredActivities.includes(activity.id)}
                onRegister={() => handleRegister(activity.id)}
                getActivityIcon={getActivityIcon}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface ActivityCardProps {
  activity: EnrichedActivity;
  isRegistered: boolean;
  onRegister: () => void;
  getActivityIcon: (type: string) => any;
}

const ActivityCard: React.FC<ActivityCardProps> = ({ 
  activity, 
  isRegistered, 
  onRegister,
  getActivityIcon 
}) => {
  const [isInterested, setIsInterested] = useState(false);
  const ActivityIcon = getActivityIcon(activity.activity_type || '');

  const handleInterest = () => {
    setIsInterested(!isInterested);
  };

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('fr', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date(date));
  };

  const formatTime = (date: string) => {
    return new Intl.DateTimeFormat('fr', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const isUpcoming = new Date(activity.date_start) > new Date();
  const isFull = activity.max_participants && (activity.current_participants || 0) >= activity.max_participants;

  return (
    <Card hover className="h-full flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-spiritual-400 to-primary-400 rounded-lg flex items-center justify-center">
            <ActivityIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-1">
              {activity.title}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500">
              {activity.parish?.name || 'Paroisse'}
            </p>
          </div>
        </div>
        <button
          onClick={handleInterest}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <Heart className={`w-4 h-4 ${isInterested ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
        </button>
      </div>

      {activity.image_url && (
        <div className="aspect-video rounded-lg overflow-hidden mb-4">
          <img
            src={activity.image_url}
            alt={activity.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="flex-1 space-y-3">
        <p className="text-sm text-gray-600 line-clamp-3">
          {activity.description}
        </p>

        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(activity.date_start)}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{formatTime(activity.date_start)}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            <span className="truncate">{activity.location}</span>
          </div>

          {activity.max_participants && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              <span>
                {activity.current_participants || 0}/{activity.max_participants} participants
              </span>
              {isFull && <span className="text-red-500 text-xs">(Complet)</span>}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {activity.status === 'ongoing' && (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              En cours
            </span>
          )}
          {!isUpcoming && (
            <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
              Passé
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
        <div className="text-sm text-gray-500">
          Par {activity.organizer?.first_name || ''} {activity.organizer?.last_name || ''}
        </div>
        <Button 
          variant={isRegistered ? "outline" : "primary"} 
          size="sm" 
          onClick={onRegister}
          disabled={!isUpcoming || isFull || isRegistered}
        >
          {isRegistered ? 'Inscrit ✓' : isFull ? 'Complet' : isUpcoming ? 'Participer' : 'Terminé'}
        </Button>
      </div>
    </Card>
  );
};