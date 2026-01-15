import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const ALLOWED_ORIGINS = [
  'https://bficxnetrsuyzygutztn.lovableproject.com',
  'https://thinkandtalk.lovable.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'https://bficxnetrsuyzygutztn.supabase.co'
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.some(o => origin.startsWith(o.replace(/\/$/, ''))) 
    ? origin 
    : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);
  
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

    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user?.email) {
      throw new Error("Usuário não autenticado.");
    }

    const priceId = Deno.env.get("STRIPE_THINKANDTALK_PRICE_ID");
    if (!priceId) {
      throw new Error("Price ID não configurado.");
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("Stripe não configurado.");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });

    // Check if user already has a Stripe customer ID
    const { data: profile } = await supabaseClient
      .from("users")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    let customerId = profile?.stripe_customer_id ?? null;

    // Look up existing Stripe customer by email if we don't have one stored
    if (!customerId) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        // Store the customer ID for future use
        await supabaseClient
          .from("users")
          .upsert({ user_id: user.id, email: user.email, stripe_customer_id: customerId });
      }
    }

    // Determine success/cancel URLs
    const successOrigin = origin && ALLOWED_ORIGINS.some(o => origin.startsWith(o.replace(/\/$/, '')))
      ? origin
      : Deno.env.get("SITE_URL") ?? ALLOWED_ORIGINS[0];

    console.log("Creating checkout session for user:", user.id, "email:", user.email);

    const session = await stripe.checkout.sessions.create({
      customer: customerId ?? undefined,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${successOrigin}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${successOrigin}/premium`,
      allow_promotion_codes: true,
      metadata: {
        userId: user.id,
      },
    });

    console.log("Checkout session created:", session.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    console.error("Error creating subscription checkout:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro ao criar sessão de checkout.";
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...getCorsHeaders(req.headers.get('origin')), "Content-Type": "application/json" },
      status: 500,
    });
  }
});
