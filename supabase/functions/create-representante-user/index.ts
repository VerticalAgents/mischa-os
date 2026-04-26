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

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Caller deve ser admin
    const { data: roleRows, error: roleErr } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", ownerId);
    if (roleErr) {
      return new Response(
        JSON.stringify({ error: "Erro ao verificar permissões" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const isAdmin = (roleRows ?? []).some((r) => r.role === "admin");
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Apenas administradores podem criar acessos de representante" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { representante_id, email, password } = body ?? {};

    if (!representante_id || !email || !password) {
      return new Response(
        JSON.stringify({ error: "representante_id, email e senha são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (typeof password !== "string" || password.length < 6) {
      return new Response(
        JSON.stringify({ error: "Senha deve ter ao menos 6 caracteres" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verifica que o representante existe e ainda não tem acesso
    const { data: rep, error: repErr } = await adminClient
      .from("representantes")
      .select("id, nome")
      .eq("id", representante_id)
      .maybeSingle();
    if (repErr || !rep) {
      return new Response(
        JSON.stringify({ error: "Representante não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: existing } = await adminClient
      .from("representante_accounts")
      .select("id")
      .eq("representante_id", representante_id)
      .maybeSingle();
    if (existing) {
      return new Response(
        JSON.stringify({ error: "Este representante já possui um acesso cadastrado" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Cria o usuário no auth
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: rep.nome, tipo: "representante" },
    });
    if (createError || !newUser?.user) {
      const msg = createError?.message?.includes("already been registered")
        ? "Este email já está cadastrado"
        : (createError?.message ?? "Erro ao criar usuário");
      return new Response(
        JSON.stringify({ error: msg }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const newAuthUserId = newUser.user.id;

    // Insere em representante_accounts
    const { error: insertErr } = await adminClient
      .from("representante_accounts")
      .insert({
        representante_id,
        auth_user_id: newAuthUserId,
        owner_id: ownerId,
        login_email: email,
        senha_acesso: password,
        ativo: true,
      });
    if (insertErr) {
      console.error("Error inserting representante_accounts:", insertErr);
      await adminClient.auth.admin.deleteUser(newAuthUserId);
      return new Response(
        JSON.stringify({ error: "Erro ao vincular representante" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insere role
    const { error: roleInsertErr } = await adminClient
      .from("user_roles")
      .insert({ user_id: newAuthUserId, role: "representante" });
    if (roleInsertErr) {
      console.error("Error inserting user_roles:", roleInsertErr);
    }

    // Profile
    await adminClient.from("profiles").upsert({
      id: newAuthUserId,
      email,
      full_name: rep.nome,
    });

    return new Response(
      JSON.stringify({
        success: true,
        representante: { id: representante_id, nome: rep.nome, email },
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