import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, LoginData, RegisterPhase1Data, RegisterPhase2Data, 
  Country, Confession, Parish, UserRole, UserLevel, 
  ShepherdGrade, ValidationStatus 
} from '../types';
import { 
  supabase, 
  handleSupabaseError 
} from '../lib/supabase';
import { geoService } from '../services/geoService';
import { settingsService } from '../services/settingsService';
import { userPresenceService } from '../services/userPresenceService';
import type { Database } from '../lib/database.types';

// Interface étendue pour les paramètres utilisateur
export interface UserSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  language: 'fr' | 'en' | 'sw';
  theme: 'light' | 'dark' | 'system';
  privacyLevel: 'public' | 'subscribers' | 'parish';
  twoFactorEnabled: boolean;
}

// Interface User étendue avec les paramètres
export interface ExtendedUser extends User {
  settings?: UserSettings;
}

interface AuthContextType {
  user: ExtendedUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSuperAdmin: boolean;
  isShepherd: boolean;
  login: (data: LoginData) => Promise<void>;
  registerPhase1: (data: RegisterPhase1Data) => Promise<void>;
  registerPhase2: (data: RegisterPhase2Data) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  updateUserSettings: (settings: Partial<UserSettings>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Helper function to convert Supabase profile to your User type
const convertSupabaseProfileToUser = async (
  profile: Database['public']['Tables']['profiles']['Row']
): Promise<ExtendedUser> => {
  console.log('🟢 Converting profile to User:', profile);
  
  // Construction de l'objet User de base
  const user: ExtendedUser = {
    id: profile.id,
    email: profile.email,
    firstName: profile.first_name,
    lastName: profile.last_name,
    profileComplete: profile.profile_complete || false,
    role: (profile.role as UserRole) || UserRole.BREBIS,
    level: (profile.level as UserLevel) || UserLevel.SEMEUR,
    avatar: profile.avatar_url || undefined,
    bio: profile.bio || undefined,
    createdAt: profile.created_at ? new Date(profile.created_at) : new Date(),
    updatedAt: profile.updated_at ? new Date(profile.updated_at) : new Date(),
    // Initialiser les objets relationnels
    country: undefined,
    city: undefined,
    confession: undefined,
    parish: undefined,
  };

  // Charger le pays si country_id existe
  if (profile.country_id) {
    try {
      const { data: countryData, error: countryError } = await supabase
        .from('countries')
        .select('*')
        .eq('id', profile.country_id)
        .single();
      
      if (countryError) throw countryError;
      
      if (countryData) {
        user.country = {
          id: countryData.id,
          name: countryData.name,
          code: countryData.code,
          continent: { id: '', name: '', code: '' },
          subRegion: { id: '', name: '', continentId: '' },
          cities: []
        };
        console.log('✅ Country loaded:', user.country.name);
      }
    } catch (error) {
      console.warn('Could not load country:', error);
    }
  }

  // Charger la ville si city_id existe
  if (profile.city_id) {
    try {
      const { data: cityData, error: cityError } = await supabase
        .from('cities')
        .select('*')
        .eq('id', profile.city_id)
        .single();
      
      if (cityError) throw cityError;
      
      if (cityData) {
        user.city = {
          id: cityData.id,
          name: cityData.name,
          countryId: cityData.country_id
        };
        console.log('✅ City loaded:', user.city.name, 'ID:', user.city.id);
      } else {
        console.log('⚠️ City NOT found for ID:', profile.city_id);
      }
    } catch (error) {
      console.warn('Could not load city:', error);
    }
  } else {
    console.log('⚠️ No city_id in profile for user:', profile.id);
  }

  // Charger la confession si confession_id existe
  if (profile.confession_id) {
    try {
      const { data: confessionData, error: confessionError } = await supabase
        .from('confessions')
        .select('*')
        .eq('id', profile.confession_id)
        .single();
      
      if (confessionError) throw confessionError;
      
      if (confessionData) {
        user.confession = {
          id: confessionData.id,
          name: confessionData.name,
          description: confessionData.description || '',
          validated: confessionData.validated || false
        };
        console.log('✅ Confession loaded:', user.confession.name);
      }
    } catch (error) {
      console.warn('Could not load confession:', error);
    }
  }

  // Charger la paroisse si parish_id existe
  if (profile.parish_id) {
    try {
      const { data: parishData, error: parishError } = await supabase
        .from('parishes')
        .select('*')
        .eq('id', profile.parish_id)
        .single();
      
      if (parishError) throw parishError;
      
      if (parishData) {
        user.parish = {
          id: parishData.id,
          name: parishData.name,
          confessionId: parishData.confession_id,
          cityId: parishData.city_id,
          address: parishData.address || '',
          validated: parishData.validated || false
        };
        console.log('✅ Parish loaded:', user.parish.name, 'ID:', user.parish.id);
      } else {
        console.log('⚠️ Parish NOT found for ID:', profile.parish_id);
      }
    } catch (error) {
      console.warn('Could not load parish:', error);
    }
  } else {
    console.log('⚠️ No parish_id in profile for user:', profile.id);
  }

  // Charger les nouveaux champs pour la hiérarchie des bergers
  user.shepherdGrade = profile.shepherd_grade as ShepherdGrade | undefined;
  user.superiorId = profile.superior_id || undefined;
  user.validationStatus = profile.validation_status as ValidationStatus | undefined;
  user.vigneronVerified = profile.vigneron_verified || false;
  user.vigneronCertifiedBy = profile.vigneron_certified_by || undefined;
  user.spiritualPoints = profile.spiritual_points || 0;
  user.defaultVisibility = profile.default_visibility || 'public';

  // Charger les paramètres utilisateur
  try {
    const settings = await settingsService.getSettings();
    user.settings = settings;
    console.log('✅ User settings loaded:', user.settings);
  } catch (error) {
    console.warn('Could not load user settings:', error);
    user.settings = {
      emailNotifications: true,
      pushNotifications: true,
      language: 'fr',
      theme: 'light',
      privacyLevel: 'public',
      twoFactorEnabled: false,
    };
  }

  console.log('🟢 Shepherd grade loaded:', user.shepherdGrade);
  console.log('🟢 Default visibility loaded:', user.defaultVisibility);

  console.log('🟢 Final User object:', {
    id: user.id,
    profileComplete: user.profileComplete,
    country: user.country?.name,
    city: user.city?.name,
    cityId: user.city?.id,
    confession: user.confession?.name,
    parish: user.parish?.name,
    parishId: user.parish?.id,
    shepherdGrade: user.shepherdGrade,
    spiritualPoints: user.spiritualPoints,
    defaultVisibility: user.defaultVisibility,
    settings: user.settings,
  });

  // Démarrer le heartbeat de présence
  if (profile.id) {
    userPresenceService.startHeartbeat(profile.id);
  }

  return user;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Computed values
  const isSuperAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isShepherd = user?.shepherdGrade !== null && user?.shepherdGrade !== undefined;

  // Nettoyer le heartbeat au démontage du composant
  useEffect(() => {
    return () => {
      userPresenceService.stopHeartbeat();
    };
  }, []);

  // Fonction pour charger le profil après authentification
  const loadProfileAfterAuth = async (userId: string) => {
    console.log('🔵 loadProfileAfterAuth - début:', userId);
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      console.log('🔵 loadProfileAfterAuth - requête terminée');
      
      if (error) {
        console.error('🔴 Error loading profile:', error);
        return null;
      }
      
      if (profile) {
        const userData = await convertSupabaseProfileToUser(profile);
        return userData;
      }
      return null;
    } catch (error) {
      console.error('🔴 Error in loadProfileAfterAuth:', error);
      return null;
    }
  };

  // Mettre à jour les paramètres utilisateur
  const updateUserSettings = async (settings: Partial<UserSettings>): Promise<void> => {
    if (!user) throw new Error('User not found');
    
    try {
      const updatedSettings = await settingsService.updateSettings(settings);
      setUser(prev => prev ? { ...prev, settings: updatedSettings } : null);
      console.log('✅ User settings updated:', updatedSettings);
    } catch (error) {
      console.error('❌ Error updating user settings:', error);
      throw error;
    }
  };

  // Load user from Supabase on mount
  useEffect(() => {
    const loadUser = async () => {
      console.log('🔵 loadUser - début');
      try {
        setIsLoading(true);
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('🔴 Error getting session:', sessionError);
          setIsLoading(false);
          return;
        }
        
        if (session?.user) {
          console.log('🟢 User session found:', session.user.id);
          
          const userData = await loadProfileAfterAuth(session.user.id);
          
          if (userData) {
            console.log('🟢 Profile loaded, setting user');
            setUser(userData);
          } else {
            console.log('🟡 Profile not found for user:', session.user.id);
          }
        } else {
          console.log('🟡 No active session found');
        }
      } catch (error) {
        console.error('🔴 Error in loadUser:', error);
      } finally {
        console.log('🔵 loadUser - finally, isLoading=false');
        setIsLoading(false);
      }
    };

    loadUser();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔵 Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('🟢 SIGNED_IN - déclenchement du chargement du profil');
          // Déclencher le chargement du profil de manière asynchrone
          loadProfileAfterAuth(session.user.id).then(userData => {
            if (userData) {
              console.log('🟢 Profile chargé après SIGNED_IN');
              setUser(userData);
            }
            setIsLoading(false);
          }).catch(error => {
            console.error('🔴 Erreur après SIGNED_IN:', error);
            setIsLoading(false);
          });
        } else if (event === 'SIGNED_OUT') {
          console.log('🟡 User signed out');
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Create initial profile for new users
  const createInitialProfile = async (authUser: any) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: authUser.id,
          email: authUser.email,
          first_name: authUser.user_metadata?.first_name || '',
          last_name: authUser.user_metadata?.last_name || '',
          profile_complete: false,
          role: 'brebis',
          level: 'semeur',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error creating initial profile:', error);
        throw error;
      }
      
      console.log('Initial profile created for user:', authUser.id);
    } catch (error) {
      console.error('Error in createInitialProfile:', error);
      throw error;
    }
  };

  // Login with Supabase Auth
  const login = async (data: LoginData): Promise<void> => {
    setIsLoading(true);
    try {
      console.log('Attempting login for:', data.email);
      
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        console.error('Login error:', error);
        throw error;
      }
      
      console.log('Login successful');
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error(handleSupabaseError(error));
    } finally {
      setIsLoading(false);
    }
  };

  // Register phase 1: Create auth user
  const registerPhase1 = async (data: RegisterPhase1Data): Promise<void> => {
    setIsLoading(true);
    try {
      console.log('Starting registration phase 1 for:', data.email);
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
          },
        },
      });

      if (authError) {
        console.error('Auth signup error:', authError);
        throw authError;
      }

      console.log('Auth signup successful:', authData.user?.id);

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: data.email,
            first_name: data.firstName,
            last_name: data.lastName,
            country_id: data.countryId,
            profile_complete: false,
            role: 'brebis',
            level: 'semeur',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          
          if (profileError.code === '23505') {
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                first_name: data.firstName,
                last_name: data.lastName,
                country_id: data.countryId,
                updated_at: new Date().toISOString(),
              })
              .eq('id', authData.user.id);
              
            if (updateError) throw updateError;
          } else {
            throw profileError;
          }
        }

        // Créer un objet user temporaire
        const tempUser: ExtendedUser = {
          id: authData.user.id,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          profileComplete: false,
          role: UserRole.BREBIS,
          level: UserLevel.SEMEUR,
          country: undefined,
          city: undefined,
          confession: undefined,
          parish: undefined,
          avatar: undefined,
          bio: undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
          settings: {
            emailNotifications: true,
            pushNotifications: true,
            language: 'fr',
            theme: 'light',
            privacyLevel: 'public',
            twoFactorEnabled: false,
          },
        };

        try {
          const countryData = await geoService.getCountryById(data.countryId);
          if (countryData) {
            tempUser.country = {
              id: countryData.id,
              name: countryData.name,
              code: countryData.code,
              continent: {
                id: countryData.continent_id,
                name: '',
                code: ''
              },
              subRegion: countryData.sub_region_id ? {
                id: countryData.sub_region_id,
                name: '',
                continentId: countryData.continent_id
              } : undefined,
              cities: []
            };
          }
        } catch (countryError) {
          console.error('Error loading country:', countryError);
        }

        setUser(tempUser);
        console.log('Registration phase 1 completed');
      }
    } catch (error) {
      console.error('Register phase 1 failed:', error);
      throw new Error(handleSupabaseError(error));
    } finally {
      setIsLoading(false);
    }
  };

  // Register phase 2: Complete profile
  const registerPhase2 = async (data: RegisterPhase2Data): Promise<void> => {
    setIsLoading(true);
    try {
      if (!user) throw new Error('User not found');

      console.log('Starting registration phase 2 for user:', user.id);

      const updateData: any = {
        city_id: data.cityId,
        confession_id: data.confessionId,
        bio: data.bio,
        profile_complete: true,
        updated_at: new Date().toISOString(),
      };

      if (data.parishId) {
        updateData.parish_id = data.parishId;
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      await refreshUser();
      console.log('Registration phase 2 completed');
    } catch (error) {
      console.error('Register phase 2 failed:', error);
      throw new Error(handleSupabaseError(error));
    } finally {
      setIsLoading(false);
    }
  };

  // Update profile (version corrigée acceptant IDs bruts ET objets)
  const updateProfile = async (data: any): Promise<void> => {
    setIsLoading(true);
    try {
      if (!user) throw new Error('User not found');
  
      console.log('Updating profile for user:', user.id);
      console.log('Received update data:', data);
  
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };
  
      // === 1. Champs texte simples (sans transformation) ===
      if (data.firstName !== undefined) updateData.first_name = data.firstName;
      if (data.lastName !== undefined) updateData.last_name = data.lastName;
      if (data.bio !== undefined) updateData.bio = data.bio;
      if (data.avatar !== undefined) updateData.avatar_url = data.avatar;
      if (data.avatar_url !== undefined) updateData.avatar_url = data.avatar_url;
      
      // === 2. Flag profil complet ===
      if (data.profile_complete !== undefined) updateData.profile_complete = data.profile_complete;
      if (data.profileComplete !== undefined) updateData.profile_complete = data.profileComplete;
  
      // === 3. IDs bruts (cas completProfileModal et updateProfile direct) ===
      if (data.country_id !== undefined) updateData.country_id = data.country_id;
      if (data.city_id !== undefined) updateData.city_id = data.city_id;
      if (data.confession_id !== undefined) updateData.confession_id = data.confession_id;
      if (data.parish_id !== undefined) updateData.parish_id = data.parish_id;
      
      // === 3bis. IDs en camelCase (cas EditProfileModal) ===
      if (data.countryId !== undefined) updateData.country_id = data.countryId;
      if (data.cityId !== undefined) updateData.city_id = data.cityId;
      if (data.confessionId !== undefined) updateData.confession_id = data.confessionId;
      if (data.parishId !== undefined) updateData.parish_id = data.parishId;
      
      // === 4. Objets (cas ancienne version pour compatibilité) ===
      if (data.country !== undefined) {
        updateData.country_id = typeof data.country === 'object' ? data.country.id : data.country;
      }
      
      if (data.city !== undefined) {
        // Si city est un objet avec un id, prendre l'id, sinon prendre la valeur brute
        if (typeof data.city === 'object' && data.city.id) {
          updateData.city_id = data.city.id;
        } else if (typeof data.city === 'string') {
          updateData.city_id = data.city;
        } else {
          updateData.city_id = data.city;
        }
      }
      
      if (data.confession !== undefined) {
        updateData.confession_id = typeof data.confession === 'object' ? data.confession.id : data.confession;
      }
      
      if (data.parish !== undefined) {
        updateData.parish_id = typeof data.parish === 'object' ? data.parish.id : data.parish;
      }
      
      // === 5. Rôles et niveaux ===
      if (data.role !== undefined) updateData.role = data.role;
      if (data.level !== undefined) updateData.level = data.level;

      // === 6. Visibilité par défaut ===
      if (data.defaultVisibility !== undefined) {
        updateData.default_visibility = data.defaultVisibility;
      }
      if (data.default_visibility !== undefined) {
        updateData.default_visibility = data.default_visibility;
      }
  
      console.log('Final update data to send to Supabase:', updateData);
  
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);
  
      if (error) {
        console.error('Update profile error:', error);
        throw error;
      }
  
      await refreshUser();
      console.log('Profile updated successfully');
    } catch (error) {
      console.error('Update profile failed:', error);
      throw new Error(handleSupabaseError(error));
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = async (): Promise<void> => {
    try {
      console.log('Logging out user');
      
      // Arrêter le heartbeat et mettre à jour le statut
      await userPresenceService.setOfflineAndStop();
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
        throw error;
      }
      setUser(null);
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout failed:', error);
      throw new Error(handleSupabaseError(error));
    }
  };

  // Refresh user data
  const refreshUser = async (): Promise<void> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setUser(null);
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (error) {
        console.error('Error refreshing user profile:', error);
        return;
      }

      if (profile) {
        const userData = await convertSupabaseProfileToUser(profile);
        setUser(userData);
        console.log('User data refreshed');
      }
    } catch (error) {
      console.error('Error in refreshUser:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isSuperAdmin,
    isShepherd,
    login,
    registerPhase1,
    registerPhase2,
    logout,
    updateProfile,
    updateUserSettings,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};