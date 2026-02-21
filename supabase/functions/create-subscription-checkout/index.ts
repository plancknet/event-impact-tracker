import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const ALLOWED_ORIGINS = [
  "https://bficxnetrsuyzygutztn.lovableproject.com",
  "https://thinkandtalk.lovable.app",
  "https://thinkandtalk.site",
  "https://www.thinkandtalk.site",
  "http://localhost:5173",
  "http://localhost:3000",
  "https://bficxnetrsuyzygutztn.supabase.co",
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.some((o) => origin.startsWith(o.replace(/\/$/, '')))
    ? origin
    : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };
}

serve(async (req) => {
  const origin = req.headers.get("origin");
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
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      },
    );

    // Try to get user, but don't require authentication
    let user = null;
    let userEmail: string | undefined;
    
    if (token) {
      const { data } = await supabaseClient.auth.getUser(token);
      user = data.user;
      userEmail = user?.email ?? undefined;
    }

    // Parse request body for quiz response ID
    let quizResponseId: string | undefined;
    try {
      const body = await req.json();
      quizResponseId = body?.quizResponseId;
    } catch {
      // No body or invalid JSON, continue without it
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
      apiVersion: "2024-06-20",
    });

    let customerId: string | null = null;

    // Only look up customer if user is authenticated
    if (user?.id && userEmail) {
      const { data: profile } = await supabaseClient
        .from("users")
        .select("stripe_customer_id")
        .eq("user_id", user.id)
        .maybeSingle();

      customerId = profile?.stripe_customer_id ?? null;

      if (!customerId) {
        const customers = await stripe.customers.list({ email: userEmail, limit: 1 });
        if (customers.data.length > 0) {
          customerId = customers.data[0].id;
          await supabaseClient
            .from("users")
            .upsert({ user_id: user.id, email: userEmail, stripe_customer_id: customerId });
        }
      }
    }

    const successOrigin = origin && ALLOWED_ORIGINS.some((o) => origin.startsWith(o.replace(/\/$/, "")))
      ? origin
      : Deno.env.get("SITE_URL") ?? ALLOWED_ORIGINS[0];

    console.log("Creating checkout session", user?.id ? `for user: ${user.id}` : "for guest", userEmail ? `email: ${userEmail}` : "");

    const metadata: Record<string, string> = {};
    if (user?.id) metadata.userId = user.id;
    if (quizResponseId) metadata.quizResponseId = quizResponseId;

    const session = await stripe.checkout.sessions.create({
      customer: customerId ?? undefined,
      customer_email: customerId ? undefined : userEmail,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${successOrigin}/premium/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${successOrigin}/premium`,
      allow_promotion_codes: true,
      metadata,
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
      headers: { ...getCorsHeaders(req.headers.get("origin")), "Content-Type": "application/json" },
      status: 500,
    });
  }
});
