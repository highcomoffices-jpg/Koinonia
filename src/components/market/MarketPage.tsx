import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter, Grid, List, Heart, Eye, MapPin, Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { marketService, EnrichedMarketItem } from '../../services/marketService';

interface Filters {
  category: string;
  sortBy: 'newest' | 'price_asc' | 'price_desc' | 'most_liked';
}

export const MarketPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [items, setItems] = useState<EnrichedMarketItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<EnrichedMarketItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Filters>({
    category: '',
    sortBy: 'newest',
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Charger les articles
  useEffect(() => {
    const fetchItems = async () => {
      setIsLoading(true);
      try {
        const data = await marketService.getItems();
        setItems(data);
        
        // Charger les catégories
        const cats = await marketService.getCategories();
        setCategories(cats);
      } catch (error) {
        console.error('Error fetching market items:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();
  }, []);

  // Filtrer et trier les articles
  useEffect(() => {
    let result = [...items];

    // Filtre par recherche
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        item => item.title.toLowerCase().includes(term) || 
                item.description.toLowerCase().includes(term)
      );
    }

    // Filtre par catégorie
    if (filters.category) {
      result = result.filter(item => item.category === filters.category);
    }

    // Tri
    switch (filters.sortBy) {
      case 'price_asc':
        result.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price_desc':
        result.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'most_liked':
        result.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        break;
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
        break;
    }

    setFilteredItems(result);
  }, [items, searchTerm, filters]);

  const handleLike = async (itemId: string) => {
    try {
      await marketService.likeItem(itemId);
      // Mettre à jour l'état local
      setItems(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, likes: (item.likes || 0) + 1 }
          : item
      ));
    } catch (error) {
      console.error('Error liking item:', error);
    }
  };

  const formatPrice = (price: number | null) => {
    if (!price) return 'Gratuit';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(price);
  };

  const categoryOptions = [
    { value: '', label: 'Toutes les catégories' },
    ...categories.map(cat => ({ value: cat, label: cat })),
  ];

  const sortOptions = [
    { value: 'newest', label: 'Plus récents' },
    { value: 'price_asc', label: 'Prix croissant' },
    { value: 'price_desc', label: 'Prix décroissant' },
    { value: 'most_liked', label: 'Les plus aimés' },
  ];

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="px-4 sm:px-6 py-4 sm:py-6">
        <div className="w-full max-w-full mx-auto">
          {/* En-tête */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {t('market.title') || 'Boutique chrétienne'}
              </h1>
              <p className="text-sm text-gray-600">
                {t('market.subtitle') || 'Achetez, vendez et partagez des articles chrétiens'}
              </p>
            </div>
            {user && (
              <Button variant="primary" size="sm" icon={Plus}>
                {t('market.sell') || 'Vendre un article'}
              </Button>
            )}
          </div>

          {/* Barre de recherche et filtres */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Rechercher un article..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={Search}
              />
            </div>
            <div className="flex gap-3">
              <Select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                options={categoryOptions}
                className="w-48"
              />
              <Select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                options={sortOptions}
                className="w-40"
              />
              <div className="flex gap-1 border border-gray-200 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'text-gray-400'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* État de chargement */}
          {isLoading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="mt-2 text-gray-600">Chargement des articles...</p>
            </div>
          )}

          {/* Grille des articles */}
          {!isLoading && (
            <>
              {filteredItems.length === 0 ? (
                <Card className="text-center py-12">
                  <p className="text-gray-500">Aucun article trouvé</p>
                  <p className="text-sm text-gray-400 mt-1">Essayez de modifier vos critères de recherche</p>
                </Card>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredItems.map((item) => (
                    <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="relative aspect-square bg-gray-100">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            Pas d'image
                          </div>
                        )}
                        <button
                          onClick={() => handleLike(item.id)}
                          className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                        >
                          <Heart className={`w-4 h-4 ${(item.likes || 0) > 0 ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                        </button>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                          {item.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {item.description}
                        </p>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-lg font-bold text-primary-600">
                            {formatPrice(item.price)}
                          </span>
                          <div className="flex items-center space-x-3 text-xs text-gray-500">
                            <span className="flex items-center">
                              <Heart className="w-3 h-3 mr-1" />
                              {item.likes || 0}
                            </span>
                            <span className="flex items-center">
                              <Eye className="w-3 h-3 mr-1" />
                              {item.views || 0}
                            </span>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                          <div className="flex items-center text-xs text-gray-500">
                            <MapPin className="w-3 h-3 mr-1" />
                            {item.location}
                          </div>
                          <span className="text-xs text-gray-400">
                            {item.condition || 'État non précisé'}
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredItems.map((item) => (
                    <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
                      <div className="flex flex-col sm:flex-row">
                        <div className="w-full sm:w-32 h-32 bg-gray-100 flex-shrink-0">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              Pas d'image
                            </div>
                          )}
                        </div>
                        <div className="flex-1 p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-gray-900 mb-1">
                                {item.title}
                              </h3>
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {item.description}
                              </p>
                            </div>
                            <button
                              onClick={() => handleLike(item.id)}
                              className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                            >
                              <Heart className={`w-5 h-5 ${(item.likes || 0) > 0 ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                            </button>
                          </div>
                          <div className="flex flex-wrap items-center justify-between mt-3 gap-2">
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span className="flex items-center">
                                <MapPin className="w-3 h-3 mr-1" />
                                {item.location}
                              </span>
                              <span>{item.condition || 'État non précisé'}</span>
                              <span className="flex items-center">
                                <Eye className="w-3 h-3 mr-1" />
                                {item.views || 0} vues
                              </span>
                            </div>
                            <span className="text-xl font-bold text-primary-600">
                              {formatPrice(item.price)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};