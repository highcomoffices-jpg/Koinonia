import React, { useState } from 'react';
import { X, CreditCard, Smartphone, Bitcoin, Shield, CheckCircle, AlertTriangle, Clock, Award, Users } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Formation } from '../../types';
import { EnrollmentData } from './EnrollmentModal';

interface PaymentModalProps {
  formation: Formation;
  enrollmentData: EnrollmentData;
  onBack: () => void;
  onComplete: (data: PaymentData) => void;
}

export interface PaymentData {
  method: 'mobile_money' | 'card' | 'crypto';
  provider?: string;
  amount: number;
  currency: string;
  transactionId: string;
  fees: number;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ 
  formation, 
  enrollmentData, 
  onBack, 
  onComplete 
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'mobile_money' | 'card' | 'crypto'>('mobile_money');
  const [selectedProvider, setSelectedProvider] = useState('mtn');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });
  const [cryptoWallet, setCryptoWallet] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const paymentMethods = [
    {
      id: 'mobile_money',
      name: 'Mobile Money',
      icon: Smartphone,
      description: 'MTN, Moov, Orange Money',
      fees: 0,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      id: 'card',
      name: 'Carte bancaire',
      icon: CreditCard,
      description: 'Visa, Mastercard',
      fees: Math.round(formation.price * 0.025), // 2.5% de frais
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      id: 'crypto',
      name: 'Cryptomonnaie',
      icon: Bitcoin,
      description: 'Bitcoin, USDT',
      fees: Math.round(formation.price * 0.01), // 1% de frais
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    }
  ];

  const mobileProviders = [
    { id: 'mtn', name: 'MTN Mobile Money', color: 'text-yellow-600' },
    { id: 'moov', name: 'Moov Money', color: 'text-blue-600' },
    { id: 'orange', name: 'Orange Money', color: 'text-orange-600' }
  ];

  const processingSteps = [
    'Vérification des informations...',
    'Connexion sécurisée au service de paiement...',
    'Traitement de la transaction...',
    'Confirmation du paiement...',
    'Génération de votre inscription...'
  ];

  const totalAmount = formation.price + (paymentMethods.find(m => m.id === selectedMethod)?.fees || 0);

  const validatePayment = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (selectedMethod === 'mobile_money') {
      if (!phoneNumber.trim()) {
        newErrors.phoneNumber = 'Numéro de téléphone requis';
      } else if (!/^\+?229\d{8}$/.test(phoneNumber.replace(/\s/g, ''))) {
        newErrors.phoneNumber = 'Format: +229 XX XX XX XX';
      }
    } else if (selectedMethod === 'card') {
      if (!cardData.number.trim()) {
        newErrors.cardNumber = 'Numéro de carte requis';
      }
      if (!cardData.expiry.trim()) {
        newErrors.cardExpiry = 'Date d\'expiration requise';
      }
      if (!cardData.cvv.trim()) {
        newErrors.cardCvv = 'CVV requis';
      }
      if (!cardData.name.trim()) {
        newErrors.cardName = 'Nom sur la carte requis';
      }
    } else if (selectedMethod === 'crypto') {
      if (!cryptoWallet.trim()) {
        newErrors.cryptoWallet = 'Adresse de portefeuille requise';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayment = async () => {
    if (!validatePayment()) return;

    setIsProcessing(true);
    
    // Simulation du processus de paiement avec étapes
    for (let i = 0; i < processingSteps.length; i++) {
      setProcessingStep(i);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Simulation de succès du paiement
    const paymentData: PaymentData = {
      method: selectedMethod,
      provider: selectedMethod === 'mobile_money' ? selectedProvider : undefined,
      amount: totalAmount,
      currency: 'FCFA',
      transactionId: `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      fees: paymentMethods.find(m => m.id === selectedMethod)?.fees || 0
    };

    setIsProcessing(false);
    onComplete(paymentData);
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} FCFA`;
  };

  const selectedMethodData = paymentMethods.find(m => m.id === selectedMethod);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Paiement sécurisé
          </h2>
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {isProcessing ? (
          /* Écran de traitement */
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-spiritual-500 to-primary-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Traitement en cours...
            </h3>
            <p className="text-gray-600 mb-6">
              {processingSteps[processingStep]}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div 
                className="bg-gradient-to-r from-spiritual-500 to-primary-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${((processingStep + 1) / processingSteps.length) * 100}%` }}
              />
            </div>
            <p className="text-sm text-gray-500">
              Étape {processingStep + 1} sur {processingSteps.length}
            </p>
            <div className="mt-6 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
              🔒 Paiement sécurisé par cryptage SSL 256-bit
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Résumé de commande */}
            <div className="bg-gradient-to-r from-spiritual-50 to-primary-50 rounded-lg p-4 border border-spiritual-200">
              <h3 className="font-bold text-gray-900 mb-3">Résumé de votre commande</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Formation :</span>
                  <span className="font-medium">{formation.title}</span>
                </div>
                <div className="flex justify-between">
                  <span>Participant :</span>
                  <span className="font-medium">{enrollmentData.firstName} {enrollmentData.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Mode :</span>
                  <span className="font-medium">
                    {enrollmentData.participationMode === 'online' ? '🌐 En ligne' : '🏢 Présentiel'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Durée :</span>
                  <span className="font-medium">{formation.duration} • {formation.modules.length} modules</span>
                </div>
                <div className="border-t border-spiritual-200 pt-2 mt-3">
                  <div className="flex justify-between text-base">
                    <span>Prix de la formation :</span>
                    <span className="font-bold">{formatPrice(formation.price)}</span>
                  </div>
                  {selectedMethodData?.fees && selectedMethodData.fees > 0 && (
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Frais de transaction :</span>
                      <span>+{formatPrice(selectedMethodData.fees)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold text-primary-600 mt-2">
                    <span>Total à payer :</span>
                    <span>{formatPrice(totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sélection méthode de paiement */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Choisissez votre méthode de paiement
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  const isSelected = selectedMethod === method.id;
                  
                  return (
                    <button
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id as any)}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        isSelected 
                          ? `${method.borderColor} ${method.bgColor}` 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3 mb-2">
                        <Icon className={`w-6 h-6 ${isSelected ? method.color : 'text-gray-400'}`} />
                        <div>
                          <p className={`font-medium ${isSelected ? method.color : 'text-gray-900'}`}>
                            {method.name}
                          </p>
                          <p className="text-sm text-gray-500">{method.description}</p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-600">
                        {method.fees > 0 ? `Frais: ${formatPrice(method.fees)}` : 'Sans frais'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Formulaire selon la méthode */}
            <div className="space-y-4">
              {selectedMethod === 'mobile_money' && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Informations Mobile Money</h4>
                  
                  {/* Sélection opérateur */}
                  <div className="grid grid-cols-3 gap-3">
                    {mobileProviders.map((provider) => (
                      <button
                        key={provider.id}
                        onClick={() => setSelectedProvider(provider.id)}
                        className={`p-3 rounded-lg border-2 text-center transition-all ${
                          selectedProvider === provider.id 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <p className={`text-sm font-medium ${
                          selectedProvider === provider.id ? 'text-green-900' : 'text-gray-900'
                        }`}>
                          {provider.name.split(' ')[0]}
                        </p>
                      </button>
                    ))}
                  </div>
                  
                  <Input
                    label="Numéro de téléphone"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+229 XX XX XX XX"
                    icon={Smartphone}
                    error={errors.phoneNumber}
                  />
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-800">
                      📱 Vous recevrez un SMS avec le code de confirmation sur ce numéro.
                    </p>
                  </div>
                </div>
              )}

              {selectedMethod === 'card' && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Informations de carte</h4>
                  
                  <Input
                    label="Numéro de carte"
                    value={cardData.number}
                    onChange={(e) => setCardData(prev => ({ ...prev, number: e.target.value }))}
                    placeholder="1234 5678 9012 3456"
                    icon={CreditCard}
                    error={errors.cardNumber}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Date d'expiration"
                      value={cardData.expiry}
                      onChange={(e) => setCardData(prev => ({ ...prev, expiry: e.target.value }))}
                      placeholder="MM/AA"
                      error={errors.cardExpiry}
                    />
                    <Input
                      label="CVV"
                      value={cardData.cvv}
                      onChange={(e) => setCardData(prev => ({ ...prev, cvv: e.target.value }))}
                      placeholder="123"
                      error={errors.cardCvv}
                    />
                  </div>
                  
                  <Input
                    label="Nom sur la carte"
                    value={cardData.name}
                    onChange={(e) => setCardData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="JEAN DUPONT"
                    error={errors.cardName}
                  />
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      🔒 Paiement sécurisé par cryptage SSL. Vos données ne sont pas stockées.
                    </p>
                  </div>
                </div>
              )}

              {selectedMethod === 'crypto' && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Paiement en cryptomonnaie</h4>
                  
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="text-center">
                      <Bitcoin className="w-12 h-12 text-orange-600 mx-auto mb-3" />
                      <p className="text-sm text-orange-800 mb-2">
                        Montant à envoyer : <span className="font-bold">0.00234 BTC</span>
                      </p>
                      <p className="text-xs text-orange-600">
                        (Équivalent à {formatPrice(totalAmount)})
                      </p>
                    </div>
                  </div>
                  
                  <Input
                    label="Adresse de votre portefeuille"
                    value={cryptoWallet}
                    onChange={(e) => setCryptoWallet(e.target.value)}
                    placeholder="bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
                    icon={Bitcoin}
                    error={errors.cryptoWallet}
                  />
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Vérifiez bien l'adresse avant de confirmer. Les transactions crypto sont irréversibles.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Garanties et sécurité */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Shield className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-900">Garanties Koinonia</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Paiement 100% sécurisé</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Remboursement sous 7 jours</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Support 24/7</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Accès à vie au contenu</span>
                </div>
              </div>
            </div>

            {/* Récapitulatif final */}
            <div className="bg-white border-2 border-primary-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-gray-900">Total à payer</span>
                <span className="text-2xl font-bold text-primary-600">
                  {formatPrice(totalAmount)}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                <p>• Formation : {formatPrice(formation.price)}</p>
                {selectedMethodData?.fees && selectedMethodData.fees > 0 && (
                  <p>• Frais {selectedMethodData.name} : {formatPrice(selectedMethodData.fees)}</p>
                )}
                <p className="mt-2 text-xs">
                  En confirmant, vous acceptez les conditions de Koinonia Formations.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-6 border-t border-gray-200">
              <Button variant="outline" fullWidth onClick={onBack}>
                Retour à l'inscription
              </Button>
              <Button 
                variant="spiritual" 
                fullWidth 
                onClick={handlePayment}
                icon={Shield}
              >
                Confirmer le paiement - {formatPrice(totalAmount)}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};