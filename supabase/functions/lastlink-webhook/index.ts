import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-lastlink-token",
};

const WEBHOOK_TOKEN = Deno.env.get("LASTLINK_WEBHOOK_TOKEN") ?? "";
const DEFAULT_PASSWORD = "12345678";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const token = req.headers.get("x-lastlink-token") ?? "";
  if (!WEBHOOK_TOKEN || token !== WEBHOOK_TOKEN) {
    return new Response(JSON.stringify({ error: "Invalid webhook token" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 401,
    });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    const payload = await req.json();
    const eventId = payload?.Id;
    const eventType = payload?.Event;

    if (!eventId || !eventType) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    if (eventType !== "Purchase_Order_Confirmed") {
      return new Response(JSON.stringify({ received: true, ignored: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const buyerEmail = payload?.Data?.Buyer?.Email ?? null;
    const paymentId = payload?.Data?.Purchase?.PaymentId ?? null;
    const isTest = Boolean(payload?.IsTest);

    await supabaseAdmin
      .from("lastlink_events")
      .upsert({
        event_id: eventId,
        event_type: eventType,
        buyer_email: buyerEmail,
        payment_id: paymentId,
        is_test: isTest,
        payload,
      }, { onConflict: "event_id" });

    if (buyerEmail) {
      let userId: string | null = null;
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserByEmail(buyerEmail);

      if (!userError && userData?.user) {
        userId = userData.user.id;
      } else {
        const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: buyerEmail,
          password: DEFAULT_PASSWORD,
          email_confirm: true,
          user_metadata: {
            must_change_password: true,
          },
        });
        if (!createError && createdUser?.user) {
          userId = createdUser.user.id;
        }
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
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Lastlink webhook error:", error);
    return new Response(JSON.stringify({ error: "Webhook handler error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
