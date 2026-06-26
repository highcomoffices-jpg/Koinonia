import React, { useState, useEffect } from 'react';
import { MapPin, Play, Clock, Volume2, Navigation, Lock, Pause, Download, Share2, Heart, Star, Filter, Search, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { spiritualityService, EnrichedLocationMeditation } from '../../services/spiritualityService';

export const LocationMeditationsSection: React.FC = () => {
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [meditations, setMeditations] = useState<EnrichedLocationMeditation[]>([]);
  const [filteredMeditations, setFilteredMeditations] = useState<EnrichedLocationMeditation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [playingMeditation, setPlayingMeditation] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  useEffect(() => {
    // Simuler la géolocalisation (Cotonou par défaut)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          // Fallback sur Cotonou
          setUserLocation({ lat: 6.3703, lng: 2.3912 });
        }
      );
    } else {
      setUserLocation({ lat: 6.3703, lng: 2.3912 });
    }
  }, []);

  useEffect(() => {
    const fetchMeditations = async () => {
      setIsLoading(true);
      try {
        const data = await spiritualityService.getLocationMeditations();
        setMeditations(data);
        setFilteredMeditations(data);
      } catch (error) {
        console.error('Error fetching meditations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMeditations();
  }, []);

  useEffect(() => {
    let filtered = [...meditations];

    if (searchTerm) {
      filtered = filtered.filter(m => 
        m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.description && m.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        m.location_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedType) {
      filtered = filtered.filter(m => m.location_type === selectedType);
    }

    if (selectedLanguage) {
      filtered = filtered.filter(m => m.language === selectedLanguage);
    }

    setFilteredMeditations(filtered);
  }, [searchTerm, selectedType, selectedLanguage, meditations]);

  const locationTypeOptions = [
    { value: '', label: 'Tous les types' },
    { value: 'church', label: 'Églises' },
    { value: 'cross', label: 'Croix' },
    { value: 'sacred_site', label: 'Sites sacrés' },
    { value: 'cemetery', label: 'Cimetières' },
    { value: 'pilgrimage_site', label: 'Sites de pèlerinage' }
  ];

  const languageOptions = [
    { value: '', label: 'Toutes langues' },
    { value: 'fr', label: 'Français' },
    { value: 'fon', label: 'Fon' },
    { value: 'yoruba', label: 'Yoruba' }
  ];

  const handlePlayMeditation = (meditation: EnrichedLocationMeditation) => {
    if (meditation.is_premium) {
      setShowPremiumModal(true);
      return;
    }

    if (playingMeditation === meditation.id) {
      setPlayingMeditation(null);
      setCurrentTime(0);
    } else {
      setPlayingMeditation(meditation.id);
      setCurrentTime(0);
      // Simuler la lecture audio
      const interval = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= (meditation.duration_minutes || 5) * 60) {
            clearInterval(interval);
            setPlayingMeditation(null);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getLocationTypeIcon = (type: string) => {
    switch (type) {
      case 'church': return '⛪';
      case 'cross': return '✝️';
      case 'sacred_site': return '🏛️';
      case 'cemetery': return '🪦';
      case 'pilgrimage_site': return '🙏';
      default: return '📍';
    }
  };

  const getLocationTypeLabel = (type: string) => {
    switch (type) {
      case 'church': return 'Église';
      case 'cross': return 'Croix';
      case 'sacred_site': return 'Site sacré';
      case 'cemetery': return 'Cimetière';
      case 'pilgrimage_site': return 'Site de pèlerinage';
      default: return 'Lieu';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Méditations géolocalisées</h2>
          <p className="text-gray-600">Méditations contextuelles près des lieux sacrés</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" icon={MapPin}>Carte interactive</Button>
          <Button variant="spiritual" icon={Download}>Télécharger hors ligne</Button>
        </div>
      </div>

      {userLocation && (
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <Navigation className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900">Localisation activée</h3>
                <p className="text-green-700 text-sm">
                  {filteredMeditations.length} méditation(s) disponible(s)
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm">Actualiser position</Button>
          </div>
        </Card>
      )}

      <Card>
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Rechercher une méditation ou un lieu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={Search}
              />
            </div>
            <div className="flex space-x-3">
              <Select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                options={locationTypeOptions}
                className="min-w-[150px]"
              />
              <Select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                options={languageOptions}
                className="min-w-[130px]"
              />
            </div>
          </div>
        </div>
      </Card>

      {filteredMeditations.length === 0 ? (
        <Card className="text-center py-8">
          <p className="text-gray-500">Aucune méditation trouvée</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredMeditations.map((meditation) => (
            <LocationMeditationCard
              key={meditation.id}
              meditation={meditation}
              isPlaying={playingMeditation === meditation.id}
              currentTime={currentTime}
              onPlay={() => handlePlayMeditation(meditation)}
              getLocationTypeIcon={getLocationTypeIcon}
              getLocationTypeLabel={getLocationTypeLabel}
              formatTime={formatTime}
            />
          ))}
        </div>
      )}

      {showPremiumModal && (
        <PremiumModal onClose={() => setShowPremiumModal(false)} />
      )}

      <Card className="bg-gradient-to-r from-spiritual-50 to-primary-50 border-spiritual-200">
        <div className="text-center">
          <Lock className="w-12 h-12 text-spiritual-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">Débloquez plus de méditations</h3>
          <p className="text-gray-600 mb-4">Accédez à plus de méditations géolocalisées dans tout le Bénin</p>
          <Button variant="spiritual" onClick={() => setShowPremiumModal(true)}>
            Passer à Premium - 5000 FCFA/mois
          </Button>
        </div>
      </Card>
    </div>
  );
};

interface LocationMeditationCardProps {
  meditation: EnrichedLocationMeditation;
  isPlaying: boolean;
  currentTime: number;
  onPlay: () => void;
  getLocationTypeIcon: (type: string) => string;
  getLocationTypeLabel: (type: string) => string;
  formatTime: (seconds: number) => string;
}

const LocationMeditationCard: React.FC<LocationMeditationCardProps> = ({ 
  meditation, 
  isPlaying, 
  currentTime, 
  onPlay,
  getLocationTypeIcon,
  getLocationTypeLabel,
  formatTime
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const progressPercentage = (currentTime / ((meditation.duration_minutes || 5) * 60)) * 100;

  return (
    <Card hover className={`${isPlaying ? 'ring-2 ring-blue-500' : ''}`}>
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{getLocationTypeIcon(meditation.location_type || 'church')}</div>
            <div>
              <h3 className="font-semibold text-gray-900">{meditation.title}</h3>
              <p className="text-sm text-gray-500">{meditation.location_name}</p>
            </div>
          </div>
          {meditation.is_premium && (
            <span className="bg-gradient-to-r from-spiritual-500 to-primary-500 text-white text-xs rounded-full px-2 py-1">
              Premium
            </span>
          )}
        </div>

        {meditation.bible_verse && (
          <div className="bg-gradient-to-r from-spiritual-50 to-primary-50 rounded-lg p-4 border border-spiritual-100">
            <p className="text-sm italic text-spiritual-800 mb-2 leading-relaxed">
              "{meditation.bible_verse}"
            </p>
            <p className="text-xs text-spiritual-600 font-medium">
              — {meditation.verse_reference}
            </p>
          </div>
        )}

        <p className="text-sm text-gray-600 leading-relaxed">{meditation.description}</p>

        {isPlaying && (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
                <Volume2 className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">En cours de lecture...</p>
                <p className="text-xs text-blue-700">
                  {formatTime(currentTime)} / {formatTime((meditation.duration_minutes || 5) * 60)}
                </p>
              </div>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2 mb-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Button variant="outline" size="sm" onClick={onPlay}>
                <Pause className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{meditation.duration_minutes} min</span>
            </div>
            <div className="flex items-center space-x-1">
              <Volume2 className="w-4 h-4" />
              <span className="uppercase font-medium">{meditation.language}</span>
            </div>
          </div>
          <span className="text-xs bg-gray-100 px-2 py-1 rounded font-medium">
            {getLocationTypeLabel(meditation.location_type || 'church')}
          </span>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsLiked(!isLiked)}
              className={`flex items-center space-x-1 transition-colors ${
                isLiked ? 'text-red-600' : 'text-gray-500 hover:text-red-600'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span className="text-sm">{isLiked ? '1' : '0'}</span>
            </button>
            <div className="flex items-center space-x-1 text-gray-500">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{meditation.radius_meters}m</span>
            </div>
          </div>
          <Button 
            variant={meditation.is_premium ? "spiritual" : isPlaying ? "outline" : "primary"}
            size="sm"
            icon={meditation.is_premium ? Lock : isPlaying ? Pause : Play}
            onClick={onPlay}
          >
            {meditation.is_premium ? 'Premium requis' : isPlaying ? 'Pause' : 'Écouter'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

const PremiumModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-spiritual-500 to-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Contenu Premium</h3>
          <p className="text-gray-600 mb-6">
            Cette méditation est réservée aux membres Premium.
          </p>
          <div className="flex space-x-3">
            <Button variant="outline" fullWidth onClick={onClose}>Plus tard</Button>
            <Button variant="spiritual" fullWidth>Passer à Premium - 5000 FCFA/mois</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};