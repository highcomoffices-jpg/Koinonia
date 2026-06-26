import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type OrganizationRow = Database['public']['Tables']['organizations']['Row'];

export interface Organization extends OrganizationRow {}

class OrganizationService {
  // Récupérer toutes les organisations
  async getOrganizations(options?: {
    type?: 'charity' | 'church' | 'ministry';
    isVerified?: boolean;
    limit?: number;
  }): Promise<Organization[]> {
    try {
      let query = supabase
        .from('organizations')
        .select('*')
        .order('name', { ascending: true });

      if (options?.type) {
        query = query.eq('type', options.type);
      }

      if (options?.isVerified !== undefined) {
        query = query.eq('is_verified', options.isVerified);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching organizations:', error);
      return [];
    }
  }

  // Récupérer une organisation par son ID
  async getOrganizationById(id: string): Promise<Organization | null> {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching organization:', error);
      return null;
    }
  }

  // Incrémenter le montant total reçu
  async incrementTotalReceived(organizationId: string, amount: number): Promise<void> {
    try {
      await supabase.rpc('increment_organization_total', {
        org_id: organizationId,
        increment_amount: amount
      });
    } catch (error) {
      console.error('Error incrementing organization total:', error);
    }
  }
}

// Fonction SQL auxiliaire (à exécuter dans Supabase)
/*
CREATE OR REPLACE FUNCTION increment_organization_total(org_id uuid, increment_amount numeric)
RETURNS void AS $$
BEGIN
  UPDATE organizations SET total_received = COALESCE(total_received, 0) + increment_amount WHERE id = org_id;
END;
$$ LANGUAGE plpgsql;
*/

export const organizationService = new OrganizationService();