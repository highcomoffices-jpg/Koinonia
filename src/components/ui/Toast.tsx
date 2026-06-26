import React, { useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Info, Bell, ThumbsUp, ShieldAlert } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
  title?: string;
}

export const Toast: React.FC<ToastProps> = ({ 
  message, 
  type = 'error', 
  duration = 5000, 
  onClose,
  title
}) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success': 
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'error': 
        return <ShieldAlert className="w-6 h-6 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-6 h-6 text-amber-600" />;
      case 'info': 
        return <Info className="w-6 h-6 text-blue-600" />;
      default:
        return <Bell className="w-6 h-6 text-gray-600" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success': return 'bg-green-100 border-green-300';
      case 'error': return 'bg-red-100 border-red-300';
      case 'warning': return 'bg-amber-100 border-amber-300';
      case 'info': return 'bg-blue-100 border-blue-300';
      default: return 'bg-gray-100 border-gray-300';
    }
  };

  const getTitle = () => {
    if (title) return title;
    switch (type) {
      case 'success': return 'Succès !';
      case 'error': return 'Erreur';
      case 'warning': return 'Attention';
      case 'info': return 'Information';
      default: return 'Notification';
    }
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md mx-4">
      <div className={`flex items-start gap-3 px-4 py-4 rounded-xl shadow-xl border ${getBgColor()}`}>
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 text-sm">
            {getTitle()}
          </h4>
          <p className="text-sm text-gray-800 mt-0.5 break-words">
            {message}
          </p>
        </div>
        
        <button 
          onClick={onClose} 
          className="flex-shrink-0 ml-2 p-1 text-gray-500 hover:text-gray-700 hover:bg-white/50 rounded-lg transition-colors"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};