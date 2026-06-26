import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister }) => {
  const { t } = useTranslation();
  const { login, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsSubmitting(true);

    try {
      await login(formData);
      // Login successful - auth state change will handle redirection
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle specific Supabase errors
      if (error.message?.includes('Invalid login credentials')) {
        setErrors({ 
          general: 'Email ou mot de passe incorrect' 
        });
      } else if (error.message?.includes('Email not confirmed')) {
        setErrors({ 
          general: 'Veuillez confirmer votre email avant de vous connecter' 
        });
      } else if (error.message?.includes('rate limit')) {
        setErrors({ 
          general: 'Trop de tentatives. Veuillez réessayer plus tard.' 
        });
      } else {
        setErrors({ 
          general: error.message || 'Une erreur est survenue lors de la connexion' 
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const isLoadingTotal = isLoading || isSubmitting;

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
            {t('welcome') || 'Bienvenue'}
          </h1>
          <p className="text-gray-600">
            Connectez-vous à votre compte Koinonia
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{errors.general}</p>
              {errors.general?.includes('Email ou mot de passe incorrect') && (
                <p className="text-xs text-red-500 mt-1">
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      onSwitchToRegister();
                    }}
                    className="underline"
                  >
                    Créer un compte ?
                  </a>
                </p>
              )}
            </div>
          )}

          <Input
            label={t('email') || 'Email'}
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            icon={Mail}
            placeholder="votre@email.com"
            required
            error={errors.email}
            disabled={isLoadingTotal}
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
              disabled={isLoadingTotal}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 disabled:opacity-50"
              disabled={isLoadingTotal}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <div className="text-right">
            <button
              type="button"
              className="text-sm text-primary-600 hover:text-primary-700 disabled:opacity-50"
              disabled={isLoadingTotal}
            >
              Mot de passe oublié ?
            </button>
          </div>

          <Button
            type="submit"
            variant="spiritual"
            size="lg"
            fullWidth
            loading={isLoadingTotal}
            disabled={isLoadingTotal}
          >
            {isLoadingTotal ? 'Connexion...' : (t('login') || 'Se connecter')}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Pas encore de compte ?{' '}
            <button
              onClick={onSwitchToRegister}
              className="text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50"
              disabled={isLoadingTotal}
            >
              {t('register') || 'Créer un compte'}
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
};