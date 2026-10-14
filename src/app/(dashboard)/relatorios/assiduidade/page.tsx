import React from "react";
import { getRelatorioAssiduidadeNominal } from "@/lib/actions/relatorios";
import { RelatorioAssiduidadeClient } from "@/components/relatorios/relatorio-assiduidade-client";

export const metadata = {
  title: "Espelho de Assiduidade & Busca Ativa | Gestão de Beneficiários",
  description:
    "Extrato nominal atômico com cálculo tripartite oficial de assiduidade e motor de combate à evasão (§3.9.5.A).",
};

interface AssiduidadePageProps {
  searchParams: Promise<{
    objeto_id?: string;
    local_id?: string;
    grupo_id?: string;
    data_inicio?: string;
    data_fim?: string;
    status_meta?: "todos" | "dentro_da_meta" | "abaixo_da_meta";
    busca?: string;
  }>;
}

export default async function AssiduidadePage({ searchParams }: AssiduidadePageProps) {
  const resolvedParams = await searchParams;

  const data = await getRelatorioAssiduidadeNominal({
    objeto_id: resolvedParams.objeto_id,
    local_id: resolvedParams.local_id,
    grupo_id: resolvedParams.grupo_id,
    data_inicio: resolvedParams.data_inicio,
    data_fim: resolvedParams.data_fim,
    status_meta: resolvedParams.status_meta || "todos",
    busca: resolvedParams.busca,
  });

  return (
    <div className="space-y-6">
      <RelatorioAssiduidadeClient
        initialData={data}
        objetoId={resolvedParams.objeto_id || data.objeto?.id || ""}
      />
    </div>
  );
}
