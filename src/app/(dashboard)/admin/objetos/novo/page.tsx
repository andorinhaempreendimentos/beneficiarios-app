import React from "react";
import { getOrganizacoes } from "@/lib/actions/organizacoes";
import { getConcedentes } from "@/lib/actions/concedentes";
import { getModalidades } from "@/lib/actions/modalidades";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ObjetoForm } from "@/components/admin/objeto-form";

export const metadata = {
  title: "Novo Projeto | Painel Administrativo",
};

export default async function NovoObjetoPage() {
  const [organizacoes, concedentes, modalidades] = await Promise.all([
    getOrganizacoes(),
    getConcedentes(),
    getModalidades(),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Criar Novo Projeto / Objeto"
        description="Formalização de nova parceria com delimitação de vigência, regras de negócio e vocabulário dinâmico."
        backHref="/admin/objetos"
        backLabel="Voltar para Projetos"
      />
      <ObjetoForm
        organizacoes={organizacoes}
        concedentes={concedentes}
        modalidades={modalidades}
      />
    </div>
  );
}
