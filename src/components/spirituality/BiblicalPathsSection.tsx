import React, { useState, useEffect } from 'react';
import { Brain, Clock, Star, Play, CheckCircle, Lock, Search, Filter, Award, Target, Zap, BookOpen, Heart, Download, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { spiritualityService, EnrichedBiblicalPath } from '../../services/spiritualityService';
import { useAuth } from '../../contexts/AuthContext';

export const BiblicalPathsSection: React.FC = () => {
  const { user } = useAuth();
  const [paths, setPaths] = useState<EnrichedBiblicalPath[]>([]);
  const [filteredPaths, setFilteredPaths] = useState<EnrichedBiblicalPath[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [startedPaths, setStartedPaths] = useState<string[]>([]);

  const categoryOptions = [
    { value: 'inner_peace', label: 'Paix intérieure' },
    { value: 'family_issues', label: 'Problèmes familiaux' },
    { value: 'professional_success', label: 'Succès professionnel' },
    { value: 'healing', label: 'Guérison' },
    { value: 'forgiveness', label: 'Pardon' },
    { value: 'guidance', label: 'Direction' },
    { value: 'gratitude', label: 'Gratitude' },
    { value: 'faith_building', label: 'Renforcement de la foi' }
  ];

  const difficultyOptions = [
    { value: 'beginner', label: 'Débutant' },
    { value: 'intermediate', label: 'Intermédiaire' },
    { value: 'advanced', label: 'Avancé' }
  ];

  useEffect(() => {
    const fetchPaths = async () => {
      setIsLoading(true);
      try {
        const data = await spiritualityService.getBiblicalPaths();
        setPaths(data);
        setFilteredPaths(data);
      } catch (error) {
        console.error('Error fetching biblical paths:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaths();
  }, []);

  useEffect(() => {
    let filtered = [...paths];

    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    if (selectedDifficulty) {
      filtered = filtered.filter(p => p.difficulty === selectedDifficulty);
    }

    setFilteredPaths(filtered);
  }, [searchTerm, selectedCategory, selectedDifficulty, paths]);

  const handleStartPath = (path: EnrichedBiblicalPath) => {
    if (path.is_premium && !user?.subscription) {
      setShowPremiumModal(true);
      return;
    }

    if (!startedPaths.includes(path.id)) {
      setStartedPaths(prev => [...prev, path.id]);
      // Simulation de démarrage
      spiritualityService.updateBiblicalPathProgress(path.id, 5);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'Débutant';
      case 'intermediate': return 'Intermédiaire';
      case 'advanced': return 'Avancé';
      default: return difficulty;
    }
  };

  const getCategoryLabel = (category: string) => {
    const found = categoryOptions.find(c => c.value === category);
    return found?.label || category;
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
      {/* En-tête */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Plans de lecture spirituels IA</h2>
          <p className="text-gray-600">Parcours bibliques personnalisés selon vos besoins</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" icon={BookOpen}>
            Mes parcours
          </Button>
          <Button 
            variant="spiritual" 
            icon={Brain}
            onClick={() => setShowAIGenerator(true)}
          >
            Générer un parcours IA
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="sm" className="text-center">
          <div className="text-2xl font-bold text-spiritual-600">{paths.length}</div>
          <div className="text-sm text-gray-600">Parcours disponibles</div>
        </Card>
        <Card padding="sm" className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {paths.filter(p => p.is_ai_generated).length}
          </div>
          <div className="text-sm text-gray-600">Générés par IA</div>
        </Card>
        <Card padding="sm" className="text-center">
          <div className="text-2xl font-bold text-green-600">{startedPaths.length}</div>
          <div className="text-sm text-gray-600">Mes parcours actifs</div>
        </Card>
        <Card padding="sm" className="text-center">
          <div className="text-2xl font-bold text-warm-600">
            {paths.filter(p => p.difficulty === 'beginner').length}
          </div>
          <div className="text-sm text-gray-600">Niveau débutant</div>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Rechercher un parcours..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={Search}
              />
            </div>
            <div className="flex space-x-3">
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                options={[{ value: '', label: 'Toutes catégories' }, ...categoryOptions]}
                className="min-w-[180px]"
              />
              <Select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                options={[{ value: '', label: 'Tous niveaux' }, ...difficultyOptions]}
                className="min-w-[150px]"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Liste des parcours */}
      {filteredPaths.length === 0 ? (
        <Card className="text-center py-8">
          <p className="text-gray-500">Aucun parcours trouvé</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredPaths.map((path) => (
            <BiblicalPathCard 
              key={path.id} 
              path={path}
              hasStarted={startedPaths.includes(path.id)}
              onStart={() => handleStartPath(path)}
              getDifficultyColor={getDifficultyColor}
              getDifficultyLabel={getDifficultyLabel}
              getCategoryLabel={getCategoryLabel}
            />
          ))}
        </div>
      )}

      {/* Générateur IA Modal */}
      {showAIGenerator && (
        <AIPathGeneratorModal onClose={() => setShowAIGenerator(false)} />
      )}

      {/* Modal Premium */}
      {showPremiumModal && (
        <PremiumModal onClose={() => setShowPremiumModal(false)} />
      )}
    </div>
  );
};

interface BiblicalPathCardProps {
  path: EnrichedBiblicalPath;
  hasStarted: boolean;
  onStart: () => void;
  getDifficultyColor: (difficulty: string) => string;
  getDifficultyLabel: (difficulty: string) => string;
  getCategoryLabel: (category: string) => string;
}

const BiblicalPathCard: React.FC<BiblicalPathCardProps> = ({ 
  path, 
  hasStarted, 
  onStart,
  getDifficultyColor,
  getDifficultyLabel,
  getCategoryLabel
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const steps = (path.steps as any[]) || [];
  const currentProgress = hasStarted ? Math.max(path.completion_rate || 0, 5) : (path.completion_rate || 0);

  const handleLike = () => {
    setIsLiked(!isLiked);
  };

  return (
    <Card hover className="h-full flex flex-col group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-spiritual-400 to-primary-400 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 line-clamp-1">{path.title}</h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(path.difficulty || 'beginner')}`}>
                {getDifficultyLabel(path.difficulty || 'beginner')}
              </span>
              {path.is_ai_generated && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  🤖 IA
                </span>
              )}
              {path.is_premium && (
                <span className="px-2 py-1 bg-gradient-to-r from-spiritual-500 to-primary-500 text-white text-xs rounded-full">
                  Premium
                </span>
              )}
              {hasStarted && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  ✓ Démarré
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleLike}
            className={`p-2 rounded-full transition-colors ${
              isLiked ? 'text-red-600 bg-red-50' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          </button>
          {path.is_premium && <Lock className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {path.image_url && (
        <div className="aspect-video rounded-lg overflow-hidden mb-4 relative group">
          <img
            src={path.image_url}
            alt={path.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Play className="w-12 h-12 text-white" />
          </div>
        </div>
      )}

      <div className="flex-1 space-y-3">
        <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">{path.description}</p>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{path.duration_days || 7} jours</span>
            </div>
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4" />
              <span>{steps.length} étapes</span>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Target className="w-4 h-4" />
            <span className="font-medium">{getDifficultyLabel(path.difficulty || 'beginner')}</span>
          </div>
        </div>

        {currentProgress > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 font-medium">Progression</span>
              <span className="font-bold">{Math.round(currentProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-spiritual-500 to-primary-500 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${currentProgress}%` }}
              />
            </div>
          </div>
        )}

        {steps.length > 0 && steps[0] && (
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Première étape :</h4>
            <p className="text-sm text-gray-600 line-clamp-2">{steps[0].description}</p>
            <div className="flex items-center space-x-2 mt-2">
              <BookOpen className="w-3 h-3 text-spiritual-600" />
              <span className="text-xs text-spiritual-600 font-medium">
                {steps[0].verseReference}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-500">
            {hasStarted ? 'Continuer' : 'Commencer'}
          </div>
          {path.is_ai_generated && (
            <div className="flex items-center space-x-1 text-blue-600">
              <Brain className="w-3 h-3" />
              <span className="text-xs">Personnalisé</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {!path.is_premium && (
            <Button variant="ghost" size="sm" icon={Download}>
              <Download className="w-4 h-4" />
            </Button>
          )}
          <Button 
            variant={path.is_premium ? "spiritual" : hasStarted ? "outline" : "primary"} 
            size="sm"
            icon={path.is_premium ? Lock : hasStarted ? Play : CheckCircle}
            onClick={onStart}
            className="group-hover:scale-105 transition-transform duration-200"
          >
            {path.is_premium ? 'Premium requis' : hasStarted ? 'Continuer' : 'Commencer'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

// Modal de génération IA (simplifié pour l'instant)
const AIPathGeneratorModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [need, setNeed] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsGenerating(false);
    onClose();
    alert('🎉 Votre parcours personnalisé a été créé avec succès !');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-spiritual-500 to-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Générateur de parcours IA</h2>
          <p className="text-gray-600">L'IA créera un parcours biblique personnalisé</p>
        </div>

        {isGenerating ? (
          <div className="text-center py-8">
            <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
            <p className="text-gray-600">Génération en cours...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Select
              label="Quel est votre besoin spirituel principal ?"
              value={need}
              onChange={(e) => setNeed(e.target.value)}
              options={[
                { value: '', label: 'Sélectionnez votre besoin' },
                { value: 'peace', label: 'Paix intérieure' },
                { value: 'family', label: 'Problème familial' },
                { value: 'work', label: 'Succès professionnel' },
                { value: 'healing', label: 'Guérison' },
              ]}
              required
            />
            <div className="flex space-x-3 pt-4">
              <Button variant="outline" fullWidth onClick={onClose}>Annuler</Button>
              <Button variant="spiritual" fullWidth onClick={handleGenerate} disabled={!need}>
                Générer
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

const PremiumModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-spiritual-500 to-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Contenu Premium</h3>
          <p className="text-gray-600 mb-6">
            Ce parcours est réservé aux membres Premium. Débloquez l'accès à tous les parcours IA personnalisés.
          </p>
          <div className="flex space-x-3">
            <Button variant="outline" fullWidth onClick={onClose}>Plus tard</Button>
            <Button variant="spiritual" fullWidth>Passer à Premium - 5000 FCFA/mois</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};