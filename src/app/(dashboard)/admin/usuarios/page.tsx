import React from "react";
import { getUsuariosAdmin } from "@/lib/actions/usuarios";
import { getObjetosAdmin } from "@/lib/actions/objetos";
import { getFuncionariosAdmin } from "@/lib/actions/funcionarios";
import { getOrganizacoes } from "@/lib/actions/organizacoes";
import { getLocaisAdmin } from "@/lib/actions/locais";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { UsuariosClient } from "@/components/admin/usuarios-client";

export const metadata = {
  title: "Usuários & RBAC | Painel Administrativo",
  description: "Controle de acesso, papéis institucionais e escopo de projetos.",
};

export default async function UsuariosPage() {
  const [usuarios, objetos, funcionarios, organizacoes, locais] = await Promise.all([
    getUsuariosAdmin(),
    getObjetosAdmin(),
    getFuncionariosAdmin(),
    getOrganizacoes(),
    getLocaisAdmin(),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Usuários e Controle de Acesso (RBAC)"
        description="Gestão de identidades de login, papéis operacionais e escopo territorial por projeto (§4). Garante que cada profissional acerte exclusivamente os módulos autorizados."
      />
      <UsuariosClient
        initialUsuarios={usuarios}
        objetos={objetos.map((o) => ({ id: o.id, nome: o.nome }))}
        funcionarios={funcionarios.map((f) => ({
          id: f.id,
          nome_completo: f.nome_completo,
          cargo: f.cargo,
          usuario_id: f.usuario_id,
        }))}
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
      />
    </div>
  );
}
