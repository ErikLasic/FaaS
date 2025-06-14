import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*", // zamenjaj z domeno za produkcijo
  "Access-Control-Allow-Methods": "DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Vary": "Origin",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: CORS_HEADERS,
    });
  }

  if (req.method !== "DELETE") {
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

    const now = new Date();
    const cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("events")
      .delete()
      .lt("event_date", cutoffDate)
      .select("*");

    if (error) {
      console.error("Delete error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: {
          ...CORS_HEADERS,
          "Content-Type": "application/json",
        },
      });
    }

    const deletedCount = Array.isArray(data) ? data.length : 0;

    return new Response(
      JSON.stringify({ message: `Izbrisano ${deletedCount} dogodkov, starejših od 24 ur.` }),
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
