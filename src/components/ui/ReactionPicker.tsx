import React, { useEffect, useRef } from 'react';

interface ReactionPickerProps {
  onSelect: (reaction: string) => void;
  onClose: () => void;
}

const REACTIONS = [
  { emoji: '❤️', label: 'Cœur' },
  { emoji: '🙏', label: 'Prière' },
  { emoji: '🎉', label: 'Fête' },
  { emoji: '🔥', label: 'Feu' },
  { emoji: '👍', label: 'Pouce' },
  { emoji: '😢', label: 'Émotion' },
  { emoji: '👏', label: 'Applaudissement' },
  { emoji: '✨', label: 'Magie' },
];

export const ReactionPicker: React.FC<ReactionPickerProps> = ({ onSelect, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={containerRef}
      className="flex gap-2 p-2 bg-gray-800 rounded-full shadow-xl border border-gray-700 animate-fade-in"
    >
      {REACTIONS.map((reaction) => (
        <button
          key={reaction.emoji}
          onClick={() => {
            onSelect(reaction.emoji);
            onClose();
          }}
          className="w-10 h-10 flex items-center justify-center text-2xl hover:bg-gray-700 rounded-full transition-colors"
          title={reaction.label}
        >
          {reaction.emoji}
        </button>
      ))}
    </div>
  );
};