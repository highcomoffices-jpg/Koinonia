import React, { useState, useEffect, useCallback } from 'react';

interface CountdownTimerProps {
  targetDate: Date;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  format?: 'full' | 'compact';
  onCountdownEnd?: () => void;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isValid: boolean;
  hasPassed: boolean;
  isLoading?: boolean;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  targetDate,
  className = '',
  size = 'md',
  showLabels = true,
  format = 'full',
  onCountdownEnd
}) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isValid: true,
    hasPassed: false,
    isLoading: true
  });

  // Validation de la date
  const isValidDate = useCallback((date: Date): boolean => {
    return date instanceof Date && !isNaN(date.getTime());
  }, []);

  // Calcul du temps restant
  const calculateTimeLeft = useCallback((): Omit<TimeLeft, 'isLoading'> => {
    if (!isValidDate(targetDate)) {
      return { 
        days: 0, 
        hours: 0, 
        minutes: 0, 
        seconds: 0, 
        isValid: false, 
        hasPassed: false 
      };
    }

    const now = new Date();
    const difference = targetDate.getTime() - now.getTime();
    
    if (difference <= 0) {
      return { 
        days: 0, 
        hours: 0, 
        minutes: 0, 
        seconds: 0, 
        isValid: true, 
        hasPassed: true 
      };
    }

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((difference % (1000 * 60)) / 1000),
      isValid: true,
      hasPassed: false
    };
  }, [targetDate, isValidDate]);

  useEffect(() => {
    // Calcul initial
    const initialTimeLeft = calculateTimeLeft();
    setTimeLeft({ ...initialTimeLeft, isLoading: false });

    // Si le compte à rebours est déjà terminé, ne pas créer d'intervalle
    if (initialTimeLeft.hasPassed || !initialTimeLeft.isValid) {
      if (initialTimeLeft.hasPassed && onCountdownEnd) {
        onCountdownEnd();
      }
      return;
    }

    const interval = setInterval(() => {
      const newTimeLeft = calculateTimeLeft();
      setTimeLeft({ ...newTimeLeft, isLoading: false });

      if (newTimeLeft.hasPassed && onCountdownEnd) {
        onCountdownEnd();
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate, calculateTimeLeft, onCountdownEnd]);

  // Classes de taille
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  const labelSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  // Composant réutilisable pour chaque unité de temps
  const TimeUnit: React.FC<{
    value: number;
    label: string;
    ariaLabel: string;
  }> = ({ value, label, ariaLabel }) => (
    <div 
      className="flex items-center space-x-1 bg-orange-100 px-2 py-1 rounded-lg border border-orange-200"
      role="timer"
      aria-label={ariaLabel}
    >
      <span className={`font-bold text-orange-700 ${sizeClasses[size]}`}>
        {value.toString().padStart(2, '0')}
      </span>
      <span className={`text-orange-600 ${labelSizeClasses[size]} font-medium`}>
        {label}
      </span>
    </div>
  );

  // États de chargement et d'erreur
  if (timeLeft.isLoading) {
    return (
      <div 
        className={`flex items-center justify-center space-x-2 ${className}`}
        aria-live="polite"
      >
        <div className="animate-pulse bg-gray-200 h-8 w-20 rounded-lg"></div>
        <div className="animate-pulse bg-gray-200 h-8 w-20 rounded-lg"></div>
        <div className="animate-pulse bg-gray-200 h-8 w-20 rounded-lg"></div>
      </div>
    );
  }

  if (!timeLeft.isValid) {
    return (
      <span 
        className={`${sizeClasses[size]} text-red-500 ${className}`}
        role="alert"
        aria-label="Date de compte à rebours invalide"
      >
        ❌ Date invalide
      </span>
    );
  }

  if (timeLeft.hasPassed) {
    return (
      <span 
        className={`${sizeClasses[size]} text-green-600 font-medium ${className}`}
        role="status"
        aria-label="Le compte à rebours est terminé"
      >
        ✓ Événement en cours
      </span>
    );
  }

  // Format compact
  if (format === 'compact') {
    return (
      <span 
        className={`${sizeClasses[size]} font-bold text-orange-600 ${className}`}
        role="timer"
        aria-label={`Temps restant: ${timeLeft.days} jours, ${timeLeft.hours} heures, ${timeLeft.minutes} minutes`}
      >
        {timeLeft.days}j {timeLeft.hours}h {timeLeft.minutes}m
      </span>
    );
  }

  // Format complet avec accessibilité
  return (
    <div 
      className={`flex items-center justify-center space-x-1 sm:space-x-2 ${className}`}
      role="timer"
      aria-label={`Temps restant: ${timeLeft.days} jours, ${timeLeft.hours} heures, ${timeLeft.minutes} minutes, ${timeLeft.seconds} secondes`}
    >
      <TimeUnit 
        value={timeLeft.days} 
        label="J" 
        ariaLabel={`${timeLeft.days} jours`} 
      />
      <TimeUnit 
        value={timeLeft.hours} 
        label="H" 
        ariaLabel={`${timeLeft.hours} heures`} 
      />
      <TimeUnit 
        value={timeLeft.minutes} 
        label="M" 
        ariaLabel={`${timeLeft.minutes} minutes`} 
      />
      <TimeUnit 
        value={timeLeft.seconds} 
        label="S" 
        ariaLabel={`${timeLeft.seconds} secondes`} 
      />
    </div>
  );
};

// Composant wrapper pour une meilleure réutilisabilité
export const CountdownTimerWithLabel: React.FC<CountdownTimerProps & { label?: string }> = (props) => {
  const { label = "Temps restant avant l'événement", ...timerProps } = props;
  
  return (
    <div className="flex flex-col items-center">
      {label && (
        <span className="text-sm text-gray-600 mb-2" aria-hidden="true">
          {label}
        </span>
      )}
      <CountdownTimer {...timerProps} />
    </div>
  );
};

export default CountdownTimer;