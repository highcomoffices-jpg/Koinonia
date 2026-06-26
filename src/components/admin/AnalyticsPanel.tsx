import React, { useState, useEffect } from 'react';
import { BarChart3, Users, FileText, Flag, TrendingUp, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card } from '../ui/Card';

interface AnalyticsData {
  totalUsers: number;
  totalPosts: number;
  totalReports: number;
  totalParishes: number;
  usersByRole: Record<string, number>;
  postsByDay: { date: string; count: number }[];
}

export const AnalyticsPanel: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      // Total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Total posts
      const { count: totalPosts } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true });

      // Total reports
      const { count: totalReports } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true });

      // Total parishes
      const { count: totalParishes } = await supabase
        .from('parishes')
        .select('*', { count: 'exact', head: true })
        .eq('validated', true);

      // Users by role
      const { data: usersByRoleData } = await supabase
        .from('profiles')
        .select('role');
      
      const usersByRole: Record<string, number> = {};
      usersByRoleData?.forEach(u => {
        const role = u.role || 'unknown';
        usersByRole[role] = (usersByRole[role] || 0) + 1;
      });

      // Posts by last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: postsByDayData } = await supabase
        .from('posts')
        .select('created_at')
        .gte('created_at', sevenDaysAgo.toISOString());

      const postsByDay: Record<string, number> = {};
      postsByDayData?.forEach(p => {
        const date = new Date(p.created_at).toLocaleDateString();
        postsByDay[date] = (postsByDay[date] || 0) + 1;
      });

      setData({
        totalUsers: totalUsers || 0,
        totalPosts: totalPosts || 0,
        totalReports: totalReports || 0,
        totalParishes: totalParishes || 0,
        usersByRole,
        postsByDay: Object.entries(postsByDay).map(([date, count]) => ({ date, count })),
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const stats = [
    { label: 'Utilisateurs', value: data?.totalUsers || 0, icon: Users, color: 'blue' },
    { label: 'Publications', value: data?.totalPosts || 0, icon: FileText, color: 'green' },
    { label: 'Signalements', value: data?.totalReports || 0, icon: Flag, color: 'yellow' },
    { label: 'Paroisses', value: data?.totalParishes || 0, icon: TrendingUp, color: 'purple' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Analytics Koinonia
        </h2>
        <p className="text-sm text-gray-500">Statistiques globales de la plateforme</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const colorClasses = {
            blue: 'bg-blue-100 text-blue-600',
            green: 'bg-green-100 text-green-600',
            yellow: 'bg-yellow-100 text-yellow-600',
            purple: 'bg-purple-100 text-purple-600',
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

      {/* Users by role */}
      <Card className="p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Répartition par rôle</h3>
        <div className="space-y-2">
          {Object.entries(data?.usersByRole || {}).map(([role, count]) => (
            <div key={role} className="flex items-center justify-between">
              <span className="text-sm text-gray-600 capitalize">{role}</span>
              <div className="flex items-center gap-2">
                <div className="w-48 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${(count / (data?.totalUsers || 1)) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700">{count}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Posts per day */}
      <Card className="p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Publications des 7 derniers jours</h3>
        {data?.postsByDay.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Aucune donnée récente</p>
        ) : (
          <div className="space-y-2">
            {data?.postsByDay.map((item) => (
              <div key={item.date} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{item.date}</span>
                <div className="flex items-center gap-2">
                  <div className="w-48 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${Math.min(100, (item.count / 10) * 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};