import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Users, Calendar, Shield, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { shepherdService } from '../../services/shepherdService';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

export const FinanceDashboard: React.FC = () => {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOfferings: 0,
    monthlyOfferings: 0,
    weeklyOfferings: 0,
    totalDonors: 0
  });

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setHasAccess(false);
        setIsLoading(false);
        return;
      }

      const canAccess = await shepherdService.hasAnyGrade(user.id, ['leader', 'superior', 'elder']);
      setHasAccess(canAccess);
      
      if (canAccess) {
        // Charger les statistiques financières
        // TODO: Remplacer par des appels API réels
        setStats({
          totalOfferings: 1250000,
          monthlyOfferings: 342000,
          weeklyOfferings: 87500,
          totalDonors: 45
        });
      }
      setIsLoading(false);
    };

    checkAccess();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <Card className="text-center py-12">
        <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Accès restreint</h3>
        <p className="text-gray-600">
          Seuls les Leaders, Supérieurs et Anciens peuvent accéder aux informations financières.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Tableau de bord financier</h2>
        <p className="text-gray-600 mt-2">
          Vue d'ensemble des offrandes et contributions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card padding="sm" className="text-center">
          <DollarSign className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {stats.totalOfferings.toLocaleString()} FCFA
          </div>
          <div className="text-sm text-gray-600">Total des offrandes</div>
        </Card>

        <Card padding="sm" className="text-center">
          <TrendingUp className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {stats.monthlyOfferings.toLocaleString()} FCFA
          </div>
          <div className="text-sm text-gray-600">Ce mois</div>
        </Card>

        <Card padding="sm" className="text-center">
          <Calendar className="w-8 h-8 text-purple-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">
            {stats.weeklyOfferings.toLocaleString()} FCFA
          </div>
          <div className="text-sm text-gray-600">Cette semaine</div>
        </Card>

        <Card padding="sm" className="text-center">
          <Users className="w-8 h-8 text-orange-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900">{stats.totalDonors}</div>
          <div className="text-sm text-gray-600">Donateurs uniques</div>
        </Card>
      </div>

      <Card className="text-center py-6">
        <p className="text-gray-500">
          Les fonctionnalités détaillées de gestion financière seront disponibles prochainement.
        </p>
        <Button variant="outline" className="mt-3">
          Exporter les rapports
        </Button>
      </Card>
    </div>
  );
};