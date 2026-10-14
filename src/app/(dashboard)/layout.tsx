import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getObjetosDoUsuario } from "@/lib/objeto/queries";
import { ObjetoProvider } from "@/lib/objeto";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { AppHeader } from "@/components/dashboard/app-header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import type { Database } from "@/lib/database.types";

type Usuario = Database["public"]["Tables"]["usuarios"]["Row"];

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: usuario, error: usuarioError } = await supabase
    .from("usuarios")
    .select("*")
    .eq("id", user.id)
    .single();

  if (usuarioError || !usuario) {
    // Usuário autenticado mas sem perfil na tabela usuarios — estado inválido
    redirect("/login");
  }

  const objetos = await getObjetosDoUsuario();

  // Objeto inicial: primeiro da lista (será refinado pelo seletor na UI)
  const objetoInicial = objetos[0] ?? null;

  return (
    <ObjetoProvider initialObjeto={objetoInicial}>
      <SidebarProvider>
        <AppSidebar usuario={usuario as Usuario} />
        <SidebarInset>
          <AppHeader usuario={usuario as Usuario} objetos={objetos} />
          <main className="flex-1 p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </ObjetoProvider>
  );
}
