import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      },
    );

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: userData } = await supabaseClient.auth.getUser(token);
    const user = userData?.user;

    if (!user?.email) {
      return new Response(JSON.stringify({ error: "Usuário não autenticado." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const { data: eventData, error: eventError } = await supabaseAdmin
      .from("lastlink_events")
      .select("event_id, event_type")
      .eq("buyer_email", user.email)
      .eq("event_type", "Purchase_Order_Confirmed")
      .maybeSingle();

    if (eventError || !eventData) {
      return new Response(JSON.stringify({ activated: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const { error: upsertError } = await supabaseAdmin
      .from("creator_profiles")
      .upsert({
        user_id: user.id,
        has_license: true,
      }, { onConflict: "user_id" });

    if (upsertError) {
      console.error("Failed to activate license:", upsertError);
      return new Response(JSON.stringify({ activated: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ activated: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Lastlink verify error:", error);
    return new Response(JSON.stringify({ error: "Erro ao verificar pagamento." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
