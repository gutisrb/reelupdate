// Upload Custom Music Edge Function
// Handles user-uploaded background music for videos

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const CLOUDINARY_CLOUD_NAME = Deno.env.get('CLOUDINARY_CLOUD_NAME')!;
const CLOUDINARY_API_KEY = Deno.env.get('CLOUDINARY_API_KEY')!;
const CLOUDINARY_API_SECRET = Deno.env.get('CLOUDINARY_API_SECRET')!;

// File constraints
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_DURATION_SECONDS = 60; // 60 seconds
const ALLOWED_FORMATS = ['mp3', 'wav', 'm4a', 'aac', 'ogg'];

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    // Get user from auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string | null;

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({
          error: 'File too large',
          message: `File must be under ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate file type
    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_FORMATS.includes(fileExt)) {
      return new Response(
        JSON.stringify({
          error: 'Invalid file format',
          message: `Allowed formats: ${ALLOWED_FORMATS.join(', ')}`,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${user.id}] Uploading music: ${file.name} (${file.size} bytes)`);

    // Upload to Cloudinary
    const arrayBuffer = await file.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ''
      )
    );

    const uploadData = new FormData();
    uploadData.append('file', `data:audio/${fileExt};base64,${base64}`);
    uploadData.append('upload_preset', 'ml_default'); // Use your Cloudinary upload preset
    uploadData.append('folder', `custom_music/${user.id}`);

    const cloudinaryResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`,
      {
        method: 'POST',
        body: uploadData,
      }
    );

    if (!cloudinaryResponse.ok) {
      const error = await cloudinaryResponse.text();
      console.error('Cloudinary upload failed:', error);
      return new Response(
        JSON.stringify({ error: 'Upload failed', details: error }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const cloudinaryData = await cloudinaryResponse.json();
    const duration = Math.floor(cloudinaryData.duration || 0);

    // Validate duration
    if (duration > MAX_DURATION_SECONDS) {
      // Delete uploaded file from Cloudinary
      await deleteFromCloudinary(cloudinaryData.public_id);

      return new Response(
        JSON.stringify({
          error: 'Audio too long',
          message: `Audio must be under ${MAX_DURATION_SECONDS} seconds. Your file is ${duration} seconds.`,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${user.id}] Uploaded to Cloudinary: ${cloudinaryData.secure_url}`);

    // Save to database
    const { data: musicRecord, error: dbError } = await supabase
      .from('custom_music_uploads')
      .insert({
        user_id: user.id,
        filename: file.name,
        cloudinary_url: cloudinaryData.secure_url,
        cloudinary_public_id: cloudinaryData.public_id,
        duration_seconds: duration,
        file_size_bytes: file.size,
        format: cloudinaryData.format || fileExt,
        title: title || file.name.replace(/\.[^/.]+$/, ''), // Remove extension if no title
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database insert failed:', dbError);
      // Clean up Cloudinary upload
      await deleteFromCloudinary(cloudinaryData.public_id);

      return new Response(
        JSON.stringify({ error: 'Failed to save music record' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[${user.id}] Music saved to database: ${musicRecord.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        music: musicRecord,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error uploading custom music:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Generate Cloudinary API signature
 */
async function generateCloudinarySignature(
  params: Record<string, string>,
  apiSecret: string
): Promise<string> {
  // Sort parameters alphabetically
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');

  const message = sortedParams + apiSecret;

  // Use Web Crypto API for SHA-1
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}

/**
 * Delete file from Cloudinary
 */
async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = await generateCloudinarySignature(
      {
        public_id: publicId,
        timestamp: timestamp.toString(),
      },
      CLOUDINARY_API_SECRET
    );

    const deleteData = new FormData();
    deleteData.append('public_id', publicId);
    deleteData.append('api_key', CLOUDINARY_API_KEY);
    deleteData.append('timestamp', timestamp.toString());
    deleteData.append('signature', signature);

    await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/destroy`,
      {
        method: 'POST',
        body: deleteData,
      }
    );
  } catch (error) {
    console.error('Failed to delete from Cloudinary:', error);
  }
}
