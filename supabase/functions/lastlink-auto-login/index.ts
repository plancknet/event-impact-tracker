import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_PASSWORD = "12345678";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email.trim() : "";

    if (!email) {
      return new Response(JSON.stringify({ ok: false, error: "Email invalido." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: eventData } = await supabaseAdmin
      .from("lastlink_events")
      .select("id")
      .eq("buyer_email", email)
      .eq("event_type", "Purchase_Order_Confirmed")
      .maybeSingle();

    if (!eventData) {
      return new Response(JSON.stringify({ ok: false, error: "Pagamento nao confirmado." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    let userId: string | null = null;

    const { data: listData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const existingUser = listData?.users?.find((u) => u.email === email);

    if (existingUser) {
      userId = existingUser.id;
    } else {
      const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: DEFAULT_PASSWORD,
        email_confirm: true,
        user_metadata: {
          must_change_password: true,
        },
      });

      if (createError) {
        return new Response(JSON.stringify({ ok: false, error: "Falha ao criar usuario." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        });
      }

      userId = createdUser?.user?.id ?? null;
    }

    if (userId) {
      await supabaseAdmin
        .from("creator_profiles")
        .upsert(
          {
            user_id: userId,
            has_license: true,
          },
          { onConflict: "user_id" },
        );

      await supabaseAdmin
        .from("quiz_responses")
        .update({ user_id: userId })
        .eq("email", email)
        .is("user_id", null);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Auto-login handler error:", error);
    return new Response(JSON.stringify({ ok: false, error: "Erro interno." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
