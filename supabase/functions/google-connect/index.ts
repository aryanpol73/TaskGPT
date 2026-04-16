import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
].join(" ");

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
    const { action, redirect_uri, code } = body;

    if (action === "get_auth_url") {
      if (!GOOGLE_CLIENT_ID) {
        return new Response(JSON.stringify({ error: "Google Client ID not configured" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: redirect_uri || "",
        response_type: "code",
        scope: SCOPES,
        access_type: "offline",
        prompt: "consent",
        state: user.id,
      });

      return new Response(JSON.stringify({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "exchange_code") {
      if (!code || !redirect_uri) {
        return new Response(JSON.stringify({ error: "Missing code or redirect_uri" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID || "",
          client_secret: GOOGLE_CLIENT_SECRET || "",
          code,
          grant_type: "authorization_code",
          redirect_uri,
        }),
      });

      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        console.error("Token exchange failed:", errText);
        return new Response(JSON.stringify({ error: "Failed to exchange code with Google" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const tokenData = await tokenRes.json();
      const expiresAt = new Date(Date.now() + (tokenData.expires_in || 3600) * 1000).toISOString();

      // Use service role to upsert tokens reliably
      const serviceClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const { data: existing } = await serviceClient
        .from("google_tokens")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        await serviceClient.from("google_tokens").update({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || undefined,
          expires_at: expiresAt,
          scopes: SCOPES,
        }).eq("user_id", user.id);
      } else {
        await serviceClient.from("google_tokens").insert({
          user_id: user.id,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token || null,
          expires_at: expiresAt,
          scopes: SCOPES,
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "disconnect") {
      const serviceClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      await serviceClient.from("google_tokens").delete().eq("user_id", user.id);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
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
