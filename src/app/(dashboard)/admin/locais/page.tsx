import React from "react";
import { getLocaisAdmin, getRegioesParaSelecao } from "@/lib/actions/locais";
import { getObjetosAdmin } from "@/lib/actions/objetos";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LocaisClient, type LocalItem } from "@/components/admin/locais-client";

export const metadata = {
  title: "Polos & Locais | Painel Administrativo",
  description: "Gestão de polos físicos de atendimento e locais de atividade.",
};

export default async function LocaisPage() {
  const [locais, objetos, regioes] = await Promise.all([
    getLocaisAdmin(),
    getObjetosAdmin(),
    getRegioesParaSelecao(),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Polos e Locais de Atendimento"
        description="Espaços físicos onde ocorrem as atividades práticas e vistorias de supervisão (§3.2). Todo polo pertence obrigatoriamente a uma Região Territorial vinculada ao projeto."
      />
      <LocaisClient
        initialLocais={locais as unknown as LocalItem[]}
        objetos={objetos.map((o) => ({
          id: o.id,
          nome: o.nome,
          termo_local: o.termo_local,
        }))}
        regioes={regioes}
      />
    </div>
  );
}
