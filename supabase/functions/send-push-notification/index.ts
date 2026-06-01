// Send Push Notifications via FCM HTTP v1
//
// SETUP:
// - Create a Firebase project, generate a service account JSON
//   (Project Settings → Service Accounts → Generate new private key).
// - Add the *entire JSON content* as a Supabase secret named
//   `FCM_SERVICE_ACCOUNT_KEY`.
// - On Android, place `google-services.json` into `android/app/`.
//
// Input: { user_id: string, title: string, body: string, data?: Record<string,string> }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface PushInput {
  user_id: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

// ---- Google OAuth2 access token (service account JWT) ----
async function getAccessToken(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const enc = (obj: unknown) =>
    btoa(JSON.stringify(obj)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  const unsigned = `${enc(header)}.${enc(claim)}`;

  // Import private key (PKCS#8 PEM)
  const pem = serviceAccount.private_key as string;
  const pemBody = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s+/g, "");
  const binary = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    "pkcs8",
    binary,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = new Uint8Array(
    await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned))
  );
  const sigB64 = btoa(String.fromCharCode(...sig))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
  const jwt = `${unsigned}.${sigB64}`;

  const tokRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const tokJson = await tokRes.json();
  if (!tokRes.ok) throw new Error(`OAuth failed: ${JSON.stringify(tokJson)}`);
  return tokJson.access_token as string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const input = (await req.json()) as PushInput;
    if (!input?.user_id || !input?.title || !input?.body) {
      return new Response(JSON.stringify({ error: "user_id, title, body required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceAccountRaw = Deno.env.get("FCM_SERVICE_ACCOUNT_KEY");
    if (!serviceAccountRaw) {
      return new Response(JSON.stringify({ error: "FCM_SERVICE_ACCOUNT_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const serviceAccount = JSON.parse(serviceAccountRaw);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: tokens, error } = await supabase
      .from("device_tokens")
      .select("token")
      .eq("user_id", input.user_id);

    if (error) throw error;
    if (!tokens || tokens.length === 0) {
      return new Response(JSON.stringify({ sent: 0, reason: "no tokens" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = await getAccessToken(serviceAccount);
    const projectId = serviceAccount.project_id;
    const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

    const dataStr: Record<string, string> = {};
    if (input.data) for (const [k, v] of Object.entries(input.data)) dataStr[k] = String(v);

    const results = await Promise.all(
      tokens.map(async (t) => {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: {
              token: t.token,
              notification: { title: input.title, body: input.body },
              data: dataStr,
            },
          }),
        });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) {
          // Cleanup dead tokens
          const errCode = j?.error?.details?.[0]?.errorCode || j?.error?.status;
          if (errCode === "UNREGISTERED" || errCode === "INVALID_ARGUMENT" || res.status === 404) {
            await supabase.from("device_tokens").delete().eq("token", t.token);
          }
          return { token: t.token, ok: false, error: j };
        }
        return { token: t.token, ok: true };
      })
    );

    return new Response(
      JSON.stringify({ sent: results.filter((r) => r.ok).length, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
