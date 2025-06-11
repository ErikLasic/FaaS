import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return new Response("Missing email or password", { status: 400 });
    }

    // Inicializiraj supabase klient z anonimnim ključem
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Poskusi prijavo uporabnika z emailom in geslom
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      return new Response(JSON.stringify({ error: error?.message ?? "Login failed" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Uspešna prijava - vrni session z access_token (JWT)
    return new Response(JSON.stringify({ session: data.session, user: data.user }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("Error in login-user:", e);
    return new Response("Internal Server Error", { status: 500 });
  }
});
