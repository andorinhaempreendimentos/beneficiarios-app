import React from "react";
import { notFound } from "next/navigation";
import { getObjetoByIdAdmin } from "@/lib/actions/objetos";
import { getOrganizacoes } from "@/lib/actions/organizacoes";
import { getConcedentes } from "@/lib/actions/concedentes";
import { getModalidades } from "@/lib/actions/modalidades";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ObjetoDetalhesClient } from "@/components/admin/objeto-detalhes-client";

interface ObjetoDetalhesPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ObjetoDetalhesPageProps) {
  const { id } = await params;
  try {
    const objeto = await getObjetoByIdAdmin(id);
    return {
      title: `${objeto.nome} | Detalhes do Projeto`,
    };
  } catch {
    return {
      title: "Detalhes do Projeto | Painel Administrativo",
    };
  }
}

export default async function ObjetoDetalhesPage({
  params,
}: ObjetoDetalhesPageProps) {
  const { id } = await params;

  let objeto;
  try {
    objeto = await getObjetoByIdAdmin(id);
  } catch {
    notFound();
  }

  const [organizacoes, concedentes, modalidades] = await Promise.all([
    getOrganizacoes(),
    getConcedentes(),
    getModalidades(),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={objeto.nome}
        description="Configurações completas do projeto, vigência, vocabulário dinâmico, regiões e polos vinculados."
        backHref="/admin/objetos"
        backLabel="Voltar para Projetos"
      />
      <ObjetoDetalhesClient
        objeto={objeto}
        organizacoes={organizacoes}
        concedentes={concedentes}
        modalidades={modalidades}
      />
    </div>
  );
}
