// Types pour les nouvelles fonctionnalités premium

export interface LiveCelebration {
  id: string;
  title: string;
  description: string;
  organizerId: string;
  organizer: User;
  parishIds: string[];
  parishes: Parish[];
  startTime: Date;
  endTime?: Date;
  streamUrl: string;
  isLive: boolean;
  totalOfferings: number;
  participantCount: number;
  showDonorNames: boolean;
  offerings: LiveOffering[];
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LiveOffering {
  id: string;
  celebrationId: string;
  donorId: string;
  donor?: User;
  amount: number;
  currency: 'FCFA' | 'USD' | 'EUR';
  paymentMethod: PaymentMethod;
  isAnonymous: boolean;
  message?: string;
  createdAt: Date;
}

export interface MicroDonation {
  id: string;
  donorId: string;
  donor: User;
  targetType: 'post' | 'live' | 'prayer' | 'formation';
  targetId: string;
  amount: number;
  currency: 'FCFA' | 'USD' | 'EUR';
  paymentMethod: PaymentMethod;
  beneficiaryId?: string;
  beneficiary?: Organization;
  createdAt: Date;
}

export interface BiblicalPath {
  id: string;
  title: string;
  description: string;
  category: BiblicalPathCategory;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // en jours
  steps: BiblicalStep[];
  userId?: string; // Si personnalisé par IA
  isAIGenerated: boolean;
  isPremium: boolean;
  completionRate: number;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BiblicalStep {
  id: string;
  pathId: string;
  day: number;
  title: string;
  description: string;
  bibleVerse: string;
  verseReference: string;
  audioUrl?: string;
  videoUrl?: string;
  meditationText: string;
  reflectionQuestions: string[];
  isCompleted: boolean;
  completedAt?: Date;
}

export interface LocationMeditation {
  id: string;
  title: string;
  description: string;
  bibleVerse: string;
  verseReference: string;
  audioUrl: string;
  duration: number; // en minutes
  latitude: number;
  longitude: number;
  radius: number; // en mètres
  locationName: string;
  locationType: LocationType;
  language: 'fr' | 'fon' | 'yoruba';
  isPremium: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PrayerWall {
  id: string;
  title: string;
  description: string;
  category: PrayerCategory;
  requesterId: string;
  requester: User;
  isAnonymous: boolean;
  prayerCount: number;
  targetPrayerCount?: number;
  isAnswered: boolean;
  answeredAt?: Date;
  testimony?: string;
  isPremium: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommunityChallenge {
  id: string;
  title: string;
  description: string;
  type: ChallengeType;
  targetCount: number;
  currentCount: number;
  reward: ChallengeReward;
  startDate: Date;
  endDate: Date;
  participantIds: string[];
  participants: User[];
  isActive: boolean;
  isCompleted: boolean;
  completedAt?: Date;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChallengeReward {
  type: 'donation' | 'badge' | 'premium_access';
  amount?: number;
  currency?: string;
  beneficiaryId?: string;
  beneficiary?: Organization;
  badgeId?: string;
  description: string;
}

export interface SpiritualBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: BadgeCategory;
  requirements: BadgeRequirement[];
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  pointsValue: number;
  unlockedBy: string[];
  createdAt: Date;
}

export interface BadgeRequirement {
  type: 'prayers' | 'donations' | 'posts' | 'formations' | 'activities';
  count: number;
  description: string;
}

export interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  badge: SpiritualBadge;
  unlockedAt: Date;
  isVisible: boolean;
}

export interface SpiritualRanking {
  id: string;
  userId: string;
  user: User;
  totalPoints: number;
  rank: number;
  badges: UserBadge[];
  achievements: Achievement[];
  level: SpiritualLevel;
  updatedAt: Date;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  pointsAwarded: number;
  unlockedAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  description: string;
  type: 'charity' | 'church' | 'ministry';
  contactEmail: string;
  website?: string;
  logoUrl?: string;
  isVerified: boolean;
  totalReceived: number;
  createdAt: Date;
}

// Enums
export enum PaymentMethod {
  MOBILE_MONEY = 'mobile_money',
  CRYPTO = 'crypto',
  BANK_TRANSFER = 'bank_transfer',
  CARD = 'card'
}

export enum BiblicalPathCategory {
  INNER_PEACE = 'inner_peace',
  FAMILY_ISSUES = 'family_issues',
  PROFESSIONAL_SUCCESS = 'professional_success',
  HEALING = 'healing',
  FORGIVENESS = 'forgiveness',
  GUIDANCE = 'guidance',
  GRATITUDE = 'gratitude',
  FAITH_BUILDING = 'faith_building'
}

export enum LocationType {
  CHURCH = 'church',
  CROSS = 'cross',
  SACRED_SITE = 'sacred_site',
  CEMETERY = 'cemetery',
  PILGRIMAGE_SITE = 'pilgrimage_site'
}

export enum PrayerCategory {
  HEALING = 'healing',
  FAMILY = 'family',
  WORK = 'work',
  GUIDANCE = 'guidance',
  GRATITUDE = 'gratitude',
  FORGIVENESS = 'forgiveness',
  PROTECTION = 'protection',
  PEACE = 'peace'
}

export enum ChallengeType {
  PRAYER_COUNT = 'prayer_count',
  DONATION_AMOUNT = 'donation_amount',
  BIBLE_READING = 'bible_reading',
  COMMUNITY_SERVICE = 'community_service',
  EVANGELIZATION = 'evangelization'
}

export enum BadgeCategory {
  PRAYER = 'prayer',
  GENEROSITY = 'generosity',
  COMMUNITY = 'community',
  KNOWLEDGE = 'knowledge',
  SERVICE = 'service',
  LEADERSHIP = 'leadership'
}

export enum SpiritualLevel {
  NOVICE = 'novice',
  DISCIPLE = 'disciple',
  SERVANT = 'servant',
  MINISTER = 'minister',
  ELDER = 'elder',
  SHEPHERD = 'shepherd'
}