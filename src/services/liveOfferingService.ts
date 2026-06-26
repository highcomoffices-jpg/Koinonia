import { supabase } from '../lib/supabase';

export interface LiveOffering {
  id: string;
  live_id: string;
  donor_id: string;
  amount: number;
  currency: 'XOF' | 'USD' | 'EUR';
  payment_method: 'mobile_money' | 'card' | 'stripe';
  is_anonymous: boolean;
  message: string | null;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transaction_id: string | null;
  created_at: string;
}

class LiveOfferingService {
  // Créer une offrande
  async createOffering(data: {
    live_id: string;
    amount: number;
    payment_method: 'mobile_money' | 'card' | 'stripe';
    is_anonymous?: boolean;
    message?: string;
  }): Promise<LiveOffering | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: offering, error } = await supabase
        .from('live_offerings')
        .insert({
          live_id: data.live_id,
          donor_id: user.id,
          amount: data.amount,
          currency: 'XOF',
          payment_method: data.payment_method,
          is_anonymous: data.is_anonymous || false,
          message: data.message || null,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return offering;
    } catch (error) {
      console.error('Error creating offering:', error);
      return null;
    }
  }

  // Mettre à jour le statut de l'offrande (après paiement)
  async updateOfferingStatus(offeringId: string, status: LiveOffering['status'], transactionId?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('live_offerings')
        .update({
          status,
          transaction_id: transactionId || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', offeringId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating offering status:', error);
      return false;
    }
  }

  // Récupérer le total des offrandes pour un live
  async getTotalOfferings(liveId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('live_offerings')
        .select('amount')
        .eq('live_id', liveId)
        .eq('status', 'completed');

      if (error) throw error;
      return data?.reduce((sum, item) => sum + item.amount, 0) || 0;
    } catch (error) {
      console.error('Error getting total offerings:', error);
      return 0;
    }
  }

  // Récupérer les offrandes d'un live (pour l'organisateur)
  async getLiveOfferings(liveId: string): Promise<LiveOffering[]> {
    try {
      const { data, error } = await supabase
        .from('live_offerings')
        .select('*, donor:profiles(first_name, last_name)')
        .eq('live_id', liveId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching offerings:', error);
      return [];
    }
  }
}

export const liveOfferingService = new LiveOfferingService();