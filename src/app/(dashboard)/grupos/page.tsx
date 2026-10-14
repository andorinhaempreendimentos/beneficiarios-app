import React from "react";
import { getGrupos } from "@/lib/actions/grupos";
import { getObjetosAdmin } from "@/lib/actions/objetos";
import { getLocaisAdmin } from "@/lib/actions/locais";
import { getModalidades } from "@/lib/actions/modalidades";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { GruposClient } from "@/components/grupos/grupos-client";

export const metadata = {
  title: "Grupos | Gestão de Beneficiários",
  description: "Controle de grupos, regras de restrição de idade e capacidade de vagas (§3.3).",
};

export default async function GruposPage() {
  const [grupos, objetos, locais, modalidades] = await Promise.all([
    getGrupos(),
    getObjetosAdmin(),
    getLocaisAdmin(),
    getModalidades(),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Grupos de Atendimento"
        description="Estruturas canônicas de reserva e controle de capacidade (§3.3). Em projetos contínuos costumam ser Turmas; em pontuais, Pelotões ou Baterias. A modalidade e a faixa etária funcionam como regras de restrição de acesso para autorizar inscrições."
      />
      <GruposClient
        initialGrupos={grupos}
        objetos={objetos.map((o) => ({ id: o.id, nome: o.nome }))}
        locais={locais.map((l) => ({ id: l.id, nome: l.nome, objeto_id: l.objeto_id }))}
        modalidades={modalidades.map((m) => ({ id: m.id, nome: m.nome }))}
      />
    </div>
  );
}
