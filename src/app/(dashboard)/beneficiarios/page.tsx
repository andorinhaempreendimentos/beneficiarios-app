import React from "react";
import { getBeneficiarios } from "@/lib/actions/beneficiarios";
import { getObjetosAdmin } from "@/lib/actions/objetos";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { BeneficiariosClient } from "@/components/beneficiarios/beneficiarios-client";

export const metadata = {
  title: "Beneficiários | Gestão de Beneficiários",
  description:
    "Cadastro civil universal de cidadãos (§3.3), único por CPF e desacoplado dos projetos sociais.",
};

export default async function BeneficiariosPage() {
  const [beneficiarios, objetos] = await Promise.all([
    getBeneficiarios(),
    getObjetosAdmin(),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Beneficiários & Cidadãos"
        description="Cadastro civil universal e perene (§3.3). O cidadão existe de forma única pelo CPF em todo o ecossistema, enquanto suas participações temporais e dados de convênio são registrados via Matrículas."
      />
      <BeneficiariosClient
        initialBeneficiarios={beneficiarios}
        objetos={objetos.map((o) => ({ id: o.id, nome: o.nome }))}
      />
    </div>
  );
}
