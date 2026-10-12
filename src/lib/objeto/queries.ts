import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

type Objeto = Database["public"]["Tables"]["objetos"]["Row"];

/**
 * Busca os objetos que o usuário autenticado tem acesso.
 * Super Admin: todos os objetos ativos.
 * Demais papéis: apenas os objetos vinculados via usuario_acessos.
 */
export async function getObjetosDoUsuario(): Promise<Objeto[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // Verifica papel
  const { data: perfil, error: perfilError } = await supabase
    .from("usuarios")
    .select("papel")
    .eq("id", user.id)
    .single();

  if (perfilError || !perfil) return [];

  if (perfil.papel === "super_admin") {
    const { data, error } = await supabase
      .from("objetos")
      .select("*")
      .eq("ativo", true)
      .order("nome");

    if (error) throw new Error(`Erro ao buscar objetos: ${error.message}`);
    return data ?? [];
  }

  // Demais papéis: via usuario_acessos
  const { data, error } = await supabase
    .from("usuario_acessos")
    .select("objeto_id, objetos(*)")
    .eq("usuario_id", user.id);

  if (error) throw new Error(`Erro ao buscar acessos: ${error.message}`);

  return (data ?? [])
    .map((a) => a.objetos as unknown as Objeto)
    .filter((o) => o?.ativo);
}

/**
 * Busca um objeto específico por ID, verificando acesso do usuário.
 */
export async function getObjeto(objeto_id: string): Promise<Objeto | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("objetos")
    .select("*")
    .eq("id", objeto_id)
    .single();

  if (error) return null;
  return data;
}
