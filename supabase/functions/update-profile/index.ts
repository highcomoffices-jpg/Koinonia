// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.0';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cloudflare R2 configuration (adapté aux noms de vos secrets)
const R2_ENDPOINT = Deno.env.get('R2_ENDPOINT') || '';
const R2_ACCESS_KEY_ID = Deno.env.get('R2_ACCESS_KEY_ID') || '';
const R2_SECRET_ACCESS_KEY = Deno.env.get('R2_SECRET_ACCESS_KEY') || '';
const R2_BUCKET_NAME = Deno.env.get('R2_BUCKET') || 'koinonia-media';
const R2_PUBLIC_URL = Deno.env.get('R2_PUBLIC_URL') || '';
const R2_ACCOUNT_ID = Deno.env.get('R2_ACCOUNT_ID') || '';

// Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Helper function to create AWS Signature V4
async function signRequestV4(
  method: string,
  url: URL,
  headers: Record<string, string>,
  body: BodyInit | null,
  accessKeyId: string,
  secretAccessKey: string,
  region: string = 'auto',
  service: string = 's3'
): Promise<Record<string, string>> {
  const date = new Date();
  const amzDate = date.toISOString().replace(/[:\-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);

  // Step 1: Create canonical request
  const canonicalHeaders = Object.keys(headers)
    .sort()
    .map(key => `${key.toLowerCase()}:${headers[key]}`)
    .join('\n') + '\n';
  
  const signedHeaders = Object.keys(headers)
    .sort()
    .map(key => key.toLowerCase())
    .join(';');
  
  const payloadHash = body ? await sha256(body) : 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  
  const canonicalRequest = [
    method,
    url.pathname,
    url.search,
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join('\n');

  // Step 2: Create string to sign
  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const hashedCanonicalRequest = await sha256(canonicalRequest);
  
  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    hashedCanonicalRequest
  ].join('\n');

  // Step 3: Calculate signature
  const kDate = await hmac(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = await hmac(kDate, region);
  const kService = await hmac(kRegion, service);
  const kSigning = await hmac(kService, 'aws4_request');
  const signature = await hmac(kSigning, stringToSign, 'hex');

  // Step 4: Create authorization header
  const authorizationHeader = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  
  return { Authorization: authorizationHeader, 'x-amz-date': amzDate };
}

// Helper: SHA256 hash
async function sha256(data: string | ArrayBuffer | BodyInit): Promise<string> {
  let input: ArrayBuffer;
  
  if (typeof data === 'string') {
    input = new TextEncoder().encode(data);
  } else if (data instanceof ArrayBuffer) {
    input = data;
  } else if (data instanceof Blob) {
    input = await data.arrayBuffer();
  } else if (data instanceof ReadableStream) {
    const reader = data.getReader();
    const chunks: Uint8Array[] = [];
    let done = false;
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) chunks.push(value);
    }
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const concatenated = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      concatenated.set(chunk, offset);
      offset += chunk.length;
    }
    input = concatenated;
  } else {
    input = new TextEncoder().encode('');
  }
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', input);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Helper: HMAC
async function hmac(key: string | ArrayBuffer, message: string, output: 'hex' | 'raw' = 'raw'): Promise<string | ArrayBuffer> {
  let keyBuffer: ArrayBuffer;
  
  if (typeof key === 'string') {
    keyBuffer = new TextEncoder().encode(key);
  } else {
    keyBuffer = key;
  }
  
  const messageBuffer = new TextEncoder().encode(message);
  const cryptoKey = await crypto.subtle.importKey('raw', keyBuffer, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageBuffer);
  
  if (output === 'hex') {
    const signatureArray = Array.from(new Uint8Array(signature));
    return signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  return signature;
}

// Generate a unique filename
function generateFileName(userId: string, originalName: string): string {
  const timestamp = Date.now();
  const extension = originalName.split('.').pop();
  return `${userId}/${timestamp}.${extension}`;
}

// Upload file to Cloudflare R2 using AWS Signature V4
async function uploadToR2(file: File, fileName: string): Promise<string> {
  const objectPath = `avatars/${fileName}`;
  const endpoint = `${R2_ENDPOINT}/${R2_BUCKET_NAME}/${objectPath}`;
  const url = new URL(endpoint);
  
  console.log('📤 R2 Endpoint:', endpoint);
  console.log('📤 R2 Bucket:', R2_BUCKET_NAME);
  console.log('📤 R2_ENDPOINT value:', R2_ENDPOINT);
  console.log('📤 R2_ACCESS_KEY_ID exists:', !!R2_ACCESS_KEY_ID);
  console.log('📤 R2_SECRET_ACCESS_KEY exists:', !!R2_SECRET_ACCESS_KEY);
  
  // Prepare headers
  const headers: Record<string, string> = {
    'Content-Type': file.type,
  };
  
  // Get file body as ArrayBuffer
  const bodyBuffer = await file.arrayBuffer();
  
  // Sign request with AWS Signature V4
  const signedHeaders = await signRequestV4(
    'PUT',
    url,
    headers,
    bodyBuffer,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY
  );
  
  // Merge signed headers
  const finalHeaders = { ...headers, ...signedHeaders };
  
  const response = await fetch(endpoint, {
    method: 'PUT',
    body: bodyBuffer,
    headers: finalHeaders,
  });

  console.log('📤 Response status:', response.status);
  console.log('📤 Response statusText:', response.statusText);
  
  const responseText = await response.text();
  console.log('📤 Response body:', responseText.substring(0, 200));

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${responseText.substring(0, 100)}`);
  }

  // Return public URL
  return `${R2_PUBLIC_URL}/${objectPath}`;
}

// Delete old avatar from R2
async function deleteFromR2(filePath: string): Promise<void> {
  // Extract the relative path from the full URL
  const url = new URL(filePath);
  const relativePath = url.pathname.substring(1); // Remove leading slash
  
  const endpoint = `${R2_ENDPOINT}/${R2_BUCKET_NAME}/${relativePath}`;
  const deleteUrl = new URL(endpoint);
  
  console.log('🗑️ Delete endpoint:', endpoint);
  
  // Prepare headers for DELETE
  const headers: Record<string, string> = {};
  
  // Sign request with AWS Signature V4
  const signedHeaders = await signRequestV4(
    'DELETE',
    deleteUrl,
    headers,
    null,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY
  );
  
  const finalHeaders = { ...headers, ...signedHeaders };
  
  const response = await fetch(endpoint, {
    method: 'DELETE',
    headers: finalHeaders,
  });
  
  if (!response.ok && response.status !== 404) {
    console.warn(`Delete failed: ${response.status} ${response.statusText}`);
  }
}

// Get current user avatar URL from database
async function getCurrentAvatarUrl(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('avatar_url')
    .eq('id', userId)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return data.avatar_url;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Log R2 configuration status
    console.log('🔐 R2_ENDPOINT:', R2_ENDPOINT ? '✅ défini' : '❌ MANQUANT');
    console.log('🔐 R2_ACCESS_KEY_ID:', R2_ACCESS_KEY_ID ? '✅ défini' : '❌ MANQUANT');
    console.log('🔐 R2_SECRET_ACCESS_KEY:', R2_SECRET_ACCESS_KEY ? '✅ défini' : '❌ MANQUANT');
    console.log('🔐 R2_BUCKET_NAME:', R2_BUCKET_NAME ? '✅ défini' : '❌ MANQUANT');
    console.log('🔐 R2_PUBLIC_URL:', R2_PUBLIC_URL ? '✅ défini' : '❌ MANQUANT');

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.split(' ')[1];
    
    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    console.log('👤 User ID:', userId);
    
    // Parse form data
    const formData = await req.formData();
    
    // Prepare update object for profile
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    
    // Text fields
    const firstName = formData.get('first_name');
    if (firstName && typeof firstName === 'string') {
      updateData.first_name = firstName;
      console.log('📝 Updating first_name:', firstName);
    }
    
    const lastName = formData.get('last_name');
    if (lastName && typeof lastName === 'string') {
      updateData.last_name = lastName;
      console.log('📝 Updating last_name:', lastName);
    }
    
    const bio = formData.get('bio');
    if (bio && typeof bio === 'string') {
      updateData.bio = bio;
      console.log('📝 Updating bio');
    }
    
    const defaultVisibility = formData.get('default_visibility');
    if (defaultVisibility && typeof defaultVisibility === 'string') {
      updateData.default_visibility = defaultVisibility;
      console.log('📝 Updating default_visibility:', defaultVisibility);
    }
    
    // Avatar handling
    const avatarFile = formData.get('avatar');
    const removeAvatar = formData.get('remove_avatar') === 'true';
    
    console.log('📸 Avatar file received:', avatarFile ? (avatarFile instanceof File ? avatarFile.name : 'not a file') : 'none');
    console.log('📸 Remove avatar flag:', removeAvatar);
    
    if (removeAvatar) {
      // Delete old avatar from R2 if exists
      const currentAvatarUrl = await getCurrentAvatarUrl(userId);
      if (currentAvatarUrl && currentAvatarUrl.includes(R2_PUBLIC_URL)) {
        console.log('🗑️ Deleting old avatar:', currentAvatarUrl);
        await deleteFromR2(currentAvatarUrl);
      }
      updateData.avatar_url = null;
      console.log('📸 Avatar removed');
    } else if (avatarFile && avatarFile instanceof File && avatarFile.size > 0) {
      console.log('📸 Avatar file size:', avatarFile.size);
      console.log('📸 Avatar file type:', avatarFile.type);
      
      // Delete old avatar if exists
      const currentAvatarUrl = await getCurrentAvatarUrl(userId);
      if (currentAvatarUrl && currentAvatarUrl.includes(R2_PUBLIC_URL)) {
        console.log('🗑️ Deleting old avatar before upload:', currentAvatarUrl);
        await deleteFromR2(currentAvatarUrl);
      }
      
      // Upload new avatar
      const fileName = generateFileName(userId, avatarFile.name);
      console.log('📸 Generated filename:', fileName);
      const publicUrl = await uploadToR2(avatarFile, fileName);
      updateData.avatar_url = publicUrl;
      console.log('📸 New avatar URL:', publicUrl);
    }
    
    // Update profile in database
    console.log('💾 Updating profile with data:', Object.keys(updateData));
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();
    
    if (updateError) {
      throw new Error(`Failed to update profile: ${updateError.message}`);
    }
    
    console.log('✅ Profile updated successfully');
    
    return new Response(
      JSON.stringify({
        success: true,
        profile: updatedProfile,
        message: 'Profile updated successfully',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in update-profile function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});