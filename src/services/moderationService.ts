import { supabase } from '../lib/supabase';

export interface ForbiddenWord {
  id: string;
  word: string;
  category: string;
  severity: number;
  is_active: boolean;
  created_at: string;
}

export interface Report {
  id: string;
  content_id: string;
  reporter_id: string;
  reason: string;
  details?: string;
  reported_word?: string;
  context?: string;
  auto_extracted?: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'word_added';
  created_at: string;
}

class ModerationService {
  private readonly FORBIDDEN_WORDS_CACHE_KEY = 'forbidden_words_cache';
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private cachedWords: ForbiddenWord[] | null = null;
  private cacheTimestamp: number = 0;

  // ============================================
  // GESTION DES MOTS INTERDITS (FORBIDDEN WORDS)
  // ============================================

  // Récupérer tous les mots interdits actifs
  async getForbiddenWords(): Promise<ForbiddenWord[]> {
    // Vérifier le cache
    if (this.cachedWords && (Date.now() - this.cacheTimestamp) < this.CACHE_DURATION) {
      return this.cachedWords;
    }

    const { data, error } = await supabase
      .from('forbidden_words')
      .select('*')
      .eq('is_active', true)
      .order('word', { ascending: true });

    if (error) {
      console.error('Error fetching forbidden words:', error);
      return [];
    }

    this.cachedWords = data;
    this.cacheTimestamp = Date.now();
    return data;
  }

  // Récupérer tous les mots interdits (y compris inactifs) - pour admin
  async getAllForbiddenWords(): Promise<ForbiddenWord[]> {
    const { data, error } = await supabase
      .from('forbidden_words')
      .select('*')
      .order('word', { ascending: true });

    if (error) {
      console.error('Error fetching all forbidden words:', error);
      return [];
    }
    return data;
  }

  // Ajouter un mot interdit
  async addForbiddenWord(word: string, category: string, severity: number = 1): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('forbidden_words')
        .insert({
          word: word.toLowerCase().trim(),
          category,
          severity,
          created_by: user.id,
          is_active: true
        });

      if (error) throw error;
      
      // Invalider le cache
      this.cachedWords = null;
      return true;
    } catch (error) {
      console.error('Error adding forbidden word:', error);
      return false;
    }
  }

  // Mettre à jour un mot interdit
  async updateForbiddenWord(id: string, updates: { category?: string; severity?: number; is_active?: boolean }): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('forbidden_words')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      // Invalider le cache
      this.cachedWords = null;
      return true;
    } catch (error) {
      console.error('Error updating forbidden word:', error);
      return false;
    }
  }

  // Supprimer un mot interdit
  async deleteForbiddenWord(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('forbidden_words')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Invalider le cache
      this.cachedWords = null;
      return true;
    } catch (error) {
      console.error('Error deleting forbidden word:', error);
      return false;
    }
  }

  // Analyser un contenu avec la liste des mots interdits
  async moderateContent(content: string): Promise<{ isApproved: boolean; forbiddenWords: ForbiddenWord[]; message?: string }> {
    const forbiddenWords = await this.getForbiddenWords();
    const lowerContent = content.toLowerCase();
    const foundWords: ForbiddenWord[] = [];

    for (const word of forbiddenWords) {
      if (lowerContent.includes(word.word.toLowerCase())) {
        foundWords.push(word);
      }
    }

    if (foundWords.length > 0) {
      const highestSeverity = Math.max(...foundWords.map(w => w.severity));
      const categories = [...new Set(foundWords.map(w => w.category))];
      
      return {
        isApproved: false,
        forbiddenWords: foundWords,
        message: `Votre message contient des termes inappropriés (${categories.join(', ')}). Veuillez le modifier.`
      };
    }

    return { isApproved: true, forbiddenWords: [] };
  }

  // ============================================
  // GESTION DES SIGNALEMENTS (REPORTS)
  // ============================================

  // Créer un signalement
  async createReport(
    contentId: string,
    reason: string,
    details?: string,
    reportedWord?: string,
    context?: string
  ): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('reports')
        .insert({
          content_id: contentId,
          reporter_id: user.id,
          reason,
          details,
          reported_word: reportedWord,
          context,
          auto_extracted: !!reportedWord,
          status: 'pending'
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error creating report:', error);
      return false;
    }
  }

  // Récupérer tous les signalements (pour admin/berger)
  async getReports(status?: string): Promise<Report[]> {
    try {
      let query = supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching reports:', error);
      return [];
    }
  }

  // Mettre à jour le statut d'un signalement
  async updateReportStatus(reportId: string, status: 'approved' | 'rejected' | 'word_added'): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status })
        .eq('id', reportId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating report status:', error);
      return false;
    }
  }

  // ============================================
  // GESTION DES MOTS SIGNALÉS (REPORTED WORDS)
  // ============================================

  // Ajouter un mot signalé
  async addReportedWord(reportId: string, word: string, context?: string): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('add_reported_word', {
        p_report_id: reportId,
        p_word: word,
        p_context: context || null
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error adding reported word:', error);
      return false;
    }
  }

  // Récupérer les mots signalés en attente d'approbation
  async getPendingReportedWords(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('reported_words')
        .select(`
          *,
          report:reports(
            id,
            reason,
            reporter_id,
            content_id
          )
        `)
        .eq('is_approved', false)
        .order('occurrence_count', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching pending reported words:', error);
      return [];
    }
  }

  // Approuver un mot signalé (l'ajouter aux mots interdits)
  async approveReportedWord(reportedWordId: string, word: string, category: string, severity: number): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Ajouter aux mots interdits
      const wordAdded = await this.addForbiddenWord(word, category, severity);
      if (!wordAdded) return false;

      // Marquer le mot signalé comme approuvé
      const { error } = await supabase
        .from('reported_words')
        .update({
          is_approved: true,
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', reportedWordId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error approving reported word:', error);
      return false;
    }
  }

  // Rejeter un mot signalé
  async rejectReportedWord(reportedWordId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('reported_words')
        .delete()
        .eq('id', reportedWordId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error rejecting reported word:', error);
      return false;
    }
  }
}

export const moderationService = new ModerationService();