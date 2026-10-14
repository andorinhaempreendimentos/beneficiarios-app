import React from "react";
import { notFound } from "next/navigation";
import { getPesquisaPorToken } from "@/lib/actions/pesquisas";
import { FormularioPesquisaPublica } from "@/components/pesquisas/formulario-pesquisa-publica";

interface PesquisaPublicaPageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: PesquisaPublicaPageProps) {
  const { token } = await params;
  const dados = await getPesquisaPorToken(token);

  if (!dados) {
    return {
      title: "Pesquisa de Satisfação | Não Encontrada",
    };
  }

  return {
    title: `${dados.pesquisa.titulo} — ${dados.objeto.nome}`,
    description:
      dados.pesquisa.descricao ||
      `Pesquisa de satisfação oficial e avaliação de impacto do projeto ${dados.objeto.nome}.`,
  };
}

export default async function PesquisaPublicaPage({
  params,
}: PesquisaPublicaPageProps) {
  const { token } = await params;
  const dados = await getPesquisaPorToken(token);

  if (!dados) {
    notFound();
  }

  return <FormularioPesquisaPublica dados={dados} />;
}
