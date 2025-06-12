import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Prilagodi na frontend domeno za produkcijo
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Content-Type": "application/json",
};

serve(async (req) => {
  // ⚠️ OPTIONS preflight za CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  const token = authHeader.split(" ")[1];

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
    },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  try {
    const body = await req.json();
    const { title, description, event_date } = body;

    if (!title || !event_date) {
      return new Response(JSON.stringify({ error: "Missing title or event_date" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    if (isNaN(Date.parse(event_date))) {
      return new Response(JSON.stringify({ error: "Invalid event_date format" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("events")
      .insert([{
        title,
        description: description ?? null,
        event_date,
        user_id: user.id,
        created_at: now,
        updated_at: now,
      }]);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    console.log("user.id:", user.id);

    return new Response(JSON.stringify({ data }), {
      status: 201,
      headers: corsHeaders,
    });
  } catch (e) {
    console.error("Error in function:", e);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
