import React from "react";
import {
  getFuncionariosAdmin,
  getUsuariosParaVinculo,
} from "@/lib/actions/funcionarios";
import { getObjetosAdmin } from "@/lib/actions/objetos";
import { getOrganizacoes } from "@/lib/actions/organizacoes";
import { getLocaisAdmin } from "@/lib/actions/locais";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  FuncionariosClient,
  type FuncionarioItem,
} from "@/components/admin/funcionarios-client";

export const metadata = {
  title: "Funcionários & Equipe | Painel Administrativo",
  description: "Gestão do quadro de recursos humanos e vínculos de campo MROSC.",
};

export default async function FuncionariosPage() {
  const [funcionarios, objetos, organizacoes, locais, usuarios] =
    await Promise.all([
      getFuncionariosAdmin(),
      getObjetosAdmin(),
      getOrganizacoes(),
      getLocaisAdmin(),
      getUsuariosParaVinculo(),
    ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Funcionários e Equipe de Campo"
        description="Vínculos trabalhistas e equipe de execução contratada pela OSC (§3.2). Garante rastreabilidade para folhas de pagamento e relatórios de auditoria governamental MROSC."
      />
      <FuncionariosClient
        initialFuncionarios={funcionarios as unknown as FuncionarioItem[]}
        objetos={objetos.map((o) => ({ id: o.id, nome: o.nome }))}
        organizacoes={organizacoes.map((org) => ({
          id: org.id,
          razao_social: org.razao_social,
          nome_fantasia: org.nome_fantasia,
        }))}
        locais={locais.map((loc) => ({
          id: loc.id,
          nome: loc.nome,
          objeto_id: loc.objeto_id,
        }))}
        usuarios={usuarios}
      />
    </div>
  );
}
