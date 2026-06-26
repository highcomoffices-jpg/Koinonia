import { supabase } from '../lib/supabase';
import { moderationService } from './moderationService';

export interface ReportData {
  contentId: string;
  reason: string;
  details?: string;
  reportedWord?: string;
  context?: string;
}

class ReportService {
  // Créer un signalement avec extraction automatique du mot
  async createReport(data: ReportData): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Créer le signalement
      const { data: report, error } = await supabase
        .from('reports')
        .insert({
          content_id: data.contentId,
          reporter_id: user.id,
          reason: data.reason,
          details: data.details,
          reported_word: data.reportedWord,
          context: data.context,
          auto_extracted: !!data.reportedWord,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Si un mot a été signalé, l'ajouter aux mots signalés
      if (data.reportedWord && report) {
        await moderationService.addReportedWord(report.id, data.reportedWord, data.context);
      }

      return true;
    } catch (error) {
      console.error('Error creating report:', error);
      return false;
    }
  }

  // Récupérer les signalements pour un contenu spécifique
  async getReportsForContent(contentId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('content_id', contentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching reports for content:', error);
      return [];
    }
  }

  // Compter les signalements pour un contenu
  async countReportsForContent(contentId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('content_id', contentId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error counting reports:', error);
      return 0;
    }
  }

  // Vérifier si l'utilisateur a déjà signalé un contenu
  async hasUserReported(contentId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('reports')
        .select('id')
        .eq('content_id', contentId)
        .eq('reporter_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking user report:', error);
      return false;
    }
  }
}

export const reportService = new ReportService();