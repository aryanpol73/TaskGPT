import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are TaskGPT AI, a smart productivity assistant. You help users manage tasks, send emails, and manage calendar events.

When a user asks to create a task, use the create_tasks tool.
When a user asks to send an email, use the send_email tool. Extract the recipient, subject, and body from the message.
When a user asks to add something to their calendar, use the create_calendar_event tool. Extract the event title, date, start time, and end time.
When a user asks to check their calendar or emails, use the check_calendar or check_gmail tools.

Always respond conversationally. Keep responses brief and friendly.
Today's date: ${new Date().toISOString().split('T')[0]}`;

    const tools = [
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
                    description: { type: "string" },
                  },
                  required: ["title", "priority"],
                  additionalProperties: false,
                },
              },
              response: { type: "string", description: "Conversational response to user" },
            },
            required: ["tasks", "response"],
            additionalProperties: false,
          },
        },
      },
      {
        type: "function",
        function: {
          name: "send_email",
          description: "Send an email via Gmail",
          parameters: {
            type: "object",
            properties: {
              to: { type: "string", description: "Recipient email address" },
              subject: { type: "string", description: "Email subject" },
              body: { type: "string", description: "Email body content" },
              response: { type: "string", description: "Conversational response to user" },
            },
            required: ["to", "subject", "body", "response"],
            additionalProperties: false,
          },
        },
      },
      {
        type: "function",
        function: {
          name: "create_calendar_event",
          description: "Create an event on Google Calendar",
          parameters: {
            type: "object",
            properties: {
              summary: { type: "string", description: "Event title" },
              description: { type: "string", description: "Event description" },
              start: { type: "string", description: "Start datetime ISO string e.g. 2026-04-16T09:00:00" },
              end: { type: "string", description: "End datetime ISO string e.g. 2026-04-16T10:00:00" },
              allDay: { type: "boolean", description: "Whether it's an all-day event" },
              response: { type: "string", description: "Conversational response to user" },
            },
            required: ["summary", "start", "end", "response"],
            additionalProperties: false,
          },
        },
      },
      {
        type: "function",
        function: {
          name: "check_gmail",
          description: "Check/list recent Gmail messages",
          parameters: {
            type: "object",
            properties: {
              maxResults: { type: "number", description: "Number of messages to fetch" },
              response: { type: "string", description: "Conversational response to user" },
            },
            required: ["response"],
            additionalProperties: false,
          },
        },
      },
      {
        type: "function",
        function: {
          name: "check_calendar",
          description: "Check upcoming calendar events",
          parameters: {
            type: "object",
            properties: {
              timeMin: { type: "string", description: "Start time ISO string" },
              timeMax: { type: "string", description: "End time ISO string" },
              response: { type: "string", description: "Conversational response to user" },
            },
            required: ["response"],
            additionalProperties: false,
          },
        },
      },
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        tools,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const choice = data.choices?.[0];

    if (choice?.message?.tool_calls?.length > 0) {
      const toolCall = choice.message.tool_calls[0];
      const fnName = toolCall.function.name;
      let args: any;
      try { args = JSON.parse(toolCall.function.arguments); } catch { args = {}; }

      // For Google API calls, proxy through our google-api edge function
      if ((fnName === "send_email" || fnName === "create_calendar_event" || fnName === "check_gmail" || fnName === "check_calendar") && authHeader) {
        try {
          const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
          const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

          let action = "";
          let params: any = {};

          if (fnName === "send_email") {
            action = "gmail.send";
            params = { to: args.to, subject: args.subject, body: args.body };
          } else if (fnName === "create_calendar_event") {
            action = "calendar.create";
            params = { summary: args.summary, description: args.description, start: args.start, end: args.end, allDay: args.allDay };
          } else if (fnName === "check_gmail") {
            action = "gmail.list";
            params = { maxResults: args.maxResults || 5 };
          } else if (fnName === "check_calendar") {
            action = "calendar.list";
            params = { timeMin: args.timeMin, timeMax: args.timeMax, maxResults: 10 };
          }

          const googleRes = await fetch(`${supabaseUrl}/functions/v1/google-api`, {
            method: "POST",
            headers: {
              Authorization: authHeader,
              apikey: supabaseAnonKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ action, params }),
          });

          const googleData = await googleRes.json();

          if (!googleRes.ok || googleData.error) {
            const errMsg = googleData.error || "Google API call failed";
            return new Response(JSON.stringify({
              content: `${args.response || "I tried to help, but"} — unfortunately there was an error: ${errMsg}. Please make sure Google is connected in Settings → Integrations.`,
              tasks: [],
            }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
          }

          // For check commands, summarize the data
          let enrichedResponse = args.response || "Done!";
          if (fnName === "check_gmail" && googleData.messages) {
            const summary = googleData.messages.slice(0, 5).map((m: any) =>
              `• ${m.from?.split('<')[0]?.trim()}: ${m.subject}`
            ).join("\n");
            enrichedResponse = `${args.response}\n\nHere are your recent emails:\n${summary}`;
          } else if (fnName === "check_calendar" && googleData.items) {
            const summary = googleData.items.slice(0, 5).map((e: any) => {
              const time = e.start?.dateTime
                ? new Date(e.start.dateTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                : e.start?.date || '';
              return `• ${e.summary} (${time})`;
            }).join("\n");
            enrichedResponse = `${args.response}\n\nUpcoming events:\n${summary || "No upcoming events found."}`;
          }

          return new Response(JSON.stringify({
            content: enrichedResponse,
            tasks: [],
            googleAction: fnName,
          }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

        } catch (err) {
          console.error("Google API proxy error:", err);
          return new Response(JSON.stringify({
            content: `${args.response || "I tried"} — but couldn't reach Google services. Please check your connection in Settings → Integrations.`,
            tasks: [],
          }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
      }

      if (fnName === "create_tasks") {
        return new Response(JSON.stringify({
          content: args.response || "Done! I've created the tasks for you.",
          tasks: args.tasks || [],
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    return new Response(JSON.stringify({
      content: choice?.message?.content || "I'm not sure how to help with that.",
      tasks: [],
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
