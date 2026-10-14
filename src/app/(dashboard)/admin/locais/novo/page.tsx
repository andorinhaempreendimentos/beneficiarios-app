import React from "react";
import { getObjetosAdmin } from "@/lib/actions/objetos";
import { getRegioesParaSelecao } from "@/lib/actions/locais";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LocalForm } from "@/components/admin/local-form";

export const metadata = {
  title: "Novo Polo / Local | Painel Administrativo",
  description: "Cadastro de novo polo físico de atendimento.",
};

export default async function NovoLocalPage() {
  const [objetos, regioes] = await Promise.all([
    getObjetosAdmin(),
    getRegioesParaSelecao(),
  ]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <AdminPageHeader
        title="Cadastrar Novo Polo / Local"
        description="Espaço físico onde serão realizadas as atividades práticas e o planejamento das grades de turmas (§3.2)."
      />
      <LocalForm
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
