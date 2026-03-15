import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Create admin user
  const { data: userData, error: createError } =
    await supabase.auth.admin.createUser({
      email: "admin@pathways.com",
      password: "123456",
      email_confirm: true,
      user_metadata: { display_name: "ADMIN@PATHWAYS" },
    });

  let userId = userData?.user?.id;

  if (createError) {
    if (createError.message.includes("already been registered")) {
      // User exists, find them
      const {
        data: { users },
      } = await supabase.auth.admin.listUsers();
      const adminUser = users?.find(
        (u: any) => u.email === "admin@pathways.com"
      );
      userId = adminUser?.id;
    } else {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  if (userId) {
    // Assign admin role
    const { error: roleError } = await supabase
      .from("user_roles")
      .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });

    if (roleError) {
      return new Response(JSON.stringify({ error: roleError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  return new Response(
    JSON.stringify({ success: true, user_id: userId }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
