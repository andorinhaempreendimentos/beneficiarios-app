import React from "react";
import { notFound } from "next/navigation";
import { getObjetoByIdAdmin } from "@/lib/actions/objetos";
import { getPerguntasInscricao } from "@/lib/actions/perguntas-inscricao";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ConstrutorPerguntas } from "@/components/admin/construtor-perguntas";

interface PerguntasPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PerguntasPageProps) {
  const { id } = await params;
  try {
    const objeto = await getObjetoByIdAdmin(id);
    return {
      title: `Formulário de Inscrição — ${objeto.nome} | Painel Administrativo`,
    };
  } catch {
    return {
      title: "Formulário de Inscrição | Painel Administrativo",
    };
  }
}

export default async function PerguntasPage({ params }: PerguntasPageProps) {
  const { id } = await params;

  let objeto;
  try {
    objeto = await getObjetoByIdAdmin(id);
  } catch {
    notFound();
  }

  const perguntas = await getPerguntasInscricao(id);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`Formulário de Inscrição — ${objeto.nome}`}
        description="Configure as perguntas personalizadas do convênio para inscrição e matrícula, mantendo intacto o núcleo civil obrigatório."
        backHref={`/admin/objetos/${id}`}
        backLabel="Voltar para Detalhes do Projeto"
      />

      <ConstrutorPerguntas
        objetoId={objeto.id}
        objetoNome={objeto.nome}
        termoBeneficiario={objeto.termo_beneficiario}
        initialPerguntas={perguntas}
      />
    </div>
  );
}
