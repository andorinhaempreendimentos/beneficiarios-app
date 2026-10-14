"use server";

import { createClient } from "@/lib/supabase/server";

export interface AdminHubMetrics {
  totalObjetos: number;
  objetosContinuos: number;
  objetosPontuais: number;
  totalLocais: number;
  totalRegioes: number;
  totalFuncionarios: number;
  totalUsuarios: number;
  totalOrganizacoes: number;
  totalConcedentes: number;
  totalModalidades: number;
  recentObjetos: {
    id: string;
    nome: string;
    tipo: string;
    ativo: boolean;
    data_inicio: string;
    data_fim: string;
    organizacao: { razao_social: string; nome_fantasia: string | null } | null;
    concedente: { nome: string; sigla: string | null } | null;
  }[];
}

export async function getAdminHubMetrics(): Promise<AdminHubMetrics> {
  const supabase = await createClient();

  const [
    { data: objetos },
    { count: locaisCount },
    { count: regioesCount },
    { count: funcionariosCount },
    { count: usuariosCount },
    { count: organizacoesCount },
    { count: concedentesCount },
    { count: modalidadesCount },
  ] = await Promise.all([
    supabase
      .from("objetos")
      .select(`
        id,
        nome,
        tipo,
        ativo,
        data_inicio,
        data_fim,
        organizacao:organizacoes(razao_social, nome_fantasia),
        concedente:concedentes(nome, sigla)
      `)
      .order("criado_em", { ascending: false }),
    supabase.from("locais").select("*", { count: "exact", head: true }),
    supabase.from("regioes").select("*", { count: "exact", head: true }),
    supabase.from("funcionarios").select("*", { count: "exact", head: true }),
    supabase.from("usuarios").select("*", { count: "exact", head: true }),
    supabase.from("organizacoes").select("*", { count: "exact", head: true }),
    supabase.from("concedentes").select("*", { count: "exact", head: true }),
    supabase.from("modalidades").select("*", { count: "exact", head: true }),
  ]);

  const allObjetos = objetos ?? [];
  const continuos = allObjetos.filter((o) => o.tipo === "continuo").length;
  const pontuais = allObjetos.filter((o) => o.tipo === "pontual").length;

  return {
    totalObjetos: allObjetos.length,
    objetosContinuos: continuos,
    objetosPontuais: pontuais,
    totalLocais: locaisCount ?? 0,
    totalRegioes: regioesCount ?? 0,
    totalFuncionarios: funcionariosCount ?? 0,
    totalUsuarios: usuariosCount ?? 0,
    totalOrganizacoes: organizacoesCount ?? 0,
    totalConcedentes: concedentesCount ?? 0,
    totalModalidades: modalidadesCount ?? 0,
    recentObjetos: (allObjetos.slice(0, 5) as unknown as AdminHubMetrics["recentObjetos"]),
  };
}
