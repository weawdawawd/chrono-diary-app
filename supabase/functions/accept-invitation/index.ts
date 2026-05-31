import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { token, email, password, displayName, action } = await req.json();
    if (!token) {
      return new Response(JSON.stringify({ error: "Fehlende Felder" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: invite, error: invErr } = await admin
      .from("invitations").select("*").eq("token", token).maybeSingle();
    if (invErr || !invite) {
      return new Response(JSON.stringify({ error: "Einladung ungültig" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (invite.used_at) {
      return new Response(JSON.stringify({ error: "Einladung wurde bereits verwendet" }), {
        status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (new Date(invite.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Einladung ist abgelaufen" }), {
        status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "check") {
      return new Response(JSON.stringify({ ok: true, email: invite.email, displayName: invite.note }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Fehlende Felder" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (password.length < 6) {
      return new Response(JSON.stringify({ error: "Passwort muss mindestens 6 Zeichen lang sein" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Enforce that the registered email matches the invitation's pre-set email
    // to prevent link interception/forwarding from creating accounts under a
    // different identity that inherits the invited role.
    if (invite.email && email.toLowerCase().trim() !== invite.email.toLowerCase().trim()) {
      return new Response(JSON.stringify({ error: "E-Mail stimmt nicht mit der Einladung überein" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { display_name: displayName ?? null },
    });
    if (createErr || !created.user) {
      // Log details server-side, return generic message to avoid account enumeration
      console.error("[accept-invitation] createUser failed", { error: createErr?.message });
      return new Response(JSON.stringify({ error: "Konto konnte nicht erstellt werden. Bitte versuche es erneut." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = created.user.id;

    await admin.from("user_roles").insert({ user_id: userId, role: invite.role });
    await admin.from("profiles").upsert({ user_id: userId, email, display_name: displayName ?? null }, { onConflict: "user_id" });
    await admin.from("invitations").update({ used_at: new Date().toISOString(), used_by: userId }).eq("id", invite.id);

    return new Response(JSON.stringify({ ok: true, email }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
