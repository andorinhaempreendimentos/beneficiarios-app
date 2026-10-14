import React from "react";
import { getPainelInstrutorData } from "@/lib/actions/sessoes";
import { createClient } from "@/lib/supabase/server";
import { SessoesClient } from "@/components/sessoes/sessoes-client";

export const metadata = {
  title: "Painel do Instrutor e Execução de Sessões | Gestão de Beneficiários",
  description: "Mini-dashboard mobile-first, agenda do dia, chamada nominal e registro de sessões em campo (§3.5).",
};

interface SessoesPageProps {
  searchParams: Promise<{
    instrutor_id?: string;
    objeto_id?: string;
  }>;
}

export default async function SessoesPage({ searchParams }: SessoesPageProps) {
  const resolvedParams = await searchParams;
  const instrutorIdFiltro = resolvedParams.instrutor_id;
  const objetoIdFiltro = resolvedParams.objeto_id;

  const supabase = await createClient();

  // 1. Carregar dados operacionais do painel
  const painelData = await getPainelInstrutorData(instrutorIdFiltro, objetoIdFiltro);

  // 2. Buscar instrutores/funcionários ativos para o seletor rápido
  const { data: instrutoresRaw } = await supabase
    .from("funcionarios")
    .select("id, nome_completo, cargo")
    .eq("situacao", "ativo")
    .order("nome_completo");

  const instrutoresDisponiveis = (instrutoresRaw || []).map((f) => ({
    id: f.id,
    nome_completo: f.nome_completo,
    cargo: f.cargo,
  }));

  // 3. Resolver vocabulário dinâmico do objeto ativo
  const objetoId = painelData.instrutor?.objeto_id || objetoIdFiltro || "";
  let termoLocal = "Polo";
  let termoInstrutor = "Professor";
  let termoSessao = "Sessão";
  let termoGrupo = "Turma";

  if (objetoId) {
    const { data: obj } = await supabase
      .from("objetos")
      .select("termo_local, termo_instrutor, termo_sessao, termo_grupo")
      .eq("id", objetoId)
      .single();

    if (obj) {
      termoLocal = obj.termo_local || termoLocal;
      termoInstrutor = obj.termo_instrutor || termoInstrutor;
      termoSessao = obj.termo_sessao || termoSessao;
      termoGrupo = obj.termo_grupo || termoGrupo;
    }
  }

  return (
    <div className="space-y-6">
      <SessoesClient
        initialData={painelData}
        instrutoresDisponiveis={painelData.isInstrutorLogado ? [] : instrutoresDisponiveis}
        objetoId={objetoId}
        termoLocal={termoLocal}
        termoInstrutor={termoInstrutor}
        termoSessao={termoSessao}
        termoGrupo={termoGrupo}
      />
    </div>
  );
}
