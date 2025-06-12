import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

// Skupni CORS headerji
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // ali npr. "http://localhost:3000"
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Content-Type": "application/json",
};

serve(async (req) => {
  // ⚠️ CORS preflight handler
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

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: corsHeaders,
    });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new Response(JSON.stringify({ error: "Missing file field" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    if (file.type !== "image/png") {
      return new Response(JSON.stringify({ error: "Only PNG files allowed" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const fileContent = new Uint8Array(await file.arrayBuffer());
    const fileName = `${user.id}-${Date.now()}.png`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("uploads")
      .upload(fileName, fileContent, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(JSON.stringify({ error: uploadError.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    const { data: publicUrlData } = supabase.storage
      .from("uploads")
      .getPublicUrl(fileName);

    return new Response(JSON.stringify({
      url: publicUrlData.publicUrl,
      fileName: fileName,
    }), {
      status: 200,
      headers: corsHeaders,
    });

  } catch (error) {
    console.error("Processing error:", error);
    return new Response(JSON.stringify({ error: "Failed to process request" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
