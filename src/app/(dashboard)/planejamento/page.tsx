import React from "react";
import { getBlocosAdmin } from "@/lib/actions/blocos";
import { getObjetosAdmin } from "@/lib/actions/objetos";
import { getLocaisAdmin } from "@/lib/actions/locais";
import { getFuncionariosAdmin } from "@/lib/actions/funcionarios";
import { getGrupos } from "@/lib/actions/grupos";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { BlocosClient } from "@/components/planejamento/blocos-client";

export const metadata = {
  title: "Planejamento Temporal & Grade | Gestão de Beneficiários",
  description: "Grade semanal de horários, cronograma de eventos e alocação de instrutores.",
};

export default async function PlanejamentoPage() {
  const [blocos, objetos, locais, funcionarios, grupos] = await Promise.all([
    getBlocosAdmin(),
    getObjetosAdmin(),
    getLocaisAdmin(),
    getFuncionariosAdmin(),
    getGrupos(),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Planejamento Temporal e Grade de Horários"
        description="Organização dos blocos intervalares da agenda (§3.4). Suporte a grade semanal para rotinas contínuas ou datas específicas para eventos pontuais."
      />
      <BlocosClient
        initialBlocos={blocos}
        objetos={objetos.map((o) => ({ id: o.id, nome: o.nome, tipo: o.tipo }))}
        locais={locais.map((l) => ({ id: l.id, nome: l.nome, objeto_id: l.objeto_id }))}
        instrutores={funcionarios.map((f) => ({
          id: f.id,
          nome_completo: f.nome_completo,
          cargo: f.cargo,
        }))}
        grupos={grupos.map((g) => ({
          id: g.id,
          nome: g.nome,
          objeto_id: g.objeto_id,
          local_id: g.local_id,
        }))}
      />
    </div>
  );
}
