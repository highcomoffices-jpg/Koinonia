import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Calendar, Download, Eye, Wallet, History, PieChart, ArrowUpRight, ArrowDownRight, Plus } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface FinanceStats {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyChange: number;
}

interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'cancelled';
}

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
}

const expenseCategories = [
  'Charité', 'Équipement', 'Entretien', 'Électricité', 'Eau', 
  'Communication', 'Transport', 'Événement', 'Salaires', 'Autre'
];

export const ParishFinancePanel: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [stats, setStats] = useState<FinanceStats>({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    monthlyChange: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [newExpense, setNewExpense] = useState({
    amount: 0,
    category: 'Autre',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parishId = user?.parish?.id;

  useEffect(() => {
    if (parishId) {
      loadFinanceData();
    }
  }, [period, parishId]);

  const loadFinanceData = async () => {
    if (!parishId) return;
    
    setIsLoading(true);
    try {
      // Calculer les dates
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case 'week':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          break;
        case 'year':
          startDate = new Date(now);
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate = new Date(now);
          startDate.setDate(1);
          startDate.setHours(0, 0, 0, 0);
      }

      const startDateStr = startDate.toISOString();
      const currentMonthStart = new Date(now);
      currentMonthStart.setDate(1);
      currentMonthStart.setHours(0, 0, 0, 0);
      const previousMonthStart = new Date(currentMonthStart);
      previousMonthStart.setMonth(previousMonthStart.getMonth() - 1);

      // 1. Récupérer les offrandes (revenus)
      const { data: offerings, error: offeringsError } = await supabase
        .from('donations')
        .select('amount, created_at')
        .eq('status', 'completed')
        .gte('created_at', startDateStr);

      if (offeringsError) throw offeringsError;

      // 2. Récupérer les dépenses
      const { data: expensesData, error: expensesError } = await supabase
        .from('parish_expenses')
        .select('*')
        .eq('parish_id', parishId)
        .gte('date', startDateStr)
        .order('date', { ascending: false });

      if (expensesError) throw expensesError;

      setExpenses(expensesData || []);

      // Calculer les totaux
      const totalIncome = (offerings || []).reduce((sum, d) => sum + d.amount, 0);
      const totalExpenses = (expensesData || []).reduce((sum, e) => sum + e.amount, 0);
      const balance = totalIncome - totalExpenses;

      // Calcul mensuel
      const monthlyIncome = (offerings || []).filter(d => 
        new Date(d.created_at) >= currentMonthStart
      ).reduce((sum, d) => sum + d.amount, 0);
      
      const monthlyExpenses = (expensesData || []).filter(e => 
        new Date(e.date) >= currentMonthStart
      ).reduce((sum, e) => sum + e.amount, 0);

      // Calcul évolution mensuelle
      const previousMonthlyIncome = (offerings || []).filter(d => 
        new Date(d.created_at) >= previousMonthStart && new Date(d.created_at) < currentMonthStart
      ).reduce((sum, d) => sum + d.amount, 0);
      
      const monthlyChange = previousMonthlyIncome > 0 
        ? ((monthlyIncome - previousMonthlyIncome) / previousMonthlyIncome) * 100 
        : monthlyIncome > 0 ? 100 : 0;

      setStats({
        totalIncome,
        totalExpenses,
        balance,
        monthlyIncome,
        monthlyExpenses,
        monthlyChange,
      });

      // Formater les transactions récentes
      const incomeTransactions: Transaction[] = (offerings || []).slice(0, 5).map(o => ({
        id: o.id,
        amount: o.amount,
        type: 'income',
        category: 'Offrande',
        description: 'Don reçu',
        date: new Date(o.created_at).toISOString().split('T')[0],
        status: 'completed',
      }));

      const expenseTransactions: Transaction[] = (expensesData || []).slice(0, 5).map(e => ({
        id: e.id,
        amount: e.amount,
        type: 'expense',
        category: e.category,
        description: e.description || e.category,
        date: new Date(e.date).toISOString().split('T')[0],
        status: 'completed',
      }));

      const allTransactions = [...incomeTransactions, ...expenseTransactions]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 10);

      setRecentTransactions(allTransactions);
    } catch (error) {
      console.error('Error loading finance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddExpense = async () => {
    if (!parishId || newExpense.amount <= 0) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('parish_expenses')
        .insert({
          parish_id: parishId,
          amount: newExpense.amount,
          category: newExpense.category,
          description: newExpense.description,
          date: new Date().toISOString(),
          created_by: user?.id,
        });

      if (error) throw error;

      setIsExpenseModalOpen(false);
      setNewExpense({ amount: 0, category: 'Autre', description: '' });
      await loadFinanceData();
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Erreur lors de l\'ajout de la dépense');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (!parishId) {
    return (
      <Card className="text-center py-8">
        <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Vous n'êtes affilié à aucune paroisse.</p>
        <p className="text-sm text-gray-500 mt-2">Rejoignez une paroisse pour voir les finances.</p>
      </Card>
    );
  }

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
        <Card className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded"></div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques financières */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total des revenus</p>
              <p className="text-2xl font-bold text-green-600">{formatAmount(stats.totalIncome)}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total des dépenses</p>
              <p className="text-2xl font-bold text-red-600">{formatAmount(stats.totalExpenses)}</p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Solde actuel</p>
              <p className="text-2xl font-bold text-blue-600">{formatAmount(stats.balance)}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Wallet className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Évolution mensuelle</p>
              <div className="flex items-center gap-1">
                <p className="text-2xl font-bold text-gray-900">{stats.monthlyChange.toFixed(1)}%</p>
                {stats.monthlyChange >= 0 ? (
                  <ArrowUpRight className="w-5 h-5 text-green-600" />
                ) : (
                  <ArrowDownRight className="w-5 h-5 text-red-600" />
                )}
              </div>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <PieChart className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Graphique et répartition */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Répartition mensuelle</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Revenus</span>
                <span className="font-medium">{formatAmount(stats.monthlyIncome)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 rounded-full h-2" 
                  style={{ width: `${(stats.monthlyIncome / (stats.monthlyIncome + stats.monthlyExpenses || 1)) * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Dépenses</span>
                <span className="font-medium">{formatAmount(stats.monthlyExpenses)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-500 rounded-full h-2" 
                  style={{ width: `${(stats.monthlyExpenses / (stats.monthlyIncome + stats.monthlyExpenses || 1)) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Actions rapides</h3>
            <div className="flex gap-2">
              <Button 
                variant="primary" 
                size="sm" 
                icon={Plus}
                onClick={() => setIsExpenseModalOpen(true)}
              >
                Ajouter dépense
              </Button>
              <button className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors">
                <Download className="w-4 h-4 inline mr-1" />
                Exporter
              </button>
            </div>
          </div>
          <div className="text-center py-6">
            <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Gestion complète des finances</p>
            <p className="text-sm text-gray-400">Suivez les dîmes, offrandes et dépenses</p>
          </div>
        </Card>
      </div>

      {/* Transactions récentes */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <History className="w-5 h-5" />
            Transactions récentes
          </h3>
          <div className="flex gap-2">
            <button 
              onClick={() => setPeriod('week')}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${period === 'week' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              Semaine
            </button>
            <button 
              onClick={() => setPeriod('month')}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${period === 'month' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              Mois
            </button>
            <button 
              onClick={() => setPeriod('year')}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${period === 'year' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              Année
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="text-left py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Catégorie</th>
                <th className="text-right py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                <th className="text-center py-3 px-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map((transaction) => (
                <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-2 text-sm text-gray-600">{transaction.date}</td>
                  <td className="py-3 px-2 text-sm text-gray-900">{transaction.description}</td>
                  <td className="py-3 px-2 text-sm text-gray-600">{transaction.category}</td>
                  <td className={`py-3 px-2 text-sm font-medium text-right ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.type === 'income' ? '+' : '-'} {formatAmount(transaction.amount)}
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusBadge(transaction.status)}`}>
                      {transaction.status === 'completed' ? 'Complété' : transaction.status === 'pending' ? 'En attente' : 'Annulé'}
                    </span>
                  </td>
                </tr>
              ))}
              {recentTransactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    Aucune transaction trouvée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal d'ajout de dépense */}
      <Modal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        title="Ajouter une dépense"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Montant (FCFA)</label>
            <Input
              type="number"
              value={newExpense.amount}
              onChange={(e) => setNewExpense(prev => ({ ...prev, amount: parseInt(e.target.value) || 0 }))}
              placeholder="0"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
            <Select
              value={newExpense.category}
              onChange={(e) => setNewExpense(prev => ({ ...prev, category: e.target.value }))}
              options={expenseCategories.map(c => ({ value: c, label: c }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={newExpense.description}
              onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Description de la dépense..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsExpenseModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="primary" onClick={handleAddExpense} loading={isSubmitting}>
              Ajouter
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};