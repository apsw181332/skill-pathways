import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Not authenticated");

    const user = userData.user;
    const email = user.email;
    if (!email) throw new Error("No email associated with account");

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));

    // Delete old codes for this user
    await supabase.from("verification_codes").delete().eq("user_id", user.id);

    // Insert new code
    await supabase.from("verification_codes").insert({
      user_id: user.id,
      email,
      code,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });

    // Try to send via email queue if available
    try {
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="color: #1a1a2e; font-size: 24px; margin-bottom: 8px;">Pathways Verification Code</h1>
          <p style="color: #555; font-size: 14px; margin-bottom: 24px;">Enter this code to verify your identity:</p>
          <div style="background: #f0f4ff; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1a1a2e; font-family: monospace;">${code}</span>
          </div>
          <p style="color: #999; font-size: 12px;">This code expires in 10 minutes. If you didn't request this, please ignore this email.</p>
        </div>
      `;

      await supabase.rpc("enqueue_email", {
        queue_name: "auth_emails",
        payload: {
          to: email,
          subject: "Your Pathways Verification Code",
          html: htmlContent,
          purpose: "auth",
        },
      });
      console.log("2FA code enqueued for", email);
    } catch (emailErr) {
      console.warn("Email queue not available, code stored in DB:", emailErr);
    }

    return new Response(JSON.stringify({ success: true, email: email.replace(/(.{2})(.*)(@.*)/, "$1***$3") }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
