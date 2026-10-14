import React from "react";
import { getMatriculas } from "@/lib/actions/matriculas";
import { getObjetosAdmin } from "@/lib/actions/objetos";
import { getLocaisAdmin } from "@/lib/actions/locais";
import { getGrupos } from "@/lib/actions/grupos";
import { getBeneficiarios } from "@/lib/actions/beneficiarios";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { MatriculasClient } from "@/components/matriculas/matriculas-client";

export const metadata = {
  title: "Matrículas & Inscrições | Gestão de Beneficiários",
  description:
    "Gestão associativa de matrículas nos grupos com controle de vagas e cotas MROSC (§3.3).",
};

export default async function MatriculasPage() {
  const [matriculas, objetos, locais, grupos, beneficiarios] =
    await Promise.all([
      getMatriculas(),
      getObjetosAdmin(),
      getLocaisAdmin(),
      getGrupos(),
      getBeneficiarios(),
    ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Matrículas & Inscrições"
        description="Vínculo formal entre o cidadão e os grupos de atendimento (§3.3). A idade é validada contra os limites do grupo, as vagas são gerenciadas com lista de espera automática e a cota de vulnerabilidade social é registrada para as metas do plano de trabalho."
      />
      <MatriculasClient
        initialMatriculas={matriculas}
        objetos={objetos.map((o) => ({
          id: o.id,
          nome: o.nome,
          termo_grupo: o.termo_grupo || "Grupo",
          termo_beneficiario: o.termo_beneficiario || "Beneficiário",
        }))}
        locais={locais.map((l) => ({
          id: l.id,
          nome: l.nome,
          objeto_id: l.objeto_id,
        }))}
        grupos={grupos.map((g) => ({
          id: g.id,
          nome: g.nome,
          objeto_id: g.objeto_id,
          local_id: g.local_id,
          capacidade_maxima: g.capacidade_maxima,
          idade_minima: g.idade_minima,
          idade_maxima: g.idade_maxima,
          vagas_ocupadas: g.vagas_ocupadas,
        }))}
        beneficiarios={beneficiarios.map((b) => ({
          id: b.id,
          nome_completo: b.nome_completo,
          cpf: b.cpf,
          idade: b.idade,
          data_nascimento: b.data_nascimento,
        }))}
      />
    </div>
  );
}
