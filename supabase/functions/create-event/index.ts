import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const token = authHeader.split(" ")[1];

  // Supabase client z uporabniškim JWT tokenom
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
    },
  });

  // Pridobimo uporabnika iz tokena
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, description, event_date } = body;

    if (!title || !event_date) {
      return new Response("Missing title or event_date", { status: 400 });
    }

    // Validacija event_date, da je ISO string
    if (isNaN(Date.parse(event_date))) {
      return new Response("Invalid event_date format", { status: 400 });
    }

    const now = new Date().toISOString();

    // Vstavi nov dogodek z user_id iz tokena, ter nastavi created_at/updated_at
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
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("user.id:", user.id);

    return new Response(JSON.stringify({ data }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error in function:", e);
    return new Response("Internal Server Error", { status: 500 });
  }
});
