import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPin, Church, Home, FileText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Card } from '../ui/Card';
import { useGeoData } from '../../hooks/useGeoData';
import { RegisterPhase2Data } from '../../types';

export const RegisterPhase2: React.FC = () => {
  const { t } = useTranslation();
  const { user, registerPhase2, isLoading: authLoading } = useAuth();
  const { 
    cities,
    confessions,
    parishes,
    isLoading: geoLoading,
    error: geoError,
    loadCitiesByCountry,
    loadParishesByCityAndConfession
  } = useGeoData();
  
  const [formData, setFormData] = useState<RegisterPhase2Data>({
    cityId: '',
    confessionId: '',
    parishId: '',
    bio: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filteredParishes, setFilteredParishes] = useState<any[]>([]);

  // Load cities for user's country when component mounts
  useEffect(() => {
    if (user?.country?.id) {
      loadCitiesByCountry(user.country.id);
    }
  }, [user?.country?.id, loadCitiesByCountry]);

  // Filter parishes when city or confession changes
  useEffect(() => {
    if (formData.cityId || formData.confessionId) {
      loadParishesByCityAndConfession(formData.cityId, formData.confessionId);
    }
  }, [formData.cityId, formData.confessionId, loadParishesByCityAndConfession]);

  // Update filtered parishes when parishes data changes
  useEffect(() => {
    let filtered = parishes;
    
    if (formData.cityId) {
      filtered = filtered.filter(parish => parish.city_id === formData.cityId);
    }
    
    if (formData.confessionId) {
      filtered = filtered.filter(parish => parish.confession_id === formData.confessionId);
    }
    
    setFilteredParishes(filtered);
    
    // Reset parish if it's no longer available
    if (formData.parishId && !filtered.find(p => p.id === formData.parishId)) {
      setFormData(prev => ({ ...prev, parishId: '' }));
    }
  }, [parishes, formData.cityId, formData.confessionId, formData.parishId]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.cityId) {
      newErrors.cityId = 'La ville est requise';
    }
    if (!formData.confessionId) {
      newErrors.confessionId = 'La confession religieuse est requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      await registerPhase2(formData);
      // Redirection will be handled by App.tsx based on user.profileComplete
    } catch (error: any) {
      console.error('Registration phase 2 error:', error);
      
      if (error.message?.includes('User not found')) {
        setErrors({ 
          general: 'Session expirée. Veuillez vous reconnecter.' 
        });
      } else if (error.message?.includes('foreign key constraint')) {
        setErrors({ 
          general: 'Une des informations sélectionnées n\'est plus disponible. Veuillez vérifier vos choix.' 
        });
      } else {
        setErrors({ 
          general: error.message || 'Une erreur est survenue lors de la finalisation du profil' 
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // If confession or city changes, reset parish
      if ((name === 'confessionId' || name === 'cityId') && prev.parishId) {
        newData.parishId = '';
      }
      
      return newData;
    });
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: '' }));
    }
  };

  const cityOptions = cities.map(city => ({
    value: city.id,
    label: city.name
  })).sort((a, b) => a.label.localeCompare(b.label));

  const confessionOptions = confessions.map(confession => ({
    value: confession.id,
    label: confession.name,
    metadata: {
      description: confession.description,
      validated: confession.validated
    }
  })).sort((a, b) => a.label.localeCompare(b.label));

  const parishOptions = filteredParishes.map(parish => ({
    value: parish.id,
    label: parish.name,
    metadata: {
      address: parish.address,
      validated: parish.validated
    }
  })).sort((a, b) => a.label.localeCompare(b.label));

  const isLoading = authLoading || isSubmitting || geoLoading;

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-spiritual-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Session expirée</h2>
            <p className="text-gray-600 mb-6">
              Veuillez vous connecter pour continuer.
            </p>
            <Button
              variant="primary"
              onClick={() => window.location.reload()}
            >
              Retour à la connexion
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-spiritual-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-spiritual-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-2 border-white rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-full"></div>
            </div>
          </div>
          <h1 className="text-2xl font-display font-bold text-gray-900 mb-2">
            {t('register.phase2.title') || 'Compléter votre profil'}
          </h1>
          <p className="text-gray-600">
            {t('register.phase2.subtitle') || 'Pour mieux vous connecter à la communauté'}
          </p>
          {user && (
            <p className="text-sm text-primary-600 mt-2">
              Bienvenue {user.firstName} {user.lastName} !
              {user.country && ` de ${user.country.name}`}
            </p>
          )}
        </div>

        {geoError && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">
              Erreur de chargement des données. Veuillez rafraîchir la page.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          <Select
            label={t('register.phase2.city') || 'Ville'}
            name="cityId"
            value={formData.cityId}
            onChange={handleChange}
            options={cityOptions}
            placeholder={geoLoading ? 'Chargement des villes...' : t('register.phase2.selectCity') || 'Sélectionnez votre ville'}
            error={errors.cityId}
            disabled={isLoading || geoLoading || !user?.country?.id}
            loading={geoLoading}
            helpText={!user?.country?.id ? "Sélectionnez d'abord un pays lors de l'étape 1" : undefined}
          />

          <Select
            label={t('register.phase2.confession') || 'Confession religieuse'}
            name="confessionId"
            value={formData.confessionId}
            onChange={handleChange}
            options={confessionOptions}
            placeholder={geoLoading ? 'Chargement des confessions...' : t('register.phase2.selectConfession') || 'Sélectionnez votre confession'}
            error={errors.confessionId}
            disabled={isLoading || geoLoading}
            loading={geoLoading}
          />

          {filteredParishes.length > 0 && (
            <Select
              label={t('register.phase2.parish') || 'Paroisse/Église (optionnel)'}
              name="parishId"
              value={formData.parishId}
              onChange={handleChange}
              options={parishOptions}
              placeholder={t('register.phase2.selectParish') || 'Sélectionnez votre paroisse'}
              error={errors.parishId}
              disabled={isLoading || !formData.cityId || !formData.confessionId}
              helpText={!formData.cityId || !formData.confessionId ? 
                "Sélectionnez d'abord une ville et une confession" : 
                `${filteredParishes.length} paroisse(s) trouvée(s)`}
            />
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('register.phase2.bio') || 'Bio (optionnel)'}
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder={t('register.phase2.bioPlaceholder') || 'Parlez-nous un peu de vous...'}
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {formData.bio.length}/500 caractères
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700">
              <strong>Information :</strong> Votre profil sera visible par les autres membres de la communauté. 
              Vous pourrez modifier ces informations à tout moment dans les paramètres.
            </p>
          </div>

          <Button
            type="submit"
            variant="spiritual"
            size="lg"
            fullWidth
            loading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'Finalisation...' : (t('register.phase2.complete') || 'Finaliser mon inscription')}
          </Button>
        </form>
      </Card>
    </div>
  );
};