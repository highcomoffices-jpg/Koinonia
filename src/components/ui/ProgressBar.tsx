import React from 'react';

interface ProgressBarProps {
  current: number;
  max: number;
  label?: string;
  showPercentage?: boolean;
  showNumbers?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'spiritual' | 'green' | 'orange' | 'red';
  animated?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  max,
  label,
  showPercentage = true,
  showNumbers = true,
  size = 'md',
  color = 'primary',
  animated = true,
  className = ''
}) => {
  const percentage = Math.min((current / max) * 100, 100);

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const colorClasses = {
    primary: 'from-primary-500 to-primary-600',
    spiritual: 'from-spiritual-500 to-spiritual-600',
    green: 'from-green-500 to-emerald-500',
    orange: 'from-orange-500 to-red-500',
    red: 'from-red-500 to-red-600'
  };

  const getStatusColor = () => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-orange-600';
    return 'text-green-600';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* En-tête avec label et statistiques */}
      {(label || showNumbers || showPercentage) && (
        <div className="flex items-center justify-between text-sm">
          {label && (
            <span className="text-gray-600 font-medium">{label}</span>
          )}
          <div className="flex items-center space-x-2">
            {showNumbers && (
              <span className="font-bold">
                {current.toLocaleString()}/{max.toLocaleString()}
              </span>
            )}
            {showPercentage && (
              <span className={`font-medium ${getStatusColor()}`}>
                {Math.round(percentage)}%
              </span>
            )}
          </div>
        </div>
      )}

      {/* Barre de progression */}
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div 
          className={`bg-gradient-to-r ${colorClasses[color]} ${sizeClasses[size]} rounded-full ${
            animated ? 'transition-all duration-500 ease-out progress-bar-glow' : ''
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Informations supplémentaires */}
      {showNumbers && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">
            {Math.round(percentage)}% rempli
          </span>
          <span className={`font-medium ${getStatusColor()}`}>
            {max - current > 0 
              ? `${(max - current).toLocaleString()} restant${max - current > 1 ? 's' : ''}`
              : 'Complet'
            }
          </span>
        </div>
      )}
    </div>
  );
};