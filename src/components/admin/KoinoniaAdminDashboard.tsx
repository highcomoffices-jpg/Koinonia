import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Shield, Settings, Ban, FileText, Flag, BarChart3, Eye, DollarSign } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { SettingsPanel } from './SettingsPanel';
import { ForbiddenWordsManager } from './ForbiddenWordsManager';
import { AuditLogsPanel } from './AuditLogsPanel';
import { GlobalReportsPanel } from './GlobalReportsPanel';
import { AnalyticsPanel } from './AnalyticsPanel';
import { KoinoniaFinancePanel } from './KoinoniaFinancePanel';

type TabType = 'settings' | 'forbidden-words' | 'reports' | 'finance' | 'audit-logs' | 'analytics';

export const KoinoniaAdminDashboard: React.FC = () => {
  const { user, isSuperAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('settings');

  if (!isSuperAdmin) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Card className="text-center py-12">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Accès restreint</h2>
          <p className="text-gray-600">
            Vous n'avez pas les droits pour accéder à l'administration Koinonia.
          </p>
        </Card>
      </div>
    );
  }

  const tabs = [
    { id: 'settings' as TabType, label: 'Configuration', icon: Settings, badge: 'PLATEFORME' },
    { id: 'forbidden-words' as TabType, label: 'Mots interdits', icon: Ban, badge: 'PLATEFORME' },
    { id: 'reports' as TabType, label: 'Signalements', icon: Flag, badge: 'GLOBAL' },
    { id: 'finance' as TabType, label: 'Finances', icon: DollarSign, badge: 'GLOBAL' },
    { id: 'audit-logs' as TabType, label: 'Audit logs', icon: FileText, badge: 'SECURITE' },
    { id: 'analytics' as TabType, label: 'Analytics', icon: BarChart3, badge: 'STATS' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'settings':
        return <SettingsPanel />;
      case 'forbidden-words':
        return <ForbiddenWordsManager />;
      case 'reports':
        return <GlobalReportsPanel />;
      case 'finance':
        return <KoinoniaFinancePanel />;
      case 'audit-logs':
        return <AuditLogsPanel />;
      case 'analytics':
        return <AnalyticsPanel />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Administration Koinonia</h1>
          <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
            PLATEFORME
          </span>
        </div>
        <p className="text-gray-600">Gestion globale de la plateforme Koinonia</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                isActive ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {tab.badge}
              </span>
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