import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find expired respuestas with files
    const { data: expiredResponses, error: fetchError } = await supabase
      .from("respuestas")
      .select("id, file_url, user_id, solicitud_id")
      .not("file_url", "is", null)
      .lt("expires_at", new Date().toISOString());

    if (fetchError) {
      throw new Error(`Error fetching expired responses: ${fetchError.message}`);
    }

    if (!expiredResponses || expiredResponses.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No expired files to clean up",
          deleted: 0 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let deletedCount = 0;
    const errors: string[] = [];

    for (const response of expiredResponses) {
      if (!response.file_url) continue;

      // Extract file path from URL
      // URL format: https://xxx.supabase.co/storage/v1/object/public/respuestas-docs/user_id/filename.pdf
      const urlParts = response.file_url.split("/respuestas-docs/");
      if (urlParts.length < 2) {
        errors.push(`Invalid file URL format for response ${response.id}`);
        continue;
      }

      const filePath = urlParts[1];

      // Delete from storage
      const { error: deleteStorageError } = await supabase.storage
        .from("respuestas-docs")
        .remove([filePath]);

      if (deleteStorageError) {
        errors.push(`Failed to delete file for response ${response.id}: ${deleteStorageError.message}`);
        continue;
      }

      // Clear the file_url in the database (keep the response record)
      const { error: updateError } = await supabase
        .from("respuestas")
        .update({ file_url: null, file_name: null })
        .eq("id", response.id);

      if (updateError) {
        errors.push(`Failed to update response ${response.id}: ${updateError.message}`);
        continue;
      }

      deletedCount++;
    }

    console.log(`Cleanup complete: ${deletedCount} files deleted, ${errors.length} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Cleaned up ${deletedCount} expired files`,
        deleted: deletedCount,
        total: expiredResponses.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Cleanup error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
