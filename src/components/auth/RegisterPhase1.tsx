import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
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
    continents,
    countries,
    loadCountriesByContinent,
    isLoadingCountries,
    error: geoError 
  } = useGeoData();
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedContinent, setSelectedContinent] = useState('');
  const [acceptPolicies, setAcceptPolicies] = useState(false);
  const [formData, setFormData] = useState<RegisterPhase1Data & { continentId?: string }>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    countryId: '',
    continentId: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  // Charger les pays quand le continent change
  useEffect(() => {
    if (selectedContinent) {
      loadCountriesByContinent(selectedContinent);
      setFormData(prev => ({ ...prev, countryId: '' }));
    }
  }, [selectedContinent, loadCountriesByContinent]);

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
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    if (!formData.countryId) {
      newErrors.countryId = 'Le pays est requis';
    }

    if (!acceptPolicies) {
      newErrors.acceptPolicies = 'Vous devez accepter les politiques de Koinonia';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});
    setIsEmailSent(false);

    try {
      await registerPhase1({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        countryId: formData.countryId,
      });
      
      setIsEmailSent(true);
      
    } catch (error: any) {
      console.error('Registration error:', error);
      
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
    
    if (name === 'continentId') {
      setSelectedContinent(value);
      setFormData(prev => ({ ...prev, continentId: value, countryId: '' }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: '' }));
    }
  };

  const handleResendConfirmation = async () => {
    if (!formData.email) return;
    
    try {
      await supabase.auth.resend({
        type: 'signup',
        email: formData.email
      });
      setErrors({
        general: 'Un nouveau lien de confirmation a été envoyé à votre adresse email.'
      });
    } catch (error) {
      console.error('Erreur lors du renvoi du lien:', error);
      setErrors({
        general: 'Erreur lors du renvoi du lien. Veuillez réessayer plus tard.'
      });
    }
  };

  const continentOptions = continents.map(continent => ({
    value: continent.id,
    label: continent.name,
  }));

  const countryOptions = countries.map(country => ({
    value: country.id,
    label: country.name,
  }));

  const isLoading = authLoading || isSubmitting;

  // Affichage du message de confirmation d'email
  if (isEmailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-spiritual-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">📧 Vérifiez votre email</h2>
          <p className="text-gray-600 mb-4">
            Un email de confirmation a été envoyé à <strong>{formData.email}</strong>.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Veuillez cliquer sur le lien dans l'email pour activer votre compte avant de vous connecter.
          </p>
          <div className="space-y-3">
            <button
              onClick={handleResendConfirmation}
              className="w-full text-primary-600 font-medium py-2 px-4 rounded-xl hover:bg-primary-50 transition-colors border border-primary-200"
            >
              Renvoyer le lien de confirmation
            </button>
            <button
              onClick={() => {
                setIsEmailSent(false);
                onSwitchToLogin();
              }}
              className="w-full text-gray-600 font-medium py-2 px-4 rounded-xl hover:bg-gray-50 transition-colors border border-gray-200"
            >
              Retour à la connexion
            </button>
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
            label="Continent"
            name="continentId"
            value={selectedContinent}
            onChange={handleChange}
            options={continentOptions}
            placeholder="Sélectionnez votre continent"
            error={errors.continentId}
            disabled={isLoading}
          />

          <Select
            label={t('register.phase1.country') || 'Pays'}
            name="countryId"
            value={formData.countryId}
            onChange={handleChange}
            options={countryOptions}
            placeholder={selectedContinent ? "Sélectionnez votre pays" : "Sélectionnez d'abord un continent"}
            error={errors.countryId}
            disabled={isLoading || !selectedContinent || isLoadingCountries}
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

          {/* Politiques - Case à cocher */}
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="acceptPolicies"
                checked={acceptPolicies}
                onChange={(e) => {
                  setAcceptPolicies(e.target.checked);
                  if (errors.acceptPolicies) {
                    setErrors(prev => ({ ...prev, acceptPolicies: '' }));
                  }
                }}
                className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                disabled={isLoading}
              />
              <label htmlFor="acceptPolicies" className="text-sm text-gray-700 cursor-pointer">
                J'accepte les{' '}
                <a 
                  href="/policies"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline font-medium"
                >
                  Politiques de Koinonia
                </a>
              </label>
            </div>
            {errors.acceptPolicies && (
              <p className="text-sm text-red-600">{errors.acceptPolicies}</p>
            )}
            <p className="text-xs text-gray-400 pl-6">
              En acceptant, vous reconnaissez avoir lu et compris nos politiques de confidentialité et d'utilisation.
            </p>
          </div>

          <Button
            type="submit"
            variant="spiritual"
            size="lg"
            fullWidth
            loading={isLoading}
            disabled={isLoading || !acceptPolicies}
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
