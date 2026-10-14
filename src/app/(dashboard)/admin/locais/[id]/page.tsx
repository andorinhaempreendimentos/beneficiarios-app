import React from "react";
import { notFound } from "next/navigation";
import { getLocalById, getRegioesParaSelecao } from "@/lib/actions/locais";
import { getObjetosAdmin } from "@/lib/actions/objetos";
import { getFuncionariosAdmin } from "@/lib/actions/funcionarios";
import { LocalDetalhesClient } from "@/components/admin/local-detalhes-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const local = await getLocalById(id);
  if (!local) return { title: "Polo não encontrado" };
  return {
    title: `${local.nome} | Detalhes do Polo & Grade`,
    description: `Gestão física e grade semanal do polo ${local.nome}.`,
  };
}

export default async function LocalDetalhesPage({ params }: PageProps) {
  const { id } = await params;
  const local = await getLocalById(id);

  if (!local) {
    notFound();
  }

  const [objetos, regioes, funcionarios] = await Promise.all([
    getObjetosAdmin(),
    getRegioesParaSelecao(local.objeto_id),
    getFuncionariosAdmin(local.objeto_id),
  ]);

  return (
    <LocalDetalhesClient
      local={local}
      objetos={objetos.map((o) => ({
        id: o.id,
        nome: o.nome,
        termo_local: o.termo_local,
        termo_bloco: o.termo_bloco,
        termo_grupo: o.termo_grupo,
        termo_instrutor: o.termo_instrutor,
        tipo: o.tipo,
      }))}
      regioes={regioes}
      instrutores={funcionarios.map((f) => ({
        id: f.id,
        nome_completo: f.nome_completo,
        cargo: f.cargo,
      }))}
    />
  );
}
