import React from "react";
import { notFound } from "next/navigation";
import { getSessaoDetalhes } from "@/lib/actions/sessoes";
import { SessaoAtivaClient } from "@/components/sessoes/sessao-ativa-client";

interface SessaoPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: SessaoPageProps) {
  const { id } = await params;
  try {
    const res = await getSessaoDetalhes(id);
    if (!res.success || !res.data) {
      return {
        title: "Sessão | Gestão de Beneficiários",
      };
    }
    const sessao = res.data.sessao;
    const dataFormatada = new Date(sessao.data + "T00:00:00").toLocaleDateString("pt-BR");
    return {
      title: `${sessao.local?.nome || "Sessão"} (${dataFormatada}) | Cockpit da Aula`,
      description: "Cockpit de execução da aula, chamada nominal e registro de evidências probatórias (§3.5).",
    };
  } catch {
    return {
      title: "Sessão | Gestão de Beneficiários",
    };
  }
}

export default async function SessaoDetalhesPage({ params }: SessaoPageProps) {
  const { id } = await params;

  const res = await getSessaoDetalhes(id);

  if (!res.success || !res.data) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <SessaoAtivaClient initialData={res.data} />
    </div>
  );
}
