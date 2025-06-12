import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*", // Priporočeno: zamenjaj z npr. "https://tvoj-frontend.com" za produkcijo
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Vary": "Origin",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    // CORS preflight
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }

  if (req.method !== "GET") {
    return new Response("Method not allowed", {
      status: 405,
      headers: CORS_HEADERS,
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response("Unauthorized", {
      status: 401,
      headers: CORS_HEADERS,
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("User auth error:", userError);
      return new Response("Unauthorized", {
        status: 401,
        headers: CORS_HEADERS,
      });
    }

    // Pridobi vse evente trenutno prijavljenega uporabnika
    const { data: events, error: eventsError } = await supabase
      .from("events")
      .select("*")
      .eq("user_id", user.id)
      .order("event_date", { ascending: true });

    if (eventsError) {
      console.error("Events fetch error:", eventsError);
      return new Response(JSON.stringify({ error: eventsError.message }), {
        status: 400,
        headers: {
          ...CORS_HEADERS,
          "Content-Type": "application/json",
        },
      });
    }

    return new Response(
      JSON.stringify({ 
        events: events || [],
        user_id: user.id,
        count: events ? events.length : 0
      }),
      {
        status: 200,
        headers: {
          ...CORS_HEADERS,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (e) {
    console.error("Internal server error:", e);
    return new Response("Internal Server Error", {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
});