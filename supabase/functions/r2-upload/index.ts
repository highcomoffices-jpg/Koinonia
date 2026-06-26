// supabase/functions/r2-upload/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { crypto } from 'https://deno.land/std@0.177.0/crypto/mod.ts';

// Configuration R2
const R2_ACCESS_KEY_ID = Deno.env.get('R2_ACCESS_KEY_ID')!;
const R2_SECRET_ACCESS_KEY = Deno.env.get('R2_SECRET_ACCESS_KEY')!;
const R2_ENDPOINT = Deno.env.get('R2_ENDPOINT')!;
const R2_BUCKET = Deno.env.get('R2_BUCKET')!;
const R2_PUBLIC_URL = Deno.env.get('R2_PUBLIC_URL')!;

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_ANON_KEY')!,
);

// Calculer SHA256 d'un fichier
async function computeSha256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Générer la signature AWS V4 simplifiée pour R2
async function signR2Request(
  method: string,
  url: string,
  contentType: string,
  contentSha256: string,
  file: File
): Promise<Headers> {
  const headers = new Headers();
  const date = new Date();
  const amzDate = date.toISOString().replace(/[:\-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  
  headers.set('Content-Type', contentType);
  headers.set('x-amz-content-sha256', contentSha256);
  headers.set('x-amz-date', amzDate);
  
  // Construction de la signature (version simplifiée)
  const parsedUrl = new URL(url);
  const canonicalUri = parsedUrl.pathname;
  const canonicalQueryString = '';
  const canonicalHeaders = `content-type:${contentType}\nx-amz-content-sha256:${contentSha256}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = 'content-type;x-amz-content-sha256;x-amz-date';
  
  const canonicalRequest = `${method}\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${contentSha256}`;
  
  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
  const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${await sha256(canonicalRequest)}`;
  
  const signingKey = await getSignatureKey(R2_SECRET_ACCESS_KEY, dateStamp, 'auto', 's3');
  const signature = await hmacSha256(signingKey, stringToSign);
  
  const authorizationHeader = `${algorithm} Credential=${R2_ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  headers.set('Authorization', authorizationHeader);
  
  return headers;
}

// Fonctions auxiliaires pour la signature
async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function hmacSha256(key: Uint8Array, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
  return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getSignatureKey(key: string, dateStamp: string, regionName: string, serviceName: string): Promise<Uint8Array> {
  const kDate = await hmacSha256Raw(('AWS4' + key), dateStamp);
  const kRegion = await hmacSha256Raw(kDate, regionName);
  const kService = await hmacSha256Raw(kRegion, serviceName);
  const kSigning = await hmacSha256Raw(kService, 'aws4_request');
  return kSigning;
}

async function hmacSha256Raw(key: string | Uint8Array, message: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  let cryptoKey: Uint8Array;
  
  if (typeof key === 'string') {
    cryptoKey = encoder.encode(key);
  } else {
    cryptoKey = key;
  }
  
  const importedKey = await crypto.subtle.importKey('raw', cryptoKey, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', importedKey, encoder.encode(message));
  return new Uint8Array(signature);
}

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Fichier
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Préparer l'upload
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
    const filePath = `posts/${user.id}/${fileName}`;
    const r2Url = `${R2_ENDPOINT}/${R2_BUCKET}/${filePath}`;
    
    const contentSha256 = await computeSha256(file);
    const headers = await signR2Request('PUT', r2Url, file.type || 'application/octet-stream', contentSha256, file);

    // Upload
    const uploadResponse = await fetch(r2Url, {
      method: 'PUT',
      headers,
      body: file,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('R2 upload error:', errorText);
      return new Response(JSON.stringify({ error: 'R2 upload failed', details: errorText }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const publicUrl = `${R2_PUBLIC_URL}/${filePath}`;
    return new Response(JSON.stringify({ url: publicUrl, success: true }), 
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      
  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error', details: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});