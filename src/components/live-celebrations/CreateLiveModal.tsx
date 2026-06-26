import React, { useState } from 'react';
import { X, Calendar, Clock, Globe, Users, Church, Video, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useGeoData } from '../../hooks/useGeoData';
import { liveCelebrationService } from '../../services/liveCelebrationService';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Card } from '../ui/Card';

interface CreateLiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLiveCreated: () => void;
}

export const CreateLiveModal: React.FC<CreateLiveModalProps> = ({
  isOpen,
  onClose,
  onLiveCreated,
}) => {
  const { user } = useAuth();
  const { parishes } = useGeoData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isScheduled, setIsScheduled] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    stream_url: '',
    scheduled_start: '',
    scheduled_end: '',
    visibility: 'public',
    parish_ids: [] as string[],
    image_url: '',
  });

  const visibilityOptions = [
    { value: 'public', label: 'Public – Tout le monde', icon: Globe },
    { value: 'subscribers', label: 'Abonnés – Mes abonnés uniquement', icon: Users },
    { value: 'parish', label: 'Paroisse – Ma paroisse uniquement', icon: Church },
  ];

  const parishOptions = parishes.map(p => ({
    value: p.id,
    label: p.name,
  }));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleParishToggle = (parishId: string) => {
    setFormData(prev => ({
      ...prev,
      parish_ids: prev.parish_ids.includes(parishId)
        ? prev.parish_ids.filter(id => id !== parishId)
        : [...prev.parish_ids, parishId],
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = 'Le titre est requis';
    if (!formData.stream_url.trim()) {
      newErrors.stream_url = 'L\'URL YouTube est requise';
    } else if (!formData.stream_url.includes('youtube.com') && !formData.stream_url.includes('youtu.be')) {
      newErrors.stream_url = 'URL YouTube invalide';
    }

    if (isScheduled && formData.scheduled_start) {
      const startDate = new Date(formData.scheduled_start);
      if (startDate < new Date()) {
        newErrors.scheduled_start = 'La date doit être dans le futur';
      }
    }

    if (formData.scheduled_end && formData.scheduled_start) {
      if (new Date(formData.scheduled_end) <= new Date(formData.scheduled_start)) {
        newErrors.scheduled_end = 'La date de fin doit être après la date de début';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const scheduledStart = isScheduled && formData.scheduled_start
        ? new Date(formData.scheduled_start)
        : undefined;

      const scheduledEnd = isScheduled && formData.scheduled_end
        ? new Date(formData.scheduled_end)
        : undefined;

      await liveCelebrationService.createLive({
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        stream_url: formData.stream_url.trim(),
        scheduled_start: scheduledStart,
        scheduled_end: scheduledEnd,
        visibility: formData.visibility as any,
        parish_ids: formData.parish_ids,
        image_url: formData.image_url || undefined,
      });

      onLiveCreated();
      onClose();
    } catch (error) {
      console.error('Error creating live:', error);
      setErrors({ general: 'Erreur lors de la création du live' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getYouTubeEmbedUrl = (url: string): string => {
    if (url.includes('youtube.com/watch?v=')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('/embed/')) return url;
    return url;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex-shrink-0 flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Créer un live</h2>
            <p className="text-gray-600 text-sm">Diffusez en direct sur Koinonia</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-2 space-y-4">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          <Input
            label="Titre du live *"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Ex: Culte de louange du dimanche"
            required
            error={errors.title}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="Décrivez votre live..."
            />
          </div>

          <Input
            label="URL YouTube *"
            name="stream_url"
            value={formData.stream_url}
            onChange={handleChange}
            placeholder="https://youtube.com/live/... ou https://youtu.be/..."
            error={errors.stream_url}
          />

          {formData.stream_url && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-2">Aperçu du lecteur :</p>
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <iframe
                  src={getYouTubeEmbedUrl(formData.stream_url)}
                  className="w-full h-full"
                  title="Aperçu live"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 py-2">
            <input
              type="checkbox"
              id="scheduled"
              checked={isScheduled}
              onChange={(e) => setIsScheduled(e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded"
            />
            <label htmlFor="scheduled" className="text-sm text-gray-700">
              Programmer le live (différé)
            </label>
          </div>

          {isScheduled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Date et heure de début"
                name="scheduled_start"
                type="datetime-local"
                value={formData.scheduled_start}
                onChange={handleChange}
                icon={Calendar}
                error={errors.scheduled_start}
              />
              <Input
                label="Date et heure de fin (optionnel)"
                name="scheduled_end"
                type="datetime-local"
                value={formData.scheduled_end}
                onChange={handleChange}
                icon={Clock}
                error={errors.scheduled_end}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Visibilité
            </label>
            <div className="space-y-2">
              {visibilityOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = formData.visibility === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, visibility: option.value }))}
                    className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`w-5 h-5 mt-0.5 ${isSelected ? 'text-primary-600' : 'text-gray-400'}`} />
                      <div>
                        <p className={`font-medium ${isSelected ? 'text-primary-900' : 'text-gray-900'}`}>
                          {option.label}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {user?.shepherdGrade === 'leader' && parishOptions.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paroisses participantes
              </label>
              <div className="flex flex-wrap gap-2">
                {parishOptions.map(parish => (
                  <button
                    key={parish.value}
                    type="button"
                    onClick={() => handleParishToggle(parish.value)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      formData.parish_ids.includes(parish.value)
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {parish.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Input
            label="Image de couverture (URL)"
            name="image_url"
            value={formData.image_url}
            onChange={handleChange}
            icon={ImageIcon}
            placeholder="https://..."
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" variant="spiritual" loading={isSubmitting}>
              {isScheduled ? 'Programmer' : 'Démarrer le live'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};