import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  let event: Stripe.Event;

  try {
    const signature = req.headers.get("Stripe-Signature");
    if (!signature || !webhookSecret) {
      throw new Error("Missing Stripe signature or webhook secret");
    }
    const payload = await req.text();
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.error("Error verifying webhook signature", err);
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }

  try {
    let eventUserId: string | null = null;

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        eventUserId = await handleCheckoutCompleted(supabaseClient, session);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        eventUserId = await handleSubscriptionEvent(supabaseClient, subscription, event.type);
        break;
      }
      case "invoice.paid":
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        eventUserId = await handleInvoiceEvent(supabaseClient, invoice);
        break;
      }
      default:
        console.log("Unhandled Stripe event", event.type);
    }

    await supabaseClient
      .from("stripe_subscription_events")
      .insert({
        user_id: eventUserId,
        event_type: event.type,
        payload: event as any,
      });

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("Error handling webhook", err);
    return new Response(JSON.stringify({ error: "Webhook handler error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function handleSubscriptionEvent(
  supabaseClient: any,
  subscription: Stripe.Subscription,
  eventType: string,
): Promise<string | null> {
  const customerId = subscription.customer as string;
  const subscriptionId = subscription.id;
  const status = subscription.status ?? "inactive";
  const periodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null;

  const userId = await findUserId(supabaseClient, subscriptionId, customerId);

  const updates: any = {
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    subscription_status: status,
    current_period_end: periodEnd,
    last_subscription_check: new Date().toISOString(),
  };

  if (status === "active") {
    updates.subscription_tier = "INFLUENCER";
    updates.premium_type = "influencer";
    updates.is_premium = true;
    updates.plan_confirmed = true;
  } else if (status === "past_due") {
    updates.plan_confirmed = false;
    updates.is_premium = false;
  } else {
    updates.subscription_tier = "FREE";
    updates.is_premium = false;
    updates.plan_confirmed = false;
  }

  if (eventType === "customer.subscription.deleted") {
    updates.subscription_status = "canceled";
    updates.subscription_tier = "FREE";
    updates.is_premium = false;
    updates.plan_confirmed = false;
    updates.current_period_end = null;
    updates.stripe_subscription_id = null;
  }

  if (userId) {
    await supabaseClient.from("users").update(updates).eq("user_id", userId);
  }

  return userId;
}

async function handleInvoiceEvent(
  supabaseClient: any,
  invoice: Stripe.Invoice,
): Promise<string | null> {
  const subscriptionId = invoice.subscription as string | null;
  const customerId = invoice.customer as string | null;
  if (!customerId) return null;

  const status = invoice.paid ? "active" : "past_due";
  const userId = await findUserId(supabaseClient, subscriptionId ?? undefined, customerId);

  const updates: any = {
    stripe_latest_invoice_id: invoice.id,
    subscription_status: status,
    last_subscription_check: new Date().toISOString(),
  };

  if (invoice.paid) {
    updates.subscription_tier = "INFLUENCER";
    updates.is_premium = true;
    updates.plan_confirmed = true;
  } else {
    updates.plan_confirmed = false;
    updates.is_premium = false;
  }

  if (userId) {
    await supabaseClient.from("users").update(updates).eq("user_id", userId);
  }

  return userId;
}

async function handleCheckoutCompleted(
  supabaseClient: any,
  session: Stripe.Checkout.Session,
): Promise<string | null> {
  const customerId = session.customer as string | null;
  if (!customerId) return null;
  const userId = await findUserId(supabaseClient, undefined, customerId);

  if (userId) {
    await supabaseClient
      .from("users")
      .update({
        stripe_customer_id: customerId,
        stripe_session_id: session.id,
        last_subscription_check: new Date().toISOString(),
      })
      .eq("user_id", userId);
  }

  return userId;
}

async function findUserId(
  supabaseClient: any,
  subscriptionId: string | undefined,
  customerId: string | undefined,
): Promise<string | null> {
  if (!subscriptionId && !customerId) {
    return null;
  }

  if (subscriptionId) {
    const { data } = await supabaseClient
      .from("users")
      .select("user_id")
      .eq("stripe_subscription_id", subscriptionId)
      .maybeSingle();
    if (data?.user_id) {
      return data.user_id;
    }
  }

  if (customerId) {
    const { data } = await supabaseClient
      .from("users")
      .select("user_id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();
    if (data?.user_id) {
      return data.user_id;
    }
  }

  return null;
}
