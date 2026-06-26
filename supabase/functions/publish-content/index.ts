import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.0';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Récupérer les mots interdits depuis la base
async function getForbiddenWords(supabaseClient: any): Promise<{ word: string; category: string; severity: number }[]> {
  const { data, error } = await supabaseClient
    .from('forbidden_words')
    .select('word, category, severity')
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching forbidden words:', error);
    return [];
  }
  return data || [];
}

// Analyser le contenu avec les mots interdits
function moderateContent(content: string, forbiddenWords: { word: string; category: string; severity: number }[]): { 
  isApproved: boolean; 
  foundWords: string[]; 
  message?: string 
} {
  const lowerContent = content.toLowerCase();
  const foundWords: string[] = [];

  for (const word of forbiddenWords) {
    if (lowerContent.includes(word.word.toLowerCase())) {
      foundWords.push(word.word);
    }
  }

  if (foundWords.length > 0) {
    const categories = [...new Set(forbiddenWords.filter(w => foundWords.includes(w.word)).map(w => w.category))];
    return {
      isApproved: false,
      foundWords,
      message: `Votre message contient des termes inappropriés (${categories.join(', ')}). Veuillez le modifier.`
    };
  }

  return { isApproved: true, foundWords: [] };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Vérifier l'authentification
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_ANON_KEY') || '',
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    // Vérifier que l'utilisateur existe
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Récupérer le contenu du body (JSON uniquement)
    const body = await req.json();
    const content = body.content || '';

    if (!content || content.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'Content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Récupérer les mots interdits depuis la base
    const forbiddenWords = await getForbiddenWords(supabaseClient);
    
    // Analyser le contenu
    const moderation = moderateContent(content, forbiddenWords);
    
    // Retourner UNIQUEMENT le résultat de la modération (pas d'insertion)
    return new Response(
      JSON.stringify({
        success: true,
        isApproved: moderation.isApproved,
        message: moderation.message || null,
        foundWords: moderation.foundWords
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in publish-content:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});