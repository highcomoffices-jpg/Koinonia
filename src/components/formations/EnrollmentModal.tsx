import React, { useState } from 'react';
import { X, User, Mail, Phone, MapPin, Globe, Building, CheckCircle, AlertTriangle, Users, Clock, Award } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Formation } from '../../types';

interface EnrollmentModalProps {
  formation: Formation;
  onBack: () => void;
  onComplete: (data: EnrollmentData) => void;
}

export interface EnrollmentData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  participationMode: 'online' | 'onsite';
  acceptTerms: boolean;
  specialRequests?: string;
}

export const EnrollmentModal: React.FC<EnrollmentModalProps> = ({ 
  formation, 
  onBack, 
  onComplete 
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<EnrollmentData>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: '',
    participationMode: 'online',
    acceptTerms: false,
    specialRequests: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Simulation de places restantes
  const placesRestantes = formation.maxStudents ? formation.maxStudents - formation.currentStudents : null;
  const isOnlineAvailable = Math.random() > 0.3;
  const isOnsiteAvailable = Math.random() > 0.2;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Le prénom est requis';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Le nom est requis';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email invalide';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Le téléphone est requis';
    }
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'Vous devez accepter les conditions';
    }

    // Vérifier la disponibilité du mode choisi
    if (formData.participationMode === 'online' && !isOnlineAvailable) {
      newErrors.participationMode = 'Mode en ligne non disponible pour cette formation';
    }
    if (formData.participationMode === 'onsite' && !isOnsiteAvailable) {
      newErrors.participationMode = 'Mode présentiel complet';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    // Simulation de vérification des places
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Vérification finale des places
    if (placesRestantes && placesRestantes <= 0) {
      setErrors({ general: 'Désolé, cette formation est maintenant complète.' });
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    onComplete(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const formatPrice = (price: number) => {
    if (price === 0) return 'Gratuit';
    return `${price.toLocaleString()} FCFA`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Inscription à la formation
          </h2>
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Résumé de la formation */}
        <div className="bg-gradient-to-r from-spiritual-50 to-primary-50 rounded-lg p-4 mb-6 border border-spiritual-200">
          <div className="flex items-start space-x-4">
            <img
              src={formation.imageUrl}
              alt={formation.title}
              className="w-20 h-20 object-cover rounded-lg"
            />
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-1">{formation.title}</h3>
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{formation.description}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{formation.duration}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Award className="w-4 h-4" />
                  <span>{formation.modules.length} modules</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{formation.currentStudents} inscrits</span>
                </div>
              </div>
              <div className="text-lg font-bold text-primary-600 mt-2">
                {formatPrice(formation.price)}
              </div>
            </div>
          </div>
        </div>

        {/* Alerte places limitées */}
        {placesRestantes && placesRestantes <= 5 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-red-900">
                Attention ! Plus que {placesRestantes} place{placesRestantes > 1 ? 's' : ''} disponible{placesRestantes > 1 ? 's' : ''} !
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          {/* Section 1: Confirmation identité */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <User className="w-5 h-5 text-primary-600" />
              <span>Confirmation de votre identité</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Prénom"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                icon={User}
                required
                error={errors.firstName}
              />
              <Input
                label="Nom"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                icon={User}
                required
                error={errors.lastName}
              />
            </div>
            
            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              icon={Mail}
              required
              error={errors.email}
            />
            
            <Input
              label="Téléphone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              icon={Phone}
              placeholder="+229 XX XX XX XX"
              required
              error={errors.phone}
            />
          </div>

          {/* Section 2: Mode de participation */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-spiritual-600" />
              <span>Mode de participation</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option en ligne */}
              <label className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                formData.participationMode === 'online' 
                  ? 'border-blue-500 bg-blue-50' 
                  : isOnlineAvailable 
                    ? 'border-gray-200 hover:border-gray-300' 
                    : 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
              }`}>
                <input
                  type="radio"
                  name="participationMode"
                  value="online"
                  checked={formData.participationMode === 'online'}
                  onChange={handleChange}
                  disabled={!isOnlineAvailable}
                  className="sr-only"
                />
                <div className="flex items-center space-x-3">
                  <Globe className={`w-6 h-6 ${
                    formData.participationMode === 'online' ? 'text-blue-600' : 'text-gray-400'
                  }`} />
                  <div>
                    <p className={`font-medium ${
                      formData.participationMode === 'online' ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      En ligne via Koinonia Live
                    </p>
                    <p className="text-sm text-gray-500">
                      {isOnlineAvailable ? 'Accès depuis chez vous' : 'Non disponible'}
                    </p>
                    {formData.participationMode === 'online' && (
                      <div className="mt-2 text-xs text-blue-600 bg-blue-100 rounded px-2 py-1">
                        ✓ Lien de connexion envoyé par email
                      </div>
                    )}
                  </div>
                </div>
              </label>

              {/* Option présentiel */}
              <label className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                formData.participationMode === 'onsite' 
                  ? 'border-green-500 bg-green-50' 
                  : isOnsiteAvailable 
                    ? 'border-gray-200 hover:border-gray-300' 
                    : 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
              }`}>
                <input
                  type="radio"
                  name="participationMode"
                  value="onsite"
                  checked={formData.participationMode === 'onsite'}
                  onChange={handleChange}
                  disabled={!isOnsiteAvailable}
                  className="sr-only"
                />
                <div className="flex items-center space-x-3">
                  <Building className={`w-6 h-6 ${
                    formData.participationMode === 'onsite' ? 'text-green-600' : 'text-gray-400'
                  }`} />
                  <div>
                    <p className={`font-medium ${
                      formData.participationMode === 'onsite' ? 'text-green-900' : 'text-gray-900'
                    }`}>
                      Présentiel - Église Saint-Michel
                    </p>
                    <p className="text-sm text-gray-500">
                      {isOnsiteAvailable ? 'Cotonou, Bénin' : 'Places épuisées'}
                    </p>
                    {formData.participationMode === 'onsite' && (
                      <div className="mt-2 text-xs text-green-600 bg-green-100 rounded px-2 py-1">
                        ✓ Adresse détaillée envoyée par SMS
                      </div>
                    )}
                  </div>
                </div>
              </label>
            </div>
            
            {errors.participationMode && (
              <p className="text-sm text-red-600">{errors.participationMode}</p>
            )}
          </div>

          {/* Section 3: Demandes spéciales */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Demandes spéciales (optionnel)
            </h3>
            <textarea
              name="specialRequests"
              value={formData.specialRequests}
              onChange={handleChange}
              placeholder="Besoins particuliers, questions, ou demandes spécifiques..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors resize-none"
            />
          </div>

          {/* Section 4: Vérification places */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Vérification automatique</span>
            </div>
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex items-center justify-between">
                <span>Places totales :</span>
                <span className="font-medium">{formation.maxStudents || 'Illimitées'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Déjà inscrits :</span>
                <span className="font-medium">{formation.currentStudents}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Places restantes :</span>
                <span className={`font-bold ${
                  placesRestantes && placesRestantes <= 5 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {placesRestantes || 'Illimitées'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 5: Conditions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Conditions d'inscription
            </h3>
            
            <div className="bg-gray-50 rounded-lg p-4 space-y-3 text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Accès à vie au contenu de la formation</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Certificat de participation à la fin</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Support pédagogique inclus (PDF, vidéos)</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Accès au groupe privé de formation</span>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Remboursement possible sous 7 jours</span>
              </div>
            </div>

            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                name="acceptTerms"
                checked={formData.acceptTerms}
                onChange={handleChange}
                className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <div className="text-sm text-gray-700">
                <span>J'accepte les </span>
                <button type="button" className="text-primary-600 hover:text-primary-700 underline">
                  conditions générales
                </button>
                <span> et la </span>
                <button type="button" className="text-primary-600 hover:text-primary-700 underline">
                  politique de remboursement
                </button>
                <span> de Koinonia Formations.</span>
              </div>
            </label>
            
            {errors.acceptTerms && (
              <p className="text-sm text-red-600">{errors.acceptTerms}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-6 border-t border-gray-200">
            <Button variant="outline" fullWidth onClick={onBack}>
              Retour aux détails
            </Button>
            <Button 
              variant="spiritual" 
              fullWidth 
              type="submit"
              loading={isSubmitting}
              disabled={!formData.acceptTerms}
            >
              {isSubmitting ? 'Vérification...' : 'Continuer vers le paiement'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};