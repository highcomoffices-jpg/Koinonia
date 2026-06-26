import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Loader2, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface AuditLog {
  id: string;
  user_email: string;
  user_role: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: any;
  created_at: string;
}

export const AuditLogsPanel: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const actions = [
    'config_update', 'word_add', 'word_edit', 'word_delete', 'word_toggle',
    'validate_creator', 'reject_creator', 'validate_parish', 'reject_parish',
    'disable_post', 'approve_report', 'reject_report', 'user_role_change',
    'user_suspend', 'user_unsuspend', 'settings_reset'
  ];

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchTerm === '' || 
      log.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = !filterAction || log.action === filterAction;
    return matchesSearch && matchesAction;
  });

  const exportLogs = () => {
    const csv = [
      ['Date', 'Utilisateur', 'Rôle', 'Action', 'Type', 'Détails'].join(','),
      ...filteredLogs.map(log => [
        new Date(log.created_at).toLocaleString(),
        log.user_email,
        log.user_role,
        log.action,
        log.entity_type,
        JSON.stringify(log.details || {}),
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getActionColor = (action: string) => {
    if (action.includes('delete')) return 'text-red-600 bg-red-50';
    if (action.includes('add') || action.includes('validate')) return 'text-green-600 bg-green-50';
    if (action.includes('edit') || action.includes('update')) return 'text-blue-600 bg-blue-50';
    return 'text-gray-600 bg-gray-50';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Audit logs</h2>
          <p className="text-sm text-gray-500">Traçabilité des actions administratives</p>
        </div>
        <Button variant="outline" size="sm" icon={Download} onClick={exportLogs}>
          Exporter CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Input
            placeholder="Rechercher par utilisateur ou action..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={Search}
          />
        </div>
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Toutes les actions</option>
          {actions.map(action => (
            <option key={action} value={action}>{action.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      {/* Logs list */}
      <div className="space-y-2">
        {filteredLogs.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-gray-500">Aucun log trouvé</p>
          </Card>
        ) : (
          filteredLogs.map((log) => (
            <Card key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">{log.user_email}</span>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                      {log.user_role}
                    </span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${getActionColor(log.action)}`}>
                      {log.action.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-gray-400">
                      {log.entity_type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {new Date(log.created_at).toLocaleString()}
                  </p>
                  {log.details && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                      {JSON.stringify(log.details)}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Eye}
                  onClick={() => setSelectedLog(log)}
                >
                  Détails
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modal détails */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Détail du log</h3>
              <button onClick={() => setSelectedLog(null)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Date</p>
                <p className="text-gray-900">{new Date(selectedLog.created_at).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Utilisateur</p>
                <p className="text-gray-900">{selectedLog.user_email} ({selectedLog.user_role})</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Action</p>
                <p className="text-gray-900">{selectedLog.action.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Entité</p>
                <p className="text-gray-900">Type: {selectedLog.entity_type} | ID: {selectedLog.entity_id || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Détails</p>
                <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};