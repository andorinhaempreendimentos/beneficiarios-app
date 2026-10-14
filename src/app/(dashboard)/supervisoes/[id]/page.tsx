import React from "react";
import { notFound } from "next/navigation";
import { getSupervisaoDetalhes } from "@/lib/actions/supervisoes";
import { SupervisaoCockpitClient } from "@/components/supervisoes/supervisao-cockpit-client";

interface SupervisaoDetalhesPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: SupervisaoDetalhesPageProps) {
  const { id } = await params;
  try {
    const res = await getSupervisaoDetalhes(id);
    if (!res.success || !res.data) {
      return {
        title: "Supervisão | Gestão de Beneficiários",
      };
    }
    const visita = res.data.visita;
    const dataFormatada = new Date(visita.data + "T00:00:00").toLocaleDateString("pt-BR");
    return {
      title: `Vistoria: ${visita.local?.nome || "Polo"} (${dataFormatada}) | Auditoria em Campo`,
      description: "Cockpit de vistoria presencial em campo, checklist de conformidade e fiscalização governamental (§3.6).",
    };
  } catch {
    return {
      title: "Supervisão | Gestão de Beneficiários",
    };
  }
}

export default async function SupervisaoDetalhesPage({ params }: SupervisaoDetalhesPageProps) {
  const { id } = await params;

  const res = await getSupervisaoDetalhes(id);

  if (!res.success || !res.data) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <SupervisaoCockpitClient initialData={res.data} />
    </div>
  );
}
