import React from "react";
import { getRelatorioRecursosHumanos } from "@/lib/actions/relatorios";
import { RelatorioPontoClient } from "@/components/relatorios/relatorio-ponto-client";

export const metadata = {
  title: "Folha de Ponto & RH | Gestão de Beneficiários",
  description:
    "Espelho de ponto eletrônico, controle de jornada e retificação administrativa auditada perante o Concedente (§3.9.5.B e §3.9.6).",
};

interface PontoPageProps {
  searchParams: Promise<{
    objeto_id?: string;
    local_id?: string;
    data_inicio?: string;
    data_fim?: string;
  }>;
}

export default async function PontoPage({ searchParams }: PontoPageProps) {
  const resolvedParams = await searchParams;

  const data = await getRelatorioRecursosHumanos(
    resolvedParams.objeto_id,
    resolvedParams.local_id,
    resolvedParams.data_inicio,
    resolvedParams.data_fim
  );

  return (
    <div className="space-y-6">
      <RelatorioPontoClient
        initialData={data}
        objetoId={resolvedParams.objeto_id || data.objeto?.id || ""}
      />
    </div>
  );
}
