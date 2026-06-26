import React, { useState, useEffect } from 'react';
import { Video, Calendar, Clock, Eye, Plus, Loader2, Play } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { liveCelebrationService, LiveCelebration } from '../../services/liveCelebrationService';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { CreateLiveModal } from './CreateLiveModal';
import { LiveViewer } from './LiveViewer';

export const LiveCelebrationsPage: React.FC = () => {
  const { user } = useAuth();
  const [liveNow, setLiveNow] = useState<LiveCelebration[]>([]);
  const [upcoming, setUpcoming] = useState<LiveCelebration[]>([]);
  const [ended, setEnded] = useState<LiveCelebration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedLive, setSelectedLive] = useState<LiveCelebration | null>(null);
  const [activeTab, setActiveTab] = useState<'live' | 'upcoming' | 'ended'>('live');

  const canCreateLive = user?.shepherdGrade === 'leader' || user?.shepherdGrade === 'superior' || user?.shepherdGrade === 'elder';

  const loadLives = async () => {
    setIsLoading(true);
    try {
      const [liveNowData, upcomingData, endedData] = await Promise.all([
        liveCelebrationService.getLives({ status: 'live' }),
        liveCelebrationService.getLives({ status: 'scheduled' }),
        liveCelebrationService.getLives({ status: 'ended' }),
      ]);
      setLiveNow(liveNowData);
      setUpcoming(upcomingData);
      setEnded(endedData);
    } catch (error) {
      console.error('Error loading lives:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLives();
  }, []);

  const handleStartLive = async (liveId: string) => {
    await liveCelebrationService.startLive(liveId);
    await loadLives();
  };

  const handleEndLive = async (liveId: string) => {
    if (confirm('Terminer ce live ?')) {
      await liveCelebrationService.endLive(liveId);
      await loadLives();
    }
  };

  const getLivesForTab = () => {
    switch (activeTab) {
      case 'live': return liveNow;
      case 'upcoming': return upcoming;
      case 'ended': return ended;
    }
  };

  const getLiveCard = (live: LiveCelebration) => (
    <Card key={live.id} className="overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image avec badge superposé */}
      <div className="relative">
        {live.image_url ? (
          <div className="relative w-full h-48 bg-gray-200 overflow-hidden">
            <img 
              src={live.image_url} 
              alt={live.title} 
              className="w-full h-full object-cover"
            />
            {/* Overlay gradient pour améliorer la lisibilité du badge */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-primary-600 to-spiritual-600 flex items-center justify-center">
            <Video className="w-12 h-12 text-white/50" />
          </div>
        )}
        
        {/* Badge EN DIRECT - Positionné en haut à droite avec meilleur style */}
        {live.live_status === 'live' && (
          <div className="absolute top-3 right-3 z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white bg-red-600 rounded-full shadow-lg">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-200"></span>
              </span>
              EN DIRECT
            </span>
          </div>
        )}

        {/* Badge PROGRAMMÉ */}
        {live.live_status === 'scheduled' && (
          <div className="absolute top-3 right-3 z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white bg-blue-600 rounded-full shadow-lg">
              <Clock className="w-3 h-3" />
              PROGRAMMÉ
            </span>
          </div>
        )}

        {/* Badge TERMINÉ */}
        {live.live_status === 'ended' && (
          <div className="absolute top-3 right-3 z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white bg-gray-600 rounded-full shadow-lg">
              TERMINÉ
            </span>
          </div>
        )}

        {/* Compteur de vues en bas à gauche */}
        {live.viewer_count > 0 && (
          <div className="absolute bottom-3 left-3 z-10">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-white bg-black/60 backdrop-blur-sm rounded-full">
              <Eye className="w-3 h-3" />
              {live.viewer_count} vues
            </span>
          </div>
        )}
      </div>

      {/* Contenu de la carte */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-base line-clamp-1">
              {live.title}
            </h3>
            <p className="text-sm text-gray-600 mt-0.5">
              {live.organizer?.first_name} {live.organizer?.last_name}
            </p>
          </div>
        </div>

        {live.description && (
          <p className="text-sm text-gray-500 mt-2 line-clamp-2">
            {live.description}
          </p>
        )}

        <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
          {live.scheduled_start && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(live.scheduled_start).toLocaleDateString('fr', { 
                day: 'numeric', 
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          )}
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            variant="primary"
            size="sm"
            fullWidth
            icon={live.live_status === 'live' ? Play : Video}
            onClick={() => setSelectedLive(live)}
          >
            {live.live_status === 'live' ? 'Regarder' : 'Voir détails'}
          </Button>

          {canCreateLive && live.live_status === 'scheduled' && (
            <Button variant="success" size="sm" onClick={() => handleStartLive(live.id)}>
              Démarrer
            </Button>
          )}

          {canCreateLive && live.live_status === 'live' && (
            <Button variant="danger" size="sm" onClick={() => handleEndLive(live.id)}>
              Terminer
            </Button>
          )}
        </div>
      </div>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Video className="w-6 h-6 text-primary-600" />
            Célébrations en direct
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Participez aux cultes et prières en ligne
          </p>
        </div>
        {canCreateLive && (
          <Button variant="primary" icon={Plus} onClick={() => setIsCreateModalOpen(true)}>
            Créer un live
          </Button>
        )}
      </div>

      {/* Onglets */}
      <div className="flex flex-wrap gap-1 border-b border-gray-200 pb-0">
        <button
          onClick={() => setActiveTab('live')}
          className={`px-4 py-2.5 text-sm font-medium transition-all duration-200 border-b-2 ${
            activeTab === 'live'
              ? 'text-red-600 border-red-600 bg-red-50/50'
              : 'text-gray-500 hover:text-gray-700 border-transparent hover:border-gray-300'
          }`}
        >
          <span className="flex items-center gap-2">
            {activeTab === 'live' && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
            En direct
            {liveNow.length > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
                {liveNow.length}
              </span>
            )}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2.5 text-sm font-medium transition-all duration-200 border-b-2 ${
            activeTab === 'upcoming'
              ? 'text-blue-600 border-blue-600 bg-blue-50/50'
              : 'text-gray-500 hover:text-gray-700 border-transparent hover:border-gray-300'
          }`}
        >
          <span className="flex items-center gap-2">
            À venir
            {upcoming.length > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                {upcoming.length}
              </span>
            )}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('ended')}
          className={`px-4 py-2.5 text-sm font-medium transition-all duration-200 border-b-2 ${
            activeTab === 'ended'
              ? 'text-gray-600 border-gray-600 bg-gray-50/50'
              : 'text-gray-500 hover:text-gray-700 border-transparent hover:border-gray-300'
          }`}
        >
          Terminés
        </button>
      </div>

      {/* Liste des lives */}
      {getLivesForTab().length === 0 ? (
        <Card className="text-center py-12 sm:py-16">
          <Video className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {activeTab === 'live' && 'Aucun live en direct'}
            {activeTab === 'upcoming' && 'Aucun live programmé'}
            {activeTab === 'ended' && 'Aucun live terminé'}
          </h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            {canCreateLive && activeTab !== 'ended'
              ? 'Créez un live pour commencer votre diffusion.'
              : 'Revenez plus tard pour découvrir les lives.'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {getLivesForTab().map(getLiveCard)}
        </div>
      )}

      {/* Modals */}
      <CreateLiveModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onLiveCreated={loadLives}
      />

      {selectedLive && (
        <LiveViewer
          live={selectedLive}
          onClose={() => setSelectedLive(null)}
          onShare={() => navigator.share?.({ title: selectedLive.title, url: window.location.href })}
        />
      )}
    </div>
  );
};