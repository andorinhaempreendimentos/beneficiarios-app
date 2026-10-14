import React from "react";
import { notFound } from "next/navigation";
import { getGrupoById } from "@/lib/actions/grupos";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  GrupoDetalhesClient,
  type GrupoDetalhes,
} from "@/components/grupos/grupo-detalhes-client";

interface GrupoDetalhesPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: GrupoDetalhesPageProps) {
  const { id } = await params;
  try {
    const grupo = await getGrupoById(id);
    return {
      title: `${grupo.nome} | Detalhes do Grupo`,
    };
  } catch {
    return {
      title: "Detalhes do Grupo | Gestão de Beneficiários",
    };
  }
}

export default async function GrupoDetalhesPage({
  params,
}: GrupoDetalhesPageProps) {
  const { id } = await params;

  let grupo;
  try {
    grupo = await getGrupoById(id);
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={grupo.nome}
        description={`Projeto: ${grupo.objeto?.nome ?? "—"} • Local: ${grupo.local?.nome ?? "—"} • ${grupo.modalidade?.nome ?? "Multimodal"}`}
        backHref="/grupos"
        backLabel="Voltar para Grupos"
      />
      <GrupoDetalhesClient grupo={grupo as unknown as GrupoDetalhes} />
    </div>
  );
}
