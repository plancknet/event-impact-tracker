import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type PlanType = "STANDARD" | "INFLUENCER";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user) {
      throw new Error("Usuario nao autenticado.");
    }

    const body = await req.json().catch(() => ({}));
    const sessionId = typeof body?.sessionId === "string" ? body.sessionId : "";
    if (!sessionId) {
      throw new Error("Session ID invalido.");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ success: false, isPremium: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const planType = (session.metadata?.planType as PlanType | undefined) ?? "STANDARD";
    const normalizedPlan: PlanType = planType === "INFLUENCER" ? "INFLUENCER" : "STANDARD";

    const updates: Record<string, unknown> = {
      user_id: user.id,
      email: user.email,
      is_premium: true,
      subscription_tier: normalizedPlan,
      premium_type: normalizedPlan === "INFLUENCER" ? "influencer" : "standard",
      plan_confirmed: true,
      purchase_date: new Date().toISOString(),
      stripe_customer_id: session.customer,
      stripe_session_id: sessionId,
      stripe_subscription_id: normalizedPlan === "INFLUENCER" ? (session.subscription as string | null) : null,
      subscription_status: "active",
      updated_at: new Date().toISOString(),
    };

    if (normalizedPlan === "INFLUENCER" && typeof session.subscription === "string") {
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      updates.subscription_status = subscription.status ?? "active";
      updates.current_period_end = subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null;
    } else {
      updates.current_period_end = null;
    }

    const { error: upsertError } = await supabaseClient
      .from("users")
      .upsert(updates, { onConflict: "user_id" });

    if (upsertError) {
      throw upsertError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        isPremium: true,
        plan: normalizedPlan,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error verifying payment:", error);
    return new Response(JSON.stringify({ error: "Payment verification failed." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
