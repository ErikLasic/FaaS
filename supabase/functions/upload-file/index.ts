import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  // Avtentikacija preko JWT
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
  }
  const token = authHeader.split(" ")[1];

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
    },
  });

  // Preveri uporabnika
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new Response("Missing file field", { status: 400 });
    }

    if (file.type !== "image/png") {
      return new Response("Only PNG files allowed", { status: 400 });
    }

    // Pretvori v Uint8Array
    const fileContent = new Uint8Array(await file.arrayBuffer());
    const fileName = `${user.id}-${Date.now()}.png`;

    // Upload datoteke
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("uploads")
      .upload(fileName, fileContent, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(`Failed to upload file: ${uploadError.message}`, { status: 500 });
    }

    const { data: publicUrlData } = supabase.storage
      .from("uploads")
      .getPublicUrl(fileName);

    return new Response(JSON.stringify({ 
      url: publicUrlData.publicUrl,
      fileName: fileName 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Processing error:", error);
    return new Response("Failed to process request", { status: 500 });
  }
});
