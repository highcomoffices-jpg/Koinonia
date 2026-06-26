import React, { useState, useEffect } from 'react';
import { Heart, Gift, Zap } from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';
import { Input } from './Input';
import { Select } from './Select';
import { organizationService, Organization } from '../../services/organizationService';
import { PaymentMethod } from '../../types/premium';
import { supabase } from '../../lib/supabase';

interface MicroDonationButtonProps {
  targetType: 'post' | 'live' | 'prayer' | 'formation';
  targetId: string;
  className?: string;
  liveTitle?: string;
  liveOrganizer?: string;
}

export const MicroDonationButton: React.FC<MicroDonationButtonProps> = ({ 
  targetType, 
  targetId, 
  className = '',
  liveTitle,
  liveOrganizer
}) => {
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [beneficiaryId, setBeneficiaryId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.MOBILE_MONEY);
  const [isProcessing, setIsProcessing] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false);
  const [liveData, setLiveData] = useState<any>(null);
  const [isLoadingLive, setIsLoadingLive] = useState(false);

  // Charger les informations du live si targetType === 'live'
  useEffect(() => {
    if (showModal && targetType === 'live' && targetId && !liveData) {
      fetchLiveData();
    }
  }, [showModal, targetType, targetId]);

  const fetchLiveData = async () => {
    setIsLoadingLive(true);
    try {
      const { data, error } = await supabase
        .from('live_celebrations')
        .select(`
          id,
          title,
          description,
          organizer:profiles!organizer_id(
            id,
            first_name,
            last_name,
            avatar_url
          ),
          viewer_count,
          visibility,
          image_url
        `)
        .eq('id', targetId)
        .single();

      if (error) throw error;
      setLiveData(data);
    } catch (error) {
      console.error('Error fetching live data:', error);
    } finally {
      setIsLoadingLive(false);
    }
  };

  // Charger les organisations depuis Supabase
  useEffect(() => {
    const loadOrganizations = async () => {
      setIsLoadingOrgs(true);
      try {
        const orgs = await organizationService.getOrganizations({ isVerified: true });
        setOrganizations(orgs);
      } catch (error) {
        console.error('Error loading organizations:', error);
      } finally {
        setIsLoadingOrgs(false);
      }
    };

    if (showModal) {
      loadOrganizations();
    }
  }, [showModal]);

  const beneficiaryOptions = [
    { value: '', label: 'Communauté générale' },
    ...organizations.map(org => ({
      value: org.id,
      label: org.name
    }))
  ];

  const paymentMethodOptions = [
    { value: PaymentMethod.MOBILE_MONEY, label: 'Mobile Money' },
    { value: PaymentMethod.CARD, label: 'Carte bancaire' },
    { value: PaymentMethod.CRYPTO, label: 'Cryptomonnaie' }
  ];

  const getTitle = () => {
    switch (targetType) {
      case 'post': return 'cette publication';
      case 'live': return 'cette diffusion en direct';
      case 'prayer': return 'cette prière';
      case 'formation': return 'cette formation';
      default: return 'cet élément';
    }
  };

  const getIcon = () => {
    switch (targetType) {
      case 'live': return <Zap className="w-6 h-6 text-white" />;
      default: return <Gift className="w-6 h-6 text-white" />;
    }
  };

  const getGradient = () => {
    switch (targetType) {
      case 'live': return 'from-red-500 to-orange-500';
      default: return 'from-warm-500 to-orange-500';
    }
  };

  const handleDonate = async () => {
    if (!amount || parseInt(amount) < 100) return;

    setIsProcessing(true);
    
    // Simulation de traitement du paiement
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Si un bénéficiaire est sélectionné, incrémenter son total
    if (beneficiaryId) {
      await organizationService.incrementTotalReceived(beneficiaryId, parseInt(amount));
    }

    // Enregistrer la donation pour le live
    if (targetType === 'live' && targetId) {
      try {
        await supabase.from('live_donations').insert({
          live_id: targetId,
          amount: parseInt(amount),
          donor_id: (await supabase.auth.getUser()).data.user?.id,
          is_anonymous: !beneficiaryId,
          payment_method: paymentMethod,
          status: 'completed'
        });

        // Mettre à jour le compteur d'offrandes du live
        await supabase.rpc('increment_live_offerings', {
          live_id: targetId,
          amount: parseInt(amount)
        });
      } catch (error) {
        console.error('Error recording live donation:', error);
      }
    }
    
    setIsProcessing(false);
    setShowModal(false);
    setAmount('');
    setBeneficiaryId('');
    
    // Afficher une notification de succès
    const message = targetType === 'live' && liveData
      ? `Merci ! Votre don de ${amount} FCFA pour "${liveData.title}" a été envoyé avec succès.`
      : `Merci ! Votre don de ${amount} FCFA a été envoyé avec succès.`;
    alert(message);
  };

  // Texte personnalisé pour le bouton selon le type
  const getButtonText = () => {
    switch (targetType) {
      case 'live': return 'Soutenir le live';
      default: return 'Offrande';
    }
  };

  // Texte personnalisé pour la description du modal
  const getModalDescription = () => {
    if (targetType === 'live' && liveData) {
      return `Soutenez "${liveData.title}" par votre générosité durant cette diffusion en direct.`;
    }
    return `Soutenez ${getTitle()} par votre générosité`;
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        icon={targetType === 'live' ? Zap : Gift}
        onClick={() => setShowModal(true)}
        className={`${targetType === 'live' ? 'text-red-600 hover:text-red-700 hover:bg-red-50' : 'text-warm-600 hover:text-warm-700 hover:bg-warm-50'} ${className}`}
      >
        {getButtonText()}
      </Button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <div className="text-center mb-6">
              <div className={`w-12 h-12 bg-gradient-to-br ${getGradient()} rounded-full flex items-center justify-center mx-auto mb-4`}>
                {getIcon()}
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Faire une micro-offrande
              </h2>
              <p className="text-gray-600">
                {getModalDescription()}
              </p>
            </div>

            <div className="space-y-4">
              <Input
                label="Montant (FCFA)"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Minimum 100 FCFA"
                min="100"
                required
              />

              <div className="grid grid-cols-3 gap-2">
                {[100, 500, 1000].map((suggestedAmount) => (
                  <button
                    key={suggestedAmount}
                    onClick={() => setAmount(suggestedAmount.toString())}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm transition-colors"
                  >
                    {suggestedAmount} FCFA
                  </button>
                ))}
              </div>

              <Select
                label="Bénéficiaire (optionnel)"
                value={beneficiaryId}
                onChange={(e) => setBeneficiaryId(e.target.value)}
                options={beneficiaryOptions}
                placeholder={isLoadingOrgs ? 'Chargement...' : 'Sélectionnez une organisation'}
                disabled={isLoadingOrgs}
              />

              <Select
                label="Méthode de paiement"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                options={paymentMethodOptions}
                required
              />

              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                <p className="mb-1">💡 <strong>Micro-offrande :</strong></p>
                <p>Votre don sera directement versé à l'organisation choisie ou à la communauté générale.</p>
                {targetType === 'live' && (
                  <p className="mt-2 text-xs text-spiritual-600">
                    🎥 Vos dons aident à maintenir les diffusions en direct et à soutenir les organisateurs.
                  </p>
                )}
              </div>

              <div className="flex space-x-3">
                <Button 
                  variant="outline" 
                  fullWidth 
                  onClick={() => setShowModal(false)}
                  disabled={isProcessing}
                >
                  Annuler
                </Button>
                <Button 
                  variant="spiritual" 
                  fullWidth 
                  onClick={handleDonate}
                  loading={isProcessing}
                  disabled={!amount || parseInt(amount) < 100}
                >
                  {isProcessing ? 'Traitement...' : 'Confirmer le don'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};