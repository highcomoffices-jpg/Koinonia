import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Wallet, History, PieChart, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { supabase } from '../../lib/supabase';

interface GlobalFinanceStats {
  totalDonations: number;
  totalParishes: number;
  averageDonation: number;
  monthlyGrowth: number;
  donationsByMonth: { month: string; amount: number }[];
}

export const KoinoniaFinancePanel: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<GlobalFinanceStats>({
    totalDonations: 0,
    totalParishes: 0,
    averageDonation: 0,
    monthlyGrowth: 0,
    donationsByMonth: [],
  });

  useEffect(() => {
    loadGlobalStats();
  }, []);

  const loadGlobalStats = async () => {
    setIsLoading(true);
    try {
      // Total des dons
      const { data: donations, error: donationsError } = await supabase
        .from('donations')
        .select('amount, created_at')
        .eq('status', 'completed');

      if (donationsError) throw donationsError;

      const totalDonations = (donations || []).reduce((sum, d) => sum + d.amount, 0);
      const averageDonation = donations?.length ? totalDonations / donations.length : 0;

      // Nombre de paroisses
      const { count: totalParishes } = await supabase
        .from('parishes')
        .select('*', { count: 'exact', head: true })
        .eq('validated', true);

      // Dons par mois (derniers 6 mois)
      const now = new Date();
      const donationsByMonth: { month: string; amount: number }[] = [];
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(now.getMonth() - i);
        const monthName = date.toLocaleString('fr', { month: 'short' });
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const monthlyDonations = (donations || []).filter(d => {
          const donationDate = new Date(d.created_at);
          return donationDate >= monthStart && donationDate <= monthEnd;
        }).reduce((sum, d) => sum + d.amount, 0);
        
        donationsByMonth.push({ month: monthName, amount: monthlyDonations });
      }

      // Croissance mensuelle
      const currentMonth = donationsByMonth[donationsByMonth.length - 1]?.amount || 0;
      const previousMonth = donationsByMonth[donationsByMonth.length - 2]?.amount || 0;
      const monthlyGrowth = previousMonth > 0 ? ((currentMonth - previousMonth) / previousMonth) * 100 : 0;

      setStats({
        totalDonations,
        totalParishes: totalParishes || 0,
        averageDonation,
        monthlyGrowth,
        donationsByMonth,
      });
    } catch (error) {
      console.error('Error loading global stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <div className="h-24 bg-gray-200 rounded"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Finances globales
        </h2>
        <p className="text-sm text-gray-500">Statistiques financières de la plateforme</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total des dons</p>
              <p className="text-2xl font-bold text-green-600">{formatAmount(stats.totalDonations)}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Paroisses actives</p>
              <p className="text-2xl font-bold text-blue-600">{stats.totalParishes}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Wallet className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Don moyen</p>
              <p className="text-2xl font-bold text-purple-600">{formatAmount(stats.averageDonation)}</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <PieChart className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Croissance mensuelle</p>
              <div className="flex items-center gap-1">
                <p className="text-2xl font-bold text-gray-900">{stats.monthlyGrowth.toFixed(1)}%</p>
                {stats.monthlyGrowth >= 0 ? (
                  <ArrowUpRight className="w-5 h-5 text-green-600" />
                ) : (
                  <ArrowDownRight className="w-5 h-5 text-red-600" />
                )}
              </div>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Évolution des dons */}
      <Card className="p-4">
        <h3 className="font-semibold text-gray-900 mb-4">Évolution des dons (6 derniers mois)</h3>
        <div className="space-y-3">
          {stats.donationsByMonth.map((item, index) => (
            <div key={index}>
              <div className="flex justify-between text-sm mb-1">
                <span>{item.month}</span>
                <span className="font-medium">{formatAmount(item.amount)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 rounded-full h-2" 
                  style={{ width: `${Math.min(100, (item.amount / (stats.totalDonations || 1)) * 100)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};