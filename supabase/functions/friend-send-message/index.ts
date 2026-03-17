import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    const body = await req.json().catch(() => null);
    const receiverId = typeof body?.receiver_id === "string" ? body.receiver_id : "";
    const content = typeof body?.content === "string" ? body.content.trim() : "";
    const gemGift = Number.isFinite(body?.gem_gift) ? Math.max(0, Math.floor(body.gem_gift)) : 0;

    if (!receiverId) {
      return new Response(JSON.stringify({ error: "receiver_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!content && gemGift <= 0) {
      return new Response(JSON.stringify({ error: "Message content or a gem gift is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (receiverId === userId) {
      return new Response(JSON.stringify({ error: "You cannot message yourself" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: friendship } = await adminClient
      .from("friendships")
      .select("id")
      .or(`and(user_id.eq.${userId},friend_id.eq.${receiverId}),and(user_id.eq.${receiverId},friend_id.eq.${userId})`)
      .eq("status", "accepted")
      .maybeSingle();

    if (!friendship) {
      return new Response(JSON.stringify({ error: "You can only message accepted friends" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (gemGift > 0) {
      const { data: senderProfile, error: senderError } = await adminClient
        .from("profiles")
        .select("gems")
        .eq("user_id", userId)
        .single();

      const { data: receiverProfile, error: receiverError } = await adminClient
        .from("profiles")
        .select("gems")
        .eq("user_id", receiverId)
        .single();

      if (senderError || receiverError || !senderProfile || !receiverProfile) {
        return new Response(JSON.stringify({ error: "Could not load profile data for gift transfer" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (senderProfile.gems < gemGift) {
        return new Response(JSON.stringify({ error: "Not enough gems" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: senderUpdateError } = await adminClient
        .from("profiles")
        .update({ gems: senderProfile.gems - gemGift })
        .eq("user_id", userId);

      if (senderUpdateError) {
        return new Response(JSON.stringify({ error: senderUpdateError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: receiverUpdateError } = await adminClient
        .from("profiles")
        .update({ gems: receiverProfile.gems + gemGift })
        .eq("user_id", receiverId);

      if (receiverUpdateError) {
        await adminClient
          .from("profiles")
          .update({ gems: senderProfile.gems })
          .eq("user_id", userId);

        return new Response(JSON.stringify({ error: receiverUpdateError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const payload = {
      sender_id: userId,
      receiver_id: receiverId,
      content: content || `Sent you ${gemGift} gems! 💎`,
      gem_gift: gemGift,
    };

    const { data: insertedMessage, error: messageError } = await adminClient
      .from("friend_messages")
      .insert(payload)
      .select("id, sender_id, receiver_id, content, gem_gift, created_at")
      .single();

    if (messageError || !insertedMessage) {
      return new Response(JSON.stringify({ error: messageError?.message || "Could not send message" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, message: insertedMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
