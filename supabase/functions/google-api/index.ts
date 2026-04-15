import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, params } = body;

    // Get stored tokens
    const { data: tokenRow, error: tokenError } = await supabase
      .from("google_tokens")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (tokenError || !tokenRow) {
      return new Response(JSON.stringify({ error: "Google not connected. Please sign in with Google." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let accessToken = tokenRow.access_token;

    // Check if token is expired and refresh if needed
    if (tokenRow.expires_at && new Date(tokenRow.expires_at) < new Date()) {
      if (!tokenRow.refresh_token) {
        return new Response(JSON.stringify({ error: "Token expired and no refresh token. Please re-authenticate." }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID || "",
          client_secret: GOOGLE_CLIENT_SECRET || "",
          refresh_token: tokenRow.refresh_token,
          grant_type: "refresh_token",
        }),
      });

      if (!refreshRes.ok) {
        const errBody = await refreshRes.text();
        console.error("Token refresh failed:", errBody);
        return new Response(JSON.stringify({ error: "Failed to refresh Google token. Please re-authenticate." }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const refreshData = await refreshRes.json();
      accessToken = refreshData.access_token;

      // Update stored token
      await supabase.from("google_tokens").update({
        access_token: accessToken,
        expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
      }).eq("user_id", user.id);
    }

    // Route to the appropriate Google API
    let result;
    switch (action) {
      case "gmail.list":
        result = await gmailList(accessToken, params);
        break;
      case "gmail.get":
        result = await gmailGet(accessToken, params);
        break;
      case "gmail.send":
        result = await gmailSend(accessToken, params);
        break;
      case "calendar.list":
        result = await calendarList(accessToken, params);
        break;
      case "calendar.create":
        result = await calendarCreate(accessToken, params);
        break;
      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function gmailList(token: string, params?: { maxResults?: number; q?: string }) {
  const query = new URLSearchParams({
    maxResults: String(params?.maxResults || 20),
  });
  if (params?.q) query.set("q", params.q);

  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Gmail list failed [${res.status}]: ${await res.text()}`);
  const data = await res.json();

  // Fetch message details in parallel (batch of first 10)
  const messageIds = (data.messages || []).slice(0, 10);
  const details = await Promise.all(
    messageIds.map(async (m: { id: string }) => {
      const detail = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!detail.ok) return null;
      return detail.json();
    })
  );

  return {
    messages: details.filter(Boolean).map((msg: any) => {
      const headers = msg.payload?.headers || [];
      const getHeader = (name: string) => headers.find((h: any) => h.name === name)?.value || "";
      return {
        id: msg.id,
        threadId: msg.threadId,
        snippet: msg.snippet,
        from: getHeader("From"),
        subject: getHeader("Subject"),
        date: getHeader("Date"),
        labelIds: msg.labelIds,
        isUnread: msg.labelIds?.includes("UNREAD"),
      };
    }),
    resultSizeEstimate: data.resultSizeEstimate,
  };
}

async function gmailGet(token: string, params: { messageId: string }) {
  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${params.messageId}?format=full`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`Gmail get failed [${res.status}]: ${await res.text()}`);
  return res.json();
}

async function gmailSend(token: string, params: { to: string; subject: string; body: string }) {
  const rawMessage = [
    `To: ${params.to}`,
    `Subject: ${params.subject}`,
    `Content-Type: text/html; charset=utf-8`,
    "",
    params.body,
  ].join("\r\n");

  const encoded = btoa(unescape(encodeURIComponent(rawMessage)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: encoded }),
  });
  if (!res.ok) throw new Error(`Gmail send failed [${res.status}]: ${await res.text()}`);
  return res.json();
}

async function calendarList(token: string, params?: { timeMin?: string; timeMax?: string; maxResults?: number }) {
  const now = new Date();
  const query = new URLSearchParams({
    timeMin: params?.timeMin || now.toISOString(),
    timeMax: params?.timeMax || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    maxResults: String(params?.maxResults || 50),
    singleEvents: "true",
    orderBy: "startTime",
  });

  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${query}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Calendar list failed [${res.status}]: ${await res.text()}`);
  return res.json();
}

async function calendarCreate(token: string, params: {
  summary: string;
  description?: string;
  start: string;
  end: string;
  allDay?: boolean;
}) {
  const event: any = {
    summary: params.summary,
    description: params.description || "",
  };

  if (params.allDay) {
    event.start = { date: params.start.split("T")[0] };
    event.end = { date: params.end.split("T")[0] };
  } else {
    event.start = { dateTime: params.start, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone };
    event.end = { dateTime: params.end, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone };
  }

  const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(event),
  });
  if (!res.ok) throw new Error(`Calendar create failed [${res.status}]: ${await res.text()}`);
  return res.json();
}
