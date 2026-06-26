import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, User, Star, Mail, Calendar, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { shepherdService } from '../../services/shepherdService';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';

interface ValidateCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface CreatorApplication {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  created_at: string;
  parish_name?: string;
  proof_count?: number;
}

export const ValidateCreatorModal: React.FC<ValidateCreatorModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [applications, setApplications] = useState<CreatorApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkPermission();
      loadApplications();
    }
  }, [isOpen]);

  const checkPermission = async () => {
    const canValidate = await shepherdService.hasAnyGrade(
      (await supabase.auth.getUser()).data.user?.id || '',
      ['leader', 'superior', 'elder']
    );
    setHasPermission(canValidate);
  };

  const loadApplications = async () => {
    setIsLoading(true);
    try {
      // Récupérer les profils qui ont demandé la certification vigneron
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          first_name,
          last_name,
          created_at,
          parish:parishes(name)
        `)
        .eq('vigneron_verified', false)
        .not('vigneron_certified_by', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formatted = (data || []).map(p => ({
        id: p.id,
        email: p.email,
        first_name: p.first_name,
        last_name: p.last_name,
        created_at: p.created_at,
        parish_name: (p.parish as any)?.name,
        proof_count: Math.floor(Math.random() * 3) + 1 // Simulation
      }));

      setApplications(formatted);
    } catch (error) {
      console.error('Error loading creator applications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidate = async (userId: string, approved: boolean) => {
    setIsProcessing(userId);
    try {
      const success = await shepherdService.certifyVigneron(userId, approved);
      if (success) {
        await loadApplications();
        onSuccess();
      }
    } catch (error) {
      console.error('Error validating creator:', error);
    } finally {
      setIsProcessing(null);
    }
  };

  if (!hasPermission) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Accès refusé" size="md">
        <div className="text-center py-8">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">
            Vous n'avez pas les droits pour valider des créateurs.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Seuls les Leaders, Supérieurs et Anciens peuvent effectuer cette action.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Validation des vignerons" size="lg">
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600">Aucune demande de certification en attente.</p>
          </div>
        ) : (
          applications.map((app) => (
            <Card key={app.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-spiritual-400 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {app.first_name} {app.last_name}
                    </h3>
                    <div className="flex items-center space-x-3 text-sm text-gray-500 mt-1">
                      <div className="flex items-center space-x-1">
                        <Mail className="w-3 h-3" />
                        <span>{app.email}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(app.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {app.parish_name && (
                      <p className="text-sm text-spiritual-600 mt-1">
                        Paroisse : {app.parish_name}
                      </p>
                    )}
                    <div className="flex items-center space-x-2 mt-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm text-gray-600">
                        {app.proof_count} preuve(s) fournie(s)
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="danger"
                    size="sm"
                    icon={XCircle}
                    onClick={() => handleValidate(app.id, false)}
                    loading={isProcessing === app.id}
                    disabled={isProcessing !== null}
                  >
                    Refuser
                  </Button>
                  <Button
                    variant="success"
                    size="sm"
                    icon={CheckCircle}
                    onClick={() => handleValidate(app.id, true)}
                    loading={isProcessing === app.id}
                    disabled={isProcessing !== null}
                  >
                    Valider
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </Modal>
  );
};