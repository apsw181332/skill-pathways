import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { learningCode, lessonTitle, lessonContent, mascotMsg, learningStyle } = await req.json();

    if (!learningCode || !lessonContent) {
      return new Response(JSON.stringify({ adapted: lessonContent, adaptedMascotMsg: mascotMsg }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Decode learning code
    const criteria = [
      "Learning Speed", "Visual Pref", "Auditory Pref", "Kinesthetic Pref",
      "Reading/Writing Pref", "Attention Span", "Social Learning", "Content Complexity", "Accessibility Needs"
    ];
    const levels = ["low/simple/short", "moderate", "high/complex/long"];
    const profile = learningCode.split("").map((d: string, i: number) =>
      `${criteria[i]}: ${levels[parseInt(d)] || "moderate"}`
    ).join(", ");

    const prompt = `You are an adaptive learning assistant. Adapt the following lesson content for a learner with this profile:
${profile}
Primary learning style: ${learningStyle || "balanced"}

Original lesson title: ${lessonTitle}
Original content: ${lessonContent}
Original mascot message: ${mascotMsg}

Rules:
- If attention span is short, make content more concise with bullet points
- If visual preference is high, suggest adding visual metaphors
- If kinesthetic preference is high, add "try this" action steps
- If accessibility needs are significant, use simpler language
- If content complexity is simple, use everyday examples
- Keep the same factual information, just adapt presentation
- Return JSON with "adapted" (adapted content) and "adaptedMascotMsg" (adapted mascot message)`;

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ adapted: lessonContent, adaptedMascotMsg: mascotMsg }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai-gateway.lovable.dev/api/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: "You adapt educational content to match a learner's profile. Return ONLY valid JSON with 'adapted' and 'adaptedMascotMsg' keys." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";

    let result;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      result = JSON.parse(cleaned);
    } catch {
      result = { adapted: lessonContent, adaptedMascotMsg: mascotMsg };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
