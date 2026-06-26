import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Card } from '../ui/Card';
import { useGeoData } from '../../hooks/useGeoData';
import { RegisterPhase1Data } from '../../types';

interface RegisterPhase1Props {
  onSwitchToLogin: () => void;
  onPhase1Complete: () => void;
}

export const RegisterPhase1: React.FC<RegisterPhase1Props> = ({ 
  onSwitchToLogin, 
  onPhase1Complete 
}) => {
  const { t } = useTranslation();
  const { registerPhase1, isLoading: authLoading } = useAuth();
  const { 
    countries, 
    isLoading: geoLoading,
    isLoadingCountries,
    error: geoError 
  } = useGeoData();
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<RegisterPhase1Data>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    countryId: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Le prénom est requis';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'Le prénom doit contenir au moins 2 caractères';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Le nom est requis';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Le nom doit contenir au moins 2 caractères';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }

    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    if (!formData.countryId) {
      newErrors.countryId = 'Le pays est requis';
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
      await registerPhase1(formData);
      onPhase1Complete();
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Handle specific Supabase errors
      if (error.message?.includes('already registered')) {
        setErrors({ 
          email: 'Cet email est déjà utilisé. Essayez de vous connecter.' 
        });
      } else if (error.message?.includes('Password should be at least')) {
        setErrors({ 
          password: 'Le mot de passe doit contenir au moins 6 caractères' 
        });
      } else if (error.message?.includes('Invalid email')) {
        setErrors({ 
          email: 'Email invalide' 
        });
      } else if (error.message?.includes('row violates row-level security policy')) {
        setErrors({ 
          general: 'Erreur de sécurité. Veuillez réessayer ou contacter le support.' 
        });
      } else if (error.message?.includes('429')) {
        setErrors({ 
          general: 'Trop de tentatives. Veuillez patienter quelques minutes.' 
        });
      } else {
        setErrors({ 
          general: error.message || 'Une erreur est survenue lors de l\'inscription' 
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: '' }));
    }
  };

  const countryOptions = countries.map(country => ({
    value: country.id,
    label: country.name,
    metadata: {
      code: country.code,
      continentId: country.continent_id
    }
  })).sort((a, b) => a.label.localeCompare(b.label));

  const isLoading = authLoading || isSubmitting || geoLoading;

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
            {t('register.phase1.title') || 'Créer un compte'}
          </h1>
          <p className="text-gray-600">
            {t('register.phase1.subtitle') || 'Rejoignez la communauté Koinonia'}
          </p>
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

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('firstName') || 'Prénom'}
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              icon={User}
              placeholder="Jean"
              required
              error={errors.firstName}
              disabled={isLoading}
            />

            <Input
              label={t('lastName') || 'Nom'}
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              icon={User}
              placeholder="Dupont"
              required
              error={errors.lastName}
              disabled={isLoading}
            />
          </div>

          <Input
            label={t('email') || 'Email'}
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            icon={Mail}
            placeholder="jean.dupont@example.com"
            required
            error={errors.email}
            disabled={isLoading}
          />

          <Select
            label={t('register.phase1.country') || 'Pays'}
            name="countryId"
            value={formData.countryId}
            onChange={handleChange}
            options={countryOptions}
            placeholder={isLoadingCountries ? 'Chargement des pays...' : t('register.phase1.selectCountry') || 'Sélectionnez un pays'}
            error={errors.countryId}
            disabled={isLoading || isLoadingCountries}
          />

          <div className="relative">
            <Input
              label={t('password') || 'Mot de passe'}
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              icon={Lock}
              placeholder="••••••••"
              required
              error={errors.password}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 disabled:opacity-50"
              disabled={isLoading}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <div className="relative">
            <Input
              label={t('confirmPassword') || 'Confirmer le mot de passe'}
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              icon={Lock}
              placeholder="••••••••"
              required
              error={errors.confirmPassword}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 disabled:opacity-50"
              disabled={isLoading}
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <div className="text-sm text-gray-500 space-y-1">
            <p>Le mot de passe doit contenir :</p>
            <ul className="list-disc list-inside pl-2">
              <li className={formData.password.length >= 6 ? 'text-green-600' : ''}>
                Au moins 6 caractères
              </li>
              <li className={/(?=.*[a-z])/.test(formData.password) ? 'text-green-600' : ''}>
                Au moins une minuscule
              </li>
              <li className={/(?=.*[A-Z])/.test(formData.password) ? 'text-green-600' : ''}>
                Au moins une majuscule
              </li>
              <li className={/(?=.*\d)/.test(formData.password) ? 'text-green-600' : ''}>
                Au moins un chiffre
              </li>
            </ul>
          </div>

          <Button
            type="submit"
            variant="spiritual"
            size="lg"
            fullWidth
            loading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'Inscription en cours...' : (t('register.phase1.continue') || 'Continuer')}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            {t('register.phase1.haveAccount') || 'Vous avez déjà un compte ?'}{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50"
              disabled={isLoading}
            >
              {t('login') || 'Se connecter'}
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
};