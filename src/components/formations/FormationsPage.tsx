import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter, Award, Plus, BookOpen, Users, Star, Clock, MapPin, Calendar, TrendingUp, Heart, Eye, Share2, Bookmark, Trophy, Zap, Globe, Building, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Card } from '../ui/Card';
import { Pagination } from '../ui/Pagination';
import { usePagination } from '../../hooks/usePagination';
import { FormationCard } from './FormationCard';
import { FormationDetailPage } from './FormationDetailPage';
import { EnrollmentModal } from './EnrollmentModal';
import { PaymentModal } from './PaymentModal';
import { ConfirmationModal } from './ConfirmationModal';
import { formationService, EnrichedFormation } from '../../services/formationService';
import { FormationCategory } from '../../types';

type EnrollmentStep = 'details' | 'enrollment' | 'payment' | 'confirmation';

export const FormationsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [formations, setFormations] = useState<EnrichedFormation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FormationCategory | ''>('');
  const [sortBy, setSortBy] = useState('upcoming');
  const [showMyFormations, setShowMyFormations] = useState(false);
  
  // Navigation et modales
  const [selectedFormation, setSelectedFormation] = useState<EnrichedFormation | null>(null);
  const [currentStep, setCurrentStep] = useState<EnrollmentStep>('details');
  const [enrollmentData, setEnrollmentData] = useState<any>(null);
  const [paymentData, setPaymentData] = useState<any>(null);
  
  // États des interactions
  const [likedFormations, setLikedFormations] = useState<string[]>([]);
  const [bookmarkedFormations, setBookmarkedFormations] = useState<string[]>([]);
  const [enrolledFormations, setEnrolledFormations] = useState<string[]>([]);
  const [userProgress, setUserProgress] = useState<Map<string, number>>(new Map());

  // Charger les formations depuis Supabase
  useEffect(() => {
    const fetchFormations = async () => {
      setIsLoading(true);
      try {
        const data = await formationService.getFormations();
        setFormations(data);
        
        // Vérifier les inscriptions existantes
        if (user) {
          const enrollments = await formationService.getUserEnrollments();
          const enrolledIds = enrollments.map(e => e.formation_id);
          setEnrolledFormations(enrolledIds);
          
          // Récupérer les progressions
          const progressMap = new Map();
          for (const enrollment of enrollments) {
            if (enrollment.progress) {
              progressMap.set(enrollment.formation_id, enrollment.progress);
            }
          }
          setUserProgress(progressMap);
        }
      } catch (error) {
        console.error('Error fetching formations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFormations();
  }, [user]);

  // Filtrer les formations
  const filteredFormations = useMemo(() => {
    let filtered = [...formations];

    if (searchTerm) {
      filtered = filtered.filter(f => 
        f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.description && f.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (f.instructor?.first_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (f.instructor?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(f => f.category === selectedCategory);
    }
    
    // Filtrer mes formations
    if (showMyFormations) {
      filtered = filtered.filter(f => enrolledFormations.includes(f.id));
    }

    // Tri
    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price-desc':
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'popular':
        filtered.sort((a, b) => (b.current_students || 0) - (a.current_students || 0));
        break;
      case 'duration':
        filtered.sort((a, b) => parseInt(a.duration || '0') - parseInt(b.duration || '0'));
        break;
      default: // upcoming
        filtered.sort((a, b) => new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime());
    }

    return filtered;
  }, [formations, searchTerm, selectedCategory, sortBy, showMyFormations, enrolledFormations]);

  // Pagination
  const {
    currentPage,
    totalPages,
    paginatedData: paginatedFormations,
    goToPage,
    resetPagination
  } = usePagination({ data: filteredFormations, itemsPerPage: 12 });

  // Reset pagination when filters change
  React.useEffect(() => {
    resetPagination();
  }, [searchTerm, selectedCategory, sortBy, showMyFormations, resetPagination]);

  const categoryOptions = [
    { value: '', label: 'Toutes catégories' },
    { value: FormationCategory.FAMILY_EDUCATION, label: 'Éducation familiale' },
    { value: FormationCategory.COUPLE_LIFE, label: 'Vie de couple' },
    { value: FormationCategory.YOUTH_FORMATION, label: 'Formation jeunesse' },
    { value: FormationCategory.BIBLICAL_STUDIES, label: 'Études bibliques' },
    { value: FormationCategory.THEOLOGY, label: 'Théologie' },
    { value: FormationCategory.LEADERSHIP, label: 'Leadership' },
    { value: FormationCategory.EVANGELIZATION, label: 'Évangélisation' },
    { value: FormationCategory.PRAYER_LIFE, label: 'Vie de prière' },
    { value: FormationCategory.SPIRITUAL_GROWTH, label: 'Croissance spirituelle' },
    { value: FormationCategory.MINISTRY_TRAINING, label: 'Formation ministérielle' }
  ];

  const sortOptions = [
    { value: 'upcoming', label: 'Prochaines sessions' },
    { value: 'popular', label: 'Plus populaires' },
    { value: 'rating', label: 'Mieux notées' },
    { value: 'price-asc', label: 'Prix croissant' },
    { value: 'price-desc', label: 'Prix décroissant' },
    { value: 'duration', label: 'Durée' }
  ];

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSortBy('upcoming');
    setShowMyFormations(false);
  };

  // Handlers pour les interactions
  const handleFormationClick = (formation: EnrichedFormation) => {
    setSelectedFormation(formation);
    setCurrentStep('details');
  };

  const handleBackToList = () => {
    setSelectedFormation(null);
    setCurrentStep('details');
    setEnrollmentData(null);
    setPaymentData(null);
  };

  const handleEnrollClick = (formation: EnrichedFormation) => {
    setSelectedFormation(formation);
    setCurrentStep('enrollment');
  };

  const handleEnrollmentComplete = async (data: any) => {
    if (selectedFormation) {
      const success = await formationService.enrollInFormation(selectedFormation.id);
      if (success) {
        setEnrolledFormations(prev => [...prev, selectedFormation.id]);
      }
    }
    setEnrollmentData(data);
    setCurrentStep('payment');
  };

  const handlePaymentComplete = (data: any) => {
    setPaymentData(data);
    setCurrentStep('confirmation');
  };

  const handleConfirmationComplete = () => {
    handleBackToList();
  };

  const handleLike = (formationId: string) => {
    setLikedFormations(prev => 
      prev.includes(formationId) 
        ? prev.filter(id => id !== formationId)
        : [...prev, formationId]
    );
  };

  const handleBookmark = (formationId: string) => {
    setBookmarkedFormations(prev => 
      prev.includes(formationId) 
        ? prev.filter(id => id !== formationId)
        : [...prev, formationId]
    );
  };

  const handleShare = async (formation: EnrichedFormation) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: formation.title,
          text: formation.description,
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Lien copié dans le presse-papiers !');
      }
    } catch (error) {
      console.log('Partage annulé');
    }
  };

  const handleMyFormations = () => {
    setShowMyFormations(!showMyFormations);
  };

  const handleMyCertificates = () => {
    const completed = Array.from(userProgress.entries()).filter(([_, progress]) => progress >= 100).length;
    alert(`Vous avez ${completed} formation(s) complétée(s) et certificat(s) disponible(s)`);
  };

  const handleBecomeInstructor = () => {
    alert('Candidature pour devenir formateur - Fonctionnalité à développer');
  };

  const stats = {
    total: filteredFormations.length,
    myFormations: enrolledFormations.length,
    free: filteredFormations.filter(f => !f.price || f.price === 0).length,
    avgRating: formations.reduce((sum, f) => sum + (f.rating || 0), 0) / (formations.length || 1)
  };

  // Si une formation est sélectionnée, afficher selon l'étape
  if (selectedFormation) {
    switch (currentStep) {
      case 'details':
        return (
          <FormationDetailPage
            formation={selectedFormation as any}
            onBack={handleBackToList}
            onEnroll={() => setCurrentStep('enrollment')}
            onLike={() => handleLike(selectedFormation.id)}
            onBookmark={() => handleBookmark(selectedFormation.id)}
            onShare={() => handleShare(selectedFormation)}
            isLiked={likedFormations.includes(selectedFormation.id)}
            isBookmarked={bookmarkedFormations.includes(selectedFormation.id)}
            isEnrolled={enrolledFormations.includes(selectedFormation.id)}
          />
        );
      case 'enrollment':
        return (
          <EnrollmentModal
            formation={selectedFormation as any}
            onBack={() => setCurrentStep('details')}
            onComplete={handleEnrollmentComplete}
          />
        );
      case 'payment':
        return (
          <PaymentModal
            formation={selectedFormation as any}
            enrollmentData={enrollmentData}
            onBack={() => setCurrentStep('enrollment')}
            onComplete={handlePaymentComplete}
          />
        );
      case 'confirmation':
        return (
          <ConfirmationModal
            formation={selectedFormation as any}
            enrollmentData={enrollmentData}
            paymentData={paymentData}
            onComplete={handleConfirmationComplete}
          />
        );
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* En-tête avec actions */}
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div className="text-center lg:text-left">
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-gray-900">
              Formations Chrétiennes
            </h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">
              Développez votre foi et vos compétences avec nos formations certifiées
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3">
            <Button 
              variant="outline" 
              icon={BookOpen} 
              className="w-full sm:w-auto"
              onClick={handleMyFormations}
            >
              📚 Mes formations ({enrolledFormations.length})
            </Button>
            <Button 
              variant="outline" 
              icon={Trophy} 
              className="w-full sm:w-auto"
              onClick={handleMyCertificates}
            >
              🏆 Mes certificats
            </Button>
            <Button 
              variant="primary" 
              icon={Plus} 
              className="w-full sm:w-auto"
              onClick={handleBecomeInstructor}
            >
              Devenir formateur
            </Button>
          </div>
        </div>

        {/* Statistiques enrichies */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card padding="sm" className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-primary-600">
              {stats.total}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Formations disponibles</div>
          </Card>
          <Card padding="sm" className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-spiritual-600">
              {stats.myFormations}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Mes inscriptions</div>
          </Card>
          <Card padding="sm" className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-warm-600">
              {stats.free}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Formations gratuites</div>
          </Card>
          <Card padding="sm" className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              {stats.avgRating.toFixed(1)}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Note moyenne</div>
          </Card>
        </div>

        {/* Filtres et recherche */}
        <Card>
          <div className="space-y-4">
            <div className="flex flex-col space-y-4 xl:flex-row xl:items-center xl:space-y-0 xl:space-x-4">
              <div className="flex-1">
                <Input
                  placeholder="Rechercher une formation, formateur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon={Search}
                />
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as FormationCategory | '')}
                  options={categoryOptions}
                  className="w-full sm:min-w-[180px]"
                />
                <Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  options={sortOptions}
                  className="w-full sm:min-w-[180px]"
                />
                <label className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={showMyFormations}
                    onChange={(e) => setShowMyFormations(e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Mes formations</span>
                </label>
              </div>
            </div>
            
            {(searchTerm || selectedCategory || showMyFormations) && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                <p className="text-sm text-gray-600 text-center sm:text-left">
                  {filteredFormations.length} formation{filteredFormations.length > 1 ? 's' : ''} trouvée{filteredFormations.length > 1 ? 's' : ''}
                </p>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Effacer les filtres
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Grille des formations */}
        <div className="formation-grid grid gap-4 sm:gap-6">
          {paginatedFormations.map((formation) => (
            <FormationCard
              key={formation.id}
              formation={formation as any}
              onClick={() => handleFormationClick(formation)}
              onEnroll={() => handleEnrollClick(formation)}
              onLike={() => handleLike(formation.id)}
              onShare={() => handleShare(formation)}
              onBookmark={() => handleBookmark(formation.id)}
              isLiked={likedFormations.includes(formation.id)}
              isBookmarked={bookmarkedFormations.includes(formation.id)}
              isEnrolled={enrolledFormations.includes(formation.id)}
            />
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
            totalItems={filteredFormations.length}
            itemsPerPage={12}
          />
        )}

        {/* Message si aucune formation */}
        {filteredFormations.length === 0 && (
          <Card className="text-center py-8 sm:py-12">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Award className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {showMyFormations ? 'Aucune formation inscrite' : 'Aucune formation trouvée'}
            </h3>
            <p className="text-gray-600 mb-4 text-sm sm:text-base px-4">
              {showMyFormations 
                ? 'Vous n\'êtes inscrit à aucune formation pour le moment.'
                : 'Aucune formation ne correspond à vos critères de recherche.'
              }
            </p>
            {showMyFormations && (
              <Button variant="primary" icon={Search} onClick={() => setShowMyFormations(false)}>
                Découvrir les formations
              </Button>
            )}
          </Card>
        )}

        {/* Call to action pour devenir formateur */}
        <Card className="bg-gradient-to-r from-spiritual-50 to-primary-50 border-spiritual-200">
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-spiritual-500 to-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Partagez votre expertise
            </h3>
            <p className="text-gray-600 mb-4">
              Devenez formateur certifié Koinonia et transmettez vos connaissances spirituelles
            </p>
            <Button variant="spiritual" onClick={handleBecomeInstructor}>
              Candidater comme formateur
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};