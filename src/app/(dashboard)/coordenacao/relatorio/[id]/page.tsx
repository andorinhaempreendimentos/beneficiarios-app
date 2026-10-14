import React from "react";
import { notFound } from "next/navigation";
import { getRelatorioPeriodicoDetalhes } from "@/lib/actions/coordenacao";
import { RelatorioPeriodicoEspelho } from "@/components/coordenacao/relatorio-periodico-espelho";

export const metadata = {
  title: "Caderno Periódico da Coordenação — Nível 2 | Gestão de Beneficiários",
  description:
    "Espelho consolidado oficial do Caderno de Supervisão Territorial Nível 2 com fé pública (§3.7 e §3.9.3).",
};

interface RelatorioPeriodicoPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function RelatorioPeriodicoPage({ params }: RelatorioPeriodicoPageProps) {
  const { id } = await params;

  const res = await getRelatorioPeriodicoDetalhes(id);

  if (!res.success || !res.data) {
    notFound();
  }

  return (
    <div className="py-2">
      <RelatorioPeriodicoEspelho
        relatorio={res.data.relatorio as any}
        coordenadorNome={res.data.coordenadorNome}
      />
    </div>
  );
}
