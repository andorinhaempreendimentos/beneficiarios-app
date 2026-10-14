import React from "react";
import { getMetasMroscData } from "@/lib/actions/metas";
import { MetasClient } from "@/components/metas/metas-client";

export const metadata = {
  title: "Metas Contratuais & Plano de Trabalho MROSC | Gestão de Beneficiários",
  description:
    "Apuração automatizada e declaratória de metas pactuadas no Plano de Trabalho (Art. 22, IV da Lei 13.019/2014).",
};

interface MetasPageProps {
  searchParams: Promise<{
    objeto_id?: string;
    data_inicio?: string;
    data_fim?: string;
  }>;
}

export default async function MetasPage({ searchParams }: MetasPageProps) {
  const resolvedParams = await searchParams;
  const objetoIdFiltro = resolvedParams.objeto_id;
  const dataInicio = resolvedParams.data_inicio;
  const dataFim = resolvedParams.data_fim;

  const data = await getMetasMroscData(objetoIdFiltro, dataInicio, dataFim);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <MetasClient initialData={data} objetoId={data.objeto?.id || objetoIdFiltro || ""} />
    </div>
  );
}
