import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

serve(async (req) => {
  if (req.method !== "DELETE") {
    return new Response("Method not allowed", { status: 405 });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
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
      return new Response("Unauthorized", { status: 401 });
    }

    // Izračunaj datum 24 ur nazaj
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    // Pobriši dogodke, ki imajo event_date starejši od cutoffDate
    const { data, error } = await supabase
      .from("events")
      .delete()
      .lt("event_date", cutoffDate)
      .select("*");

    if (error) {
      console.error("Delete error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const deletedCount = Array.isArray(data) ? data.length : 0;

    return new Response(
      JSON.stringify({ message: `Izbrisano ${deletedCount} dogodkov, starejših od 24 ur.` }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Internal server error:", e);
    return new Response("Internal Server Error", { status: 500 });
  }
});
