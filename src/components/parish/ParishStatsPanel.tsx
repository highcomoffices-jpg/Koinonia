import React, { useState, useEffect } from 'react';
import { Users, FileText, Calendar, DollarSign, Loader2, TrendingUp, UserCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../ui/Card';

export const ParishStatsPanel: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    membersCount: 0,
    postsCount: 0,
    eventsCount: 0,
    offeringsTotal: 0,
    newMembersThisMonth: 0,
    activeMembers: 0,
  });

  useEffect(() => {
    loadStats();
  }, [user]);

  const loadStats = async () => {
    if (!user?.parish?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const parishId = user.parish.id;

      // Membres
      const { count: membersCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('parish_id', parishId);

      // Posts
      const { count: postsCount } = await supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .contains('parish_ids', [parishId]);

      // Événements
      const { count: eventsCount } = await supabase
        .from('activities')
        .select('id', { count: 'exact', head: true })
        .eq('parish_id', parishId);

      // Nouveaux membres ce mois
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);

      const { count: newMembers } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('parish_id', parishId)
        .gte('created_at', firstDayOfMonth.toISOString());

      // Membres actifs (ayant posté au moins une fois)
      const { data: activeMembersData } = await supabase
        .from('posts')
        .select('author_id')
        .contains('parish_ids', [parishId])
        .gte('created_at', firstDayOfMonth.toISOString());

      const uniqueAuthors = new Set(activeMembersData?.map(p => p.author_id) || []);

      setStats({
        membersCount: membersCount || 0,
        postsCount: postsCount || 0,
        eventsCount: eventsCount || 0,
        offeringsTotal: 0, // À implémenter avec table donations
        newMembersThisMonth: newMembers || 0,
        activeMembers: uniqueAuthors.size,
      });
    } catch (error) {
      console.error('Error loading parish stats:', error);
    } finally {
      setIsLoading(false);
    }
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
        <Church className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Vous n'êtes affilié à aucune paroisse.</p>
        <p className="text-sm text-gray-500 mt-2">Rejoignez une paroisse pour voir les statistiques.</p>
      </Card>
    );
  }

  const statCards = [
    { label: 'Membres', value: stats.membersCount, icon: Users, color: 'blue' },
    { label: 'Publications', value: stats.postsCount, icon: FileText, color: 'green' },
    { label: 'Événements', value: stats.eventsCount, icon: Calendar, color: 'purple' },
    { label: 'Nouveaux (mois)', value: stats.newMembersThisMonth, icon: UserCheck, color: 'yellow' },
    { label: 'Membres actifs', value: stats.activeMembers, icon: TrendingUp, color: 'orange' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Statistiques paroissiales</h2>
        <p className="text-sm text-gray-500">Vue d'ensemble de l'activité de votre paroisse</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const colorClasses = {
            blue: 'bg-blue-100 text-blue-600',
            green: 'bg-green-100 text-green-600',
            purple: 'bg-purple-100 text-purple-600',
            yellow: 'bg-yellow-100 text-yellow-600',
            orange: 'bg-orange-100 text-orange-600',
          };
          return (
            <Card key={stat.label} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Section paroisse */}
      <Card className="p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Informations paroissiales</h3>
        <div className="space-y-2">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Nom</span>
            <span className="font-medium text-gray-900">{user.parish?.name}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Ville</span>
            <span className="font-medium text-gray-900">{user.parish?.city_name || 'Non renseignée'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Confession</span>
            <span className="font-medium text-gray-900">{user.parish?.confession_name || 'Non renseignée'}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-600">Validée</span>
            <span className={`font-medium ${user.parish?.validated ? 'text-green-600' : 'text-yellow-600'}`}>
              {user.parish?.validated ? 'Oui' : 'En attente'}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};