import React, { useState, useEffect } from 'react';
import { X, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Card } from '../ui/Card';
import { useGeoData } from '../../hooks/useGeoData';

interface ProposeParishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  cities: any[];
  confessions: any[];
}

export const ProposeParishModal: React.FC<ProposeParishModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  cities: externalCities,
  confessions: externalConfessions,
}) => {
  const [step, setStep] = useState(1);
  const {
    continents,
    countries,
    allCities,
    isLoadingCountries,
    isLoadingCities,
    loadCountriesByContinent,
    loadCitiesByCountry,
  } = useGeoData();
  
  const [formData, setFormData] = useState({
    name: '',
    confession_id: '',
    continent_id: '',
    country_id: '',
    city_id: '',
    address: '',
    description: '',
    phone: '',
    email: '',
    website: '',
  });

  // Reset when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setFormData({
        name: '',
        confession_id: '',
        continent_id: '',
        country_id: '',
        city_id: '',
        address: '',
        description: '',
        phone: '',
        email: '',
        website: '',
      });
    }
  }, [isOpen]);

  // Load cities when country changes
  useEffect(() => {
    if (formData.country_id) {
      loadCitiesByCountry(formData.country_id);
    }
  }, [formData.country_id, loadCitiesByCountry]);

  if (!isOpen) return null;

  const continentOptions = continents.map(c => ({
    value: c.id,
    label: c.name,
  }));

  const countryOptions = countries.map(c => ({
    value: c.id,
    label: c.name,
  }));

  const cityOptions = (allCities || []).map(c => ({
    value: c.id,
    label: c.name,
  }));

  const confessionOptions = externalConfessions.map(c => ({
    value: c.id,
    label: c.name,
  }));

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Reset dependent fields
    if (name === 'continent_id') {
      setFormData(prev => ({ ...prev, country_id: '', city_id: '' }));
      loadCountriesByContinent(value);
    }
    if (name === 'country_id') {
      setFormData(prev => ({ ...prev, city_id: '' }));
    }
  };

  const handleSubmit = () => {
    if (step === 1) {
      if (formData.name && formData.confession_id && formData.city_id) {
        setStep(2);
      }
    } else {
      onSubmit({
        name: formData.name,
        confession_id: formData.confession_id,
        city_id: formData.city_id,
        address: formData.address,
        description: formData.description,
        phone: formData.phone,
        email: formData.email,
        website: formData.website,
      });
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      confession_id: '',
      continent_id: '',
      country_id: '',
      city_id: '',
      address: '',
      description: '',
      phone: '',
      email: '',
      website: '',
    });
    setStep(1);
    onClose();
  };

  const isStep1Valid = formData.name && formData.confession_id && formData.city_id;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Proposer une paroisse</h2>
            <p className="text-gray-600 text-sm mt-1">
              Étape {step} sur 2 - {step === 1 ? 'Informations générales' : 'Détails supplémentaires'}
            </p>
          </div>
          <button
            onClick={resetForm}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          {step === 1 ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Nom de la paroisse *
                </label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ex: Cathédrale Notre-Dame"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Confession *
                  </label>
                  <Select
                    name="confession_id"
                    value={formData.confession_id}
                    onChange={handleInputChange}
                    options={confessionOptions}
                    placeholder="Sélectionner une confession"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Continent
                  </label>
                  <Select
                    name="continent_id"
                    value={formData.continent_id}
                    onChange={handleInputChange}
                    options={continentOptions}
                    placeholder="Sélectionner un continent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Pays *
                  </label>
                  <Select
                    name="country_id"
                    value={formData.country_id}
                    onChange={handleInputChange}
                    options={countryOptions}
                    placeholder={formData.continent_id ? "Sélectionner un pays" : "Sélectionnez d'abord un continent"}
                    disabled={!formData.continent_id || isLoadingCountries}
                    loading={isLoadingCountries}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Ville *
                  </label>
                  <Select
                    name="city_id"
                    value={formData.city_id}
                    onChange={handleInputChange}
                    options={cityOptions}
                    placeholder={formData.country_id ? "Sélectionner une ville" : "Sélectionnez d'abord un pays"}
                    disabled={!formData.country_id || isLoadingCities}
                    loading={isLoadingCities}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Adresse
                </label>
                <Input
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Ex: 10 rue de Rivoli, 75001 Paris"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Téléphone
                </label>
                <Input
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+229 XX XX XX XX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Email
                </label>
                <Input
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="contact@paroisse.bj"
                  type="email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Site web
                </label>
                <Input
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="https://www.paroisse.bj"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Décrivez la paroisse, ses activités, ses horaires..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  ℹ️ Votre proposition sera vérifiée par nos modérateurs avant publication.
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
          {step === 2 && (
            <Button variant="ghost" onClick={() => setStep(1)} fullWidth>
              Retour
            </Button>
          )}
          <Button variant="ghost" onClick={resetForm} fullWidth>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            fullWidth
            icon={step === 1 ? ChevronRight : undefined}
            disabled={step === 1 && !isStep1Valid}
          >
            {step === 1 ? 'Continuer' : 'Proposer'}
          </Button>
        </div>
      </Card>
    </div>
  );
};