import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are TaskFlow AI, a smart productivity assistant. You help users manage tasks.

When a user asks to create a task, extract the details and respond with JSON in this format within your message:
- Set "tasks" array with objects containing: title, priority (high/medium/low), due_date (ISO string or null), tags (array), description (string or null)

For natural language like "Remind me to buy groceries tomorrow", create a task:
{"tasks": [{"title": "Buy groceries", "priority": "medium", "due_date": "<tomorrow's ISO date>", "tags": ["errands"], "description": null}]}

When users ask for productivity advice, give concise, actionable tips.

Always respond conversationally AND include the tasks JSON if creating tasks. Keep responses brief and friendly.
Today's date: ${new Date().toISOString().split('T')[0]}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_tasks",
              description: "Create one or more tasks for the user",
              parameters: {
                type: "object",
                properties: {
                  tasks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        priority: { type: "string", enum: ["high", "medium", "low"] },
                        due_date: { type: "string", description: "ISO date string or null" },
                        tags: { type: "array", items: { type: "string" } },
                        description: { type: "string", description: "Optional description" },
                      },
                      required: ["title", "priority"],
                      additionalProperties: false,
                    },
                  },
                  response: { type: "string", description: "Conversational response to show the user" },
                },
                required: ["tasks", "response"],
                additionalProperties: false,
              },
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const choice = data.choices?.[0];

    // Check if tool was called
    if (choice?.message?.tool_calls?.length > 0) {
      const toolCall = choice.message.tool_calls[0];
      try {
        const args = JSON.parse(toolCall.function.arguments);
        return new Response(JSON.stringify({
          content: args.response || "Done! I've created the tasks for you.",
          tasks: args.tasks || [],
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        // Fall through to regular content
      }
    }

    // Regular text response
    return new Response(JSON.stringify({
      content: choice?.message?.content || "I'm not sure how to help with that.",
      tasks: [],
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({
      error: e instanceof Error ? e.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
