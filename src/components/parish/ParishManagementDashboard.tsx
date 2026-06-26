import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Church, UserCheck, Building2, Flag, BarChart3, Gift, DollarSign, Eye, TrendingUp, Wallet, History } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ValidateCreatorModal } from './ValidateCreatorModal';
import { ValidateParishModal } from './ValidateParishModal';
import { ParishReportsPanel } from './ParishReportsPanel';
import { ParishStatsPanel } from './ParishStatsPanel';
import { ParishOfferingsPanel } from './ParishOfferingsPanel';
import { ParishFinancePanel } from './ParishFinancePanel';

type TabType = 'creators' | 'parishes' | 'reports' | 'stats' | 'offerings' | 'finance';

export const ParishManagementDashboard: React.FC = () => {
  const { user, isShepherd } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('creators');
  const [isCreatorModalOpen, setIsCreatorModalOpen] = useState(false);
  const [isParishModalOpen, setIsParishModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const canValidateParishes = user?.shepherdGrade === 'superior' || user?.shepherdGrade === 'elder';
  const canViewFinance = user?.shepherdGrade === 'leader' || user?.shepherdGrade === 'superior' || user?.shepherdGrade === 'elder';

  if (!isShepherd) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Card className="text-center py-12">
          <Church className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Accès restreint</h2>
          <p className="text-gray-600">
            Vous n'avez pas les droits pour accéder à la gestion de l'église.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Cette fonctionnalité est réservée aux bergers (Leader, Supérieur, Ancien).
          </p>
        </Card>
      </div>
    );
  }

  const tabs = [
    { id: 'creators' as TabType, label: 'Vignerons', icon: UserCheck, description: 'Valider les demandes de certification' },
    { id: 'parishes' as TabType, label: 'Paroisses', icon: Building2, description: 'Valider les nouvelles paroisses', restricted: !canValidateParishes },
    { id: 'reports' as TabType, label: 'Signalements', icon: Flag, description: 'Gérer les signalements locaux' },
    { id: 'stats' as TabType, label: 'Statistiques', icon: BarChart3, description: 'Voir les statistiques de la paroisse' },
    { id: 'offerings' as TabType, label: 'Offrandes', icon: Gift, description: 'Gérer les offrandes paroissiales' },
    { id: 'finance' as TabType, label: 'Finances', icon: DollarSign, description: 'Gérer les finances de la paroisse', restricted: !canViewFinance },
  ];

  const visibleTabs = tabs.filter(tab => !tab.restricted);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'creators':
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Validation des vignerons</h2>
              <Button variant="primary" onClick={() => setIsCreatorModalOpen(true)}>
                Voir les demandes
              </Button>
            </div>
            <Card className="p-6 text-center text-gray-500">
              <UserCheck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Cliquez sur "Voir les demandes" pour gérer les certifications de vignerons.</p>
            </Card>
            <ValidateCreatorModal
              isOpen={isCreatorModalOpen}
              onClose={() => setIsCreatorModalOpen(false)}
              onSuccess={handleRefresh}
            />
          </div>
        );
      
      case 'parishes':
        if (!canValidateParishes) return null;
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Validation des paroisses</h2>
              <Button variant="primary" onClick={() => setIsParishModalOpen(true)}>
                Voir les demandes
              </Button>
            </div>
            <Card className="p-6 text-center text-gray-500">
              <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Cliquez sur "Voir les demandes" pour valider les nouvelles paroisses.</p>
            </Card>
            <ValidateParishModal
              isOpen={isParishModalOpen}
              onClose={() => setIsParishModalOpen(false)}
              onSuccess={handleRefresh}
            />
          </div>
        );
      
      case 'reports':
        return <ParishReportsPanel key={refreshKey} />;
      
      case 'stats':
        return <ParishStatsPanel key={refreshKey} />;
      
      case 'offerings':
        return <ParishOfferingsPanel key={refreshKey} />;
      
      case 'finance':
        return <ParishFinancePanel key={refreshKey} />;
      
      default:
        return null;
    }
  };

  // Obtenir le grade en français
  const getGradeLabel = () => {
    switch (user?.shepherdGrade) {
      case 'leader': return 'Leader';
      case 'superior': return 'Supérieur';
      case 'elder': return 'Ancien';
      default: return 'Berger';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Church className="w-6 h-6 text-green-600" />
          <h1 className="text-2xl font-bold text-gray-900">Gestion de l'Église</h1>
          <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
            PAROISSIAL
          </span>
          <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
            {getGradeLabel()}
          </span>
        </div>
        <p className="text-gray-600">Gestion de votre paroisse et de ses membres</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-2">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-green-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="mt-6">
        {renderTabContent()}
      </div>
    </div>
  );
};