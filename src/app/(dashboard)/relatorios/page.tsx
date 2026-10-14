import React from "react";
import { createClient } from "@/lib/supabase/server";
import { RelatoriosHubClient } from "@/components/relatorios/relatorios-hub-client";

export const metadata = {
  title: "Central de Relatórios & Prestação de Contas | Gestão de Beneficiários",
  description:
    "Módulo de consolidação, compilação e exportação documental dos dados do Objeto perante o Concedente (§3.8 e §3.9).",
};

interface RelatoriosPageProps {
  searchParams: Promise<{
    objeto_id?: string;
  }>;
}

export default async function RelatoriosPage({ searchParams }: RelatoriosPageProps) {
  const resolvedParams = await searchParams;
  const objetoIdFiltro = resolvedParams.objeto_id;

  const supabase = await createClient();

  // 1. Identificar objeto ativo ou primeiro disponível
  let objetoId = objetoIdFiltro || "";
  let objetoNome = "Projeto Social";
  let termoLocal = "Polo";
  let termoInstrutor = "Professor";
  let termoGrupo = "Turma";
  let termoBeneficiario = "Beneficiário";

  if (!objetoId) {
    const { data: primeiroObj } = await supabase
      .from("objetos")
      .select("id, nome, termo_local, termo_instrutor, termo_grupo, termo_beneficiario")
      .order("criado_em", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (primeiroObj) {
      objetoId = primeiroObj.id;
      objetoNome = primeiroObj.nome;
      termoLocal = primeiroObj.termo_local || termoLocal;
      termoInstrutor = primeiroObj.termo_instrutor || termoInstrutor;
      termoGrupo = primeiroObj.termo_grupo || termoGrupo;
      termoBeneficiario = primeiroObj.termo_beneficiario || termoBeneficiario;
    }
  } else {
    const { data: obj } = await supabase
      .from("objetos")
      .select("id, nome, termo_local, termo_instrutor, termo_grupo, termo_beneficiario")
      .eq("id", objetoId)
      .single();

    if (obj) {
      objetoNome = obj.nome;
      termoLocal = obj.termo_local || termoLocal;
      termoInstrutor = obj.termo_instrutor || termoInstrutor;
      termoGrupo = obj.termo_grupo || termoGrupo;
      termoBeneficiario = obj.termo_beneficiario || termoBeneficiario;
    }
  }

  // 2. Contar relatórios já fechados
  let totalFechados = 0;
  if (objetoId) {
    const { count } = await supabase
      .from("relatorios_prestacao_contas")
      .select("id", { count: "exact", head: true })
      .eq("objeto_id", objetoId)
      .eq("status", "fechado");
    totalFechados = count || 0;
  }

  return (
    <div className="space-y-6">
      <RelatoriosHubClient
        objetoNome={objetoNome}
        termoLocal={termoLocal}
        termoInstrutor={termoInstrutor}
        termoGrupo={termoGrupo}
        termoBeneficiario={termoBeneficiario}
        totalRelatoriosFechados={totalFechados}
      />
    </div>
  );
}
