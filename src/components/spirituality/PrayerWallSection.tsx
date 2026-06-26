import React, { useState, useEffect } from 'react';
import { Heart, Plus, Users, CheckCircle, Clock, MessageCircle, Search, Filter, Star, Share2, Target, Zap, Award, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { spiritualityService, EnrichedPrayerWall } from '../../services/spiritualityService';
import { useAuth } from '../../contexts/AuthContext';

export const PrayerWallSection: React.FC = () => {
  const { user } = useAuth();
  const [prayers, setPrayers] = useState<EnrichedPrayerWall[]>([]);
  const [filteredPrayers, setFilteredPrayers] = useState<EnrichedPrayerWall[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState('recent');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [prayedFor, setPrayedFor] = useState<string[]>([]);

  const categoryOptions = [
    { value: '', label: 'Toutes catégories' },
    { value: 'healing', label: 'Guérison' },
    { value: 'family', label: 'Famille' },
    { value: 'work', label: 'Travail' },
    { value: 'guidance', label: 'Direction' },
    { value: 'gratitude', label: 'Gratitude' },
    { value: 'forgiveness', label: 'Pardon' },
    { value: 'protection', label: 'Protection' },
    { value: 'peace', label: 'Paix' }
  ];

  const sortOptions = [
    { value: 'recent', label: 'Plus récentes' },
    { value: 'popular', label: 'Plus priées' },
    { value: 'urgent', label: 'Urgentes' },
    { value: 'answered', label: 'Exaucées' }
  ];

  useEffect(() => {
    const fetchPrayers = async () => {
      setIsLoading(true);
      try {
        const data = await spiritualityService.getPrayerWall();
        setPrayers(data);
        setFilteredPrayers(data);
      } catch (error) {
        console.error('Error fetching prayers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrayers();
  }, []);

  useEffect(() => {
    let filtered = [...prayers];

    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    switch (sortBy) {
      case 'popular':
        filtered.sort((a, b) => (b.prayer_count || 0) - (a.prayer_count || 0));
        break;
      case 'urgent':
        filtered.sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());
        break;
      case 'answered':
        filtered.sort((a, b) => (b.is_answered ? 1 : 0) - (a.is_answered ? 1 : 0));
        break;
      default:
        filtered.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
    }

    setFilteredPrayers(filtered);
  }, [searchTerm, selectedCategory, sortBy, prayers]);

  const handlePrayFor = async (prayerId: string) => {
    if (!prayedFor.includes(prayerId)) {
      setPrayedFor(prev => [...prev, prayerId]);
      await spiritualityService.prayForRequest(prayerId);
      
      // Mettre à jour le compteur local
      setPrayers(prev => prev.map(p => 
        p.id === prayerId ? { ...p, prayer_count: (p.prayer_count || 0) + 1 } : p
      ));
    }
  };

  const getCategoryLabel = (category: string) => {
    const found = categoryOptions.find(c => c.value === category);
    return found?.label || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      healing: 'bg-green-100 text-green-800',
      family: 'bg-blue-100 text-blue-800',
      work: 'bg-purple-100 text-purple-800',
      guidance: 'bg-yellow-100 text-yellow-800',
      gratitude: 'bg-pink-100 text-pink-800',
      forgiveness: 'bg-indigo-100 text-indigo-800',
      protection: 'bg-red-100 text-red-800',
      peace: 'bg-teal-100 text-teal-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (date: string) => {
    if (!date) return '';
    const now = new Date();
    const created = new Date(date);
    const diffInDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Aujourd'hui";
    if (diffInDays === 1) return 'Hier';
    if (diffInDays < 7) return `Il y a ${diffInDays} jours`;
    return new Intl.DateTimeFormat('fr').format(created);
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
          <h2 className="text-xl font-bold text-gray-900 mb-2">Mur des prières collectives</h2>
          <p className="text-gray-600">Partagez et soutenez les intentions de prière</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" icon={Star}>Mes prières</Button>
          <Button variant="primary" icon={Plus} onClick={() => setShowCreateModal(true)}>
            Déposer une intention
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="sm" className="text-center">
          <div className="text-2xl font-bold text-primary-600">{prayers.length}</div>
          <div className="text-sm text-gray-600">Intentions actives</div>
        </Card>
        <Card padding="sm" className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {prayers.reduce((sum, p) => sum + (p.prayer_count || 0), 0)}
          </div>
          <div className="text-sm text-gray-600">Prières offertes</div>
        </Card>
        <Card padding="sm" className="text-center">
          <div className="text-2xl font-bold text-spiritual-600">
            {prayers.filter(p => p.is_answered).length}
          </div>
          <div className="text-sm text-gray-600">Prières exaucées</div>
        </Card>
        <Card padding="sm" className="text-center">
          <div className="text-2xl font-bold text-warm-600">
            {prayers.filter(p => p.category === 'healing').length}
          </div>
          <div className="text-sm text-gray-600">Demandes de guérison</div>
        </Card>
      </div>

      <Card>
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Rechercher une intention de prière..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={Search}
              />
            </div>
            <div className="flex space-x-3">
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                options={categoryOptions}
                className="min-w-[150px]"
              />
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                options={sortOptions}
                className="min-w-[150px]"
              />
            </div>
          </div>
        </div>
      </Card>

      {filteredPrayers.length === 0 ? (
        <Card className="text-center py-8">
          <p className="text-gray-500">Aucune intention trouvée</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredPrayers.map((prayer) => (
            <PrayerCard
              key={prayer.id}
              prayer={prayer}
              hasPrayed={prayedFor.includes(prayer.id)}
              onPray={() => handlePrayFor(prayer.id)}
              getCategoryLabel={getCategoryLabel}
              getCategoryColor={getCategoryColor}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreatePrayerModal onClose={() => setShowCreateModal(false)} />
      )}

      <Card className="bg-gradient-to-r from-spiritual-50 to-primary-50 border-spiritual-200">
        <div className="text-center">
          <Heart className="w-12 h-12 text-spiritual-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">Partagez votre intention</h3>
          <p className="text-gray-600 mb-4">Déposez votre intention de prière et recevez le soutien de la communauté</p>
          <Button variant="spiritual" onClick={() => setShowCreateModal(true)}>
            Déposer une intention de prière
          </Button>
        </div>
      </Card>
    </div>
  );
};

interface PrayerCardProps {
  prayer: EnrichedPrayerWall;
  hasPrayed: boolean;
  onPray: () => void;
  getCategoryLabel: (category: string) => string;
  getCategoryColor: (category: string) => string;
  formatDate: (date: string) => string;
}

const PrayerCard: React.FC<PrayerCardProps> = ({ 
  prayer, 
  hasPrayed, 
  onPray,
  getCategoryLabel,
  getCategoryColor,
  formatDate
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const progressPercentage = prayer.target_prayer_count 
    ? Math.min(((prayer.prayer_count || 0) / prayer.target_prayer_count) * 100, 100)
    : 0;

  return (
    <Card hover className="h-full flex flex-col group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-spiritual-400 to-primary-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 line-clamp-1">{prayer.title}</h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(prayer.category || '')}`}>
                {getCategoryLabel(prayer.category || '')}
              </span>
              {prayer.is_answered && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center space-x-1">
                  <CheckCircle className="w-3 h-3" />
                  <span>Exaucée</span>
                </span>
              )}
              {hasPrayed && (
                <span className="px-2 py-1 bg-spiritual-100 text-spiritual-800 text-xs rounded-full">
                  ✓ Prié
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          {formatDate(prayer.created_at || '')}
        </div>
      </div>

      <div className="flex-1 space-y-4">
        <p className="text-sm text-gray-600 leading-relaxed">{prayer.content}</p>

        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Users className="w-4 h-4" />
          <span>
            Demandé par {prayer.is_anonymous ? 'Anonyme' : `${prayer.author?.first_name || ''} ${prayer.author?.last_name || ''}`}
          </span>
        </div>

        {prayer.target_prayer_count && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 font-medium">Objectif de prières</span>
              <span className="font-bold text-lg">
                {prayer.prayer_count || 0}/{prayer.target_prayer_count}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-spiritual-500 to-primary-500 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}

        {prayer.is_answered && prayer.testimony && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm font-semibold text-green-900">Témoignage de réponse</span>
            </div>
            <p className="text-sm text-green-800 leading-relaxed italic">"{prayer.testimony}"</p>
          </div>
        )}
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
          <div className="flex items-center space-x-1 text-spiritual-600">
            <Heart className="w-4 h-4" />
            <span className="font-medium">{prayer.prayer_count || 0} prières</span>
          </div>
        </div>
        
        <Button 
          variant={hasPrayed ? "outline" : "spiritual"}
          size="sm"
          icon={hasPrayed ? CheckCircle : Heart}
          onClick={onPray}
          disabled={hasPrayed}
          className="group-hover:scale-105 transition-transform duration-200"
        >
          {hasPrayed ? 'Prié ✓' : 'Prier maintenant'}
        </Button>
      </div>
    </Card>
  );
};

const CreatePrayerModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    isAnonymous: false,
    targetPrayerCount: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categoryOptions = [
    { value: 'healing', label: 'Guérison' },
    { value: 'family', label: 'Famille' },
    { value: 'work', label: 'Travail' },
    { value: 'guidance', label: 'Direction' },
    { value: 'gratitude', label: 'Gratitude' },
    { value: 'forgiveness', label: 'Pardon' },
    { value: 'protection', label: 'Protection' },
    { value: 'peace', label: 'Paix' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await spiritualityService.createPrayerRequest({
        title: formData.title,
        content: formData.content,
        category: formData.category,
        is_anonymous: formData.isAnonymous,
        target_prayer_count: formData.targetPrayerCount ? parseInt(formData.targetPrayerCount) : undefined
      });
      onClose();
    } catch (error) {
      console.error('Error creating prayer request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-spiritual-500 to-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Déposer une intention de prière</h2>
          <p className="text-gray-600">Partagez votre intention avec la communauté Koinonia</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Titre de l'intention"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Ex: Guérison pour ma mère"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description détaillée</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Décrivez votre intention de prière..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors resize-none"
              required
            />
          </div>

          <Select
            label="Catégorie"
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            options={categoryOptions}
            placeholder="Sélectionnez une catégorie"
            required
          />

          <Input
            label="Objectif de prières (optionnel)"
            type="number"
            value={formData.targetPrayerCount}
            onChange={(e) => setFormData(prev => ({ ...prev, targetPrayerCount: e.target.value }))}
            placeholder="Ex: 100"
            min="1"
          />

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.isAnonymous}
              onChange={(e) => setFormData(prev => ({ ...prev, isAnonymous: e.target.checked }))}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">Rester anonyme</span>
          </label>

          <div className="flex space-x-3 pt-4">
            <Button variant="outline" fullWidth onClick={onClose} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button variant="spiritual" fullWidth type="submit" loading={isSubmitting}>
              Publier l'intention
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};