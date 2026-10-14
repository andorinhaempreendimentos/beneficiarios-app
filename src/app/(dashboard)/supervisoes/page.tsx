import React from "react";
import { getPainelSupervisorData } from "@/lib/actions/supervisoes";
import { createClient } from "@/lib/supabase/server";
import { SupervisoesClient } from "@/components/supervisoes/supervisoes-client";

export const metadata = {
  title: "Painel de Supervisão e Vistorias | Gestão de Beneficiários",
  description: "Auditoria presencial em campo, checklist estrutural e fiscalização de conformidade governamental (§3.6).",
};

interface SupervisoesPageProps {
  searchParams: Promise<{
    objeto_id?: string;
    local_id?: string;
    situacao?: string;
  }>;
}

export default async function SupervisoesPage({ searchParams }: SupervisoesPageProps) {
  const resolvedParams = await searchParams;
  const objetoIdFiltro = resolvedParams.objeto_id;
  const localIdFiltro = resolvedParams.local_id;
  const situacaoFiltro = resolvedParams.situacao;

  const supabase = await createClient();

  // 1. Carregar dados operacionais do painel
  const painelData = await getPainelSupervisorData(objetoIdFiltro, localIdFiltro, situacaoFiltro);

  // 2. Identificar objeto ativo ou primeiro disponível
  let objetoId = objetoIdFiltro || "";
  let termoLocal = "Polo";
  let termoInstrutor = "Professor";
  let termoGrupo = "Turma";
  let termoSessao = "Sessão";

  if (!objetoId && painelData.locaisDisponiveis.length > 0) {
    objetoId = painelData.locaisDisponiveis[0].objeto_id;
  }

  if (objetoId) {
    const { data: obj } = await supabase
      .from("objetos")
      .select("termo_local, termo_instrutor, termo_grupo, termo_sessao")
      .eq("id", objetoId)
      .single();

    if (obj) {
      termoLocal = obj.termo_local;
      termoInstrutor = obj.termo_instrutor;
      termoGrupo = obj.termo_grupo;
      termoSessao = obj.termo_sessao;
    }
  }

  return (
    <div className="space-y-6">
      <SupervisoesClient
        initialData={painelData}
        objetoId={objetoId}
        termoLocal={termoLocal}
        termoInstrutor={termoInstrutor}
        termoGrupo={termoGrupo}
        termoSessao={termoSessao}
      />
    </div>
  );
}
