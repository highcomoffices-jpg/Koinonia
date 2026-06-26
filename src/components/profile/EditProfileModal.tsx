import React, { useState, useEffect, useMemo } from 'react';
import { X, Upload, User, Mail, MapPin, Church, Camera } from 'lucide-react';
import Select from 'react-select';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { userService } from '../../services/userService';
import { useGeoData } from '../../hooks/useGeoData';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

interface OptionType {
  value: string;
  label: string;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  onUpdate,
}) => {
  const { user, refreshUser } = useAuth();
  const {
    countries,
    allCities,
    confessions,
    parishes,
    isLoadingCountries,
    isLoadingCities,
    searchCountries,
    searchCities,
    searchConfessions,
    searchParishes,
    loadCitiesByCountry,
    loadParishesByCityAndConfession,
  } = useGeoData();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    countryId: '',
    cityId: '',
    confessionId: '',
    parishId: '',
    bio: '',
    defaultVisibility: 'public',
  });

  const [selectedCountry, setSelectedCountry] = useState<OptionType | null>(null);
  const [selectedCity, setSelectedCity] = useState<OptionType | null>(null);
  const [selectedConfession, setSelectedConfession] = useState<OptionType | null>(null);
  const [selectedParish, setSelectedParish] = useState<OptionType | null>(null);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form with user data
  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        countryId: user.country?.id || '',
        cityId: user.city?.id || '',
        confessionId: user.confession?.id || '',
        parishId: user.parish?.id || '',
        bio: user.bio || '',
        defaultVisibility: user.defaultVisibility || 'public',
      });

      if (user.country) {
        setSelectedCountry({ value: user.country.id, label: user.country.name });
        if (user.country.id) {
          loadCitiesByCountry(user.country.id);
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

      if (user.avatar) {
        setAvatarPreview(user.avatar);
      }
    }
  }, [user, isOpen, loadCitiesByCountry]);

  // Load cities when country changes
  useEffect(() => {
    if (formData.countryId && isOpen) {
      loadCitiesByCountry(formData.countryId);
      setFormData(prev => ({ ...prev, cityId: '' }));
      setSelectedCity(null);
    }
  }, [formData.countryId, loadCitiesByCountry, isOpen]);

  // Load parishes when city or confession changes
  useEffect(() => {
    if ((formData.cityId || formData.confessionId) && isOpen) {
      loadParishesByCityAndConfession(formData.cityId, formData.confessionId);
      setFormData(prev => ({ ...prev, parishId: '' }));
      setSelectedParish(null);
    }
  }, [formData.cityId, formData.confessionId, loadParishesByCityAndConfession, isOpen]);

  // Options pour les selects avec recherche dynamique
  const countryOptions = useMemo(() => 
    countries.map(country => ({
      value: country.id,
      label: country.name,
    })).sort((a, b) => a.label.localeCompare(b.label)),
    [countries]
  );

  const cityOptions = useMemo(() => 
    allCities.map(city => ({
      value: city.id,
      label: city.name,
    })).sort((a, b) => a.label.localeCompare(b.label)),
    [allCities]
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
        if (formData.cityId && parish.city_id !== formData.cityId) return false;
        if (formData.confessionId && parish.confession_id !== formData.confessionId) return false;
        return true;
      })
      .map(parish => ({
        value: parish.id,
        label: parish.name,
      }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    [parishes, formData.cityId, formData.confessionId]
  );

  const visibilityOptions = [
    { value: 'public', label: 'Public – Tout le monde' },
    { value: 'subscribers', label: 'Abonnés – Mes abonnés uniquement' },
    { value: 'parish', label: 'Paroisse – Ma paroisse uniquement' },
  ];

  const handleCountryChange = (option: OptionType | null) => {
    setSelectedCountry(option);
    setFormData(prev => ({ ...prev, countryId: option?.value || '' }));
  };

  const handleCityChange = (option: OptionType | null) => {
    setSelectedCity(option);
    setFormData(prev => ({ ...prev, cityId: option?.value || '', parishId: '' }));
    setSelectedParish(null);
  };

  const handleConfessionChange = (option: OptionType | null) => {
    setSelectedConfession(option);
    setFormData(prev => ({ ...prev, confessionId: option?.value || '', parishId: '' }));
    setSelectedParish(null);
  };

  const handleParishChange = (option: OptionType | null) => {
    setSelectedParish(option);
    setFormData(prev => ({ ...prev, parishId: option?.value || '' }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, avatar: "L'image ne doit pas dépasser 5MB" }));
      return;
    }

    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, avatar: 'Veuillez sélectionner une image' }));
      return;
    }

    setAvatarFile(file);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      if (!user) throw new Error('Utilisateur non trouvé');

      const updateData: any = {};

      if (formData.firstName !== user.firstName && formData.firstName.trim() !== '') {
        updateData.first_name = formData.firstName.trim();
      }

      if (formData.lastName !== user.lastName && formData.lastName.trim() !== '') {
        updateData.last_name = formData.lastName.trim();
      }

      if (formData.countryId !== user.country?.id && formData.countryId && formData.countryId.trim() !== '') {
        updateData.country_id = formData.countryId;
      }

      if (formData.cityId !== user.city?.id && formData.cityId && formData.cityId.trim() !== '') {
        updateData.city_id = formData.cityId;
      }

      if (formData.confessionId !== user.confession?.id && formData.confessionId && formData.confessionId.trim() !== '') {
        updateData.confession_id = formData.confessionId;
      }

      if (formData.parishId !== user.parish?.id) {
        updateData.parish_id = formData.parishId && formData.parishId.trim() !== '' ? formData.parishId : null;
      }

      if (formData.bio !== user.bio) {
        updateData.bio = formData.bio || null;
      }

      if (formData.defaultVisibility !== user.defaultVisibility) {
        updateData.default_visibility = formData.defaultVisibility;
      }

      if (Object.keys(updateData).length > 0) {
        await userService.updateProfile(user.id, updateData);
      }

      if (avatarFile) {
        await userService.uploadAvatar(user.id, avatarFile);
      }

      await refreshUser();
      onUpdate();
      onClose();

    } catch (error: any) {
      console.error('Error updating profile:', error);
      setErrors({
        general: error.message || 'Une erreur est survenue lors de la mise à jour',
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
              <h2 className="text-2xl font-bold text-gray-900">Modifier le profil</h2>
              <p className="text-gray-600 mt-1">Mettez à jour vos informations</p>
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
            {/* Avatar */}
            <div className="text-center">
              <div className="relative inline-block">
                <div className="w-32 h-32 bg-gradient-to-br from-primary-400 to-spiritual-400 rounded-full flex items-center justify-center overflow-hidden">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-white text-3xl font-bold">
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </div>
                  )}
                </div>
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-2 right-2 bg-white p-2 rounded-full shadow-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <Camera className="w-4 h-4 text-gray-600" />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    disabled={isLoading}
                  />
                </label>
              </div>
              {errors.avatar && (
                <p className="text-sm text-red-600 mt-2">{errors.avatar}</p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                Cliquez sur l'icône pour changer votre photo
              </p>
            </div>

            {/* Personal Information */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Prénom"
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                icon={User}
                placeholder="Votre prénom"
                required
                error={errors.firstName}
                disabled={isLoading}
              />

              <Input
                label="Nom"
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                icon={User}
                placeholder="Votre nom"
                required
                error={errors.lastName}
                disabled={isLoading}
              />
            </div>

            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              icon={Mail}
              placeholder="votre@email.com"
              required
              disabled
              helptext="L'email ne peut pas être modifié"
            />

            {/* Location with autocomplete */}
            <div className="space-y-4">
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
                      borderColor: errors.countryId ? '#ef4444' : '#d1d5db',
                      '&:hover': { borderColor: '#cbd5e1' },
                    }),
                  }}
                />
                {errors.countryId && (
                  <p className="mt-1 text-sm text-red-600">{errors.countryId}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ville <span className="text-red-500">*</span>
                </label>
                <Select
                  options={cityOptions}
                  value={selectedCity}
                  onChange={handleCityChange}
                  placeholder={formData.countryId ? "Recherchez votre ville..." : "Sélectionnez d'abord un pays"}
                  isClearable
                  isDisabled={!formData.countryId}
                  isLoading={isLoadingCities}
                  noOptionsMessage={() => !formData.countryId ? "Sélectionnez un pays d'abord" : "Aucune ville trouvée"}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  onInputChange={(inputValue) => {
                    if (inputValue && inputValue.length >= 2 && formData.countryId) {
                      searchCities(inputValue, formData.countryId);
                    }
                  }}
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderRadius: '0.5rem',
                      borderColor: errors.cityId ? '#ef4444' : '#d1d5db',
                      '&:hover': { borderColor: '#cbd5e1' },
                    }),
                  }}
                />
                {errors.cityId && (
                  <p className="mt-1 text-sm text-red-600">{errors.cityId}</p>
                )}
              </div>
            </div>

            {/* Religious Information */}
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
                    borderColor: errors.confessionId ? '#ef4444' : '#d1d5db',
                    '&:hover': { borderColor: '#cbd5e1' },
                  }),
                }}
              />
              {errors.confessionId && (
                <p className="mt-1 text-sm text-red-600">{errors.confessionId}</p>
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
                isDisabled={!formData.cityId || !formData.confessionId}
                noOptionsMessage={() => "Aucune paroisse trouvée"}
                className="react-select-container"
                classNamePrefix="react-select"
                onInputChange={(inputValue) => {
                  if (inputValue && inputValue.length >= 2) {
                    searchParishes(inputValue, formData.cityId, formData.confessionId);
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

            {/* Default Visibility */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Visibilité par défaut des publications
              </label>
              <select
                name="defaultVisibility"
                value={formData.defaultVisibility}
                onChange={handleSelectChange}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bio (optionnel)
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Parlez-nous un peu de vous..."
                rows={4}
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

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                variant="spiritual"
                loading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};