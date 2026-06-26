import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, MapPin, Church, Users, Plus, Filter, Star, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Card } from '../ui/Card';
import { Pagination } from '../ui/Pagination';
import { ProposeParishModal } from './ProposeParishModal';
import { MyParishModal } from './MyParishModal';
import { ParishDetailsModal } from './ParishDetailsModal';
import { usePagination } from '../../hooks/usePagination';
import { parishService, EnrichedParish } from '../../services/parishService';
import { geoService } from '../../services/geoService';
import { useGeoData } from '../../hooks/useGeoData';
import { Parish } from '../../types';

export const ParishesPage: React.FC = () => {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const { continents, countries, loadCountriesByContinent, isLoadingCountries } = useGeoData();
  const [parishes, setParishes] = useState<EnrichedParish[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [confessions, setConfessions] = useState<any[]>([]);
  const [userParish, setUserParish] = useState<EnrichedParish | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContinent, setSelectedContinent] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedConfession, setSelectedConfession] = useState('');
  const [isProposeModalOpen, setIsProposeModalOpen] = useState(false);
  const [isMyParishModalOpen, setIsMyParishModalOpen] = useState(false);
  const [selectedParishForDetails, setSelectedParishForDetails] = useState<EnrichedParish | null>(null);
  const [filteredCountriesForSelect, setFilteredCountriesForSelect] = useState<any[]>([]);

  // Charger les données
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [parishesData, citiesData, confessionsData, userParishData] = await Promise.all([
          parishService.getParishes(),
          geoService.getCities(),
          geoService.getConfessions(),
          parishService.getUserParish()
        ]);

        setParishes(parishesData);
        setCities(citiesData);
        setConfessions(confessionsData);
        setUserParish(userParishData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filtrer les pays par continent
  useEffect(() => {
    if (selectedContinent) {
      const filtered = countries.filter(c => c.continent_id === selectedContinent);
      setFilteredCountriesForSelect(filtered);
    } else {
      setFilteredCountriesForSelect(countries);
    }
    // Reset country and city when continent changes
    setSelectedCountry('');
    setSelectedCity('');
  }, [selectedContinent, countries]);

  // Filtrer les villes par pays
  useEffect(() => {
    if (selectedCountry) {
      const filtered = cities.filter(c => c.country_id === selectedCountry);
      // Mettre à jour les villes affichées dans le filtre (à implémenter si besoin)
    }
    setSelectedCity('');
  }, [selectedCountry, cities]);

  // Filtrer les paroisses
  const filteredParishes = useMemo(() => {
    return parishes.filter(parish => {
      const matchesSearch = searchTerm === '' || 
        parish.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (parish.address && parish.address.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCity = !selectedCity || parish.city_id === selectedCity;
      const matchesConfession = !selectedConfession || parish.confession_id === selectedConfession;
      
      return matchesSearch && matchesCity && matchesConfession;
    });
  }, [parishes, searchTerm, selectedCity, selectedConfession]);

  // Pagination
  const {
    currentPage,
    totalPages,
    paginatedData: paginatedParishes,
    goToPage,
    resetPagination
  } = usePagination({ data: filteredParishes, itemsPerPage: 20 });

  React.useEffect(() => {
    resetPagination();
  }, [searchTerm, selectedCity, selectedConfession, resetPagination]);

  const continentOptions = continents.map(continent => ({
    value: continent.id,
    label: continent.name
  }));

  const countryOptions = filteredCountriesForSelect.map(country => ({
    value: country.id,
    label: country.name
  }));

  const cityOptions = cities.map(city => ({
    value: city.id,
    label: city.name
  }));

  const confessionOptions = confessions.map(confession => ({
    value: confession.id,
    label: confession.name
  }));

  const handleJoinParish = async (parishId: string) => {
    const success = await parishService.joinParish(parishId);
    if (success) {
      await refreshUser();
      const updatedUserParish = await parishService.getUserParish();
      setUserParish(updatedUserParish);
      alert('Vous avez rejoint cette paroisse avec succès !');
    } else {
      alert('Erreur lors de l\'adhésion à la paroisse');
    }
  };

  const handleProposeParish = async (data: any) => {
    const success = await parishService.proposeParish(data);
    if (success) {
      alert('Votre proposition a été envoyée pour validation.');
      setIsProposeModalOpen(false);
      const updatedParishes = await parishService.getParishes();
      setParishes(updatedParishes);
    } else {
      alert('Erreur lors de la proposition');
    }
  };

  const handleLeaveParish = async () => {
    const success = await parishService.leaveParish();
    if (success) {
      await refreshUser();
      setUserParish(null);
      alert('Vous avez quitté votre paroisse.');
    } else {
      alert('Erreur lors du départ de la paroisse');
    }
    setIsMyParishModalOpen(false);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedContinent('');
    setSelectedCountry('');
    setSelectedCity('');
    setSelectedConfession('');
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
              Paroisses et Confessions
            </h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">
              Découvrez et rejoignez les communautés chrétiennes près de chez vous
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3">
            <Button
              variant="outline"
              icon={Plus}
              className="w-full sm:w-auto"
              onClick={() => setIsProposeModalOpen(true)}
            >
              Proposer une paroisse
            </Button>
            <Button
              variant="primary"
              icon={Church}
              className="w-full sm:w-auto"
              onClick={() => setIsMyParishModalOpen(true)}
            >
              Ma paroisse
            </Button>
          </div>
        </div>

        {/* Ma paroisse actuelle */}
        {userParish && (
          <Card className="bg-gradient-to-r from-spiritual-50 to-primary-50 border-spiritual-200">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-spiritual-600 to-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Church className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-spiritual-900 text-sm sm:text-base">Ma paroisse</h3>
                <p className="text-spiritual-800 font-medium truncate">{userParish.name}</p>
                <p className="text-sm text-spiritual-600 truncate">
                  {userParish.city_name} • {userParish.confession_name}
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full sm:w-auto"
                onClick={() => setIsMyParishModalOpen(true)}
              >
                Voir les détails
              </Button>
            </div>
          </Card>
        )}

        {/* Filtres améliorés */}
        <Card>
          <div className="space-y-4">
            <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:space-y-0 lg:space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="Rechercher une paroisse ou une adresse..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon={Search}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Select
                value={selectedContinent}
                onChange={(e) => setSelectedContinent(e.target.value)}
                options={continentOptions}
                placeholder="Tous les continents"
              />
              <Select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                options={countryOptions}
                placeholder="Tous les pays"
                disabled={!selectedContinent && filteredCountriesForSelect.length === 0}
              />
              <Select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                options={cityOptions}
                placeholder="Toutes les villes"
              />
              <Select
                value={selectedConfession}
                onChange={(e) => setSelectedConfession(e.target.value)}
                options={confessionOptions}
                placeholder="Toutes les confessions"
              />
            </div>
            
            {(searchTerm || selectedContinent || selectedCountry || selectedCity || selectedConfession) && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <p className="text-sm text-gray-600 text-center sm:text-left">
                  {filteredParishes.length} paroisse{filteredParishes.length > 1 ? 's' : ''} trouvée{filteredParishes.length > 1 ? 's' : ''}
                </p>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Effacer les filtres
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Liste des paroisses - inchangée */}
        {filteredParishes.length === 0 ? (
          <Card className="text-center py-8 sm:py-12">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Church className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aucune paroisse trouvée
            </h3>
            <p className="text-gray-600 mb-4 text-sm sm:text-base px-4">
              Essayez de modifier vos critères de recherche ou proposez une nouvelle paroisse.
            </p>
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => setIsProposeModalOpen(true)}
            >
              Proposer une paroisse
            </Button>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {paginatedParishes.map((parish) => (
                <ParishCard
                  key={parish.id}
                  parish={parish}
                  city={parish.city_name || 'Ville inconnue'}
                  confession={parish.confession_name || 'Confession inconnue'}
                  onJoin={handleJoinParish}
                  isCurrentParish={userParish?.id === parish.id}
                  onViewDetails={() => setSelectedParishForDetails(parish)}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={goToPage}
                totalItems={filteredParishes.length}
                itemsPerPage={20}
              />
            )}
          </>
        )}

        {/* Modals */}
        <ProposeParishModal
          isOpen={isProposeModalOpen}
          onClose={() => setIsProposeModalOpen(false)}
          onSubmit={handleProposeParish}
          cities={cities}
          confessions={confessions}
        />
        
        <MyParishModal
          isOpen={isMyParishModalOpen}
          onClose={() => setIsMyParishModalOpen(false)}
          onLeaveParish={handleLeaveParish}
          userParish={userParish}
          refreshParish={async () => {
            const updated = await parishService.getUserParish();
            setUserParish(updated);
          }}
        />
        
        {selectedParishForDetails && (
          <ParishDetailsModal
            isOpen={!!selectedParishForDetails}
            onClose={() => setSelectedParishForDetails(null)}
            parish={selectedParishForDetails as any}
            city={selectedParishForDetails.city_name || 'Ville inconnue'}
            confession={selectedParishForDetails.confession_name || 'Confession inconnue'}
            onJoinParish={handleJoinParish}
          />
        )}
      </div>
    </div>
  );
};

// Composant ParishCard inchangé
interface ParishCardProps {
  parish: EnrichedParish;
  city: string;
  confession: string;
  onJoin: (parishId: string) => void;
  isCurrentParish: boolean;
  onViewDetails: () => void;
}

const ParishCard: React.FC<ParishCardProps> = ({ 
  parish, 
  city, 
  confession, 
  onJoin, 
  isCurrentParish,
  onViewDetails 
}) => {
  return (
    <Card hover className="relative h-full">
      {parish.validated && (
        <div className="absolute top-3 right-3 z-10">
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
            <Star className="w-3 h-3 text-white fill-current" />
          </div>
        </div>
      )}

      {isCurrentParish && (
        <div className="absolute top-3 left-3 z-10">
          <span className="px-2 py-1 bg-spiritual-100 text-spiritual-800 text-xs rounded-full font-medium shadow-sm">
            Ma paroisse
          </span>
        </div>
      )}

      <div className="space-y-4 h-full flex flex-col">
        <div className="flex items-start space-x-3 pt-2">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-spiritual-400 to-primary-400 rounded-lg flex items-center justify-center flex-shrink-0">
            <Church className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm sm:text-base">
              {parish.name}
            </h3>
            <p className="text-xs sm:text-sm text-spiritual-600 font-medium truncate">
              {confession}
            </p>
          </div>
        </div>

        <div className="space-y-2 flex-1">
          <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="truncate">{city}</span>
          </div>
          {parish.address && (
            <p className="text-xs sm:text-sm text-gray-500 line-clamp-2">
              {parish.address}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between text-xs sm:text-sm border-t border-gray-100 pt-3">
          <div className="flex items-center space-x-1 text-gray-500">
            <Users className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>{parish.member_count || 50} membres</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            fullWidth
            onClick={onViewDetails}
          >
            Voir détails
          </Button>
          {!isCurrentParish && (
            <Button 
              variant="primary" 
              size="sm" 
              fullWidth
              onClick={() => onJoin(parish.id)}
            >
              Rejoindre
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};