import React, { useState, useEffect } from 'react';
import { Church, MapPin, Users, Calendar, Phone, Mail, ExternalLink, Loader2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Parish } from '../../types';
import { supabase } from '../../lib/supabase';

interface ParishDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  parish: Parish;
  city: string;
  confession: string;
  onJoinParish: (parishId: string) => void;
}

export const ParishDetailsModal: React.FC<ParishDetailsModalProps> = ({
  isOpen,
  onClose,
  parish,
  city,
  confession,
  onJoinParish
}) => {
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [eventsCount, setEventsCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && parish.id) {
      const loadCounts = async () => {
        setIsLoading(true);
        try {
          // Compter les membres réels
          const { count: members } = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('parish_id', parish.id);

          // Compter les événements réels
          const { count: events } = await supabase
            .from('activities')
            .select('id', { count: 'exact', head: true })
            .eq('parish_id', parish.id);

          setMemberCount(members || 0);
          setEventsCount(events || 0);
        } catch (error) {
          console.error('Error loading counts:', error);
          setMemberCount(0);
          setEventsCount(0);
        } finally {
          setIsLoading(false);
        }
      };
      loadCounts();
    }
  }, [isOpen, parish.id]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Détails de la paroisse" size="md">
      <div className="space-y-6 p-6">
        {/* En-tête */}
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-spiritual-500 to-primary-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Church className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 truncate">{parish.name}</h2>
            <p className="text-spiritual-600 font-medium">{confession}</p>
            <div className="flex items-center mt-1 text-sm text-gray-500">
              <MapPin className="w-4 h-4 mr-1" />
              <span>{city}</span>
            </div>
          </div>
        </div>

        {/* Informations de contact */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900">Informations</h3>
          
          {(parish as any).address && (
            <div className="flex items-start space-x-3">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-700">Adresse</p>
                <p className="text-sm text-gray-600">{(parish as any).address}</p>
              </div>
            </div>
          )}

          {(parish as any).phone && (
            <div className="flex items-center space-x-3">
              <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-700">Téléphone</p>
                <p className="text-sm text-gray-600">{(parish as any).phone}</p>
              </div>
            </div>
          )}

          {(parish as any).email && (
            <div className="flex items-center space-x-3">
              <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-700">Email</p>
                <p className="text-sm text-gray-600 break-all">{(parish as any).email}</p>
              </div>
            </div>
          )}

          {(parish as any).website && (
            <div className="flex items-center space-x-3">
              <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-700">Site web</p>
                <a 
                  href={(parish as any).website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary-600 hover:text-primary-700 break-all"
                >
                  {(parish as any).website}
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        {(parish as any).description && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{(parish as any).description}</p>
          </div>
        )}

        {/* Statistiques réelles */}
        <div className="grid grid-cols-3 gap-4 py-4 border-t border-gray-200">
          <div className="text-center">
            <Users className="w-6 h-6 text-gray-400 mx-auto mb-1" />
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-primary-600 mx-auto" />
            ) : (
              <p className="text-lg font-semibold text-gray-900">{memberCount ?? 0}</p>
            )}
            <p className="text-xs text-gray-500">Membres</p>
          </div>
          <div className="text-center">
            <Calendar className="w-6 h-6 text-gray-400 mx-auto mb-1" />
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-primary-600 mx-auto" />
            ) : (
              <p className="text-lg font-semibold text-gray-900">{eventsCount ?? 0}</p>
            )}
            <p className="text-xs text-gray-500">Événements/mois</p>
          </div>
          <div className="text-center">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-1">
              <Church className="w-3 h-3 text-green-600" />
            </div>
            <p className="text-lg font-semibold text-gray-900">{parish.validated ? 'Validée' : 'En attente'}</p>
            <p className="text-xs text-gray-500">Statut</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3 pt-4 border-t border-gray-200">
          <Button variant="outline" fullWidth onClick={onClose}>
            Fermer
          </Button>
          <Button 
            variant="primary" 
            fullWidth
            onClick={() => {
              onJoinParish(parish.id);
              onClose();
            }}
          >
            Rejoindre cette paroisse
          </Button>
        </div>
      </div>
    </Modal>
  );
};