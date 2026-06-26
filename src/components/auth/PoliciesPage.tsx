import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Users, Eye, FileText, CheckCircle, ArrowLeft } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export const PoliciesPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-spiritual-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Politiques de Koinonia</h1>
        </div>

        {/* Politique de confidentialité */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Politique de confidentialité</h2>
          </div>
          <div className="space-y-4 text-sm text-gray-700">
            <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
              <Lock className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">1. Collecte des données</p>
                <p className="text-gray-600">Koinonia collecte vos nom, prénom, email, pays, ville, confession et paroisse pour vous offrir une expérience personnalisée.</p>
              </div>
            </div>
            <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
              <Eye className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">2. Utilisation des données</p>
                <p className="text-gray-600">Vos données sont utilisées pour vous connecter à votre communauté, vous proposer des contenus pertinents et faciliter les échanges.</p>
              </div>
            </div>
            <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
              <Shield className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">3. Sécurité</p>
                <p className="text-gray-600">Vos données sont chiffrées et protégées conformément au RGPD. Koinonia ne revend jamais vos données à des tiers.</p>
              </div>
            </div>
            <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
              <Users className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">4. Partage</p>
                <p className="text-gray-600">Certaines informations (nom, ville, paroisse) sont visibles par les membres de votre communauté pour favoriser les échanges.</p>
              </div>
            </div>
            <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
              <FileText className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">5. Suppression</p>
                <p className="text-gray-600">Vous pouvez à tout moment demander la suppression de votre compte et de vos données via les paramètres.</p>
              </div>
            </div>
            <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">6. Contact</p>
                <p className="text-gray-600">Pour toute question, contactez l'équipe Koinonia via le support intégré à l'application.</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Politique d'utilisation */}
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Politique d'utilisation</h2>
          </div>
          <div className="space-y-4 text-sm text-gray-700">
            <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
              <Users className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">1. Respect</p>
                <p className="text-gray-600">Les membres s'engagent à respecter toutes les confessions chrétiennes et à ne pas tenir de propos discriminatoires, haineux ou blasphématoires.</p>
              </div>
            </div>
            <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
              <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">2. Authenticité</p>
                <p className="text-gray-600">Les informations fournies doivent être authentiques. L'usurpation d'identité est interdite.</p>
              </div>
            </div>
            <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
              <FileText className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">3. Contenus</p>
                <p className="text-gray-600">Les contenus publiés doivent respecter les valeurs chrétiennes et ne pas contenir de propos violents, offensants ou inappropriés.</p>
              </div>
            </div>
            <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">4. Modération</p>
                <p className="text-gray-600">Koinonia se réserve le droit de modérer, désactiver ou supprimer tout contenu ne respectant pas ces règles.</p>
              </div>
            </div>
            <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
              <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">5. Sanctions</p>
                <p className="text-gray-600">Le non-respect de ces règles peut entraîner un avertissement, une suspension temporaire ou une exclusion définitive.</p>
              </div>
            </div>
            <div className="flex gap-3 p-3 bg-gray-50 rounded-lg">
              <FileText className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">6. Évolution</p>
                <p className="text-gray-600">Ces politiques peuvent évoluer. Les membres seront informés des modifications.</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Version simplifiée */}
        <Card className="p-6 bg-gradient-to-br from-primary-50 to-spiritual-50 border-primary-200">
          <h3 className="font-semibold text-gray-900 mb-2">📋 En résumé</h3>
          <p className="text-sm text-gray-700">
            En créant votre compte, vous acceptez que Koinonia collecte et protège vos données, 
            et vous vous engagez à respecter les valeurs chrétiennes et les autres membres de la communauté.
          </p>
        </Card>

        {/* Bouton retour */}
        <div className="flex justify-center">
          <Button variant="primary" onClick={() => navigate(-1)}>
            Retour
          </Button>
        </div>
      </div>
    </div>
  );
};
