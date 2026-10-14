import React from "react";
import { getConcedentes } from "@/lib/actions/concedentes";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ConcedentesClient } from "@/components/admin/concedentes-client";

export const metadata = {
  title: "Concedentes Públicos | Painel Administrativo",
};

export default async function ConcedentesPage() {
  const concedentes = await getConcedentes();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Concedentes Públicos"
        description="Gestão dos órgãos da administração pública (Secretarias, Prefeituras, Ministérios) concedentes de recursos."
      />
      <ConcedentesClient initialConcedentes={concedentes} />
    </div>
  );
}
