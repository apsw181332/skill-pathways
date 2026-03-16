import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const client = createClient(supabaseUrl, anonKey, {
      global: { headers: { authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: { user } } = await client.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [profileRes, progressRes] = await Promise.all([
      client.from("profiles").select("interests, enrolled_courses, learning_style").eq("user_id", user.id).single(),
      client.from("user_progress").select("category_id, completed").eq("user_id", user.id),
    ]);

    const profile = profileRes.data;
    const progress = progressRes.data || [];

    const completedCourses: Record<string, number> = {};
    progress.forEach((p: any) => {
      if (p.completed) completedCourses[p.category_id] = (completedCourses[p.category_id] || 0) + 1;
    });

    const prompt = `You are a learning path recommender for a life skills platform. Based on the user's profile, recommend exactly 3 course IDs they should try next.

Available course IDs: tech, financial, health, career, cooking, social, home, everyday, legal, environment, safety, communication, photography, music, gardening, parenting, travel, pets, mindfulness, automotive, sewing, languages, digital-tools, negotiation, mental-models, networking, moving, taxes, insurance, writing, voting

User interests: ${JSON.stringify(profile?.interests || [])}
Learning style: ${profile?.learning_style || "not set"}
Currently enrolled: ${JSON.stringify(profile?.enrolled_courses || [])}
Completed lessons by course: ${JSON.stringify(completedCourses)}

Rules:
- Don't recommend courses they're already enrolled in
- Prioritize courses related to their interests
- Consider what skills complement their progress
- Return ONLY a JSON array of 3 course IDs, nothing else`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a JSON-only API. Return only valid JSON arrays, no explanation." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again later" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI request failed");
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "[]";

    // Parse JSON from the response (handle markdown code blocks)
    let recommendations: string[];
    try {
      const cleaned = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
      recommendations = JSON.parse(cleaned);
    } catch {
      recommendations = ["financial", "health", "career"];
    }

    return new Response(
      JSON.stringify({ recommendations: recommendations.slice(0, 3) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("recommend-paths error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
