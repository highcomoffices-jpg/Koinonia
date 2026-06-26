import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Check, Search, AlertCircle } from 'lucide-react';
import { moderationService, ForbiddenWord } from '../../services/moderationService';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';

type CategoryType = 'insult' | 'spam' | 'hate' | 'violence' | 'discrimination' | 'blasphemy' | 'scam' | 'harassment' | 'adult' | 'other';

const categoryLabels: Record<CategoryType, string> = {
  insult: 'Insultes',
  spam: 'Spam',
  hate: 'Discours de haine',
  violence: 'Violence',
  discrimination: 'Discrimination',
  blasphemy: 'Blasphème',
  scam: 'Arnaques',
  harassment: 'Harcèlement',
  adult: 'Contenu adulte',
  other: 'Autre'
};

const categoryColors: Record<CategoryType, string> = {
  insult: 'bg-red-100 text-red-800',
  spam: 'bg-yellow-100 text-yellow-800',
  hate: 'bg-purple-100 text-purple-800',
  violence: 'bg-orange-100 text-orange-800',
  discrimination: 'bg-pink-100 text-pink-800',
  blasphemy: 'bg-indigo-100 text-indigo-800',
  scam: 'bg-amber-100 text-amber-800',
  harassment: 'bg-rose-100 text-rose-800',
  adult: 'bg-gray-100 text-gray-800',
  other: 'bg-gray-100 text-gray-800'
};

export const ForbiddenWordsManager: React.FC = () => {
  const [words, setWords] = useState<ForbiddenWord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<ForbiddenWord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    word: '',
    category: 'other' as CategoryType,
    severity: 1
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadWords = async () => {
    setIsLoading(true);
    try {
      const data = await moderationService.getAllForbiddenWords();
      setWords(data);
    } catch (err) {
      console.error('Error loading words:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWords();
  }, []);

  const filteredWords = words.filter(w =>
    w.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
    categoryLabels[w.category as CategoryType]?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (word?: ForbiddenWord) => {
    if (word) {
      setEditingWord(word);
      setFormData({
        word: word.word,
        category: word.category as CategoryType,
        severity: word.severity
      });
    } else {
      setEditingWord(null);
      setFormData({
        word: '',
        category: 'other',
        severity: 1
      });
    }
    setError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingWord(null);
    setFormData({ word: '', category: 'other', severity: 1 });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.word.trim()) {
      setError('Le mot est requis');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (editingWord) {
        await moderationService.updateForbiddenWord(editingWord.id, {
          category: formData.category,
          severity: formData.severity
        });
      } else {
        await moderationService.addForbiddenWord(formData.word.trim(), formData.category, formData.severity);
      }
      await loadWords();
      handleCloseModal();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (word: ForbiddenWord) => {
    try {
      await moderationService.updateForbiddenWord(word.id, { is_active: !word.is_active });
      await loadWords();
    } catch (err) {
      console.error('Error toggling word:', err);
    }
  };

  const handleDelete = async (word: ForbiddenWord) => {
    if (!confirm(`Supprimer définitivement le mot "${word.word}" ?`)) return;
    
    try {
      await moderationService.deleteForbiddenWord(word.id);
      await loadWords();
    } catch (err) {
      console.error('Error deleting word:', err);
      alert('Erreur lors de la suppression');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Mots interdits</h2>
          <p className="text-sm text-gray-500">Gérez les mots qui seront bloqués lors des publications</p>
        </div>
        <Button variant="primary" icon={Plus} onClick={() => handleOpenModal()}>
          Ajouter un mot
        </Button>
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Rechercher un mot ou une catégorie..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Liste des mots */}
      <Card>
        {filteredWords.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Aucun mot trouvé</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredWords.map((word) => (
              <div key={word.id} className="flex items-center justify-between py-3 px-4 hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-medium ${!word.is_active ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                      {word.word}
                    </span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${categoryColors[word.category as CategoryType] || 'bg-gray-100 text-gray-800'}`}>
                      {categoryLabels[word.category as CategoryType] || word.category}
                    </span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      word.severity >= 4 ? 'bg-red-100 text-red-800' :
                      word.severity >= 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      Sévérité {word.severity}
                    </span>
                    {!word.is_active && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">
                        Désactivé
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleActive(word)}
                    className={`p-2 rounded-lg transition-colors ${
                      word.is_active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'
                    }`}
                    title={word.is_active ? 'Désactiver' : 'Activer'}
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenModal(word)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Modifier"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(word)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modal d'ajout/modification */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingWord ? 'Modifier un mot' : 'Ajouter un mot interdit'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Mot"
            value={formData.word}
            onChange={(e) => setFormData(prev => ({ ...prev, word: e.target.value }))}
            placeholder="ex: spam"
            disabled={!!editingWord}
            required
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Catégorie
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as CategoryType }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sévérité (1-5)
            </label>
            <select
              value={formData.severity}
              onChange={(e) => setFormData(prev => ({ ...prev, severity: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value={1}>1 - Faible (spam, publicité)</option>
              <option value={2}>2 - Modéré (insultes légères)</option>
              <option value={3}>3 - Moyen (insultes graves)</option>
              <option value={4}>4 - Élevé (harcèlement, discrimination)</option>
              <option value={5}>5 - Critique (haine, violence, contenu adulte)</option>
            </select>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              Annuler
            </Button>
            <Button type="submit" variant="spiritual" loading={isSubmitting}>
              {editingWord ? 'Modifier' : 'Ajouter'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};