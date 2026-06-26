import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type FormationRow = Database['public']['Tables']['formations']['Row'];
type FormationModuleRow = Database['public']['Tables']['formation_modules']['Row'];
type FormationEnrollmentRow = Database['public']['Tables']['formation_enrollments']['Row'];

export interface EnrichedFormation extends FormationRow {
  instructor: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    bio: string | null;
    role: string;
  };
  modules: FormationModuleRow[];
  enrolled?: boolean;
  progress?: number;
}

export interface EnrichedFormationModule extends FormationModuleRow {
  isCompleted?: boolean;
}

class FormationService {
  // Récupérer toutes les formations actives
  async getFormations(options?: {
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<EnrichedFormation[]> {
    try {
      let query = supabase
        .from('formations')
        .select(`
          *,
          instructor:profiles(
            id,
            first_name,
            last_name,
            avatar_url,
            bio,
            role
          ),
          modules:formation_modules(*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (options?.category) {
        query = query.eq('category', options.category);
      }

      if (options?.search) {
        query = query.or(`title.ilike.%${options.search}%,description.ilike.%${options.search}%`);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset !== undefined) {
        query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Trier les modules par order
      const formations = (data as EnrichedFormation[]).map(formation => ({
        ...formation,
        modules: (formation.modules || []).sort((a, b) => (a.order || 0) - (b.order || 0))
      }));

      return formations;
    } catch (error) {
      console.error('Error fetching formations:', error);
      return [];
    }
  }

  // Récupérer une formation par son ID
  async getFormationById(formationId: string): Promise<EnrichedFormation | null> {
    try {
      const { data, error } = await supabase
        .from('formations')
        .select(`
          *,
          instructor:profiles(
            id,
            first_name,
            last_name,
            avatar_url,
            bio,
            role
          ),
          modules:formation_modules(*)
        `)
        .eq('id', formationId)
        .single();

      if (error) throw error;
      
      if (data) {
        const formation = data as EnrichedFormation;
        formation.modules = (formation.modules || []).sort((a, b) => (a.order || 0) - (b.order || 0));
        return formation;
      }
      return null;
    } catch (error) {
      console.error('Error fetching formation:', error);
      return null;
    }
  }

  // Récupérer les formations d'un instructeur
  async getFormationsByInstructor(instructorId: string): Promise<EnrichedFormation[]> {
    try {
      const { data, error } = await supabase
        .from('formations')
        .select(`
          *,
          instructor:profiles(
            id,
            first_name,
            last_name,
            avatar_url,
            bio,
            role
          ),
          modules:formation_modules(*)
        `)
        .eq('instructor_id', instructorId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as EnrichedFormation[]) || [];
    } catch (error) {
      console.error('Error fetching formations by instructor:', error);
      return [];
    }
  }

  // Récupérer les inscriptions de l'utilisateur connecté
  async getUserEnrollments(): Promise<FormationEnrollmentRow[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('formation_enrollments')
        .select('*')
        .eq('student_id', user.id);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user enrollments:', error);
      return [];
    }
  }

  // Vérifier si l'utilisateur est inscrit à une formation
  async isUserEnrolled(formationId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('formation_enrollments')
        .select('id')
        .eq('formation_id', formationId)
        .eq('student_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking enrollment:', error);
      return false;
    }
  }

  // S'inscrire à une formation
  async enrollInFormation(formationId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Vérifier si déjà inscrit
      const isEnrolled = await this.isUserEnrolled(formationId);
      if (isEnrolled) return true;

      const { error } = await supabase
        .from('formation_enrollments')
        .insert({
          formation_id: formationId,
          student_id: user.id,
          progress: 0,
          completed: false,
          enrolled_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Incrémenter le compteur current_students
      await supabase.rpc('increment_formation_students', {
        formation_id: formationId
      });

      return true;
    } catch (error) {
      console.error('Error enrolling in formation:', error);
      return false;
    }
  }

  // Mettre à jour la progression
  async updateProgress(formationId: string, progress: number): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('formation_enrollments')
        .update({ 
          progress: Math.min(progress, 100),
          completed: progress >= 100,
          completed_at: progress >= 100 ? new Date().toISOString() : null
        })
        .eq('formation_id', formationId)
        .eq('student_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating progress:', error);
      return false;
    }
  }

  // Récupérer la progression de l'utilisateur pour une formation
  async getUserProgress(formationId: string): Promise<number> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const { data, error } = await supabase
        .from('formation_enrollments')
        .select('progress')
        .eq('formation_id', formationId)
        .eq('student_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data?.progress || 0;
    } catch (error) {
      console.error('Error getting progress:', error);
      return 0;
    }
  }

  // Récupérer les formations auxquelles l'utilisateur est inscrit (enrichies)
  async getUserEnrolledFormations(): Promise<EnrichedFormation[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Récupérer les IDs des formations inscrites
      const { data: enrollments, error: enrollError } = await supabase
        .from('formation_enrollments')
        .select('formation_id, progress')
        .eq('student_id', user.id);

      if (enrollError) throw enrollError;
      if (!enrollments?.length) return [];

      const formationIds = enrollments.map(e => e.formation_id);
      const progressMap = new Map(enrollments.map(e => [e.formation_id, e.progress]));

      // Récupérer les formations
      const { data: formations, error: formError } = await supabase
        .from('formations')
        .select(`
          *,
          instructor:profiles(
            id,
            first_name,
            last_name,
            avatar_url,
            bio,
            role
          ),
          modules:formation_modules(*)
        `)
        .in('id', formationIds)
        .eq('is_active', true);

      if (formError) throw formError;

      return (formations as EnrichedFormation[]).map(formation => ({
        ...formation,
        enrolled: true,
        progress: progressMap.get(formation.id) || 0,
        modules: (formation.modules || []).sort((a, b) => (a.order || 0) - (b.order || 0))
      }));
    } catch (error) {
      console.error('Error fetching user enrolled formations:', error);
      return [];
    }
  }

  // Créer une formation (pour les instructeurs)
  async createFormation(formationData: Omit<FormationRow, 'id' | 'created_at' | 'updated_at' | 'instructor_id' | 'current_students' | 'rating' | 'reviews_count'>): Promise<EnrichedFormation | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('formations')
        .insert({
          ...formationData,
          instructor_id: user.id,
          current_students: 0,
          rating: 0,
          reviews_count: 0,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select(`
          *,
          instructor:profiles(
            id,
            first_name,
            last_name,
            avatar_url,
            bio,
            role
          ),
          modules:formation_modules(*)
        `)
        .single();

      if (error) throw error;
      return data as EnrichedFormation;
    } catch (error) {
      console.error('Error creating formation:', error);
      return null;
    }
  }

  // Ajouter un module à une formation
  async addModule(formationId: string, moduleData: Omit<FormationModuleRow, 'id' | 'created_at' | 'formation_id'>): Promise<FormationModuleRow | null> {
    try {
      const { data, error } = await supabase
        .from('formation_modules')
        .insert({
          ...moduleData,
          formation_id: formationId,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error adding module:', error);
      return null;
    }
  }

  // Obtenir les statistiques des formations
  async getFormationStats(): Promise<{
    total: number;
    free: number;
    avgRating: number;
    totalStudents: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('formations')
        .select('price, rating, current_students')
        .eq('is_active', true);

      if (error) throw error;

      const total = data?.length || 0;
      const free = data?.filter(f => !f.price || f.price === 0).length || 0;
      const avgRating = data?.reduce((sum, f) => sum + (f.rating || 0), 0) / (total || 1);
      const totalStudents = data?.reduce((sum, f) => sum + (f.current_students || 0), 0) || 0;

      return { total, free, avgRating: Math.round(avgRating * 10) / 10, totalStudents };
    } catch (error) {
      console.error('Error getting formation stats:', error);
      return { total: 0, free: 0, avgRating: 0, totalStudents: 0 };
    }
  }
}

// Fonctions SQL auxiliaires (à exécuter dans Supabase)
/*
CREATE OR REPLACE FUNCTION increment_formation_students(formation_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE formations SET current_students = current_students + 1 WHERE id = formation_id;
END;
$$ LANGUAGE plpgsql;
*/

export const formationService = new FormationService();