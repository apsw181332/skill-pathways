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

    const criteria = [
      "Learning Speed", "Visual Pref", "Auditory Pref", "Kinesthetic Pref",
      "Reading/Writing Pref", "Attention Span", "Social Learning", "Content Complexity", "Accessibility Needs"
    ];
    const levels = ["low/simple/short", "moderate", "high/complex/long"];
    const profile = learningCode.split("").map((d: string, i: number) =>
      `${criteria[i]}: ${levels[parseInt(d)] || "moderate"}`
    ).join(", ");

    const prompt = `You are an adaptive learning assistant for a life-skills app used by teens and young adults.

Learner profile: ${profile}
Primary learning style: ${learningStyle || "balanced"}

Original lesson title: ${lessonTitle}
Original content: ${lessonContent}
Original mascot message: ${mascotMsg}

STRICT RULES — follow every single one:
1. Use SIMPLE, everyday language. Write at a 6th-grade reading level. No jargon.
2. Keep the adapted content SHORT — maximum 3-4 sentences. Cut fluff ruthlessly.
3. Include ONE practical real-life example (e.g. "Imagine you're at a store and..." or "For example, when you open your phone...")
4. If visual preference is high, use 1-2 emoji and a vivid metaphor
5. If kinesthetic preference is high, add a "Try this:" action step in one sentence
6. If reading/writing preference is high, include a key vocabulary word with simple definition
7. If attention span is short, use bullet points instead of paragraphs
8. If accessibility needs are significant, use the simplest possible words
9. Keep the SAME factual information — just make it easier to understand
10. The mascot message should be encouraging, short (1 sentence), and reference the specific topic
11. Return JSON with "adapted" (adapted content string) and "adaptedMascotMsg" (adapted mascot message string)`;

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ adapted: lessonContent, adaptedMascotMsg: mascotMsg }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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

    if (!response.ok) {
      console.error("AI gateway error:", response.status, await response.text());
      return new Response(JSON.stringify({ adapted: lessonContent, adaptedMascotMsg: mascotMsg }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
