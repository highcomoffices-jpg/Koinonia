import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, BookOpen, MapPin, Brain, Crown, Zap, ArrowRight, Loader2, Church } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { BiblicalPathsSection } from './BiblicalPathsSection';
import { LocationMeditationsSection } from './LocationMeditationsSection';
import { PrayerWallSection } from './PrayerWallSection';
import { ChallengesSection } from './ChallengesSection';
import { ServicesPage } from '../services/ServicesPage';
import { spiritualityService } from '../../services/spiritualityService';

type SpiritualityTab = 'overview' | 'biblical-paths' | 'meditations' | 'prayers' | 'challenges' | 'services';

export const SpiritualityPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SpiritualityTab>('overview');
  const [stats, setStats] = useState({
    biblicalPathsCount: 0,
    meditationsCount: 0,
    prayersCount: 0,
    activeChallengesCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const [paths, meditations, prayers, challenges] = await Promise.all([
          spiritualityService.getBiblicalPaths(),
          spiritualityService.getLocationMeditations(),
          spiritualityService.getPrayerWall({ limit: 100 }),
          spiritualityService.getChallenges({ isActive: true }),
        ]);

        setStats({
          biblicalPathsCount: paths.length,
          meditationsCount: meditations.length,
          prayersCount: prayers.length,
          activeChallengesCount: challenges.length,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: Sparkles },
    { id: 'biblical-paths', label: 'Plans de lecture IA', icon: Brain },
    { id: 'meditations', label: 'Méditations du lieu', icon: MapPin },
    { id: 'prayers', label: 'Mur des prières', icon: BookOpen },
    { id: 'challenges', label: 'Défis communautaires', icon: Crown },
    { id: 'services', label: 'Services confessionnels', icon: Church }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'biblical-paths':
        return <BiblicalPathsSection />;
      case 'meditations':
        return <LocationMeditationsSection />;
      case 'prayers':
        return <PrayerWallSection />;
      case 'challenges':
        return <ChallengesSection />;
      case 'services':
        return <ServicesPage />;
      default:
        return <SpiritualityOverview 
          stats={stats} 
          isLoading={isLoading}
          onTabChange={setActiveTab} 
        />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* En-tête */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-spiritual-500 to-primary-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">
              Spiritualité Premium
            </h1>
            <span className="bg-gradient-to-r from-spiritual-500 to-primary-500 text-white text-xs rounded-full px-3 py-1">
              Premium
            </span>
          </div>
          <p className="text-gray-600 text-sm sm:text-base">
            Découvrez des expériences spirituelles personnalisées et innovantes
          </p>
        </div>

        {/* Navigation par onglets */}
        <Card>
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as SpiritualityTab)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                    isActive
                      ? 'bg-gradient-to-r from-spiritual-500 to-primary-500 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Contenu de l'onglet actif */}
        {renderTabContent()}
      </div>
    </div>
  );
};

interface SpiritualityOverviewProps {
  stats: {
    biblicalPathsCount: number;
    meditationsCount: number;
    prayersCount: number;
    activeChallengesCount: number;
  };
  isLoading: boolean;
  onTabChange: (tab: SpiritualityTab) => void;
}

const SpiritualityOverview: React.FC<SpiritualityOverviewProps> = ({ stats, isLoading, onTabChange }) => {
  const features = [
    {
      id: 'biblical-paths',
      title: 'Plans de lecture spirituels IA',
      description: 'Parcours bibliques personnalisés selon vos besoins spirituels',
      icon: Brain,
      color: 'from-blue-500 to-purple-500',
      premium: true,
      count: stats.biblicalPathsCount
    },
    {
      id: 'meditations',
      title: 'Méditations géolocalisées',
      description: 'Méditations contextuelles près des lieux sacrés',
      icon: MapPin,
      color: 'from-green-500 to-teal-500',
      premium: true,
      count: stats.meditationsCount
    },
    {
      id: 'prayers',
      title: 'Mur des prières collectives',
      description: 'Partagez et soutenez les intentions de prière',
      icon: BookOpen,
      color: 'from-orange-500 to-red-500',
      premium: false,
      count: stats.prayersCount
    },
    {
      id: 'challenges',
      title: 'Défis communautaires',
      description: 'Participez à des défis spirituels et caritatifs',
      icon: Crown,
      color: 'from-yellow-500 to-orange-500',
      premium: false,
      count: stats.activeChallengesCount
    },
    {
      id: 'services',
      title: 'Services confessionnels',
      description: 'Demandes de messe, confessions, conseils pastoraux et diffusions en direct',
      icon: Church,
      color: 'from-purple-500 to-pink-500',
      premium: false,
      count: 0
    }
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="sm" className="text-center">
          <div className="text-2xl font-bold text-spiritual-600">{stats.biblicalPathsCount}</div>
          <div className="text-sm text-gray-600">Parcours disponibles</div>
        </Card>
        <Card padding="sm" className="text-center">
          <div className="text-2xl font-bold text-primary-600">{stats.meditationsCount}</div>
          <div className="text-sm text-gray-600">Méditations locales</div>
        </Card>
        <Card padding="sm" className="text-center">
          <div className="text-2xl font-bold text-warm-600">{stats.prayersCount}</div>
          <div className="text-sm text-gray-600">Prières actives</div>
        </Card>
        <Card padding="sm" className="text-center">
          <div className="text-2xl font-bold text-green-600">{stats.activeChallengesCount}</div>
          <div className="text-sm text-gray-600">Défis en cours</div>
        </Card>
      </div>

      {/* Fonctionnalités */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature) => {
          const Icon = feature.icon;
          
          return (
            <Card 
              key={feature.id} 
              hover 
              className="cursor-pointer group"
            >
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                    {feature.premium && (
                      <span className="bg-gradient-to-r from-spiritual-500 to-primary-500 text-white text-xs rounded-full px-2 py-0.5">
                        Premium
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{feature.description}</p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-0 text-primary-600 hover:text-primary-700 group-hover:translate-x-1 transition-transform duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTabChange(feature.id as SpiritualityTab);
                    }}
                  >
                    Découvrir <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Call to action Premium */}
      <Card className="bg-gradient-to-r from-spiritual-50 to-primary-50 border-spiritual-200">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-spiritual-500 to-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Débloquez l'expérience Premium
          </h3>
          <p className="text-gray-600 mb-4">
            Accédez aux parcours IA personnalisés et aux méditations géolocalisées
          </p>
          <Button variant="spiritual" size="lg">
            Passer à Premium - 5000 FCFA/mois
          </Button>
        </div>
      </Card>
    </div>
  );
};