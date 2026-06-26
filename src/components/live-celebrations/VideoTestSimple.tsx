import React, { useState } from 'react';

// Les deux liens YouTube de votre base de données
const TEST_VIDEOS = [
  'https://www.youtube.com/watch?v=FhCtaWjTuJk',
  'https://www.youtube.com/watch?v=tzdQgjKUTwM'
];

export const VideoTestSimple: React.FC = () => {
  const [currentUrl, setCurrentUrl] = useState(TEST_VIDEOS[0]);

  // Méthode 1 : iframe classique
  const iframeUrl = `https://www.youtube.com/embed/${currentUrl.split('v=')[1]?.split('&')[0]}?autoplay=1`;

  // Méthode 2 : lien de téléchargement (pour tester si la vidéo existe)
  const downloadUrl = `https://www.youtube.com/watch?v=${currentUrl.split('v=')[1]?.split('&')[0]}`;

  return (
    <div className="p-4 bg-black min-h-screen text-white">
      <h2 className="text-xl mb-4">Test de lecture vidéo</h2>
      
      {/* Sélecteur de vidéo */}
      <div className="mb-4">
        <button 
          onClick={() => setCurrentUrl(TEST_VIDEOS[0])}
          className="mr-2 px-3 py-1 bg-red-600 rounded"
        >
          Vidéo 1 (Deborah)
        </button>
        <button 
          onClick={() => setCurrentUrl(TEST_VIDEOS[1])}
          className="px-3 py-1 bg-red-600 rounded"
        >
          Vidéo 2 (Gospel)
        </button>
      </div>

      {/* Méthode 1 : Iframe */}
      <div className="mb-6">
        <p className="mb-2 text-green-400">Méthode 1 : Iframe YouTube</p>
        <div className="aspect-video bg-gray-800 rounded">
          <iframe
            src={iframeUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Test YouTube"
          />
        </div>
      </div>

      {/* Méthode 2 : Lien direct */}
      <div>
        <p className="mb-2 text-blue-400">Méthode 2 : Ouvrir dans un nouvel onglet</p>
        <a 
          href={downloadUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-400 underline"
        >
          Cliquez ici pour ouvrir la vidéo directement sur YouTube
        </a>
      </div>
    </div>
  );
};