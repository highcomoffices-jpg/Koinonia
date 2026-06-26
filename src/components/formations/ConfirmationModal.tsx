import React, { useState, useEffect } from 'react';
import { CheckCircle, Download, Calendar, Users, MessageCircle, Gift, Star, Award, QrCode, Mail, Bell, Home } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Formation } from '../../types';
import { EnrollmentData } from './EnrollmentModal';
import { PaymentData } from './PaymentModal';

interface ConfirmationModalProps {
  formation: Formation;
  enrollmentData: EnrollmentData;
  paymentData: PaymentData;
  onComplete: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
  formation, 
  enrollmentData, 
  paymentData, 
  onComplete 
}) => {
  const [showQRCode, setShowQRCode] = useState(false);
  const [notificationsSent, setNotificationsSent] = useState(false);
  const [calendarAdded, setCalendarAdded] = useState(false);
  const [groupJoined, setGroupJoined] = useState(false);

  // Simulation des actions automatiques
  useEffect(() => {
    const timer1 = setTimeout(() => setNotificationsSent(true), 1000);
    const timer2 = setTimeout(() => setCalendarAdded(true), 2000);
    const timer3 = setTimeout(() => setGroupJoined(true), 3000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} FCFA`;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Simulation de dates de formation
  const startDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // Dans 15 jours
  const endDate = new Date(startDate.getTime() + 42 * 24 * 60 * 60 * 1000); // 6 semaines plus tard

  const handleDownloadTicket = () => {
    // Simulation de téléchargement
    alert('📄 Ticket d\'inscription téléchargé avec succès !');
  };

  const handleAddToCalendar = () => {
    // Simulation d'ajout au calendrier
    const calendarUrl = `data:text/calendar;charset=utf8,BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTEND:${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:${formation.title}
DESCRIPTION:Formation chrétienne avec ${formation.instructor.firstName} ${formation.instructor.lastName}
LOCATION:${enrollmentData.participationMode === 'online' ? 'En ligne via Koinonia Live' : 'Église Saint-Michel, Cotonou'}
END:VEVENT
END:VCALENDAR`;
    
    const link = document.createElement('a');
    link.href = calendarUrl;
    link.download = `formation-${formation.title.replace(/\s+/g, '-').toLowerCase()}.ics`;
    link.click();
    
    alert('📅 Événement ajouté à votre calendrier !');
  };

  const handleJoinGroup = () => {
    // Simulation de redirection vers le groupe
    alert(`🎉 Vous avez rejoint le groupe "${formation.title} - Promotion ${new Date().getFullYear()}" !`);
  };

  const handleViewFormation = () => {
    // Simulation d'accès à la formation
    alert('🎓 Redirection vers votre espace de formation...');
  };

  const handleMicroDonation = () => {
    // Simulation de micro-don
    alert('💝 Merci pour votre générosité ! Votre offrande soutient la paroisse organisatrice.');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[95vh] overflow-y-auto">
        {/* En-tête de confirmation */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Inscription confirmée ! 🎉
          </h2>
          <div className="bg-gradient-to-r from-spiritual-50 to-primary-50 rounded-lg p-4 border border-spiritual-200">
            <p className="text-lg text-spiritual-800 font-medium">
              "Merci {enrollmentData.firstName} 🙏<br />
              Que cette formation soit une bénédiction pour toi et ta maison !"
            </p>
          </div>
        </div>

        {/* Détails de l'inscription */}
        <div className="space-y-6">
          {/* Ticket numérique */}
          <div className="bg-white border-2 border-dashed border-primary-300 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900">Ticket d'inscription numérique</h3>
                <p className="text-sm text-gray-600">ID: {paymentData.transactionId}</p>
              </div>
              <button
                onClick={() => setShowQRCode(!showQRCode)}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <QrCode className="w-6 h-6 text-gray-600" />
              </button>
            </div>
            
            {showQRCode && (
              <div className="text-center mb-4">
                <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center mx-auto">
                  <QrCode className="w-16 h-16 text-gray-400" />
                </div>
                <p className="text-xs text-gray-500 mt-2">QR Code d'accès à la formation</p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Formation :</span>
                <p className="font-medium">{formation.title}</p>
              </div>
              <div>
                <span className="text-gray-500">Participant :</span>
                <p className="font-medium">{enrollmentData.firstName} {enrollmentData.lastName}</p>
              </div>
              <div>
                <span className="text-gray-500">Mode :</span>
                <p className="font-medium">
                  {enrollmentData.participationMode === 'online' ? '🌐 En ligne' : '🏢 Présentiel'}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Montant payé :</span>
                <p className="font-medium text-green-600">{formatPrice(paymentData.amount)}</p>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              fullWidth 
              icon={Download}
              onClick={handleDownloadTicket}
              className="mt-4"
            >
              Télécharger le ticket PDF
            </Button>
          </div>

          {/* Actions automatiques */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 mb-4">Actions automatiques en cours...</h3>
            
            <div className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
              notificationsSent ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                notificationsSent ? 'bg-green-500' : 'bg-gray-300 animate-pulse'
              }`}>
                {notificationsSent ? (
                  <CheckCircle className="w-5 h-5 text-white" />
                ) : (
                  <Bell className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {notificationsSent ? '✅ Notifications envoyées' : '📤 Envoi des notifications...'}
                </p>
                <p className="text-sm text-gray-600">
                  Email de confirmation + SMS de rappel
                </p>
              </div>
            </div>

            <div className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
              calendarAdded ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                calendarAdded ? 'bg-green-500' : 'bg-gray-300 animate-pulse'
              }`}>
                {calendarAdded ? (
                  <CheckCircle className="w-5 h-5 text-white" />
                ) : (
                  <Calendar className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {calendarAdded ? '✅ Calendrier synchronisé' : '📅 Synchronisation calendrier...'}
                </p>
                <p className="text-sm text-gray-600">
                  Sessions ajoutées à votre agenda
                </p>
              </div>
            </div>

            <div className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
              groupJoined ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                groupJoined ? 'bg-green-500' : 'bg-gray-300 animate-pulse'
              }`}>
                {groupJoined ? (
                  <CheckCircle className="w-5 h-5 text-white" />
                ) : (
                  <Users className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {groupJoined ? '✅ Groupe rejoint' : '👥 Ajout au groupe privé...'}
                </p>
                <p className="text-sm text-gray-600">
                  "{formation.title} - Promotion {new Date().getFullYear()}"
                </p>
              </div>
            </div>
          </div>

          {/* Prochaines étapes */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3">📋 Prochaines étapes</h3>
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <span>Vérifiez votre email pour les détails de connexion</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <span>Rejoignez le groupe privé de votre promotion</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                <span>Préparez-vous pour le premier module</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                <span>Recevez vos rappels automatiques avant chaque session</span>
              </div>
            </div>
          </div>

          {/* Actions rapides */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              fullWidth 
              icon={Calendar}
              onClick={handleAddToCalendar}
            >
              Ajouter au calendrier
            </Button>
            <Button 
              variant="outline" 
              fullWidth 
              icon={MessageCircle}
              onClick={handleJoinGroup}
            >
              Rejoindre le groupe
            </Button>
            <Button 
              variant="outline" 
              fullWidth 
              icon={Award}
              onClick={handleViewFormation}
            >
              Accéder à ma formation
            </Button>
            <Button 
              variant="spiritual" 
              fullWidth 
              icon={Gift}
              onClick={handleMicroDonation}
            >
              Faire une offrande 🙏
            </Button>
          </div>

          {/* Informations de suivi */}
          <div className="bg-warm-50 border border-warm-200 rounded-lg p-4">
            <h3 className="font-semibold text-warm-900 mb-3">🔔 Suivi et motivation</h3>
            <div className="space-y-2 text-sm text-warm-800">
              <p>• <strong>Rappels automatiques</strong> : Notifications avant chaque module</p>
              <p>• <strong>Messages spirituels</strong> : Encouragements personnalisés</p>
              <p>• <strong>Progression trackée</strong> : Suivi de vos modules complétés</p>
              <p>• <strong>Badge final</strong> : "Disciple formé" à la fin du parcours</p>
            </div>
          </div>

          {/* Détails de paiement */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">💳 Détails du paiement</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Méthode :</span>
                <p className="font-medium capitalize">{paymentData.method.replace('_', ' ')}</p>
              </div>
              <div>
                <span className="text-gray-500">Transaction :</span>
                <p className="font-medium font-mono text-xs">{paymentData.transactionId}</p>
              </div>
              <div>
                <span className="text-gray-500">Montant :</span>
                <p className="font-medium text-green-600">{formatPrice(paymentData.amount)}</p>
              </div>
              <div>
                <span className="text-gray-500">Statut :</span>
                <p className="font-medium text-green-600">✅ Confirmé</p>
              </div>
            </div>
          </div>

          {/* Message spirituel final */}
          <div className="text-center bg-gradient-to-r from-spiritual-100 to-primary-100 rounded-lg p-6 border border-spiritual-200">
            <Star className="w-12 h-12 text-spiritual-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-spiritual-900 mb-2">
              Que Dieu bénisse votre parcours d'apprentissage ! ✨
            </h3>
            <p className="text-spiritual-800 text-sm leading-relaxed">
              "Car l'Éternel donne la sagesse ; De sa bouche sortent la connaissance et l'intelligence."
              <br />
              <span className="font-medium">— Proverbes 2:6</span>
            </p>
          </div>

          {/* Action finale */}
          <div className="flex space-x-3 pt-6 border-t border-gray-200">
            <Button 
              variant="outline" 
              fullWidth 
              icon={Download}
              onClick={handleDownloadTicket}
            >
              Télécharger le récapitulatif
            </Button>
            <Button 
              variant="primary" 
              fullWidth 
              icon={Home}
              onClick={onComplete}
            >
              Retour à l'accueil
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};