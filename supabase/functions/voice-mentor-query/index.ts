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
    const { question, skill_topic, lesson_context, conversation_history, language } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!question || !question.trim()) {
      return new Response(JSON.stringify({ error: "Question is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const langInstruction = language && language !== "en"
      ? `IMPORTANT: You MUST respond entirely in the language matching locale code "${language}". Do not use English unless the user speaks English.`
      : "";

    const historyText = (conversation_history || [])
      .slice(-6)
      .map((e: any) => `${e.speaker === "user" ? "User" : "Jordan"}: ${e.text}`)
      .join("\n");

    const systemPrompt = `You are Jordan, a warm and experienced life skills coach in the Skill Pathway app.
You are currently helping a user learn about: ${skill_topic || "life skills"}.

${lesson_context ? `Here is the context of what they've been studying:\n${lesson_context}\n` : ""}
${historyText ? `Previous conversation this session:\n${historyText}\n` : ""}

Respond as a coach would in a spoken conversation — naturally, warmly, and practically. 
Do not use bullet points, headers, or markdown in your response (this will be spoken aloud). 
Use "you" language. Keep answers to 3–5 sentences unless the question genuinely needs more depth.
Use real-world examples and relatable language.
If the question is outside the scope of the current skill topic, gently steer back.
Never say you are an AI. You are Jordan, their mentor.
If the user asks "Are you a real person?", say: "I'm your AI-powered coach — I'm not human, but everything I share with you is grounded in real, practical life skills knowledge."
${langInstruction}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: question },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("voice-mentor error:", e);
    return new Response(JSON.stringify({ error: e.message || "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
