import React from "react";
import { getLogisticaMateriaisData } from "@/lib/actions/materiais";
import { MateriaisClient } from "@/components/materiais/materiais-client";

export const metadata = {
  title: "Logística de Materiais & Uniformes | Gestão de Beneficiários",
  description:
    "Gestão e controle de materiais coletivos (polos) e individuais (kits de alunos), remessas e entregas nominais (§3.10).",
};

interface MateriaisPageProps {
  searchParams: Promise<{
    objeto_id?: string;
    local_id?: string;
  }>;
}

export default async function MateriaisPage({ searchParams }: MateriaisPageProps) {
  const resolvedParams = await searchParams;
  const objetoIdFiltro = resolvedParams.objeto_id;
  const localIdFiltro = resolvedParams.local_id;

  const data = await getLogisticaMateriaisData(objetoIdFiltro, localIdFiltro);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <MateriaisClient initialData={data} objetoId={data.objeto?.id || objetoIdFiltro || ""} />
    </div>
  );
}
