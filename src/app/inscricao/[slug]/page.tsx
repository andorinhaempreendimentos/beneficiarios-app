import React from "react";
import { notFound } from "next/navigation";
import { getDadosPublicosLocal } from "@/lib/actions/autoinscricao";
import { FormularioInscricaoPublica } from "@/components/inscricao/formulario-inscricao-publica";

interface InscricaoLocalPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: InscricaoLocalPageProps) {
  const { slug } = await params;
  const dados = await getDadosPublicosLocal(slug);

  if (!dados) {
    return {
      title: "Inscrição Pública | Não Encontrado",
    };
  }

  return {
    title: `Inscrições Abertas — ${dados.local.nome} | ${dados.objeto.nome}`,
    description: `Faça sua inscrição nas atividades esportivas e sociais do polo ${dados.local.nome}.`,
  };
}

export default async function InscricaoLocalPage({
  params,
}: InscricaoLocalPageProps) {
  const { slug } = await params;
  const dados = await getDadosPublicosLocal(slug);

  if (!dados) {
    notFound();
  }

  return (
    <FormularioInscricaoPublica
      local={dados.local}
      objeto={dados.objeto}
      grupos={dados.grupos}
      perguntas={dados.perguntas}
    />
  );
}
