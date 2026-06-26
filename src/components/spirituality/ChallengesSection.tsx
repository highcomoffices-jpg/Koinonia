import React, { useState, useEffect } from 'react';
import { Crown, Users, Target, Gift, Calendar, TrendingUp, Award, Plus, Search, Filter, CheckCircle, Clock, Heart, Share2, Trophy, Zap, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { spiritualityService } from '../../services/spiritualityService';
import type { Database } from '../../lib/database.types';

type ChallengeRow = Database['public']['Tables']['challenges']['Row'];

export const ChallengesSection: React.FC = () => {
  const [challenges, setChallenges] = useState<ChallengeRow[]>([]);
  const [activeChallenges, setActiveChallenges] = useState<ChallengeRow[]>([]);
  const [completedChallenges, setCompletedChallenges] = useState<ChallengeRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [participatedChallenges, setParticipatedChallenges] = useState<string[]>([]);

  useEffect(() => {
    const fetchChallenges = async () => {
      setIsLoading(true);
      try {
        const data = await spiritualityService.getChallenges();
        setChallenges(data);
        setActiveChallenges(data.filter(c => c.is_active && !c.is_completed));
        setCompletedChallenges(data.filter(c => c.is_completed));
      } catch (error) {
        console.error('Error fetching challenges:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChallenges();
  }, []);

  useEffect(() => {
    const fetchUserParticipation = async () => {
      const userChallenges = await spiritualityService.getUserChallenges();
      setParticipatedChallenges(userChallenges.map(uc => uc.challenge_id));
    };
    fetchUserParticipation();
  }, []);

  const getChallengeTypeIcon = (type: string) => {
    switch (type) {
      case 'prayer_count': return '🙏';
      case 'donation_amount': return '💰';
      case 'bible_reading': return '📖';
      case 'community_service': return '🤝';
      case 'evangelization': return '📢';
      default: return '🎯';
    }
  };

  const getChallengeTypeLabel = (type: string) => {
    switch (type) {
      case 'prayer_count': return 'Prières';
      case 'donation_amount': return 'Dons';
      case 'bible_reading': return 'Lecture biblique';
      case 'community_service': return 'Service communautaire';
      case 'evangelization': return 'Évangélisation';
      default: return 'Défi';
    }
  };

  const handleParticipate = async (challengeId: string) => {
    if (participatedChallenges.includes(challengeId)) return;
    
    const success = await spiritualityService.participateInChallenge(challengeId);
    if (success) {
      setParticipatedChallenges(prev => [...prev, challengeId]);
      // Mettre à jour le compteur local
      setChallenges(prev => prev.map(c => 
        c.id === challengeId ? { ...c, participants_count: (c.participants_count || 0) + 1 } : c
      ));
    }
  };

  const formatReward = (challenge: ChallengeRow) => {
    switch (challenge.reward_type) {
      case 'donation':
        return `${challenge.reward_amount?.toLocaleString()} ${challenge.reward_currency || 'FCFA'} pour une œuvre caritative`;
      case 'badge':
        return `Badge spécial pour tous les participants`;
      case 'premium_access':
        return `Accès premium gratuit pendant 1 mois`;
      default:
        return challenge.reward_description || 'Récompense spirituelle';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Défis communautaires</h2>
          <p className="text-gray-600">Participez à des défis spirituels et caritatifs</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" icon={Trophy}>Mes récompenses</Button>
          <Button variant="primary" icon={Plus}>Créer un défi</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="sm" className="text-center">
          <div className="text-2xl font-bold text-primary-600">{activeChallenges.length}</div>
          <div className="text-sm text-gray-600">Défis actifs</div>
        </Card>
        <Card padding="sm" className="text-center">
          <div className="text-2xl font-bold text-green-600">{completedChallenges.length}</div>
          <div className="text-sm text-gray-600">Défis complétés</div>
        </Card>
        <Card padding="sm" className="text-center">
          <div className="text-2xl font-bold text-spiritual-600">
            {activeChallenges.reduce((sum, c) => sum + (c.participants_count || 0), 0)}
          </div>
          <div className="text-sm text-gray-600">Participants actifs</div>
        </Card>
        <Card padding="sm" className="text-center">
          <div className="text-2xl font-bold text-warm-600">
            {activeChallenges.reduce((sum, c) => sum + (c.current_count || 0), 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Actions accomplies</div>
        </Card>
      </div>

      {activeChallenges.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <h3 className="text-lg font-semibold text-gray-900">Défis en cours</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activeChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                hasParticipated={participatedChallenges.includes(challenge.id)}
                onParticipate={() => handleParticipate(challenge.id)}
                getChallengeTypeIcon={getChallengeTypeIcon}
                getChallengeTypeLabel={getChallengeTypeLabel}
                formatReward={formatReward}
              />
            ))}
          </div>
        </div>
      )}

      {completedChallenges.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span>Défis complétés</span>
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {completedChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                hasParticipated={participatedChallenges.includes(challenge.id)}
                onParticipate={() => {}}
                getChallengeTypeIcon={getChallengeTypeIcon}
                getChallengeTypeLabel={getChallengeTypeLabel}
                formatReward={formatReward}
                isCompleted
              />
            ))}
          </div>
        </div>
      )}

      <Card className="bg-gradient-to-r from-warm-50 to-primary-50 border-warm-200">
        <div className="text-center">
          <Crown className="w-12 h-12 text-warm-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">Créez votre propre défi</h3>
          <p className="text-gray-600 mb-4">Mobilisez votre communauté autour d'une cause qui vous tient à cœur</p>
          <Button variant="primary">Créer un défi communautaire</Button>
        </div>
      </Card>
    </div>
  );
};

interface ChallengeCardProps {
  challenge: ChallengeRow;
  hasParticipated: boolean;
  onParticipate: () => void;
  getChallengeTypeIcon: (type: string) => string;
  getChallengeTypeLabel: (type: string) => string;
  formatReward: (challenge: ChallengeRow) => string;
  isCompleted?: boolean;
}

const ChallengeCard: React.FC<ChallengeCardProps> = ({ 
  challenge, 
  hasParticipated, 
  onParticipate,
  getChallengeTypeIcon,
  getChallengeTypeLabel,
  formatReward,
  isCompleted = false
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const progressPercentage = challenge.target_count 
    ? Math.min(((challenge.current_count || 0) / challenge.target_count) * 100, 100)
    : 0;
  
  const daysLeft = challenge.end_date 
    ? Math.ceil((new Date(challenge.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <Card hover className="h-full flex flex-col group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="text-3xl group-hover:scale-110 transition-transform duration-200">
            {getChallengeTypeIcon(challenge.type || '')}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 line-clamp-2">{challenge.title}</h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {getChallengeTypeLabel(challenge.type || '')}
              </span>
              {isCompleted && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center space-x-1">
                  <Award className="w-3 h-3" />
                  <span>Complété</span>
                </span>
              )}
              {hasParticipated && (
                <span className="px-2 py-1 bg-spiritual-100 text-spiritual-800 text-xs rounded-full">
                  ✓ Participé
                </span>
              )}
            </div>
          </div>
        </div>
        {challenge.image_url && (
          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={challenge.image_url}
              alt={challenge.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          </div>
        )}
      </div>

      <div className="flex-1 space-y-4">
        <p className="text-sm text-gray-600 leading-relaxed">{challenge.description}</p>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 font-medium">Progression</span>
            <span className="font-bold text-lg">
              {(challenge.current_count || 0).toLocaleString()}/{(challenge.target_count || 0).toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div 
              className={`h-4 rounded-full transition-all duration-500 ease-out ${
                isCompleted 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                  : 'bg-gradient-to-r from-spiritual-500 to-primary-500'
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        <div className="bg-gradient-to-r from-warm-50 to-primary-50 rounded-lg p-4 border border-warm-200">
          <div className="flex items-center space-x-2 mb-2">
            <Gift className="w-5 h-5 text-warm-600" />
            <span className="text-sm font-semibold text-warm-900">Récompense</span>
          </div>
          <p className="text-sm text-warm-800 leading-relaxed">{formatReward(challenge)}</p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2 text-gray-500">
            <Users className="w-4 h-4" />
            <span>{challenge.participants_count || 0} participants</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>
              {!isCompleted && daysLeft > 0 
                ? `${daysLeft} jour${daysLeft > 1 ? 's' : ''} restant${daysLeft > 1 ? 's' : ''}`
                : 'Terminé'
              }
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsLiked(!isLiked)}
            className={`flex items-center space-x-1 transition-colors ${
              isLiked ? 'text-red-600' : 'text-gray-500 hover:text-red-600'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm">{isLiked ? '1' : '0'}</span>
          </button>
        </div>
        
        <Button 
          variant={hasParticipated ? "outline" : isCompleted ? "spiritual" : "primary"}
          size="sm"
          icon={hasParticipated ? CheckCircle : isCompleted ? Trophy : Target}
          onClick={onParticipate}
          disabled={hasParticipated || isCompleted}
          className="group-hover:scale-105 transition-transform duration-200"
        >
          {hasParticipated 
            ? 'Participé ✓' 
            : isCompleted 
              ? 'Complété 🏆' 
              : 'Participer maintenant'
          }
        </Button>
      </div>
    </Card>
  );
};