import React from "react";
import { createClient } from "@/lib/supabase/server";
import { getPainelCoordenadorData } from "@/lib/actions/coordenacao";
import { CoordenacaoClient } from "@/components/coordenacao/coordenacao-client";

export const metadata = {
  title: "Painel da Coordenação Regional | Gestão de Beneficiários",
  description:
    "Gestão territorial descentralizada, central de pendências de polos e fechamento periódico oficial (§3.7 e §3.9.3).",
};

interface CoordenacaoPageProps {
  searchParams: Promise<{
    regiao_id?: string;
    objeto_id?: string;
  }>;
}

export default async function CoordenacaoPage({ searchParams }: CoordenacaoPageProps) {
  const resolvedParams = await searchParams;
  const regiaoIdFiltro = resolvedParams.regiao_id;
  const objetoIdFiltro = resolvedParams.objeto_id;

  const supabase = await createClient();

  // 1. Identificar objeto ativo ou primeiro disponível
  let objetoId = objetoIdFiltro || "";
  let objetoNome = "Projeto Social";
  let termoLocal = "Polo";
  let termoInstrutor = "Professor";
  let termoGrupo = "Turma";
  let termoSessao = "Sessão";

  if (!objetoId) {
    const { data: primeiroObj } = await supabase
      .from("objetos")
      .select("id, nome, termo_local, termo_instrutor, termo_grupo, termo_sessao")
      .order("criado_em", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (primeiroObj) {
      objetoId = primeiroObj.id;
      objetoNome = primeiroObj.nome;
      termoLocal = primeiroObj.termo_local || termoLocal;
      termoInstrutor = primeiroObj.termo_instrutor || termoInstrutor;
      termoGrupo = primeiroObj.termo_grupo || termoGrupo;
      termoSessao = primeiroObj.termo_sessao || termoSessao;
    }
  } else {
    const { data: obj } = await supabase
      .from("objetos")
      .select("id, nome, termo_local, termo_instrutor, termo_grupo, termo_sessao")
      .eq("id", objetoId)
      .single();

    if (obj) {
      objetoNome = obj.nome;
      termoLocal = obj.termo_local || termoLocal;
      termoInstrutor = obj.termo_instrutor || termoInstrutor;
      termoGrupo = obj.termo_grupo || termoGrupo;
      termoSessao = obj.termo_sessao || termoSessao;
    }
  }

  // 2. Carregar dados operacionais da Coordenação
  const painelData = await getPainelCoordenadorData(regiaoIdFiltro, objetoId);

  return (
    <div className="space-y-6">
      <CoordenacaoClient
        initialData={painelData}
        objetoId={objetoId}
        objetoNome={objetoNome}
        termoLocal={termoLocal}
        termoInstrutor={termoInstrutor}
        termoGrupo={termoGrupo}
        termoSessao={termoSessao}
      />
    </div>
  );
}
