import React, { useState, useEffect, useMemo } from 'react';
import { X, MapPin, Church, User } from 'lucide-react';
import Select from 'react-select';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuth } from '../../contexts/AuthContext';
import { useGeoData } from '../../hooks/useGeoData';
import { supabase } from '../../lib/supabase';

interface CompleteProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

interface OptionType {
  value: string;
  label: string;
}

export const CompleteProfileModal: React.FC<CompleteProfileModalProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const { user, updateProfile, refreshUser } = useAuth();
  const { 
    countries,
    allCities,
    confessions, 
    parishes,
    isLoadingCountries,
    isLoadingCities: originalIsLoadingCities,
    searchCountries,
    searchCities,
    searchConfessions,
    searchParishes,
    loadParishesByCityAndConfession,
  } = useGeoData();

  const [formData, setFormData] = useState({
    country_id: '',
    city_id: '',
    confession_id: '',
    parish_id: '',
    bio: '',
    default_visibility: 'public',
  });

  const [selectedCountry, setSelectedCountry] = useState<OptionType | null>(null);
  const [selectedCity, setSelectedCity] = useState<OptionType | null>(null);
  const [selectedConfession, setSelectedConfession] = useState<OptionType | null>(null);
  const [selectedParish, setSelectedParish] = useState<OptionType | null>(null);

  // États locaux pour les villes (pour forcer le rechargement)
  const [localCities, setLocalCities] = useState<any[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [citySelectKey, setCitySelectKey] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fonction pour charger les villes depuis la base (sans cache)
  const loadCitiesDirectly = async (countryId: string) => {
    if (!countryId) {
      setLocalCities([]);
      return;
    }
    
    setIsLoadingCities(true);
    try {
      console.log('🟢 Chargement des villes depuis la base pour pays:', countryId);
      const { data, error } = await supabase
        .from('cities')
        .select('id, name, country_id')
        .eq('country_id', countryId)
        .order('name');
      
      if (error) throw error;
      console.log('✅ Villes chargées:', data?.length);
      setLocalCities(data || []);
    } catch (error) {
      console.error('Error loading cities:', error);
    } finally {
      setIsLoadingCities(false);
    }
  };

  // Initialiser le formulaire avec les données utilisateur existantes
  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        country_id: user.country?.id || '',
        city_id: user.city?.id || '',
        confession_id: user.confession?.id || '',
        parish_id: user.parish?.id || '',
        bio: user.bio || '',
        default_visibility: user.defaultVisibility || 'public',
      });

      if (user.country) {
        setSelectedCountry({ value: user.country.id, label: user.country.name });
        if (user.country.id) {
          loadCitiesDirectly(user.country.id).then(() => {
            setCitySelectKey(prev => prev + 1);
          });
        }
      }
      if (user.city) {
        setSelectedCity({ value: user.city.id, label: user.city.name });
      }
      if (user.confession) {
        setSelectedConfession({ value: user.confession.id, label: user.confession.name });
      }
      if (user.parish) {
        setSelectedParish({ value: user.parish.id, label: user.parish.name });
      }
    }
  }, [user, isOpen]);

  // Charger les villes quand le pays change
  useEffect(() => {
    if (formData.country_id && isOpen) {
      loadCitiesDirectly(formData.country_id).then(() => {
        setCitySelectKey(prev => prev + 1);
      });
      setFormData(prev => ({ ...prev, city_id: '' }));
      setSelectedCity(null);
    }
  }, [formData.country_id, isOpen]);

  // Charger les paroisses quand ville ou confession change
  useEffect(() => {
    if ((formData.city_id || formData.confession_id) && isOpen) {
      loadParishesByCityAndConfession(formData.city_id, formData.confession_id);
      setFormData(prev => ({ ...prev, parish_id: '' }));
      setSelectedParish(null);
    }
  }, [formData.city_id, formData.confession_id, loadParishesByCityAndConfession, isOpen]);

  // Options pour les selects
  const countryOptions = useMemo(() => 
    countries.map(country => ({
      value: country.id,
      label: country.name,
    })).sort((a, b) => a.label.localeCompare(b.label)),
    [countries]
  );

  // Utiliser localCities au lieu de allCities
  const cityOptions = useMemo(() => 
    localCities.map(city => ({
      value: city.id,
      label: city.name,
    })).sort((a, b) => a.label.localeCompare(b.label)),
    [localCities]
  );

  const confessionOptions = useMemo(() => 
    confessions.map(confession => ({
      value: confession.id,
      label: confession.name,
    })).sort((a, b) => a.label.localeCompare(b.label)),
    [confessions]
  );

  const parishOptions = useMemo(() => 
    parishes
      .filter(parish => {
        if (formData.city_id && parish.city_id !== formData.city_id) return false;
        if (formData.confession_id && parish.confession_id !== formData.confession_id) return false;
        return true;
      })
      .map(parish => ({
        value: parish.id,
        label: parish.name,
      }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    [parishes, formData.city_id, formData.confession_id]
  );

  const visibilityOptions = [
    { value: 'public', label: 'Public – Tout le monde' },
    { value: 'subscribers', label: 'Abonnés – Mes abonnés uniquement' },
    { value: 'parish', label: 'Paroisse – Ma paroisse uniquement' },
  ];

  const handleCountryChange = (option: OptionType | null) => {
    setSelectedCountry(option);
    setFormData(prev => ({ ...prev, country_id: option?.value || '' }));
  };

  const handleCityChange = (option: OptionType | null) => {
    setSelectedCity(option);
    setFormData(prev => ({ ...prev, city_id: option?.value || '', parish_id: '' }));
    setSelectedParish(null);
  };

  const handleConfessionChange = (option: OptionType | null) => {
    setSelectedConfession(option);
    setFormData(prev => ({ ...prev, confession_id: option?.value || '', parish_id: '' }));
    setSelectedParish(null);
  };

  const handleParishChange = (option: OptionType | null) => {
    setSelectedParish(option);
    setFormData(prev => ({ ...prev, parish_id: option?.value || '' }));
  };

  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, bio: e.target.value }));
  };

  const handleVisibilityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, default_visibility: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      if (!user) throw new Error('Utilisateur non trouvé');

      // Validation
      const validationErrors: Record<string, string> = {};
      
      if (!formData.country_id) {
        validationErrors.country_id = 'Le pays est requis';
      }
      
      if (!formData.city_id) {
        validationErrors.city_id = 'La ville est requise';
      }
      
      if (!formData.confession_id) {
        validationErrors.confession_id = 'La confession est requise';
      }
      
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        setIsLoading(false);
        return;
      }

      const updateData = {
        country_id: formData.country_id,
        city_id: formData.city_id,
        confession_id: formData.confession_id,
        profile_complete: true,
        default_visibility: formData.default_visibility,
        ...(formData.parish_id && { parish_id: formData.parish_id }),
        ...(formData.bio && { bio: formData.bio }),
      };

      await updateProfile(updateData);
      await refreshUser();
      onComplete();
      onClose();
    } catch (error: any) {
      console.error('Error:', error);
      setErrors({
        general: error.message || 'Une erreur est survenue',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Compléter votre profil</h2>
              <p className="text-gray-600 mt-1">Quelques informations pour personnaliser votre expérience</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              disabled={isLoading}
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {errors.general && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations personnelles */}
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-spiritual-400 rounded-full flex items-center justify-center">
                <div className="text-white text-xl font-bold">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {user.firstName} {user.lastName}
                </h3>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            </div>

            {/* Localisation avec autocomplétion */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-primary-600" />
                Localisation
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pays <span className="text-red-500">*</span>
                </label>
                <Select
                  options={countryOptions}
                  value={selectedCountry}
                  onChange={handleCountryChange}
                  placeholder="Recherchez votre pays..."
                  isClearable
                  isLoading={isLoadingCountries}
                  noOptionsMessage={() => "Aucun pays trouvé"}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  onInputChange={(inputValue) => {
                    if (inputValue && inputValue.length >= 2) {
                      searchCountries(inputValue);
                    }
                  }}
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderRadius: '0.5rem',
                      borderColor: errors.country_id ? '#ef4444' : '#d1d5db',
                      '&:hover': { borderColor: '#cbd5e1' },
                    }),
                  }}
                />
                {errors.country_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.country_id}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ville <span className="text-red-500">*</span>
                </label>
                <Select
                  key={citySelectKey}
                  options={cityOptions}
                  value={selectedCity}
                  onChange={handleCityChange}
                  placeholder={formData.country_id ? "Recherchez votre ville..." : "Sélectionnez d'abord un pays"}
                  isClearable
                  isDisabled={!formData.country_id}
                  isLoading={isLoadingCities}
                  noOptionsMessage={() => !formData.country_id ? "Sélectionnez un pays d'abord" : "Aucune ville trouvée"}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  onInputChange={(inputValue) => {
                    if (inputValue && inputValue.length >= 2 && formData.country_id) {
                      // Recherche locale pour filtrer
                      const filtered = localCities.filter(city => 
                        city.name.toLowerCase().includes(inputValue.toLowerCase())
                      );
                      setLocalCities(filtered);
                    } else if (formData.country_id) {
                      // Recharger toutes les villes
                      loadCitiesDirectly(formData.country_id);
                    }
                  }}
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderRadius: '0.5rem',
                      borderColor: errors.city_id ? '#ef4444' : '#d1d5db',
                      '&:hover': { borderColor: '#cbd5e1' },
                    }),
                  }}
                />
                {errors.city_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.city_id}</p>
                )}
              </div>
            </div>

            {/* Informations religieuses */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <Church className="w-5 h-5 mr-2 text-spiritual-600" />
                Confession religieuse
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confession religieuse <span className="text-red-500">*</span>
                </label>
                <Select
                  options={confessionOptions}
                  value={selectedConfession}
                  onChange={handleConfessionChange}
                  placeholder="Recherchez votre confession..."
                  isClearable
                  noOptionsMessage={() => "Aucune confession trouvée"}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  onInputChange={(inputValue) => {
                    if (inputValue && inputValue.length >= 2) {
                      searchConfessions(inputValue);
                    }
                  }}
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderRadius: '0.5rem',
                      borderColor: errors.confession_id ? '#ef4444' : '#d1d5db',
                      '&:hover': { borderColor: '#cbd5e1' },
                    }),
                  }}
                />
                {errors.confession_id && (
                  <p className="mt-1 text-sm text-red-600">{errors.confession_id}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Paroisse/Église (optionnel)
                </label>
                <Select
                  options={parishOptions}
                  value={selectedParish}
                  onChange={handleParishChange}
                  placeholder="Recherchez votre paroisse..."
                  isClearable
                  isDisabled={!formData.city_id || !formData.confession_id}
                  noOptionsMessage={() => "Aucune paroisse trouvée"}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  onInputChange={(inputValue) => {
                    if (inputValue && inputValue.length >= 2) {
                      searchParishes(inputValue, formData.city_id, formData.confession_id);
                    }
                  }}
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderRadius: '0.5rem',
                      borderColor: '#d1d5db',
                      '&:hover': { borderColor: '#cbd5e1' },
                    }),
                  }}
                />
              </div>
            </div>

            {/* Visibilité par défaut */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                <User className="w-5 h-5 mr-2 text-gray-600" />
                Confidentialité
              </h3>
              
              <select
                value={formData.default_visibility}
                onChange={handleVisibilityChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={isLoading}
              >
                {visibilityOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Définissez la visibilité par défaut de vos futures publications
              </p>
            </div>

            {/* Bio */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
                <User className="w-5 h-5 mr-2 text-gray-600" />
                À propos de vous
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Biographie (optionnel)
                </label>
                <textarea
                  value={formData.bio}
                  onChange={handleBioChange}
                  placeholder="Parlez-nous un peu de vous..."
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors resize-none disabled:bg-gray-100"
                  disabled={isLoading}
                />
                <div className="flex justify-between mt-1">
                  <p className="text-xs text-gray-500">
                    {formData.bio.length}/500 caractères
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Plus tard
              </Button>
              <Button
                type="submit"
                variant="spiritual"
                loading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? 'Enregistrement...' : 'Terminer'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};