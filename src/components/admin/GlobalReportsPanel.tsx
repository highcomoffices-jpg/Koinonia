import React, { useState, useEffect } from 'react';
import { Flag, CheckCircle, XCircle, AlertTriangle, Loader2, Eye, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface Report {
  id: string;
  content_id: string;
  reporter_id: string;
  reason: string;
  details?: string;
  reported_word?: string;
  created_at: string;
  status: string;
  reporter_name?: string;
  content_preview?: string;
  parish_name?: string;
}

export const GlobalReportsPanel: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadReports();
  }, [filterStatus]);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          reporter:profiles!reporter_id(first_name, last_name),
          content:posts(content, author:profiles!author_id(parish:parishes(name)))
        `)
        .eq('status', filterStatus)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted = (data || []).map((r: any) => ({
        id: r.id,
        content_id: r.content_id,
        reporter_id: r.reporter_id,
        reason: r.reason,
        details: r.details,
        reported_word: r.reported_word,
        created_at: r.created_at,
        status: r.status,
        reporter_name: r.reporter ? `${r.reporter.first_name} ${r.reporter.last_name}` : 'Anonyme',
        content_preview: r.content?.content?.substring(0, 200) || 'Contenu non disponible',
        parish_name: r.content?.author?.parish?.name || 'Paroisse inconnue',
      }));

      setReports(formatted);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolve = async (reportId: string, action: 'approve' | 'reject') => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: action === 'approve' ? 'approved' : 'rejected' })
        .eq('id', reportId);

      if (error) throw error;
      await loadReports();
      setSelectedReport(null);
    } catch (error) {
      console.error('Error resolving report:', error);
      alert('Erreur lors du traitement');
    }
  };

  const filteredReports = reports.filter(r => 
    searchTerm === '' || 
    r.reporter_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.parish_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Flag className="w-5 h-5" />
            Signalements globaux
          </h2>
          <p className="text-sm text-gray-500">Supervision des signalements toutes paroisses</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              filterStatus === 'pending' ? 'bg-yellow-500 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            En attente ({reports.filter(r => r.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilterStatus('approved')}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              filterStatus === 'approved' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Approuvés
          </button>
          <button
            onClick={() => setFilterStatus('rejected')}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              filterStatus === 'rejected' ? 'bg-gray-500 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Rejetés
          </button>
        </div>
      </div>

      {/* Search */}
      <Input
        placeholder="Rechercher par paroisse, utilisateur ou motif..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        icon={Users}
      />

      {/* Reports list */}
      {filteredReports.length === 0 ? (
        <Card className="text-center py-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <p className="text-gray-600">Aucun signalement {filterStatus === 'pending' ? 'en attente' : ''}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((report) => (
            <Card key={report.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Flag className="w-4 h-4 text-red-500" />
                    <span className="font-medium text-gray-900">Signalement</span>
                    <span className="text-xs text-gray-400">{new Date(report.created_at).toLocaleDateString()}</span>
                    {report.reported_word && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800">
                        Mot: {report.reported_word}
                      </span>
                    )}
                    <span className="px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-800">
                      {report.parish_name}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1"><strong>Motif:</strong> {report.reason}</p>
                  <p className="text-sm text-gray-500 line-clamp-2">{report.content_preview}</p>
                  <p className="text-xs text-gray-400 mt-2">Signalé par {report.reporter_name}</p>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button variant="outline" size="sm" icon={Eye} onClick={() => setSelectedReport(report)}>
                    Voir
                  </Button>
                  <Button variant="danger" size="sm" icon={XCircle} onClick={() => handleResolve(report.id, 'reject')}>
                    Rejeter
                  </Button>
                  <Button variant="success" size="sm" icon={CheckCircle} onClick={() => handleResolve(report.id, 'approve')}>
                    Approuver
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal détail (similaire à ReportsPanel) - à implémenter si nécessaire */}
    </div>
  );
};