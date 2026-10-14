import React from "react";
import { getRegioes, getCoordenadores } from "@/lib/actions/regioes";
import { getObjetosAdmin } from "@/lib/actions/objetos";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { RegioesClient, type RegiaoItem } from "@/components/admin/regioes-client";

export const metadata = {
  title: "Regiões Territoriais | Painel Administrativo",
  description: "Gestão e subdivisões territoriais dos projetos esportivos.",
};

export default async function RegioesPage() {
  const [regioes, objetos, coordenadores] = await Promise.all([
    getRegioes(),
    getObjetosAdmin(),
    getCoordenadores(),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Regiões Territoriais"
        description="Subdivisões de atuação geográfica de cada projeto social (§3.2). Toda região organiza locais/polos e vincula um Coordenador responsável."
      />
      <RegioesClient
        initialRegioes={regioes as unknown as RegiaoItem[]}
        objetos={objetos.map((o) => ({ id: o.id, nome: o.nome }))}
        coordenadores={coordenadores}
      />
    </div>
  );
}
