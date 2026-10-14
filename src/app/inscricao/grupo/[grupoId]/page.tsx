import React from "react";
import { notFound } from "next/navigation";
import { getDadosPublicosGrupo } from "@/lib/actions/autoinscricao";
import { FormularioInscricaoPublica } from "@/components/inscricao/formulario-inscricao-publica";

interface InscricaoGrupoPageProps {
  params: Promise<{ grupoId: string }>;
}

export async function generateMetadata({ params }: InscricaoGrupoPageProps) {
  const { grupoId } = await params;
  const dados = await getDadosPublicosGrupo(grupoId);

  if (!dados) {
    return {
      title: "Inscrição no Grupo | Não Encontrado",
    };
  }

  return {
    title: `Inscrição: ${dados.grupo.nome} — ${dados.local.nome} | ${dados.objeto.nome}`,
    description: `Faça sua inscrição direta no grupo ${dados.grupo.nome} (${dados.grupo.modalidade_nome}).`,
  };
}

export default async function InscricaoGrupoPage({
  params,
}: InscricaoGrupoPageProps) {
  const { grupoId } = await params;
  const dados = await getDadosPublicosGrupo(grupoId);

  if (!dados) {
    notFound();
  }

  return (
    <FormularioInscricaoPublica
      local={dados.local}
      objeto={dados.objeto}
      grupos={[dados.grupo]}
      perguntas={dados.perguntas}
      grupoInicialId={dados.grupo.id}
    />
  );
}
