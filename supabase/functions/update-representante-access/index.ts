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
    const { data: { user: caller }, error: userError } = await callerClient.auth.getUser();
    if (userError || !caller) {
      return new Response(
        JSON.stringify({ error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Caller deve ser admin
    const { data: roleRows } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id);
    const isAdmin = (roleRows ?? []).some((r) => r.role === "admin");
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Apenas administradores podem editar acessos" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { account_id, new_email, new_password } = await req.json();

    if (!account_id) {
      return new Response(
        JSON.stringify({ error: "account_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!new_email && !new_password) {
      return new Response(
        JSON.stringify({ error: "Informe novo email ou nova senha" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (new_password && (typeof new_password !== "string" || new_password.length < 6)) {
      return new Response(
        JSON.stringify({ error: "A senha deve ter pelo menos 6 caracteres" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (new_email && (typeof new_email !== "string" || !new_email.includes("@"))) {
      return new Response(
        JSON.stringify({ error: "Email inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar conta
    const { data: account, error: accErr } = await adminClient
      .from("representante_accounts")
      .select("id, auth_user_id, owner_id")
      .eq("id", account_id)
      .maybeSingle();

    if (accErr || !account) {
      return new Response(
        JSON.stringify({ error: "Acesso não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (account.owner_id !== caller.id) {
      return new Response(
        JSON.stringify({ error: "Sem permissão para alterar este acesso" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Atualiza no Auth
    const updates: Record<string, string> = {};
    if (new_email) updates.email = new_email;
    if (new_password) updates.password = new_password;

    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      account.auth_user_id,
      updates as { email?: string; password?: string }
    );

    if (updateError) {
      console.error("Error updating auth user:", updateError);
      const msg = updateError.message?.includes("already")
        ? "Este email já está em uso"
        : (updateError.message ?? "Erro ao atualizar acesso");
      return new Response(
        JSON.stringify({ error: msg }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Atualiza tabela
    const tableUpdates: Record<string, string> = { updated_at: new Date().toISOString() };
    if (new_email) tableUpdates.login_email = new_email;
    if (new_password) tableUpdates.senha_acesso = new_password;

    await adminClient
      .from("representante_accounts")
      .update(tableUpdates)
      .eq("id", account_id);

    if (new_email) {
      await adminClient
        .from("profiles")
        .update({ email: new_email })
        .eq("id", account.auth_user_id);
    }

    return new Response(
      JSON.stringify({ success: true }),
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
