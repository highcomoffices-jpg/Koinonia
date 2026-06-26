import React, { useState, useEffect } from 'react';
import { Gift, TrendingUp, Loader2, Eye, Calendar, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface Offering {
  id: string;
  donor_id: string;
  donor_name: string;
  amount: number;
  currency: string;
  message: string | null;
  created_at: string;
}

export const ParishOfferingsPanel: React.FC = () => {
  const { user } = useAuth();
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('month');

  useEffect(() => {
    loadOfferings();
  }, [user, period]);

  const loadOfferings = async () => {
    if (!user?.parish?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      let startDate: Date | null = null;
      const now = new Date();

      if (period === 'week') {
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
      } else if (period === 'month') {
        startDate = new Date(now);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
      }

      let query = supabase
        .from('donations')
        .select(`
          id,
          donor_id,
          amount,
          currency,
          message,
          created_at,
          donor:profiles!donor_id(
            first_name,
            last_name
          )
        `)
        .eq('status', 'completed');

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedOfferings: Offering[] = (data || []).map((d: any) => ({
        id: d.id,
        donor_id: d.donor_id,
        donor_name: d.donor ? `${d.donor.first_name} ${d.donor.last_name}` : 'Anonyme',
        amount: d.amount,
        currency: d.currency || 'XOF',
        message: d.message,
        created_at: d.created_at,
      }));

      setOfferings(formattedOfferings);
      setTotalAmount(formattedOfferings.reduce((sum, o) => sum + o.amount, 0));
    } catch (error) {
      console.error('Error loading offerings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
    return num.toString();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!user?.parish?.id) {
    return (
      <Card className="text-center py-8">
        <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Vous n'êtes affilié à aucune paroisse.</p>
        <p className="text-sm text-gray-500 mt-2">Rejoignez une paroisse pour voir les offrandes.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Offrandes paroissiales
          </h2>
          <p className="text-sm text-gray-500">Gestion des dons et offrandes</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod('week')}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              period === 'week' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            7 jours
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              period === 'month' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Ce mois
          </button>
          <button
            onClick={() => setPeriod('all')}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              period === 'all' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Tout
          </button>
        </div>
      </div>

      {/* Total card */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <div className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-green-700">Total des offrandes</p>
            <p className="text-3xl font-bold text-green-800">{formatNumber(totalAmount)} FCFA</p>
            <p className="text-xs text-green-600 mt-1">
              {offerings.length} don{offerings.length > 1 ? 's' : ''} reçu{offerings.length > 1 ? 's' : ''}
            </p>
          </div>
          <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-green-700" />
          </div>
        </div>
      </Card>

      {/* List of offerings */}
      {offerings.length === 0 ? (
        <Card className="text-center py-8">
          <Gift className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Aucune offrande pour cette période</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {offerings.map((offering) => (
            <Card key={offering.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{offering.donor_name}</span>
                    <span className="text-xs text-gray-400">{new Date(offering.created_at).toLocaleDateString()}</span>
                  </div>
                  {offering.message && (
                    <p className="text-sm text-gray-500 mt-1">{offering.message}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">{offering.amount.toLocaleString()} FCFA</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};