import React from "react";
import { getModalidades } from "@/lib/actions/modalidades";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ModalidadesClient } from "@/components/admin/modalidades-client";

export const metadata = {
  title: "Modalidades Esportivas | Painel Administrativo",
};

export default async function ModalidadesPage() {
  const modalidades = await getModalidades();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Modalidades Esportivas"
        description="Catálogo universal de práticas físicas e esportivas, com checklist padrão de vistoria para supervisão."
      />
      <ModalidadesClient initialModalidades={modalidades} />
    </div>
  );
}
