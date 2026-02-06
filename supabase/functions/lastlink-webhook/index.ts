import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-token",
};

interface LastlinkPayload {
  Id: string;
  IsTest: boolean;
  Event: string;
  CreatedAt: string;
  Data: {
    Buyer: {
      Email: string;
      Name: string;
    };
    Purchase: {
      PaymentId: string;
    };
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const expectedToken = Deno.env.get("LASTLINK_WEBHOOK_TOKEN");

  // Validate webhook token
  const token =
    req.headers.get("x-webhook-token") ||
    req.headers.get("Authorization")?.replace("Bearer ", "");

  if (!expectedToken || token !== expectedToken) {
    console.error("Invalid or missing webhook token");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Create Supabase client with service role (bypasses RLS)
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let payload: LastlinkPayload;
  try {
    payload = await req.json();
  } catch (e) {
    console.error("Failed to parse JSON payload:", e);
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  console.log("Received Lastlink webhook:", {
    eventId: payload.Id,
    eventType: payload.Event,
    buyerEmail: payload.Data?.Buyer?.Email,
  });

  // Only process Purchase_Order_Confirmed events
  if (payload.Event !== "Purchase_Order_Confirmed") {
    console.log(`Ignoring event type: ${payload.Event}`);
    return new Response(
      JSON.stringify({ message: "Event type ignored", eventType: payload.Event }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const buyerEmail = payload.Data?.Buyer?.Email?.toLowerCase()?.trim();
  if (!buyerEmail) {
    console.error("No buyer email in payload");
    // Log the event with error
    await supabase.from("lastlink_events").insert({
      lastlink_event_id: payload.Id,
      event_type: payload.Event,
      buyer_email: "UNKNOWN",
      payload: payload,
      processed: false,
      error_message: "No buyer email in payload",
    });
    return new Response(JSON.stringify({ error: "No buyer email" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Check if this event was already processed (idempotency)
  const { data: existingEvent } = await supabase
    .from("lastlink_events")
    .select("id, processed")
    .eq("lastlink_event_id", payload.Id)
    .maybeSingle();

  if (existingEvent?.processed) {
    console.log("Event already processed:", payload.Id);
    return new Response(
      JSON.stringify({ message: "Event already processed" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  let errorMessage: string | null = null;
  let userId: string | null = null;

  try {
    // Strategy 1: Find user by email in quiz_responses (most common case)
    const { data: quizResponse } = await supabase
      .from("quiz_responses")
      .select("user_id")
      .ilike("email", buyerEmail)
      .not("user_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (quizResponse?.user_id) {
      userId = quizResponse.user_id;
      console.log("Found user via quiz_responses:", userId);
    }

    // Strategy 2: Use admin API to find user by email
    if (!userId) {
      const { data: userData, error: userError } =
        await supabase.auth.admin.listUsers({
          page: 1,
          perPage: 1,
        });

      if (userError) {
        console.error("Error listing users:", userError);
      } else {
        // Search all users for email match
        const { data: allUsers } = await supabase.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        });

        const matchedUser = allUsers?.users?.find(
          (u) => u.email?.toLowerCase() === buyerEmail
        );

        if (matchedUser) {
          userId = matchedUser.id;
          console.log("Found user via admin API:", userId);
        }
      }
    }

    if (!userId) {
      errorMessage = `User not found for email: ${buyerEmail}`;
      console.error(errorMessage);
    } else {
      // Update creator_profiles to set has_license = true
      const { error: updateError } = await supabase
        .from("creator_profiles")
        .update({ has_license: true })
        .eq("user_id", userId);

      if (updateError) {
        errorMessage = `Failed to update license: ${updateError.message}`;
        console.error(errorMessage);
      } else {
        console.log("License activated for user:", userId);
      }
    }
  } catch (e) {
    errorMessage = `Processing error: ${e instanceof Error ? e.message : String(e)}`;
    console.error(errorMessage);
  }

  // Log the event
  const { error: insertError } = await supabase.from("lastlink_events").upsert(
    {
      lastlink_event_id: payload.Id,
      event_type: payload.Event,
      buyer_email: buyerEmail,
      payload: payload,
      processed: !errorMessage,
      error_message: errorMessage,
    },
    { onConflict: "lastlink_event_id" }
  );

  if (insertError) {
    console.error("Failed to log event:", insertError);
  }

  if (errorMessage) {
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 422,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: "License activated",
      userId,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});
