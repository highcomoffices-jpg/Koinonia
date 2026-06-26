import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export const EmailConfirmationPage: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const confirmEmail = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      const type = params.get('type');

      if (!token) {
        setStatus('error');
        setMessage('Lien de confirmation invalide.');
        return;
      }

      try {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: type === 'signup' ? 'signup' : 'email',
        });

        if (error) throw error;

        setStatus('success');
        setMessage('Votre compte a été confirmé avec succès !');
        
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } catch (error: any) {
        setStatus('error');
        setMessage(error.message || 'Une erreur est survenue lors de la confirmation.');
      }
    };

    confirmEmail();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-spiritual-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 animate-spin text-primary-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900">Confirmation en cours...</h2>
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900">Email confirmé !</h2>
            <p className="text-gray-600 mt-2">{message}</p>
            <Button 
              variant="primary" 
              fullWidth 
              className="mt-4"
              onClick={() => navigate('/')}
            >
              Accéder à l'accueil
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900">Erreur</h2>
            <p className="text-gray-600 mt-2">{message}</p>
            <Button 
              variant="outline" 
              fullWidth 
              className="mt-4"
              onClick={() => navigate('/login')}
            >
              Retour à la connexion
            </Button>
          </>
        )}
      </Card>
    </div>
  );
};
