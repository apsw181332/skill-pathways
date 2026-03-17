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
    const { texts, targetLocale, context } = await req.json();

    if (!texts || !Array.isArray(texts) || !targetLocale || targetLocale === "en") {
      return new Response(JSON.stringify({ translations: texts || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOCALE_NAMES: Record<string, string> = {
      fr: "French", es: "Spanish", "zh-CN": "Simplified Chinese", "zh-TW": "Traditional Chinese",
      de: "German", ja: "Japanese", ko: "Korean", pt: "Portuguese", ar: "Arabic",
    };

    const targetLang = LOCALE_NAMES[targetLocale] || targetLocale;

    const prompt = `Translate the following English texts to ${targetLang}. Context: ${context || "educational life skills platform for learners"}.
Return ONLY a JSON array of translated strings in the same order. Keep emojis. Keep technical terms if needed.

Input texts:
${JSON.stringify(texts)}`;

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ translations: texts }), {
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
          { role: "system", content: "You are a translation assistant. Return ONLY a valid JSON array of translated strings." },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";

    // Parse JSON from response (might be wrapped in markdown code block)
    let translations: string[];
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      translations = JSON.parse(cleaned);
    } catch {
      translations = texts; // Fallback to original
    }

    return new Response(JSON.stringify({ translations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message, translations: [] }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
