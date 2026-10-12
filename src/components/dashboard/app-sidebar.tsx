"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Users,
  ClipboardList,
  Calendar,
  UserCheck,
  BarChart3,
  Package,
  Target,
  MessageSquare,
  Settings,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useObjeto } from "@/lib/objeto";

const navPrincipal = [
  { label: "Início", href: "/", icon: LayoutDashboard },
];

const navGestao = [
  { label: "Beneficiários", href: "/beneficiarios", icon: Users, termoKey: "termo_beneficiario" as const },
  { label: "Turmas", href: "/turmas", icon: ClipboardList, termoKey: "termo_grupo" as const },
  { label: "Agenda", href: "/agenda", icon: Calendar, termoKey: "termo_bloco" as const },
  { label: "Sessões", href: "/sessoes", icon: UserCheck, termoKey: "termo_sessao" as const },
];

const navRelatorios = [
  { label: "Supervisões", href: "/supervisoes", icon: UserCheck },
  { label: "Relatórios", href: "/relatorios", icon: BarChart3 },
  { label: "Materiais", href: "/materiais", icon: Package },
  { label: "Metas", href: "/metas", icon: Target },
  { label: "Pesquisas", href: "/pesquisas", icon: MessageSquare },
];

const navAdmin = [
  { label: "Núcleo Institucional", href: "/admin", icon: Building2 },
  { label: "Configurações", href: "/admin/configuracoes", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { objeto, getTermo } = useObjeto();

  function resolveLabel(canonicalLabel: string, termoKey?: typeof navGestao[0]["termoKey"]) {
    if (!termoKey || !objeto) return canonicalLabel;
    return getTermo(termoKey);
  }

  return (
    <Sidebar>
      <SidebarContent>
        {/* Logo / Marca */}
        <div className="px-4 py-4 border-b border-sidebar-border">
          <span className="font-semibold text-sm text-sidebar-foreground">
            {objeto?.nome ?? "Gestão de Projetos"}
          </span>
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navPrincipal.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={pathname === item.href}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Gestão</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navGestao.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={pathname.startsWith(item.href)}
                  >
                    <item.icon />
                    <span>{resolveLabel(item.label, item.termoKey)}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Relatórios & Auditoria</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navRelatorios.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={pathname.startsWith(item.href)}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Administração</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navAdmin.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={pathname.startsWith(item.href)}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
