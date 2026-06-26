// Configuration R2 (variables d'environnement)
const R2_PUBLIC_URL = import.meta.env.VITE_R2_PUBLIC_URL;
const R2_UPLOAD_FUNCTION_URL = import.meta.env.VITE_R2_UPLOAD_FUNCTION_URL;

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload un fichier vers R2 via une Edge Function (sécurisé)
 * @param file - Fichier à uploader (image ou vidéo)
 * @returns URL publique du fichier uploadé
 */
export async function uploadToR2(file: File): Promise<string> {
  if (!R2_UPLOAD_FUNCTION_URL) {
    throw new Error('R2_UPLOAD_FUNCTION_URL not configured');
  }

  const formData = new FormData();
  formData.append('file', file);

  // Récupérer la session Supabase pour l'authentification
  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token;

  const response = await fetch(R2_UPLOAD_FUNCTION_URL, {
    method: 'POST',
    headers: {
      ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}),
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Upload failed: ${error}`);
  }

  const data = await response.json();
  return data.url;
}

/**
 * Upload multiple fichiers
 */
export async function uploadMultipleToR2(files: File[]): Promise<string[]> {
  const uploads = files.map(file => uploadToR2(file));
  return Promise.all(uploads);
}

/**
 * Obtenir une URL publique pour un fichier existant
 */
export function getPublicUrl(filePath: string): string {
  return `${R2_PUBLIC_URL}/${filePath}`;
}