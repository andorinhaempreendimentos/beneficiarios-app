import React from "react";
import { getOrganizacoes } from "@/lib/actions/organizacoes";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { OrganizacoesClient } from "@/components/admin/organizacoes-client";

export const metadata = {
  title: "Organizações Sociais | Painel Administrativo",
};

export default async function OrganizacoesPage() {
  const organizacoes = await getOrganizacoes();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Organizações Sociais (OSCs)"
        description="Cadastro e gestão das entidades do terceiro setor executoras das atividades-fim dos projetos."
      />
      <OrganizacoesClient initialOrganizacoes={organizacoes} />
    </div>
  );
}
