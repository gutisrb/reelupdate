/**
 * Environment Diagnostic Script
 *
 * This script checks:
 * 1. All required environment variables are set
 * 2. API keys are valid by making test requests
 * 3. Database connectivity
 * 4. Cloudinary access
 *
 * Usage:
 *   npx tsx scripts/check-environment.ts
 *
 * This helps debug issues before attempting video generation.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
}

const results: CheckResult[] = [];

function addResult(name: string, status: 'pass' | 'fail' | 'warn', message: string) {
  results.push({ name, status, message });
}

function printResults() {
  console.log('\n📊 Environment Check Results');
  console.log('============================\n');

  let passCount = 0;
  let failCount = 0;
  let warnCount = 0;

  for (const result of results) {
    const icon = result.status === 'pass' ? '✅' :
                  result.status === 'fail' ? '❌' : '⚠️';

    console.log(`${icon} ${result.name}`);
    console.log(`   ${result.message}\n`);

    if (result.status === 'pass') passCount++;
    if (result.status === 'fail') failCount++;
    if (result.status === 'warn') warnCount++;
  }

  console.log('============================');
  console.log(`Summary: ${passCount} passed, ${failCount} failed, ${warnCount} warnings\n`);

  if (failCount > 0) {
    console.log('❌ Some checks failed. Please fix the issues above before proceeding.');
    process.exit(1);
  } else if (warnCount > 0) {
    console.log('⚠️  All critical checks passed, but there are warnings to address.');
  } else {
    console.log('✨ All checks passed! Your environment is ready.');
  }
}

/**
 * Check if environment variable is set
 */
function checkEnvVar(name: string, required: boolean = true): boolean {
  const value = process.env[name];

  if (!value) {
    if (required) {
      addResult(name, 'fail', 'Environment variable not set');
    } else {
      addResult(name, 'warn', 'Optional environment variable not set');
    }
    return false;
  }

  addResult(name, 'pass', `Set (${value.substring(0, 10)}...)`);
  return true;
}

/**
 * Test Supabase connectivity
 */
async function testSupabase() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    addResult('Supabase Connection', 'fail', 'Missing URL or service key');
    return;
  }

  try {
    const supabase = createClient(url, key);

    // Test database query
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      throw error;
    }

    addResult('Supabase Connection', 'pass', 'Database connection successful');
  } catch (error: any) {
    addResult('Supabase Connection', 'fail', `Connection failed: ${error.message}`);
  }
}

/**
 * Test Luma AI API
 */
async function testLumaAPI() {
  const apiKey = process.env.LUMA_API_KEY;

  if (!apiKey) {
    addResult('Luma AI API', 'fail', 'API key not set');
    return;
  }

  try {
    // Test API by checking generations endpoint
    const response = await fetch('https://api.lumalabs.ai/dream-machine/v1/generations', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok || response.status === 404) {
      // 404 is okay - means no generations, but auth worked
      addResult('Luma AI API', 'pass', 'API key is valid');
    } else if (response.status === 401 || response.status === 403) {
      addResult('Luma AI API', 'fail', 'API key is invalid or unauthorized');
    } else {
      addResult('Luma AI API', 'warn', `Unexpected status: ${response.status}`);
    }
  } catch (error: any) {
    addResult('Luma AI API', 'fail', `Connection failed: ${error.message}`);
  }
}

/**
 * Test OpenAI API
 */
async function testOpenAIAPI() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    addResult('OpenAI API', 'fail', 'API key not set');
    return;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (response.ok) {
      addResult('OpenAI API', 'pass', 'API key is valid');
    } else if (response.status === 401) {
      addResult('OpenAI API', 'fail', 'API key is invalid');
    } else {
      addResult('OpenAI API', 'warn', `Unexpected status: ${response.status}`);
    }
  } catch (error: any) {
    addResult('OpenAI API', 'fail', `Connection failed: ${error.message}`);
  }
}

/**
 * Test Google AI API
 */
async function testGoogleAIAPI() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    addResult('Google AI API', 'fail', 'API key not set');
    return;
  }

  try {
    // Test with a simple text generation request
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );

    if (response.ok) {
      addResult('Google AI API', 'pass', 'API key is valid');
    } else if (response.status === 400 || response.status === 403) {
      addResult('Google AI API', 'fail', 'API key is invalid');
    } else {
      addResult('Google AI API', 'warn', `Unexpected status: ${response.status}`);
    }
  } catch (error: any) {
    addResult('Google AI API', 'fail', `Connection failed: ${error.message}`);
  }
}

/**
 * Test ElevenLabs API
 */
async function testElevenLabsAPI() {
  const apiKey = process.env.ELEVENLABS_API_KEY;

  if (!apiKey) {
    addResult('ElevenLabs API', 'fail', 'API key not set');
    return;
  }

  try {
    const response = await fetch('https://api.elevenlabs.io/v1/user', {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
      },
    });

    if (response.ok) {
      addResult('ElevenLabs API', 'pass', 'API key is valid');
    } else if (response.status === 401) {
      addResult('ElevenLabs API', 'fail', 'API key is invalid');
    } else {
      addResult('ElevenLabs API', 'warn', `Unexpected status: ${response.status}`);
    }
  } catch (error: any) {
    addResult('ElevenLabs API', 'fail', `Connection failed: ${error.message}`);
  }
}

/**
 * Test ZapCap API
 */
async function testZapCapAPI() {
  const apiKey = process.env.ZAPCAP_API_KEY;

  if (!apiKey) {
    addResult('ZapCap API', 'fail', 'API key not set');
    return;
  }

  // Note: ZapCap might not have a simple test endpoint
  // We'll just check if the key is set
  addResult('ZapCap API', 'warn', 'API key is set (unable to test connection)');
}

/**
 * Test Cloudinary
 */
async function testCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    addResult('Cloudinary', 'fail', 'Missing credentials (cloud name, API key, or secret)');
    return;
  }

  try {
    // Test by checking if cloud exists
    const response = await fetch(
      `https://res.cloudinary.com/${cloudName}/image/upload/sample.jpg`
    );

    if (response.ok || response.status === 404) {
      // Both OK and 404 mean cloud exists
      addResult('Cloudinary', 'pass', 'Cloud name is valid');
    } else {
      addResult('Cloudinary', 'warn', `Unexpected status: ${response.status}`);
    }
  } catch (error: any) {
    addResult('Cloudinary', 'fail', `Connection failed: ${error.message}`);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🔍 Checking Environment Configuration');
  console.log('=====================================\n');

  // Check environment variables
  console.log('Checking environment variables...\n');

  // Critical variables
  checkEnvVar('VITE_SUPABASE_URL', true);
  checkEnvVar('VITE_SUPABASE_ANON_KEY', true);
  checkEnvVar('SUPABASE_SERVICE_ROLE_KEY', true);
  checkEnvVar('LUMA_API_KEY', true);
  checkEnvVar('OPENAI_API_KEY', true);
  checkEnvVar('GOOGLE_AI_API_KEY', true);
  checkEnvVar('ELEVENLABS_API_KEY', true);
  checkEnvVar('ZAPCAP_API_KEY', true);
  checkEnvVar('CLOUDINARY_CLOUD_NAME', true);
  checkEnvVar('CLOUDINARY_API_KEY', true);
  checkEnvVar('CLOUDINARY_API_SECRET', true);

  // Optional variables
  checkEnvVar('VITE_MAKE_VIDEO_URL', false);

  // Test API connections
  console.log('\nTesting API connections...\n');

  await testSupabase();
  await testLumaAPI();
  await testOpenAIAPI();
  await testGoogleAIAPI();
  await testElevenLabsAPI();
  await testZapCapAPI();
  await testCloudinary();

  // Print results
  printResults();
}

// Run the script
main().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
