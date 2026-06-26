import type { Database } from '../lib/database.types';

// Re-export Supabase types with your existing naming
export type {
  Database,
  Json,
} from '../lib/database.types';

// Type helpers
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Country = Database['public']['Tables']['countries']['Row'];
export type City = Database['public']['Tables']['cities']['Row'];
export type Confession = Database['public']['Tables']['confessions']['Row'];
export type Parish = Database['public']['Tables']['parishes']['Row'];
export type Post = Database['public']['Tables']['posts']['Row'];
export type MarketItem = Database['public']['Tables']['market_items']['Row'];

// Convert Supabase types to your existing types
export const convertProfileToUser = (profile: Profile): any => {
  return {
    id: profile.id,
    email: profile.email,
    firstName: profile.first_name,
    lastName: profile.last_name,
    profileComplete: profile.profile_complete,
    role: profile.role,
    level: profile.level,
    countryId: profile.country_id,
    cityId: profile.city_id,
    confessionId: profile.confession_id,
    parishId: profile.parish_id,
    avatar: profile.avatar_url,
    bio: profile.bio,
    defaultVisibility: profile.default_visibility,  // <-- NOUVEAU
    createdAt: profile.created_at ? new Date(profile.created_at) : new Date(),
    updatedAt: profile.updated_at ? new Date(profile.updated_at) : new Date(),
  };
};

// Convert your User type to Supabase Profile
export const convertUserToProfile = (user: any): Partial<Profile> => {
  return {
    email: user.email,
    first_name: user.firstName,
    last_name: user.lastName,
    profile_complete: user.profileComplete,
    role: user.role,
    level: user.level,
    country_id: user.countryId || user.country?.id,
    city_id: user.cityId || user.city,
    confession_id: user.confessionId || user.confession?.id,
    parish_id: user.parishId || user.parish?.id,
    avatar_url: user.avatar,
    bio: user.bio,
    default_visibility: user.defaultVisibility,  // <-- NOUVEAU
    updated_at: new Date().toISOString(),
  };
};