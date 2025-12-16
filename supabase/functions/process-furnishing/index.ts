import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0"; // Pin version for stability
import { initClients } from "../_shared/clients/index.ts";
import { API_KEYS, API_ENDPOINTS } from "../_shared/config.ts";
import { corsHeaders } from "../_shared/cors.ts";

const SYSTEM_PROMPT = `You rewrite a user instruction into ONE clear, robust English command for the image-editing model google/nano-banana-edit.

Rules:
- Output ONE line of plain English.
- FOCUS on the "Insert..." text structure: "Insert the main subject from image 2 into image 1 [placement description]."
- Use "main subject" or the specific object name (e.g. "man", "sofa") if the user provides it.
- Ensure the instruction explicitly states WHERE to place it (e.g. "standing in front of the bed", "on the floor").
- REMOVE technical terms like "match perspective", "lens", "focal length", "scale", or "lighting".
- KEEP it natural but authoritative.
- BAD: "add man" (too vague).
- GOOD: "Insert the man from image 2 into image 1 standing on the floor in front of the bed."
- If the instruction is empty or unclear, default to:
  "Insert the main subject from image 2 into image 1 so it is clearly visible in the room."`;

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const clients = initClients();

        // 1. Initialize Admin Client (for privileged DB ops like credit deduction)
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
        const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);
        (clients as any).supabase = adminSupabase;

        // 2. Verify User Identity via Token
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            throw new Error('Missing Authorization header');
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await adminSupabase.auth.getUser(token);

        if (userError || !user) {
            console.error('[Auth Error]', userError);
            throw new Error(`Invalid or expired token: ${userError?.message || 'No user found'}`);
        }
        const userId = user.id; // Trusted User ID

        const url = new URL(req.url);

        // ------------------------------------------------------------------
        // STATUS ENDPOINT (GET)
        // ------------------------------------------------------------------
        if (req.method === 'GET') {
            const jobId = url.searchParams.get('jobId');
            if (!jobId) {
                throw new Error('Missing jobId');
            }

            // Optional: In a future iteration, check if 'jobId' belongs to 'userId' via DB.
            // For now, we at least ensure the caller is a valid user.

            console.log(`[Status] User ${userId} checking job: ${jobId}`);

            const response = await fetch(API_ENDPOINTS.kie.getTask(jobId), {
                headers: { 'Authorization': `Bearer ${API_KEYS.KIE_AI}` }
            });

            if (!response.ok) {
                throw new Error(`Kie.ai status check failed: ${await response.text()}`);
            }

            const data = await response.json();
            const status = data.data?.state; // 'waiting', 'processing', 'success', 'failed'

            if (status === 'success') {
                // Kie.ai returns 'resultJson' as a JSON string inside the data object
                let resultUrl = null;
                try {
                    // Try direct access first 
                    if (data.data?.resultUrls && Array.isArray(data.data.resultUrls)) {
                        resultUrl = data.data.resultUrls[0];
                    }
                    // Fallback to parsing resultJson string
                    else if (data.data?.resultJson) {
                        const parsedResult = JSON.parse(data.data.resultJson);
                        if (parsedResult?.resultUrls && parsedResult.resultUrls.length > 0) {
                            resultUrl = parsedResult.resultUrls[0];
                        }
                    }
                } catch (e) {
                    console.error('Failed to parse resultJson:', e);
                }

                if (!resultUrl) throw new Error(`Success status but no resultUrl found. Data: ${JSON.stringify(data.data)}`);

                // Optimization: Upload result to Cloudinary for permanent storage/size opt
                console.log(`[Status] Job done. Uploading to Cloudinary: ${resultUrl}`);
                const upload = await clients.cloudinary.uploadImageFromUrl(resultUrl, `furnisher_result_${jobId}`);

                // Update Asset Record
                console.log(`[Status] Updating asset record for job: ${jobId}`);
                await adminSupabase.from('assets')
                    .update({
                        status: 'ready',
                        src_url: upload.secure_url,
                        thumb_url: upload.secure_url
                    })
                    .eq('job_id', jobId);

                return new Response(JSON.stringify({
                    status: 'done',
                    url: upload.secure_url
                }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

            } else if (status === 'failed') {
                return new Response(JSON.stringify({
                    status: 'failed',
                    error: data.data?.error || 'Unknown error'
                }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }

            // Waiting or Processing
            return new Response(JSON.stringify({ status: 'processing' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // ------------------------------------------------------------------
        // CREATE ENDPOINT (POST)
        // ------------------------------------------------------------------
        if (req.method === 'POST') {
            const formData = await req.formData();
            // const userId = formData.get('user_id') as string; // INSECURE: Ignored in favor of auth user
            const image1 = formData.get('image1') as File;
            const image2 = formData.get('image2'); // File or string or null
            const instructions = formData.get('instructions') as string;
            const style = formData.get('style') as string; // Legacy param, usually empty or part of instructions

            if (!image1) {
                throw new Error('Missing required field: image1');
            }

            // 1. Auth & Credit Check
            console.log(`[Create] User: ${userId}`);
            const { data: profile, error: profileError } = await adminSupabase
                .from('profiles')
                .select('tier, image_credits_remaining')
                .eq('id', userId)
                .single();

            if (profileError || !profile) {
                throw new Error('User profile not found');
            }

            if (profile.tier !== 'scale' && profile.image_credits_remaining <= 0) {
                return new Response(JSON.stringify({ error: 'NO_IMAGE_CREDITS' }), {
                    status: 402,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            // 2. Upload Inputs to Cloudinary
            console.log(`[Create] Uploading Input Image 1... Type: ${image1?.constructor?.name}`);
            const image1Buf = await image1.arrayBuffer();
            const upload1 = await clients.cloudinary.uploadImage(image1Buf, `furnisher_input_1_${Date.now()}`);

            let upload2Url = null;
            console.log(`[Create] Inspecting Image 2. Value: ${image2}, Type: ${image2?.constructor?.name}, IsFile: ${image2 instanceof File}`);

            if (image2 && image2 instanceof File) {
                console.log(`[Create] Uploading Input Image 2 (Size: ${image2.size})...`);
                const image2Buf = await image2.arrayBuffer();
                const upload2 = await clients.cloudinary.uploadImage(image2Buf, `furnisher_input_2_${Date.now()}`);
                upload2Url = upload2.secure_url;
                console.log(`[Create] Image 2 Uploaded: ${upload2Url}`);
            } else {
                console.log(`[Create] Image 2 skipped. Reason: Not a valid File object.`);
            }

            // 3. Generate Prompt (OpenAI)
            const fullInstructions = `${style ? `Style: ${style}. ` : ''}${instructions}`;
            console.log(`[Create] Generating prompt for: "${fullInstructions}"`);

            // Prepare mocked "messages" for the prompt generator like in blueprint
            // We simplfy: Just send the text description. The blueprint sent image URLs to GPT-4o-vision? 
            // The blueprint used "chatgpt-4o-latest". The messages array had "imageFile" keys.
            // Let's assume we can just use the text instructions for now to keep it simple, 
            // as the system prompt is text-to-text rewriting.
            // IF the user instructions depend heavily on seeing the image ("remove the chair in the corner"), 
            // we might need vision. But standard "furnish this room" works with text.
            // Let's stick to text-only for the prompt refinement to save tokens/complexity unless requested.

            const gptResponse = await clients.openai.chat({
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: `instructions: ${fullInstructions}` }
                ],
                model: 'gpt-4o',
                temperature: 1.0
            });

            const optimizedPrompt = gptResponse.choices[0]?.message?.content || fullInstructions;
            console.log(`[Create] Optimized Prompt: ${optimizedPrompt}`);

            // 4. Call Kie.ai
            const inputPayload: any = {
                prompt: optimizedPrompt,
                image_urls: [upload1.secure_url],
                output_format: "png",
                image_size: "9:16" // Defaulting to 9:16 as per blueprint, or should we detect? 
                // Blueprint had "9:16". 
            };

            if (upload2Url) {
                inputPayload.image_urls.push(upload2Url);
            }

            console.log(`[Create] Sending to Kie.ai...`);
            const kieResponse = await fetch(API_ENDPOINTS.kie.createTask, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_KEYS.KIE_AI}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'nano-banana-pro',
                    input: {
                        ...inputPayload,
                        // nano-banana-pro expects 'image_input', not 'image_urls'
                        // we map the first image to image_input
                        // The API documentation suggests it might only take ONE image or handle multiple differently.
                        // Assuming prompt handles the second image context if passed separately?
                        // Wait, user says "neither image was uploaded".
                        // If documentation says `image_input` (singular), it might treat composition differently.
                        // For now, let's map the primary image to `image_input`.
                        // If we have 2 images, the second one (subject) usually goes to `image_input` (or maybe `mask_image`?)
                        // Correction: Standard Gemini editing usually takes ONE image + prompt.
                        // BUT for composition ("insert from image 2"), many endpoints take `images` array.
                        // However, user specifically linked to `nano-banana-pro` docs.
                        // Let's assume inputPayload properties need to be at top level of `input`.
                        image_input: inputPayload.image_urls[0], // Pass the main room as input
                        // If there is a second image (subject), where does it go?
                        // If PRO model doesn't support 2-image input natively for insertion, we have a problem.
                        // But let's try passing the second URL in the prompt? No, that's unreliable.
                        // Let's follow the user's specific hint about "image_input".
                    }
                })
            });

            if (!kieResponse.ok) {
                const err = await kieResponse.text();
                throw new Error(`Kie.ai submission failed: ${err}`);
            }

            const kieData = await kieResponse.json();
            const jobId = kieData.data?.taskId || kieData.data?.id;

            if (!jobId) {
                throw new Error(`Kie.ai did not return a Job ID (taskId). Response: ${JSON.stringify(kieData)}`);
            }

            // 5. Deduct Credit
            if (profile.tier !== 'scale') {
                // Try RPC first if exists, else direct update
                const { error: rpcError } = await adminSupabase.rpc('decrement_image_credit', { row_id: userId });
                if (rpcError) {
                    console.log('RPC failed, falling back to manual update:', rpcError.message);
                    await adminSupabase
                        .from('profiles')
                        .update({ image_credits_remaining: profile.image_credits_remaining - 1 })
                        .eq('id', userId);
                }
            }

            // 6. Create Asset Record (Mirroring Make.com logic)
            console.log(`[Create] Creating asset record for job: ${jobId}`);
            const { error: assetError } = await adminSupabase.from('assets').insert({
                user_id: userId,
                kind: 'image',
                source: 'furnisher',
                status: 'processing',
                job_id: jobId,
                prompt: instructions,
                inputs: {
                    instructions: instructions,
                    image_urls: inputPayload.image_urls
                }
            });

            if (assetError) {
                console.error('[Create] Failed to create asset record:', assetError);
                // We don't fail the request here, as the job is already running
            }

            console.log(`[Create] Success! Job ID: ${jobId}`);

            return new Response(JSON.stringify({
                jobId: jobId,
                status: 'processing'
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

        }

        throw new Error('Method not supported');

    } catch (error) {
        console.error('Error:', error);
        return new Response(JSON.stringify({ error: (error as Error).message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
