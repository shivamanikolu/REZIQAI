import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// In-memory cache to prevent concurrent race conditions during function warm phase
const processedSubmissions = new Set<string>();

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const receiverEmail = Deno.env.get('FEEDBACK_RECEIVER_EMAIL') || 'shivamaniforwork@gmail.com';
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY environment variable is missing" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return new Response(
        JSON.stringify({ error: "Feedback ID is required to prevent unauthenticated abuse" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Check in-memory cache first for rapid double-clicks
    if (processedSubmissions.has(id)) {
      return new Response(
        JSON.stringify({ success: true, message: "Email already dispatched (cached)." }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Query database to verify feedback record exists
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Supabase environment configuration is missing." }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
    const { data: feedback, error: dbError } = await supabaseAdmin
      .from('feedback')
      .select('*')
      .eq('id', id)
      .single();

    if (dbError || !feedback) {
      return new Response(
        JSON.stringify({ error: "Feedback record not found. Authorization failed." }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Check persistent database-backed flag to prevent duplicates across separate isolates
    if (feedback.browser_metadata && feedback.browser_metadata.email_sent === true) {
      return new Response(
        JSON.stringify({ success: true, message: "Email already dispatched (database verified)." }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const {
      full_name,
      email,
      feedback_type,
      feedback_message,
      rating,
      browser_metadata,
      device_metadata,
      created_at
    } = feedback;

    // Validate fields retrieved from DB
    if (!full_name || !email || !feedback_type || !feedback_message || rating === undefined) {
      return new Response(
        JSON.stringify({ error: "Retrieved feedback record contains incomplete fields." }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const timestamp = created_at 
      ? new Date(created_at).toISOString().replace('T', ' ').substring(0, 19) + ' UTC' 
      : new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
      
    const browser = browser_metadata?.userAgent || "Unknown Browser";
    const device = device_metadata
      ? `${device_metadata.screen_width || '?'}x${device_metadata.screen_height || '?'} (dpr: ${device_metadata.device_pixel_ratio || '1'})`
      : "Unknown Device";

    const emailSubject = `[REZIQ Feedback] ${feedback_type} from ${full_name}`;
    const stars = "★".repeat(rating) + "☆".repeat(Math.max(0, 5 - rating));

    const htmlBody = `
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f2; color: #0a0a0a; padding: 30px;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid rgba(0,0,0,0.06); border-radius: 24px; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.015);">
            <h2 style="font-size: 20px; font-weight: 800; border-bottom: 1px solid rgba(0,0,0,0.05); padding-bottom: 15px; margin-bottom: 20px; color: #111111;">New System Feedback Submission</h2>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
                <tr>
                    <td style="padding: 8px 0; font-size: 12px; font-weight: bold; text-transform: uppercase; color: rgba(10,10,10,0.5); width: 140px;">User Name</td>
                    <td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: #111111;">${full_name}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-size: 12px; font-weight: bold; text-transform: uppercase; color: rgba(10,10,10,0.5);">User Email</td>
                    <td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: #111111;"><a href="mailto:${email}" style="color: #0a0a0a; text-decoration: underline;">${email}</a></td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-size: 12px; font-weight: bold; text-transform: uppercase; color: rgba(10,10,10,0.5);">Category</td>
                    <td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: #111111; text-transform: capitalize;">${feedback_type}</td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; font-size: 12px; font-weight: bold; text-transform: uppercase; color: rgba(10,10,10,0.5);">ATS Rating</td>
                    <td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: #b7791f;">${stars} (${rating}/5)</td>
                </tr>
            </table>
            
            <div style="margin-bottom: 30px;">
                <p style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: rgba(10,10,10,0.5); margin-bottom: 10px;">Critique Message</p>
                <blockquote style="background-color: #f5f5f2; border-left: 2px solid #0a0a0a; padding: 18px; margin: 0; border-radius: 0 12px 12px 0; font-size: 14px; line-height: 1.6; color: rgba(10,10,10,0.85); font-style: italic;">
                    "${feedback_message}"
                </blockquote>
            </div>
            
            <div style="border-top: 1px solid rgba(0,0,0,0.05); padding-top: 20px; font-size: 11px; color: rgba(10,10,10,0.5); line-height: 1.65;">
                <p style="margin: 3px 0;"><strong>Timestamp:</strong> ${timestamp}</p>
                <p style="margin: 3px 0;"><strong>Browser Agent:</strong> ${browser}</p>
                <p style="margin: 3px 0;"><strong>Resolution:</strong> ${device}</p>
            </div>
        </div>
    </body>
    </html>
    `;

    // 4. Dispatch secure email using Resend API
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "REZIQ Telemetry <onboarding@resend.dev>",
        to: [receiverEmail],
        subject: emailSubject,
        html: htmlBody,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      return new Response(
        JSON.stringify({ error: "Resend API Error", details: resendData }),
        { status: resendResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 5. Update database record to flag that email has been successfully sent
    const updatedBrowserMetadata = {
      ...(browser_metadata || {}),
      email_sent: true
    };

    await supabaseAdmin
      .from('feedback')
      .update({ browser_metadata: updatedBrowserMetadata })
      .eq('id', id);

    // Warm-phase cache update
    processedSubmissions.add(id);

    return new Response(
      JSON.stringify({ success: true, message: "Email sent successfully", data: resendData }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
