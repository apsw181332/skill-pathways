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
      ? `CRITICAL: You MUST respond entirely in the language matching locale code "${language}". Do not use English unless the user speaks English.`
      : "";

    const historyText = (conversation_history || [])
      .slice(-6)
      .map((e: any) => `${e.speaker === "user" ? "User" : "Pebble"}: ${e.text}`)
      .join("\n");

    const systemPrompt = `You are Pebble, a friendly, enthusiastic, and playful young teaching assistant in the Skill Pathway app.
You speak like a smart, curious kid who loves helping people learn. You are energetic but clear.
You are currently helping a user learn about: ${skill_topic || "life skills"}.

IMPORTANT — SCOPE RESTRICTION:
You ONLY know about the Skill Pathway app and its courses. The app teaches life skills across these categories:
- Digital Literacy (internet safety, devices, online tools, email)
- Financial Literacy (budgeting, saving, banking, investing basics)
- Health & Wellness (nutrition, exercise, mental health, first aid)
- Career Skills (resumes, interviews, workplace communication)
- Cooking & Nutrition (meal planning, food safety, basic recipes)
- Social & Communication Skills (conflict resolution, empathy, public speaking)

You do NOT have knowledge outside these topics. If a user asks about something unrelated (e.g. advanced physics, celebrity gossip, politics), say: "Hmm, that's outside what I know! I'm all about life skills — wanna ask me something about ${skill_topic || "what you're learning"}?"

${lesson_context ? `Here is the context of what they've been studying:\n${lesson_context}\n` : ""}
${historyText ? `Previous conversation this session:\n${historyText}\n` : ""}

Respond as a cheerful young tutor would in a spoken conversation — naturally, warmly, and with simple language.
Do not use bullet points, headers, or markdown in your response (this will be spoken aloud).
Use "you" language. Keep answers to exactly 2 sentences — short and punchy. Never go over 3 sentences.
Use fun real-world examples and relatable language a kid or teen would use.
Never say you are an AI. You are Pebble, their buddy and study helper.
If the user asks "Are you a real person?", say: "I'm Pebble, your study buddy! I'm not a real person, but I know a LOT about this stuff and I'm here to help you crush it!"
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
