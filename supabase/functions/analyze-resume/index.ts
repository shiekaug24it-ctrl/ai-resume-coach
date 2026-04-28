// Analyze a resume's text via Lovable AI Gateway
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { resumeText, fileName } = await req.json();
    if (!resumeText || typeof resumeText !== "string") {
      return new Response(JSON.stringify({ error: "resumeText is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const trimmed = resumeText.slice(0, 12000);

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content:
                "You are an expert resume reviewer and career coach. Analyze resumes and return concise, actionable feedback.",
            },
            {
              role: "user",
              content: `Analyze this resume${fileName ? ` ("${fileName}")` : ""} and provide structured feedback.\n\nResume content:\n${trimmed}`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "submit_resume_analysis",
                description: "Return a structured analysis of the resume.",
                parameters: {
                  type: "object",
                  properties: {
                    score: {
                      type: "number",
                      description: "Overall resume quality score 0-100",
                    },
                    summary: {
                      type: "string",
                      description: "2-3 sentence overall summary",
                    },
                    strengths: {
                      type: "array",
                      items: { type: "string" },
                      description: "3-5 strongest aspects",
                    },
                    suggestions: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          category: {
                            type: "string",
                            enum: ["wording", "formatting", "skills", "experience", "keywords", "structure"],
                          },
                          tip: { type: "string" },
                          priority: { type: "string", enum: ["high", "medium", "low"] },
                        },
                        required: ["category", "tip", "priority"],
                        additionalProperties: false,
                      },
                      description: "5-8 actionable improvement suggestions",
                    },
                    keywords: {
                      type: "array",
                      items: { type: "string" },
                      description: "Key skills/keywords detected or recommended",
                    },
                  },
                  required: ["score", "summary", "strengths", "suggestions", "keywords"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "submit_resume_analysis" },
          },
        }),
      },
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call returned by AI");

    const analysis = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-resume error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
