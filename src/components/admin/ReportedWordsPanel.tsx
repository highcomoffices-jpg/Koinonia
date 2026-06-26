import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Loader2, Eye } from 'lucide-react';
import { moderationService } from '../../services/moderationService';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';

interface ReportedWord {
  id: string;
  word: string;
  context: string;
  occurrence_count: number;
  is_approved: boolean;
  report: {
    id: string;
    reason: string;
    content_id: string;
  };
}

export const ReportedWordsPanel: React.FC = () => {
  const [reportedWords, setReportedWords] = useState<ReportedWord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWord, setSelectedWord] = useState<ReportedWord | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [category, setCategory] = useState('other');
  const [severity, setSeverity] = useState(1);

  const loadReportedWords = async () => {
    setIsLoading(true);
    try {
      const data = await moderationService.getPendingReportedWords();
      setReportedWords(data as ReportedWord[]);
    } catch (error) {
      console.error('Error loading reported words:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReportedWords();
  }, []);

  const handleApprove = async () => {
    if (!selectedWord) return;
    setIsProcessing(true);
    try {
      await moderationService.approveReportedWord(selectedWord.id, selectedWord.word, category, severity);
      await loadReportedWords();
      setSelectedWord(null);
    } catch (error) {
      console.error('Error approving word:', error);
      alert('Erreur lors de l\'approbation');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedWord) return;
    setIsProcessing(true);
    try {
      await moderationService.rejectReportedWord(selectedWord.id);
      await loadReportedWords();
      setSelectedWord(null);
    } catch (error) {
      console.error('Error rejecting word:', error);
      alert('Erreur lors du rejet');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Mots signalés par les utilisateurs</h2>
        <p className="text-sm text-gray-500">Validez ou rejetez les mots proposés par la communauté</p>
      </div>

      {reportedWords.length === 0 ? (
        <Card className="text-center py-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <p className="text-gray-600">Aucun mot signalé en attente.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {reportedWords.map((rw) => (
            <Card key={rw.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-lg text-gray-900">{rw.word}</span>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800">
                      {rw.occurrence_count} signalement(s)
                    </span>
                  </div>
                  {rw.context && (
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Contexte :</span> "{rw.context.substring(0, 100)}..."
                    </p>
                  )}
                  <p className="text-xs text-gray-400">
                    Signalé via: {rw.report.reason}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Eye}
                    onClick={() => setSelectedWord(rw)}
                  >
                    Examiner
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal d'examen */}
      {selectedWord && (
        <Modal
          isOpen={!!selectedWord}
          onClose={() => setSelectedWord(null)}
          title="Examiner le mot signalé"
          size="md"
        >
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="font-medium text-yellow-800 mb-2">Mot à examiner</p>
              <p className="text-2xl font-bold text-yellow-900">{selectedWord.word}</p>
            </div>

            {selectedWord.context && (
              <div>
                <p className="font-medium text-gray-700 mb-1">Contexte d'utilisation</p>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  "{selectedWord.context}"
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catégorie
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="insult">Insultes</option>
                <option value="spam">Spam</option>
                <option value="hate">Discours de haine</option>
                <option value="violence">Violence</option>
                <option value="discrimination">Discrimination</option>
                <option value="blasphemy">Blasphème</option>
                <option value="scam">Arnaques</option>
                <option value="harassment">Harcèlement</option>
                <option value="adult">Contenu adulte</option>
                <option value="other">Autre</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sévérité (1-5)
              </label>
              <select
                value={severity}
                onChange={(e) => setSeverity(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value={1}>1 - Faible</option>
                <option value={2}>2 - Modéré</option>
                <option value={3}>3 - Moyen</option>
                <option value={4}>4 - Élevé</option>
                <option value={5}>5 - Critique</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="danger" onClick={handleReject} loading={isProcessing}>
                Rejeter
              </Button>
              <Button variant="success" onClick={handleApprove} loading={isProcessing}>
                Approuver et ajouter
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};