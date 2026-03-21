import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate caller auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Client with caller's JWT to get their identity
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await callerClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ownerId = claimsData.claims.sub as string;

    // Admin client for creating users
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Parse body
    const { email, password, nome, custom_role_id } = await req.json();

    if (!email || !password || !nome) {
      return new Response(
        JSON.stringify({ error: "Email, senha e nome são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check caller is not a staff member themselves
    const { data: callerStaff } = await adminClient
      .from("staff_accounts")
      .select("id")
      .eq("staff_user_id", ownerId)
      .limit(1);

    if (callerStaff && callerStaff.length > 0) {
      return new Response(
        JSON.stringify({ error: "Funcionários não podem criar outros funcionários" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create user via admin API
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: nome },
    });

    if (createError) {
      console.error("Error creating user:", createError);
      const msg = createError.message.includes("already been registered")
        ? "Este email já está cadastrado"
        : createError.message;
      return new Response(
        JSON.stringify({ error: msg }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const staffUserId = newUser.user.id;

    // Insert into staff_accounts with custom_role_id
    const { error: staffError } = await adminClient
      .from("staff_accounts")
      .insert({
        owner_id: ownerId,
        staff_user_id: staffUserId,
        role: "producao",
        nome,
        custom_role_id: custom_role_id || null,
      });

    if (staffError) {
      console.error("Error inserting staff_accounts:", staffError);
      // Rollback: delete the created user
      await adminClient.auth.admin.deleteUser(staffUserId);
      return new Response(
        JSON.stringify({ error: "Erro ao vincular funcionário" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert into user_roles
    const { error: roleError } = await adminClient
      .from("user_roles")
      .insert({
        user_id: staffUserId,
        role: "producao",
        owner_id: ownerId,
      });

    if (roleError) {
      console.error("Error inserting user_roles:", roleError);
    }

    // Insert profile
    const { error: profileError } = await adminClient
      .from("profiles")
      .upsert({
        id: staffUserId,
        email,
        full_name: nome,
      });

    if (profileError) {
      console.error("Error inserting profile:", profileError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        staff: {
          id: staffUserId,
          email,
          nome,
          custom_role_id: custom_role_id || null,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
