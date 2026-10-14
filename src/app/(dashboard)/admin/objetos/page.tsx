import React from "react";
import { getObjetosAdmin } from "@/lib/actions/objetos";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ObjetosClient } from "@/components/admin/objetos-client";

export const metadata = {
  title: "Projetos (Objetos) | Painel Administrativo",
};

export default async function ObjetosPage() {
  const objetos = await getObjetosAdmin();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Projetos (Objetos de Parceria)"
        description="Gestão dos convênios formais entre Concedentes e Organizações Sociais, com parametrização de vocabulário dinâmico e formato de execução."
      />
      <ObjetosClient initialObjetos={objetos} />
    </div>
  );
}
