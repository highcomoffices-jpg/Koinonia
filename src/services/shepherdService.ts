import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { ShepherdGrade, ValidationStatus } from '../types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type ParishRow = Database['public']['Tables']['parishes']['Row'];

export interface ShepherdProfile extends ProfileRow {
  shepherd_grade: ShepherdGrade | null;
  superior_id: string | null;
  validation_status: ValidationStatus;
  vigneron_verified: boolean;
  vigneron_certified_by: string | null;
  spiritual_points: number;
}

export interface ParishWithShepherd extends ParishRow {
  leader_shepherd_id: string | null;
  superior_shepherd_id: string | null;
}

class ShepherdService {
  // ============================================
  // GESTION DES BERGERS
  // ============================================

  // Récupérer tous les bergers d’un certain grade
  async getShepherdsByGrade(grade: ShepherdGrade): Promise<ShepherdProfile[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('shepherd_grade', grade)
        .eq('validation_status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ShepherdProfile[];
    } catch (error) {
      console.error('Error fetching shepherds by grade:', error);
      return [];
    }
  }

  // Récupérer le berger supérieur d’un utilisateur
  async getSuperiorShepherd(userId: string): Promise<ShepherdProfile | null> {
    try {
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('superior_id')
        .eq('id', userId)
        .single();

      if (userError) throw userError;
      if (!user?.superior_id) return null;

      const { data: superior, error: supError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.superior_id)
        .single();

      if (supError) throw supError;
      return superior as ShepherdProfile;
    } catch (error) {
      console.error('Error fetching superior shepherd:', error);
      return null;
    }
  }

  // Vérifier si un utilisateur a un grade spécifique
  async hasGrade(userId: string, requiredGrade: ShepherdGrade): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('shepherd_grade')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data?.shepherd_grade === requiredGrade;
    } catch (error) {
      console.error('Error checking shepherd grade:', error);
      return false;
    }
  }

  // Vérifier si un utilisateur a un grade parmi une liste
  async hasAnyGrade(userId: string, requiredGrades: ShepherdGrade[]): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('shepherd_grade')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data?.shepherd_grade ? requiredGrades.includes(data.shepherd_grade) : false;
    } catch (error) {
      console.error('Error checking shepherd grades:', error);
      return false;
    }
  }

  // ============================================
  // VALIDATION DES CRÉATEURS (VIGNERONS)
  // ============================================

  // Demander la certification vigneron
  async requestVigneronCertification(proofs: string[]): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({
          vigneron_verified: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      
      // TODO: Envoyer une notification aux bergers
      return true;
    } catch (error) {
      console.error('Error requesting vigneron certification:', error);
      return false;
    }
  }

  // Valider un vigneron (réservé aux bergers)
  async certifyVigneron(userId: string, approved: boolean): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Vérifier que l’utilisateur actuel a les droits (Leader, Superior ou Elder)
      const hasRight = await this.hasAnyGrade(user.id, [
        ShepherdGrade.LEADER,
        ShepherdGrade.SUPERIOR,
        ShepherdGrade.ELDER
      ]);

      if (!hasRight) throw new Error('Insufficient permissions');

      const { error } = await supabase
        .from('profiles')
        .update({
          vigneron_verified: approved,
          vigneron_certified_by: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error certifying vigneron:', error);
      return false;
    }
  }

  // ============================================
  // VALIDATION DES PAROISSES
  // ============================================

  // Proposer une nouvelle paroisse
  async proposeParish(parishData: Partial<ParishRow>): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('parishes')
        .insert({
          ...parishData,
          validated: false,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error proposing parish:', error);
      return false;
    }
  }

  // Valider une paroisse (réservé aux Superior et Elder)
  async validateParish(parishId: string, approved: boolean): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Vérifier que l’utilisateur actuel a les droits (Superior ou Elder)
      const hasRight = await this.hasAnyGrade(user.id, [
        ShepherdGrade.SUPERIOR,
        ShepherdGrade.ELDER
      ]);

      if (!hasRight) throw new Error('Insufficient permissions');

      const { error } = await supabase
        .from('parishes')
        .update({
          validated: approved,
          updated_at: new Date().toISOString()
        })
        .eq('id', parishId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error validating parish:', error);
      return false;
    }
  }

  // ============================================
  // STATISTIQUES ET DASHBOARD
  // ============================================

  // Obtenir les statistiques d’une paroisse (pour Leader)
  async getParishStats(parishId: string): Promise<{
    membersCount: number;
    postsCount: number;
    eventsCount: number;
    offeringsTotal: number;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Vérifier que l’utilisateur est le Leader de cette paroisse
      const { data: parish, error: parishError } = await supabase
        .from('parishes')
        .select('leader_shepherd_id')
        .eq('id', parishId)
        .single();

      if (parishError) throw parishError;
      if (parish.leader_shepherd_id !== user.id) {
        throw new Error('Not authorized to view these statistics');
      }

      // Compter les membres
      const { count: membersCount, error: membersError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('parish_id', parishId);

      if (membersError) throw membersError;

      // Compter les posts
      const { count: postsCount, error: postsError } = await supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .contains('parish_ids', [parishId]);

      if (postsError) throw postsError;

      // Compter les activités
      const { count: eventsCount, error: eventsError } = await supabase
        .from('activities')
        .select('id', { count: 'exact', head: true })
        .eq('parish_id', parishId);

      if (eventsError) throw eventsError;

      // Total des offrandes (simplifié)
      const offeringsTotal = 0; // À implémenter avec table donations

      return {
        membersCount: membersCount || 0,
        postsCount: postsCount || 0,
        eventsCount: eventsCount || 0,
        offeringsTotal
      };
    } catch (error) {
      console.error('Error getting parish stats:', error);
      return { membersCount: 0, postsCount: 0, eventsCount: 0, offeringsTotal: 0 };
    }
  }

  // ============================================
  // GESTION DES POINTS SPIRITUELS
  // ============================================

  // Ajouter des points spirituels à un utilisateur
  async addSpiritualPoints(userId: string, points: number, reason: string): Promise<boolean> {
    try {
      // Récupérer les points actuels
      const { data: user, error: fetchError } = await supabase
        .from('profiles')
        .select('spiritual_points')
        .eq('id', userId)
        .single();

      if (fetchError) throw fetchError;

      const newPoints = (user.spiritual_points || 0) + points;

      const { error } = await supabase
        .from('profiles')
        .update({
          spiritual_points: newPoints,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      // Logger l’événement (optionnel)
      console.log(`Added ${points} points to ${userId} for: ${reason}`);

      return true;
    } catch (error) {
      console.error('Error adding spiritual points:', error);
      return false;
    }
  }

  // Récupérer le classement spirituel
  async getSpiritualRanking(limit: number = 100): Promise<ShepherdProfile[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url, spiritual_points, level')
        .order('spiritual_points', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as ShepherdProfile[];
    } catch (error) {
      console.error('Error fetching spiritual ranking:', error);
      return [];
    }
  }
}

export const shepherdService = new ShepherdService();