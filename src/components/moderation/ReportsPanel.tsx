import React, { useState, useEffect } from 'react';
import { Flag, CheckCircle, XCircle, AlertTriangle, Loader2, Eye } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { shepherdService } from '../../services/shepherdService';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { postService } from '../../services/postService';

interface Report {
  id: string;
  content_id: string;
  reporter_id: string;
  reason: string;
  details?: string;
  reported_word?: string;
  context?: string;
  created_at: string;
  status: string;
  reporter_name?: string;
  content_preview?: string;
  content_type?: string;
}

export const ReportsPanel: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [userGrade, setUserGrade] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
    loadUserGrade();
  }, []);

  const loadUserGrade = async () => {
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('shepherd_grade')
        .eq('id', user.id)
        .single();
      setUserGrade(data?.shepherd_grade);
    }
  };

  const loadReports = async () => {
    setIsLoading(true);
    try {
      // Récupérer les signalements depuis la base
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          reporter:profiles!reporter_id(
            first_name,
            last_name
          ),
          content:posts(
            content,
            author_id
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedReports: Report[] = (data || []).map((report: any) => ({
        id: report.id,
        content_id: report.content_id,
        reporter_id: report.reporter_id,
        reason: report.reason,
        details: report.details,
        reported_word: report.reported_word,
        context: report.context,
        created_at: report.created_at,
        status: report.status,
        reporter_name: report.reporter ? `${report.reporter.first_name} ${report.reporter.last_name}` : 'Anonyme',
        content_preview: report.content?.content?.substring(0, 200) || 'Contenu non disponible',
        content_type: 'post'
      }));

      setReports(formattedReports);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolve = async (reportId: string, action: 'approve' | 'reject') => {
    setIsProcessing(reportId);
    try {
      const report = reports.find(r => r.id === reportId);
      
      if (action === 'approve' && report) {
        // Désactiver le post signalé
        await postService.disablePost(report.content_id, `Signalement approuvé: ${report.reason}`);
      }
      
      // Mettre à jour le statut du signalement
      const { error } = await supabase
        .from('reports')
        .update({ status: action === 'approve' ? 'approved' : 'rejected' })
        .eq('id', reportId);

      if (error) throw error;
      
      // Recharger la liste
      await loadReports();
    } catch (error) {
      console.error('Error resolving report:', error);
      alert('Erreur lors du traitement du signalement');
    } finally {
      setIsProcessing(null);
      setSelectedReport(null);
    }
  };

  const canResolve = userGrade === 'leader' || userGrade === 'superior' || userGrade === 'elder';

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Signalements</h2>
        <p className="text-gray-600 mt-2">
          Gérez les contenus signalés par la communauté
        </p>
      </div>

      {reports.length === 0 ? (
        <Card className="text-center py-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <p className="text-gray-600">Aucun signalement en attente.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Flag className="w-4 h-4 text-red-500" />
                    <span className="font-medium text-gray-900">
                      Signalement
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(report.created_at).toLocaleDateString()}
                    </span>
                    {report.reported_word && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800">
                        Mot: {report.reported_word}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Motif :</strong> {report.reason}
                  </p>
                  <p className="text-sm text-gray-500">
                    <strong>Contenu :</strong> {report.content_preview}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Signalé par {report.reporter_name}
                  </p>
                </div>
                {canResolve && (
                  <div className="flex space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Eye}
                      onClick={() => setSelectedReport(report)}
                    >
                      Voir
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={XCircle}
                      onClick={() => handleResolve(report.id, 'reject')}
                      loading={isProcessing === report.id}
                    >
                      Rejeter
                    </Button>
                    <Button
                      variant="success"
                      size="sm"
                      icon={CheckCircle}
                      onClick={() => handleResolve(report.id, 'approve')}
                      loading={isProcessing === report.id}
                    >
                      Approuver
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de détail */}
      {selectedReport && (
        <Modal isOpen={!!selectedReport} onClose={() => setSelectedReport(null)} title="Détail du signalement" size="md">
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h3 className="font-semibold text-red-800">Motif du signalement</h3>
              </div>
              <p className="text-red-700">{selectedReport.reason}</p>
              {selectedReport.details && (
                <p className="text-sm text-red-600 mt-2">{selectedReport.details}</p>
              )}
              {selectedReport.reported_word && (
                <p className="text-sm text-red-600 mt-2">
                  <strong>Mot signalé :</strong> "{selectedReport.reported_word}"
                </p>
              )}
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Contenu signalé</h4>
              <Card className="bg-gray-50 p-3">
                <p className="text-gray-600">{selectedReport.content_preview}</p>
              </Card>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Informations</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>Type :</strong> {selectedReport.content_type}</p>
                <p><strong>ID du contenu :</strong> {selectedReport.content_id}</p>
                <p><strong>Signalé par :</strong> {selectedReport.reporter_name}</p>
                <p><strong>Date :</strong> {new Date(selectedReport.created_at).toLocaleString()}</p>
              </div>
            </div>
            {canResolve && (
              <div className="flex space-x-3 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={() => setSelectedReport(null)}
                >
                  Fermer
                </Button>
                <Button
                  variant="danger"
                  fullWidth
                  onClick={() => handleResolve(selectedReport.id, 'reject')}
                >
                  Rejeter le signalement
                </Button>
                <Button
                  variant="success"
                  fullWidth
                  onClick={() => handleResolve(selectedReport.id, 'approve')}
                >
                  Approuver et désactiver
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};