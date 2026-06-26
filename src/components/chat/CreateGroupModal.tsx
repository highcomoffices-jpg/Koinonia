import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Users, Plus, X, Search, Loader2, UserPlus, Upload, Image } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { userSearchService, SearchUserResult } from '../../services/userSearchService';
import { chatService } from '../../services/chatService';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: (conversationId: string) => void;
}

const MAX_PARTICIPANTS = 50;
const DEBOUNCE_MS = 300;
const MAX_NAME_LENGTH = 50;

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose, onGroupCreated }) => {
  const { user } = useAuth();
  const [step, setStep] = useState<'info' | 'participants'>('info');
  const [groupName, setGroupName] = useState('');
  const [groupImage, setGroupImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUserResult[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<SearchUserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Nettoyer l'aperçu de l'image au démontage
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  // Gestion de la recherche avec debounce
  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim() || searchTerm.length < 2) return;
    
    setIsSearching(true);
    try {
      const results = await userSearchService.searchUsers(searchTerm, user?.id);
      // Exclure les utilisateurs déjà sélectionnés ET l'utilisateur courant
      const filtered = results.filter(r => 
        r.id !== user?.id && !selectedUsers.some(u => u.id === r.id)
      );
      setSearchResults(filtered);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  }, [searchTerm, user?.id, selectedUsers]);

  // Debounce sur le searchTerm
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    
    if (searchTerm.trim().length >= 2) {
      debounceTimerRef.current = setTimeout(handleSearch, DEBOUNCE_MS);
    } else {
      setSearchResults([]);
    }
    
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [searchTerm, handleSearch]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validation du type et taille (max 2MB)
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image');
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      alert('L\'image ne doit pas dépasser 2 Mo');
      return;
    }
    
    setGroupImage(file);
    
    // Créer un aperçu
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(URL.createObjectURL(file));
  };

  const addUser = (newUser: SearchUserResult) => {
    if (selectedUsers.length >= MAX_PARTICIPANTS) {
      alert(`Maximum ${MAX_PARTICIPANTS} participants`);
      return;
    }
    setSelectedUsers(prev => [...prev, newUser]);
    setSearchResults(prev => prev.filter(u => u.id !== newUser.id));
    setSearchTerm('');
  };

  const removeUser = (userId: string) => {
    setSelectedUsers(prev => prev.filter(u => u.id !== userId));
  };

  const uploadGroupImage = async (conversationId: string): Promise<string | null> => {
    if (!groupImage) return null;
    
    try {
      const fileExt = groupImage.name.split('.').pop();
      const fileName = `groups/${conversationId}/avatar.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('chat-files')
        .upload(fileName, groupImage, {
          cacheControl: '3600',
          upsert: true,
        });
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('chat-files')
        .getPublicUrl(fileName);
      
      return publicUrl;
    } catch (error) {
      console.error('Error uploading group image:', error);
      return null;
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      alert('Veuillez entrer un nom pour le groupe');
      return;
    }
    
    if (selectedUsers.length === 0) {
      alert('Veuillez ajouter au moins un participant');
      return;
    }
    
    setIsCreating(true);
    setUploadProgress(0);
    
    try {
      // Créer le groupe
      const participantIds = selectedUsers.map(u => u.id);
      const conversation = await chatService.createGroupConversation(groupName, participantIds);
      
      if (conversation) {
        // Upload de l'image si présente
        if (groupImage) {
          const imageUrl = await uploadGroupImage(conversation.id);
          if (imageUrl) {
            // Mettre à jour la conversation avec l'URL de l'image
            await supabase
              .from('conversations')
              .update({ avatar_url: imageUrl })
              .eq('id', conversation.id);
          }
        }
        
        onGroupCreated(conversation.id);
        resetForm();
        onClose();
      }
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Erreur lors de la création du groupe');
    } finally {
      setIsCreating(false);
      setUploadProgress(0);
    }
  };

  const resetForm = () => {
    setStep('info');
    setGroupName('');
    setGroupImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    setSearchTerm('');
    setSearchResults([]);
    setSelectedUsers([]);
    setUploadProgress(0);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Calcul du nombre de caractères restants
  const remainingChars = MAX_NAME_LENGTH - groupName.length;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Créer un groupe" size="md">
      {/* ÉTAPE 1 : Informations du groupe */}
      {step === 'info' ? (
        <div className="space-y-6 p-1">
          {/* Nom du groupe */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              Nom du groupe <span className="text-red-500">*</span>
            </label>
            <Input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value.slice(0, MAX_NAME_LENGTH))}
              placeholder="Ex: Jeunes Chrétiens de Cotonou"
              className="w-full"
            />
            <div className="flex justify-end">
              <span className={`text-xs ${remainingChars < 5 ? 'text-orange-500' : 'text-gray-400'}`}>
                {remainingChars} caractères restants
              </span>
            </div>
          </div>
          
          {/* Photo du groupe */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Photo du groupe <span className="text-gray-400 font-normal">(optionnelle)</span>
            </label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {/* Aperçu */}
              <div className="flex-shrink-0">
                {imagePreview ? (
                  <div className="relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Aperçu groupe"
                      className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                    />
                    <button
                      onClick={() => {
                        setGroupImage(null);
                        if (imagePreview) URL.revokeObjectURL(imagePreview);
                        setImagePreview(null);
                      }}
                      className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors shadow-md"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center border-2 border-dashed border-gray-300">
                    <Users className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Upload button */}
              <div className="flex-1">
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border border-gray-200 hover:border-gray-300">
                  <Upload className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">Choisir une image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-400 mt-2">
                  Format recommandé : JPG, PNG. Max 2 Mo
                </p>
              </div>
            </div>
          </div>

          {/* Boutons - CORRIGÉS */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-100">
            <Button variant="outline" fullWidth onClick={handleClose} className="sm:flex-1 order-2 sm:order-1">
              Annuler
            </Button>
            <Button 
              variant="primary" 
              fullWidth 
              onClick={() => setStep('participants')} 
              disabled={!groupName.trim()}
              className="sm:flex-1 order-1 sm:order-2"
            >
              Suivant
            </Button>
          </div>
        </div>
      ) : (
        /* ÉTAPE 2 : Ajout des participants */
        <div className="space-y-5 p-1">
          {/* En-tête avec les infos du groupe */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-4 border border-gray-200/50">
            <div className="flex items-center gap-3">
              {imagePreview ? (
                <img src={imagePreview} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-spiritual-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                  <Users className="w-6 h-6 text-primary-600" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{groupName}</h3>
                <p className="text-sm text-gray-500">
                  {selectedUsers.length} participant{selectedUsers.length !== 1 ? 's' : ''} sélectionné{selectedUsers.length !== 1 ? 's' : ''} sur {MAX_PARTICIPANTS} max
                </p>
              </div>
            </div>
          </div>

          {/* Recherche */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
              <div className="flex-1">
                <Input
                  placeholder="Rechercher des utilisateurs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon={Search}
                  className="w-full"
                />
                {searchTerm.length > 0 && searchTerm.length < 2 && (
                  <p className="text-xs text-amber-600 mt-1 ml-1">
                    Minimum 2 caractères pour la recherche
                  </p>
                )}
              </div>
              <Button 
                onClick={handleSearch} 
                disabled={isSearching || searchTerm.length < 2}
                variant="outline"
                className="w-full sm:w-auto whitespace-nowrap"
              >
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
                Rechercher
              </Button>
            </div>
          </div>

          {/* Résultats de recherche */}
          {searchResults.length > 0 && (
            <div className="border rounded-xl overflow-hidden max-h-52 overflow-y-auto">
              <div className="divide-y divide-gray-100">
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => addUser(result)}
                    className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-spiritual-400 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                        {result.first_name[0]}{result.last_name[0]}
                      </div>
                      <span className="text-sm font-medium text-gray-700 group-hover:text-primary-700 transition-colors">
                        {result.first_name} {result.last_name}
                      </span>
                    </div>
                    <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <UserPlus className="w-4 h-4 text-green-600" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message "Aucun résultat" */}
          {searchResults.length === 0 && searchTerm.length >= 2 && !isSearching && (
            <div className="text-center py-6 bg-gray-50 rounded-xl border border-gray-100">
              <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                Aucun utilisateur trouvé pour "{searchTerm}"
              </p>
              <button
                onClick={() => setSearchTerm('')}
                className="mt-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Effacer la recherche
              </button>
            </div>
          )}

          {/* Liste des participants sélectionnés */}
          {selectedUsers.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-sm font-medium text-gray-700">
                  Participants sélectionnés
                </h3>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                  {selectedUsers.length}/{MAX_PARTICIPANTS}
                </span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {selectedUsers.map((selected) => (
                  <div
                    key={selected.id}
                    className="flex items-center justify-between p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                        {selected.first_name[0]}{selected.last_name[0]}
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {selected.first_name} {selected.last_name}
                      </span>
                    </div>
                    <button
                      onClick={() => removeUser(selected.id)}
                      className="p-1.5 hover:bg-red-50 rounded-full transition-colors group"
                    >
                      <X className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* État vide */}
          {selectedUsers.length === 0 && searchResults.length === 0 && searchTerm.length < 2 && !isSearching && (
            <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-100 border-dashed">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 font-medium">Aucun participant sélectionné</p>
              <p className="text-xs text-gray-400 mt-1">Recherchez des utilisateurs pour les ajouter au groupe</p>
            </div>
          )}

          {/* Boutons - CORRIGÉS */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
            <Button variant="outline" fullWidth onClick={() => setStep('info')} className="sm:flex-1 order-2 sm:order-1">
              Retour
            </Button>
            <Button
              variant="primary"
              fullWidth
              onClick={handleCreateGroup}
              loading={isCreating}
              disabled={selectedUsers.length === 0}
              className="sm:flex-1 order-1 sm:order-2"
            >
              {isCreating ? 'Création en cours...' : 'Créer le groupe'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};