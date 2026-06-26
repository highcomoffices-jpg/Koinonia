import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter, Calendar, MapPin, Clock, Users, Star, Heart, Church, Cross, BookOpen, Headphones, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Card } from '../ui/Card';
import { serviceService, EnrichedService } from '../../services/serviceService';
import { ServiceType } from '../../types';

export const ServicesPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [services, setServices] = useState<EnrichedService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<ServiceType | ''>('');
  const [selectedConfession, setSelectedConfession] = useState('');

  // Charger les services depuis Supabase
  useEffect(() => {
    const fetchServices = async () => {
      setIsLoading(true);
      try {
        const data = await serviceService.getServices();
        setServices(data);
      } catch (error) {
        console.error('Error fetching services:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, []);

  // Filtrer les services selon la confession de l'utilisateur et les critères
  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const matchesSearch = searchTerm === '' || 
        service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesType = !selectedType || service.type === selectedType;
      const matchesConfession = !selectedConfession || (service.confession_ids && service.confession_ids.includes(selectedConfession));
      
      // Filtrer selon la confession de l'utilisateur si elle existe
      const isAccessible = !user?.confession?.id || 
        (service.confession_ids && service.confession_ids.includes(user.confession.id));
      
      return matchesSearch && matchesType && matchesConfession && isAccessible;
    });
  }, [services, searchTerm, selectedType, selectedConfession, user?.confession?.id]);

  const serviceTypeOptions = [
    { value: '', label: 'Tous les types' },
    { value: ServiceType.MASS_REQUEST, label: 'Demandes de messe' },
    { value: ServiceType.CONFESSION, label: 'Confession' },
    { value: ServiceType.BAPTISM, label: 'Baptême' },
    { value: ServiceType.WEDDING, label: 'Mariage' },
    { value: ServiceType.FUNERAL, label: 'Funérailles' },
    { value: ServiceType.COUNSELING, label: 'Conseil pastoral' },
    { value: ServiceType.PRAYER_REQUEST, label: 'Demandes de prière' },
    { value: ServiceType.LIVE_STREAM, label: 'Diffusion en direct' },
    { value: ServiceType.SPIRITUAL_DIRECTION, label: 'Direction spirituelle' },
    { value: ServiceType.YOUTH_MINISTRY, label: 'Ministère jeunesse' },
    { value: ServiceType.MUSIC_MINISTRY, label: 'Ministère musical' },
    { value: ServiceType.OTHER, label: 'Autres' }
  ];

  const confessionOptions = [
    { value: '', label: 'Toutes confessions' },
    { value: '0cba9b79-cd90-4b20-9aac-01b2fb9b60b6', label: 'Catholique' },
    { value: '9a23e380-a55b-4a56-b728-4f0c9eb00fea', label: 'Protestant' },
    { value: '9628b91d-fe81-4e26-8529-870b53719661', label: 'Orthodoxe' },
    { value: '7efa196d-c931-4b10-a7d3-6b88125447ad', label: 'Évangélique' },
    { value: 'ed17f07b-96e1-4664-961e-6f76dc7707a6', label: 'Pentecôtiste' }
  ];

  const getServiceIcon = (type: ServiceType) => {
    switch (type) {
      case ServiceType.MASS_REQUEST: return Church;
      case ServiceType.CONFESSION: return Cross;
      case ServiceType.LIVE_STREAM: return Headphones;
      case ServiceType.COUNSELING: return BookOpen;
      default: return Star;
    }
  };

  const formatPrice = (price?: number) => {
    if (!price || price === 0) return 'Gratuit';
    return `${price.toLocaleString()} FCFA`;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedType('');
    setSelectedConfession('');
  };

  const stats = {
    total: filteredServices.length,
    liveStreams: filteredServices.filter(s => s.type === ServiceType.LIVE_STREAM).length,
    free: filteredServices.filter(s => !s.price || s.price === 0).length,
    active: filteredServices.filter(s => s.is_active).length
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
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">
            Services Confessionnels
          </h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            Découvrez les services spirituels proposés par votre confession religieuse
          </p>
          {user?.confession && (
            <p className="text-sm text-primary-600 mt-2">
              Services disponibles pour : {user.confession.name}
            </p>
          )}
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card padding="sm" className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-primary-600">{stats.total}</div>
            <div className="text-xs sm:text-sm text-gray-600">Services disponibles</div>
          </Card>
          <Card padding="sm" className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-spiritual-600">{stats.liveStreams}</div>
            <div className="text-xs sm:text-sm text-gray-600">Diffusions en direct</div>
          </Card>
          <Card padding="sm" className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-warm-600">{stats.free}</div>
            <div className="text-xs sm:text-sm text-gray-600">Services gratuits</div>
          </Card>
          <Card padding="sm" className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-xs sm:text-sm text-gray-600">Services actifs</div>
          </Card>
        </div>

        {/* Filtres */}
        <Card>
          <div className="space-y-4">
            <div className="flex flex-col space-y-4 xl:flex-row xl:items-center xl:space-y-0 xl:space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="Rechercher un service..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon={Search}
                />
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <Select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as ServiceType | '')}
                  options={serviceTypeOptions}
                  className="w-full sm:min-w-[180px]"
                />
                <Select
                  value={selectedConfession}
                  onChange={(e) => setSelectedConfession(e.target.value)}
                  options={confessionOptions}
                  className="w-full sm:min-w-[150px]"
                />
              </div>
            </div>
            
            {(searchTerm || selectedType || selectedConfession) && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <p className="text-sm text-gray-600 text-center sm:text-left">
                  {filteredServices.length} service{filteredServices.length > 1 ? 's' : ''} trouvé{filteredServices.length > 1 ? 's' : ''}
                </p>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Effacer les filtres
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Liste des services */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {filteredServices.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>

        {/* Message si aucun service */}
        {filteredServices.length === 0 && (
          <Card className="text-center py-8 sm:py-12">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Church className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucun service trouvé
            </h3>
            <p className="text-gray-600 mb-4 text-sm sm:text-base px-4">
              {user?.confession 
                ? `Aucun service disponible pour votre confession (${user.confession.name}) avec ces critères.`
                : 'Complétez votre profil pour voir les services de votre confession.'
              }
            </p>
            {!user?.confession && (
              <Button variant="primary">
                Compléter mon profil
              </Button>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

interface ServiceCardProps {
  service: EnrichedService;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service }) => {
  const [isLiked, setIsLiked] = useState(false);

  const getServiceIcon = (type: ServiceType) => {
    switch (type) {
      case ServiceType.MASS_REQUEST: return Church;
      case ServiceType.CONFESSION: return Cross;
      case ServiceType.LIVE_STREAM: return Headphones;
      case ServiceType.COUNSELING: return BookOpen;
      default: return Star;
    }
  };

  const formatPrice = (price?: number) => {
    if (!price || price === 0) return 'Gratuit';
    return `${price.toLocaleString()} FCFA`;
  };

  const formatDate = (date: string, startTime: string, endTime: string) => {
    const dateObj = new Date(date);
    return new Intl.DateTimeFormat('fr', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(dateObj);
  };

  const ServiceIcon = getServiceIcon(service.type as ServiceType);
  const firstSchedule = service.schedules?.[0];

  const handleLike = () => {
    setIsLiked(!isLiked);
  };

  const handleBook = () => {
    console.log('Réserver le service:', service.id);
    // TODO: Implémenter la réservation
  };

  return (
    <Card hover className="h-full flex flex-col">
      {/* En-tête */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-spiritual-400 to-primary-400 rounded-lg flex items-center justify-center">
            <ServiceIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-1">
              {service.title}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500">
              {service.provider?.first_name} {service.provider?.last_name}
            </p>
          </div>
        </div>
        <button
          onClick={handleLike}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
        </button>
      </div>

      {/* Image */}
      {service.image_url && (
        <div className="aspect-video rounded-lg overflow-hidden mb-4">
          <img
            src={service.image_url}
            alt={service.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Description */}
      <div className="flex-1 space-y-3">
        <p className="text-sm text-gray-600 line-clamp-3">
          {service.description}
        </p>

        {/* Détails */}
        <div className="space-y-2">
          {service.duration && (
            <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>{service.duration}</span>
            </div>
          )}
          
          {firstSchedule && (
            <div className="flex items-start space-x-2 text-xs sm:text-sm text-gray-500">
              <Calendar className="w-4 h-4 mt-0.5" />
              <div>
                <p>{formatDate(firstSchedule.date, firstSchedule.start_time, firstSchedule.end_time)}</p>
                <p className="text-xs text-gray-400">
                  {firstSchedule.start_time.substring(0, 5)} - {firstSchedule.end_time.substring(0, 5)}
                </p>
                {firstSchedule.location && (
                  <p className="flex items-center space-x-1 mt-1">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{firstSchedule.location}</span>
                  </p>
                )}
                {firstSchedule.is_online && firstSchedule.meeting_link && (
                  <p className="text-xs text-blue-600 mt-1">
                    🔗 Lien de connexion disponible
                  </p>
                )}
              </div>
            </div>
          )}

          {service.max_participants && (
            <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500">
              <Users className="w-4 h-4" />
              <span>{service.current_participants || 0}/{service.max_participants} participants</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
        <div className="text-lg font-bold text-primary-600">
          {formatPrice(service.price || undefined)}
        </div>
        <Button 
          variant="primary" 
          size="sm" 
          onClick={handleBook}
        >
          {service.type === ServiceType.LIVE_STREAM ? 'Rejoindre' : 'Réserver'}
        </Button>
      </div>
    </Card>
  );
};