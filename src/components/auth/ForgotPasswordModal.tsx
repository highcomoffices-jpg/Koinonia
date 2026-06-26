import React, { useState } from 'react';
import { X, Mail, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      setIsSent(true);
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError(err.message || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setIsSent(false);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <Card className="w-full max-w-md relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-primary-600 to-spiritual-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Mot de passe oublié</h2>
          <p className="text-sm text-gray-600 mt-1">
            Saisissez votre email pour recevoir un lien de réinitialisation
          </p>
        </div>

        {isSent ? (
          <div className="text-center py-4">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-gray-700 font-medium">Email envoyé !</p>
            <p className="text-sm text-gray-500 mt-1">
              Consultez votre boîte mail pour réinitialiser votre mot de passe.
            </p>
            <Button variant="primary" fullWidth className="mt-4" onClick={handleClose}>
              Fermer
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Adresse email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              icon={Mail}
              required
              disabled={isLoading}
            />

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex space-x-3 pt-2">
              <Button
                type="button"
                variant="outline"
                fullWidth
                onClick={handleClose}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                variant="spiritual"
                fullWidth
                loading={isLoading}
                disabled={isLoading || !email.trim()}
              >
                Envoyer
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};
