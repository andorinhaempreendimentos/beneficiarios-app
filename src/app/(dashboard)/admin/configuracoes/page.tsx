import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getConfiguracoesSistema } from "@/lib/actions/configuracoes";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { ConfiguracoesForm } from "@/components/admin/configuracoes-form";

export const metadata = {
  title: "Configurações do Sistema | Painel Administrativo",
};

export default async function ConfiguracoesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("papel")
    .eq("id", user.id)
    .single();

  if (usuario?.papel !== "super_admin") {
    return (
      <div className="space-y-4">
        <AdminPageHeader
          title="Configurações do Sistema"
          description="Gestão dos dados institucionais globais da entidade gestora."
        />
        <div className="p-6 rounded-lg border border-destructive/20 bg-destructive/10 text-destructive text-sm">
          Acesso restrito. Apenas usuários com perfil <strong>Super Administrador</strong> possuem permissão para gerenciar as configurações da entidade gestora.
        </div>
      </div>
    );
  }

  const configuracoes = await getConfiguracoesSistema();

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Configurações do Sistema"
        description="Gestão dos dados cadastrais, endereço e identidade visual da organização gestora."
      />
      <ConfiguracoesForm initialData={configuracoes} />
    </div>
  );
}
