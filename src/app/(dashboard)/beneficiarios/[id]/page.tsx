import React from "react";
import { notFound } from "next/navigation";
import { getBeneficiarioById } from "@/lib/actions/beneficiarios";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { BeneficiarioDetalhesClient } from "@/components/beneficiarios/beneficiario-detalhes-client";

interface BeneficiarioDetalhesPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: BeneficiarioDetalhesPageProps) {
  const { id } = await params;
  try {
    const b = await getBeneficiarioById(id);
    if (!b) return { title: "Beneficiário não encontrado" };
    return {
      title: `${b.nome_completo} | Ficha do Beneficiário`,
      description: `Ficha cadastral e histórico de matrículas de ${b.nome_completo}.`,
    };
  } catch {
    return {
      title: "Ficha do Beneficiário | Gestão de Beneficiários",
    };
  }
}

export default async function BeneficiarioDetalhesPage({
  params,
}: BeneficiarioDetalhesPageProps) {
  const { id } = await params;

  let beneficiario;
  try {
    beneficiario = await getBeneficiarioById(id);
    if (!beneficiario) {
      notFound();
    }
  } catch {
    notFound();
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={beneficiario.nome_completo}
        description={`Cadastro Civil Universal • ${beneficiario.idade} anos • ${beneficiario.total_matriculas} matrícula(s) registradas.`}
        backHref="/beneficiarios"
        backLabel="Voltar para Beneficiários"
      />
      <BeneficiarioDetalhesClient beneficiario={beneficiario} />
    </div>
  );
}
