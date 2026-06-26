import React, { useState, useEffect } from 'react';
import { Save, TrendingUp, Shield, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { settingsService, SpiritualLevelThresholds } from '../../services/settingsService';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';

export const SettingsPanel: React.FC = () => {
  const { user } = useAuth();
  const [thresholds, setThresholds] = useState<SpiritualLevelThresholds>({
    sowerMax: 9999,
    harvesterMin: 10000,
    harvesterMax: 49999,
    friendMin: 50000,
    friendMax: 99999
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      // Vérifier si l'utilisateur est admin OU super_admin
      const isUserAdmin = user?.role === 'admin' || user?.role === 'super_admin';
      setIsAdmin(isUserAdmin);

      if (isUserAdmin) {
        const data = await settingsService.getSpiritualThresholds();
        setThresholds(data);
      }
      setIsLoading(false);
    };

    loadData();
  }, [user]);

  const handleChange = (key: keyof SpiritualLevelThresholds, value: string) => {
    const numValue = parseInt(value) || 0;
    setThresholds(prev => ({ ...prev, [key]: numValue }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await settingsService.updateSpiritualThreshold('spiritual_level_sower_max', thresholds.sowerMax);
      await settingsService.updateSpiritualThreshold('spiritual_level_harvester_min', thresholds.harvesterMin);
      await settingsService.updateSpiritualThreshold('spiritual_level_harvester_max', thresholds.harvesterMax);
      await settingsService.updateSpiritualThreshold('spiritual_level_friend_min', thresholds.friendMin);
      await settingsService.updateSpiritualThreshold('spiritual_level_friend_max', thresholds.friendMax);
      alert('Seuils mis à jour avec succès !');
    } catch (error) {
      console.error('Error saving thresholds:', error);
      alert('Erreur lors de la mise à jour des seuils');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <Card className="text-center py-8">
        <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Accès réservé aux administrateurs.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Configuration des niveaux spirituels</h2>
        <p className="text-gray-600 mt-2">
          Définissez les seuils de points pour chaque niveau
        </p>
      </div>

      <Card>
        <div className="space-y-6">
          {/* Niveau Semeur */}
          <div className="border-b border-gray-200 pb-4">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Semeur (Sower)</h3>
              <span className="text-sm text-gray-500">0 à X points</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Points maximum"
                type="number"
                value={thresholds.sowerMax.toString()}
                onChange={(e) => handleChange('sowerMax', e.target.value)}
                min="0"
              />
            </div>
          </div>

          {/* Niveau Moissonneur */}
          <div className="border-b border-gray-200 pb-4">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Moissonneur (Harvester)</h3>
              <span className="text-sm text-gray-500">X à Y points</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Points minimum"
                type="number"
                value={thresholds.harvesterMin.toString()}
                onChange={(e) => handleChange('harvesterMin', e.target.value)}
                min="0"
              />
              <Input
                label="Points maximum"
                type="number"
                value={thresholds.harvesterMax.toString()}
                onChange={(e) => handleChange('harvesterMax', e.target.value)}
                min="0"
              />
            </div>
          </div>

          {/* Niveau Ami */}
          <div className="pb-4">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Ami (Friend)</h3>
              <span className="text-sm text-gray-500">X à Y points</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Points minimum"
                type="number"
                value={thresholds.friendMin.toString()}
                onChange={(e) => handleChange('friendMin', e.target.value)}
                min="0"
              />
              <Input
                label="Points maximum"
                type="number"
                value={thresholds.friendMax.toString()}
                onChange={(e) => handleChange('friendMax', e.target.value)}
                min="0"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-200">
            <Button
              variant="spiritual"
              icon={Save}
              onClick={handleSave}
              loading={isSaving}
            >
              Enregistrer les modifications
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};