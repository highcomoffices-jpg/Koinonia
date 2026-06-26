// Types pour le Market chrétien

export interface MarketItem {
  id: string;
  title: string;
  description: string;
  price: number; // Prix en FCFA, 0 pour gratuit
  category: MarketCategory;
  condition?: string; // "Neuf", "Très bon état", "Bon état", "État correct"
  imageUrl: string;
  seller: MarketSeller;
  location: string;
  likes: number;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketSeller {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

export enum MarketCategory {
  BOOKS = 'Livres & Ressources',
  MUSIC = 'Musique & Louange',
  CRAFTS = 'Artisanat Chrétien',
  CLOTHING = 'Vêtements & Accessoires',
  SERVICES = 'Services',
  EVENTS = 'Événements',
  DONATIONS = 'Dons & Collectes',
  OTHER = 'Autres'
}

export interface MarketFilter {
  category?: MarketCategory;
  location?: string;
  priceMin?: number;
  priceMax?: number;
  condition?: string;
  searchTerm?: string;
}