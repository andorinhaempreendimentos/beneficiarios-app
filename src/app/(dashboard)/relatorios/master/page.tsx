import React from "react";
import { createClient } from "@/lib/supabase/server";
import { compilarDadosRelatorioMaster } from "@/lib/actions/relatorio-master";
import { RelatorioMasterClient } from "@/components/relatorios/relatorio-master-client";

export const metadata = {
  title: "Relatório Master de Execução (MROSC) | Gestão de Beneficiários",
  description:
    "Caderno Institucional Nível 3 com 16 seções executivas, 8 anexos e Tríplice Assinatura oficial perante o Concedente (§3.9.4).",
};

interface RelatorioMasterPageProps {
  searchParams: Promise<{
    objeto_id?: string;
    data_inicio?: string;
    data_fim?: string;
    rotulo?: string;
  }>;
}

export default async function RelatorioMasterPage({ searchParams }: RelatorioMasterPageProps) {
  const resolvedParams = await searchParams;

  const supabase = await createClient();

  // 1. Identificar objeto
  let objetoId = resolvedParams.objeto_id;
  if (!objetoId) {
    const { data: primeiroObj } = await supabase
      .from("objetos")
      .select("id")
      .order("criado_em", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (primeiroObj) objetoId = primeiroObj.id;
  }

  const hoje = new Date();
  const inicioMes =
    resolvedParams.data_inicio ||
    new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split("T")[0];
  const fimMes =
    resolvedParams.data_fim ||
    new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split("T")[0];

  const rotuloPadrao = `${hoje.toLocaleString("pt-BR", { month: "long" })} / ${hoje.getFullYear()}`;
  const rotulo =
    resolvedParams.rotulo || rotuloPadrao.charAt(0).toUpperCase() + rotuloPadrao.slice(1);

  if (!objetoId) {
    return (
      <div className="py-12 text-center text-xs text-muted-foreground">
        Nenhum projeto social cadastrado no sistema.
      </div>
    );
  }

  // 2. Compilar dados vivos ou existentes
  const compRes = await compilarDadosRelatorioMaster(objetoId, inicioMes, fimMes);

  if (!compRes.success || !compRes.data) {
    return (
      <div className="py-12 text-center text-xs text-red-600">
        Erro ao carregar dados do projeto social: {compRes.error}
      </div>
    );
  }

  // 3. Buscar relatórios anteriores ou ativo
  const { data: relatoriosRaw } = await supabase
    .from("relatorios_prestacao_contas")
    .select("id, rotulo_periodo, versao, status, fechado_em, motivo_retificacao, resumo_execucao, analise_cumprimento_metas, resultados_alcancados, conclusao, anexos_dados")
    .eq("objeto_id", objetoId)
    .order("versao", { ascending: false });

  const relatorios = relatoriosRaw ?? [];
  const relatorioAtivo = relatorios.find((r) => r.rotulo_periodo === rotulo) || relatorios[0];

  return (
    <div className="space-y-6">
      <RelatorioMasterClient
        objetoId={objetoId}
        dataInicio={inicioMes}
        dataFim={fimMes}
        rotuloPeriodo={rotulo}
        corpoExecutivo={compRes.data.corpoExecutivo}
        relatoriosAnteriores={relatorios}
        relatorioAtivo={relatorioAtivo}
      />
    </div>
  );
}
