import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Church, MapPin, Calendar, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { shepherdService } from '../../services/shepherdService';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';

interface ValidateParishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParishApplication {
  id: string;
  name: string;
  address: string;
  created_at: string;
  city_name?: string;
  confession_name?: string;
  proposer_name?: string;
}

export const ValidateParishModal: React.FC<ValidateParishModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [applications, setApplications] = useState<ParishApplication[]>([]);
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
      ['superior', 'elder']
    );
    setHasPermission(canValidate);
  };

  const loadApplications = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('parishes')
        .select(`
          id,
          name,
          address,
          created_at,
          city:cities(name),
          confession:confessions(name)
        `)
        .eq('validated', false)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formatted = (data || []).map(p => ({
        id: p.id,
        name: p.name,
        address: p.address || 'Adresse non renseignée',
        created_at: p.created_at,
        city_name: (p.city as any)?.name,
        confession_name: (p.confession as any)?.name
      }));

      setApplications(formatted);
    } catch (error) {
      console.error('Error loading parish applications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidate = async (parishId: string, approved: boolean) => {
    setIsProcessing(parishId);
    try {
      const success = await shepherdService.validateParish(parishId, approved);
      if (success) {
        await loadApplications();
        onSuccess();
      }
    } catch (error) {
      console.error('Error validating parish:', error);
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
            Vous n'avez pas les droits pour valider des paroisses.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Seuls les Supérieurs et Anciens peuvent effectuer cette action.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Validation des paroisses" size="lg">
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-gray-600">Aucune demande de paroisse en attente.</p>
          </div>
        ) : (
          applications.map((app) => (
            <Card key={app.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-spiritual-400 to-primary-400 rounded-full flex items-center justify-center">
                    <Church className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{app.name}</h3>
                    <div className="flex items-center space-x-3 text-sm text-gray-500 mt-1">
                      {app.city_name && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>{app.city_name}</span>
                        </div>
                      )}
                      {app.confession_name && (
                        <span className="text-spiritual-600">{app.confession_name}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{app.address}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Proposée le {new Date(app.created_at).toLocaleDateString()}
                    </p>
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