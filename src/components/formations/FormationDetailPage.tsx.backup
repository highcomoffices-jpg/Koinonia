import React, { useState } from 'react';
import { ArrowLeft, Play, Clock, Users, Star, MapPin, Calendar, Award, Download, Share2, Heart, Bookmark, Eye, Globe, Building, CheckCircle, Gift, MessageCircle, Phone, Mail, Video, FileText, HelpCircle, Zap, Crown, Target } from 'lucide-react';
import { Formation } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { CountdownTimer } from '../ui/CountdownTimer';
import { ProgressBar } from '../ui/ProgressBar';
import { VideoPlayer } from '../ui/VideoPlayer';

interface FormationDetailPageProps {
  formation: Formation;
  onBack: () => void;
  onEnroll: () => void;
  onLike: () => void;
  onBookmark: () => void;
  onShare: () => void;
  isLiked: boolean;
  isBookmarked: boolean;
  isEnrolled: boolean;
}

export const FormationDetailPage: React.FC<FormationDetailPageProps> = ({ 
  formation, 
  onBack, 
  onEnroll,
  onLike, 
  onBookmark, 
  onShare,
  isLiked,
  isBookmarked,
  isEnrolled
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'program' | 'instructor' | 'reviews'>('overview');
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedModuleVideo, setSelectedModuleVideo] = useState<string | null>(null);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [likesCount, setLikesCount] = useState(Math.floor(Math.random() * 100) + 50);

  // === AJOUTS POUR ALIGNEMENT AVEC DONNÉES RÉELLES ===
  
  // Guard pour l'instructeur
  const instructor = formation.instructor || {
    id: '1',
    firstName: 'Formateur',
    lastName: 'Koinonia',
    email: 'formateur@koinonia.bj',
    profileComplete: true,
    role: 'vigneron',
    level: 'berger',
    country: null,
    city: '',
    confession: null,
    parish: null,
    avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    bio: 'Formateur certifié sur la plateforme Koinonia',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Modules par défaut
  const modules = formation.modules || [];

  // Ratings avec valeurs par défaut
  const rating = formation.rating || 4.5;
  const reviewsCount = formation.reviewsCount || 0;

  // Localisation depuis formation ou par défaut
  const location = formation.location || 'En ligne via Koinonia Live';
  const fullAddress = formation.location || 'Lien de connexion envoyé par email';

  // Dates : utiliser date_start si disponible, sinon simulation
  const startDate = formation.date_start ? new Date(formation.date_start) : new Date(Date.now() + 16 * 24 * 60 * 60 * 1000);
  const endDate = formation.date_end ? new Date(formation.date_end) : null;

  // Simulation de places
  const currentStudents = formation.currentStudents || Math.floor(Math.random() * 20) + 5;
  const maxStudents = formation.maxStudents || 30;
  const placesRestantes = maxStudents - currentStudents;
  const progressPercentage = maxStudents ? (currentStudents / maxStudents) * 100 : 0;

  // =====================================================

  // Données simulées pour les avis (gardées pour l'UI)
  const mockReviews = [
    {
      id: '1',
      author: 'Catherine Lawani', // CORRIGÉ
      avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      rating: 5,
      date: new Date('2024-01-15'),
      comment: 'Formation exceptionnelle ! Le Dr. Catherine explique avec une clarté remarquable. Les outils pratiques m\'ont vraiment aidée dans l\'éducation de mes enfants.',
      helpful: 12
    },
    {
      id: '2',
      author: 'Emmanuel Gando', // CORRIGÉ
      avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      rating: 5,
      date: new Date('2024-01-10'),
      comment: 'Contenu riche et bien structuré. Les sessions live sont très interactives. Je recommande vivement !',
      helpful: 8
    },
    {
      id: '3',
      author: 'Marie Consolation', // CORRIGÉ
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
      rating: 4,
      date: new Date('2024-01-08'),
      comment: 'Très bonne formation, j\'ai appris beaucoup. Seul bémol : j\'aurais aimé plus d\'exemples concrets.',
      helpful: 5
    }
  ];

  // Avatars des inscrits (simulation - pourrait venir de formation_enrollments)
  const enrolledAvatars = [
    'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2', // Catherine Lawani
    'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2', // Emmanuel Gando
    'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2', // Marie Consolation
    'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2' // Pierre Agbodjan
  ];

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: Eye },
    { id: 'program', label: 'Programme', icon: Award },
    { id: 'instructor', label: 'Formateur', icon: Users },
    { id: 'reviews', label: 'Avis', icon: Star }
  ];

  const handleLike = () => {
    setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
    onLike();
  };

  const handleModuleVideoClick = (moduleId: string) => {
    setSelectedModuleVideo(moduleId);
    setShowVideoModal(true);
  };

  const handleScrollToEnrollment = () => {
    const enrollmentSection = document.getElementById('enrollment-section');
    enrollmentSection?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatPrice = (price: number) => {
    if (price === 0) return 'Gratuit';
    return `${price.toLocaleString()} FCFA`;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) 
            ? 'text-yellow-400 fill-current' 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  const getModuleIcon = (moduleTitle: string) => {
    if (moduleTitle.toLowerCase().includes('live') || moduleTitle.toLowerCase().includes('q&a')) return Video;
    if (moduleTitle.toLowerCase().includes('quiz') || moduleTitle.toLowerCase().includes('évaluation')) return HelpCircle;
    return FileText;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'program':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Programme pédagogique détaillé</h3>
              <p className="text-gray-600 mb-6">
                Cette formation comprend {modules.length} modules progressifs, conçus pour vous accompagner étape par étape dans votre apprentissage.
              </p>
            </div>

            <div className="space-y-4">
              {modules.map((module, index) => {
                const ModuleIcon = getModuleIcon(module.title);
                const isLiveModule = module.title.toLowerCase().includes('live');
                
                return (
                  <Card key={module.id} className="hover:shadow-md transition-shadow">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-spiritual-400 to-primary-400 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold">{module.order || index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-semibold text-gray-900">{module.title}</h4>
                          {isLiveModule && (
                            <span className="bg-red-100 text-red-800 text-xs rounded-full px-2 py-1 animate-pulse">
                              🔴 Live
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{module.description}</p>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{module.duration || '1h'}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <ModuleIcon className="w-4 h-4" />
                            <span>
                              {isLiveModule ? 'Session interactive' : 
                               module.title.toLowerCase().includes('quiz') ? 'Évaluation' : 'Contenu vidéo'}
                            </span>
                          </div>
                        </div>

                        {/* Ressources */}
                        {module.resources && module.resources.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {module.resources.map((resource, idx) => (
                              <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                {resource.includes('PDF') && '📄 '}
                                {resource.includes('Vidéo') && '🎥 '}
                                {resource.includes('Quiz') && '❓ '}
                                {resource.includes('Live') && '🔴 '}
                                {resource.includes('Exercice') && '✏️ '}
                                {resource}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Bouton de prévisualisation */}
                        {module.videoUrl && (
                          <div className="mt-3">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              icon={Play}
                              onClick={() => handleModuleVideoClick(module.id)}
                            >
                              Voir l'aperçu
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        );

      case 'instructor':
        return (
          <div className="space-y-6">
            <div className="flex items-start space-x-6">
              <div className="w-24 h-24 bg-gradient-to-br from-primary-400 to-spiritual-400 rounded-full flex items-center justify-center">
                {instructor.avatar ? (
                  <img src={instructor.avatar} alt={`${instructor.firstName} ${instructor.lastName}`} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-white text-2xl font-bold">
                    {instructor.firstName[0]}{instructor.lastName[0]}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {instructor.firstName} {instructor.lastName}
                </h3>
                <p className="text-spiritual-600 font-medium mb-4">
                  {instructor.role === 'vigneron' ? 'Formateur certifié' : 'Formateur'} Koinonia • Expert en {formation.category}
                </p>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xl font-bold text-primary-600">5</div>
                    <div className="text-sm text-gray-600">Formations</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-spiritual-600">{currentStudents}+</div>
                    <div className="text-sm text-gray-600">Étudiants</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-warm-600">{rating.toFixed(1)}</div>
                    <div className="text-sm text-gray-600">Note moyenne</div>
                  </div>
                </div>
              </div>
            </div>

            <Card>
              <h4 className="font-semibold text-gray-900 mb-3">Biographie et expertise</h4>
              <div className="prose prose-sm max-w-none text-gray-700">
                <p className="mb-4">
                  {instructor.bio || `Le Dr. ${instructor.firstName} ${instructor.lastName} est un formateur expérimenté spécialisé en ${formation.category}.`}
                </p>
                <p className="mb-4">
                  Avec plusieurs années d'expérience sur la plateforme Koinonia, il/elle a accompagné de nombreux participants dans leur parcours de formation.
                </p>
                <p>
                  Son approche pédagogique combine une base biblique solide avec des méthodes modernes adaptées au contexte des participants.
                </p>
              </div>
            </Card>

            <Card>
              <h4 className="font-semibold text-gray-900 mb-3">Disponibilités</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Award className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm">Formateur certifié Koinonia</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Award className="w-5 h-5 text-blue-500" />
                  <span className="text-sm">Spécialiste en {formation.category}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Award className="w-5 h-5 text-green-500" />
                  <span className="text-sm">Réponses aux questions sous 24h</span>
                </div>
              </div>
            </Card>

            <div className="flex space-x-3">
              <Button variant="outline" icon={MessageCircle} fullWidth>
                Contacter le formateur
              </Button>
              <Button variant="outline" icon={Eye} fullWidth>
                Voir le profil complet
              </Button>
            </div>
          </div>
        );

      case 'reviews':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Avis et témoignages</h3>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  {renderStars(rating)}
                </div>
                <span className="font-bold text-lg">{rating.toFixed(1)}</span>
                <span className="text-gray-500">({reviewsCount} avis)</span>
              </div>
            </div>

            {/* Répartition des notes */}
            <Card>
              <h4 className="font-semibold text-gray-900 mb-4">Répartition des notes</h4>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const percentage = stars === 5 ? 80 : stars === 4 ? 15 : stars === 3 ? 3 : stars === 2 ? 1 : 1;
                  return (
                    <div key={stars} className="flex items-center space-x-3">
                      <span className="text-sm w-8">{stars} ⭐</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-400 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-12">{percentage}%</span>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Liste des avis */}
            <div className="space-y-4">
              {mockReviews.slice(0, showAllReviews ? mockReviews.length : 3).map((review) => (
                <Card key={review.id}>
                  <div className="flex items-start space-x-4">
                    <img
                      src={review.avatar}
                      alt={review.author}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h5 className="font-medium text-gray-900">{review.author}</h5>
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-1">
                              {renderStars(review.rating)}
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Intl.DateTimeFormat('fr').format(review.date)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed mb-3">
                        {review.comment}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <button className="hover:text-blue-600 transition-colors">
                          👍 Utile ({review.helpful})
                        </button>
                        <button className="hover:text-gray-700 transition-colors">
                          Répondre
                        </button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {mockReviews.length > 3 && (
              <div className="text-center">
                <Button 
                  variant="outline" 
                  onClick={() => setShowAllReviews(!showAllReviews)}
                >
                  {showAllReviews ? 'Voir moins d\'avis' : `Voir tous les avis (${mockReviews.length})`}
                </Button>
              </div>
            )}
          </div>
        );

      default: // overview
        return (
          <div className="space-y-6">
            {/* Objectifs pédagogiques */}
            <Card>
              <h3 className="text-xl font-bold text-gray-900 mb-4">🎯 Objectifs pédagogiques</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Target className="w-5 h-5 text-primary-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900">Comprendre les fondements bibliques</h4>
                    <p className="text-sm text-gray-600">Maîtriser les principes scripturaires de {formation.category.toLowerCase()}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Target className="w-5 h-5 text-spiritual-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900">Développer des outils pratiques</h4>
                    <p className="text-sm text-gray-600">Acquérir des méthodes concrètes adaptées au contexte des participants</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Target className="w-5 h-5 text-warm-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900">Créer un environnement spirituel</h4>
                    <p className="text-sm text-gray-600">Établir une atmosphère propice à la croissance spirituelle</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Modalités de suivi */}
            <Card>
              <h3 className="text-xl font-bold text-gray-900 mb-4">📋 Modalités de suivi</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Mode présentiel</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>• Sessions en groupe dans nos locaux</p>
                    <p>• Interaction directe avec le formateur</p>
                    <p>• Exercices pratiques en équipe</p>
                    <p>• Support pédagogique physique inclus</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Mode en ligne</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>• Accès depuis chez vous</p>
                    <p>• Sessions live interactives</p>
                    <p>• Replay disponible 24h/24</p>
                    <p>• Chat en direct avec le formateur</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Politique d'annulation */}
            <Card>
              <h3 className="text-xl font-bold text-gray-900 mb-4">🔄 Politique d'annulation et remboursement</h3>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Remboursement intégral sous 7 jours</p>
                    <p className="text-gray-600">Si vous n'êtes pas satisfait, remboursement complet sans question</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Report possible</p>
                    <p className="text-gray-600">Possibilité de reporter votre inscription à la session suivante</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-purple-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Support continu</p>
                    <p className="text-gray-600">Assistance pédagogique pendant toute la durée de la formation</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Prérequis */}
            <Card>
              <h3 className="text-xl font-bold text-gray-900 mb-4">📚 Prérequis et recommandations</h3>
              <div className="space-y-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">✅ Aucun prérequis technique</h4>
                  <p className="text-sm text-green-800">
                    Cette formation est accessible à tous, quel que soit votre niveau de connaissance biblique.
                  </p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">📖 Recommandations</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Avoir une Bible personnelle</li>
                    <li>• Carnet de notes pour les exercices pratiques</li>
                    <li>• Cœur ouvert à l'apprentissage et à la transformation</li>
                    <li>• Engagement à suivre les modules dans l'ordre</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        );
    }
  };

  // Modifier les références dans le JSX :
  // Remplacer formation.instructor par instructor
  // Remplacer formation.rating par rating
  // Remplacer formation.reviewsCount par reviewsCount
  // Remplacer formation.currentStudents par currentStudents
  // Remplacer formation.maxStudents par maxStudents

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb et retour */}
        <div className="flex items-center space-x-2 mb-6">
          <Button 
            variant="ghost" 
            icon={ArrowLeft} 
            onClick={onBack}
            className="hover:bg-primary-50 hover:text-primary-600"
          >
            Retour aux formations
          </Button>
          <span className="text-gray-400">•</span>
          <span className="text-sm text-gray-600">{formation.category}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contenu principal */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero section */}
            <Card>
              <div className="space-y-6">
                {/* Image principale */}
                <div className="relative aspect-video rounded-lg overflow-hidden cursor-pointer group">
                  <img
                    src={formation.imageUrl || 'https://images.pexels.com/photos/1624504/pexels-photo-1624504.jpeg?auto=compress&cs=tinysrgb&w=800'}
                    alt={formation.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Button 
                        variant="primary" 
                        icon={Play}
                        onClick={() => setShowVideoModal(true)}
                      >
                        Voir la présentation
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Titre et description */}
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                        {formation.title}
                      </h1>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                          {formation.category}
                        </span>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{formation.duration}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Award className="w-4 h-4" />
                          <span>{modules.length} modules</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" icon={Bookmark} onClick={onBookmark}>
                        <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                      </Button>
                      <Button variant="ghost" icon={Share2} onClick={onShare}>
                        <Share2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" icon={Heart} onClick={handleLike}>
                        <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                      </Button>
                    </div>
                  </div>

                  <p className="text-gray-700 leading-relaxed text-base">
                    {formation.description}
                  </p>
                </div>

                {/* Décompte dynamique */}
                <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-6">
                  <div className="text-center">
                    <h3 className="text-lg font-bold text-orange-900 mb-4">
                      ⏰ La formation démarre dans :
                    </h3>
                    <CountdownTimer 
                      targetDate={startDate}
                      size="lg"
                      className="justify-center"
                    />
                    <p className="text-sm text-orange-700 mt-3">
                      Début prévu le {formatDate(startDate)}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Navigation par onglets */}
            <Card>
              <div className="flex flex-wrap gap-2 mb-6">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                        isActive
                          ? 'bg-gradient-to-r from-spiritual-500 to-primary-500 text-white'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Contenu de l'onglet */}
              {renderTabContent()}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Informations pratiques */}
            <Card className="sticky top-6" id="enrollment-section">
              <h3 className="font-bold text-gray-900 mb-4">📋 Informations pratiques</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="w-4 h-4 text-primary-600" />
                    <span className="font-medium text-gray-900">Date de début</span>
                  </div>
                  <p className="text-sm text-gray-700 ml-6">
                    {formatDate(startDate)}
                  </p>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <MapPin className="w-4 h-4 text-spiritual-600" />
                    <span className="font-medium text-gray-900">Lieu</span>
                  </div>
                  <p className="text-sm text-gray-700 ml-6">
                    {location}
                  </p>
                  <p className="text-xs text-gray-500 ml-6 mt-1">
                    {fullAddress}
                  </p>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-4 h-4 text-warm-600" />
                    <span className="font-medium text-gray-900">Durée</span>
                  </div>
                  <p className="text-sm text-gray-700 ml-6">
                    {formation.duration} • {modules.reduce((total, module) => {
                      const duration = module.duration?.match(/\d+/)?.[0] || '0';
                      return total + parseInt(duration);
                    }, 0)}h de contenu total
                  </p>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Award className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-gray-900">Prérequis</span>
                  </div>
                  <p className="text-sm text-gray-700 ml-6">
                    Aucun prérequis • Tous niveaux
                  </p>
                </div>
              </div>
            </Card>

            {/* Formateur */}
            <Card>
              <h3 className="font-bold text-gray-900 mb-4">👨‍🏫 Votre formateur</h3>
              <div className="flex items-center space-x-3 mb-4">
                {instructor.avatar ? (
                  <img src={instructor.avatar} alt={instructor.firstName} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-spiritual-400 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">
                      {instructor.firstName[0]}{instructor.lastName[0]}
                    </span>
                  </div>
                )}
                <div>
                  <h4 className="font-medium text-gray-900">
                    {instructor.firstName} {instructor.lastName}
                  </h4>
                  <p className="text-sm text-gray-600">Expert certifié</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3 text-center text-sm mb-4">
                <div>
                  <div className="font-bold text-primary-600">5</div>
                  <div className="text-gray-600">Formations</div>
                </div>
                <div>
                  <div className="font-bold text-spiritual-600">{currentStudents}+</div>
                  <div className="text-gray-600">Étudiants</div>
                </div>
                <div>
                  <div className="font-bold text-warm-600">{rating.toFixed(1)}</div>
                  <div className="text-gray-600">Note</div>
                </div>
              </div>

              <Button variant="outline" size="sm" fullWidth icon={Eye}>
                Voir le profil complet
              </Button>
            </Card>

            {/* Inscriptions avec avatars */}
            <Card>
              <h3 className="font-bold text-gray-900 mb-4">👥 Inscriptions</h3>
              
              {/* Barre de progression */}
              <div className="mb-4">
                <ProgressBar
                  current={currentStudents}
                  max={maxStudents}
                  label="Places occupées"
                  color={progressPercentage > 80 ? 'red' : progressPercentage > 60 ? 'orange' : 'green'}
                />
              </div>

              {/* Avatars des inscrits */}
              <div className="flex items-center space-x-2 mb-4">
                <div className="flex -space-x-2">
                  {enrolledAvatars.slice(0, Math.min(8, currentStudents)).map((avatar, index) => (
                    <img
                      key={index}
                      src={avatar}
                      alt={`Participant ${index + 1}`}
                      className="w-8 h-8 rounded-full border-2 border-white object-cover"
                    />
                  ))}
                  {currentStudents > 8 && (
                    <div className="w-8 h-8 bg-gray-300 rounded-full border-2 border-white flex items-center justify-center">
                      <span className="text-xs font-bold text-gray-600">
                        +{currentStudents - 8}
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-sm text-gray-600 ml-2">
                  {currentStudents} participant{currentStudents > 1 ? 's' : ''} inscrit{currentStudents > 1 ? 's' : ''}
                </span>
              </div>

              {placesRestantes && placesRestantes <= 5 && placesRestantes > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800 font-medium">
                    ⚠️ Plus que {placesRestantes} place{placesRestantes > 1 ? 's' : ''} disponible{placesRestantes > 1 ? 's' : ''} !
                  </p>
                </div>
              )}
            </Card>

            {/* Prix et inscription */}
            <Card className="bg-gradient-to-r from-primary-50 to-spiritual-50 border-primary-200">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600 mb-2">
                  {formatPrice(formation.price)}
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {placesRestantes > 0 ? `${placesRestantes} places restantes` : 'Formation complète'}
                </p>
                
                <div className="space-y-3">
                  <Button 
                    variant="spiritual" 
                    size="lg" 
                    fullWidth
                    onClick={onEnroll}
                    disabled={placesRestantes <= 0 && !isEnrolled}
                    className="text-lg py-3"
                  >
                    {placesRestantes <= 0 && !isEnrolled ? 'Formation complète' : 
                     isEnrolled ? 'Déjà inscrit ✓' : 'S\'inscrire maintenant'}
                  </Button>
                  
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>✅ Accès à vie au contenu</p>
                    <p>✅ Certificat de participation</p>
                    <p>✅ Support pédagogique inclus</p>
                    <p>✅ Remboursement sous 7 jours</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Note et avis */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">⭐ Avis des participants</h3>
                <Button variant="outline" size="sm" onClick={() => setActiveTab('reviews')}>
                  Voir tous les avis
                </Button>
              </div>
              
              <div className="flex items-center space-x-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{rating.toFixed(1)}</div>
                  <div className="flex items-center space-x-1">
                    {renderStars(rating)}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">
                    Basé sur {reviewsCount} avis vérifiés
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-sm text-green-600">98% recommandent</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-sm text-blue-600">Taux de completion: 94%</span>
                  </div>
                </div>
              </div>

              {/* Aperçu d'un avis */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <img
                    src="https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2"
                    alt="Marie Adjovi"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Marie Adjovi</p>
                    <div className="flex items-center space-x-1">
                      {renderStars(5)}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-700 italic">
                  "Formation exceptionnelle ! Les outils pratiques m'ont vraiment aidée..."
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};