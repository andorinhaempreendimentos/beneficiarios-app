"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Calendar,
  UserCheck,
  BarChart3,
  Package,
  Target,
  MessageSquare,
  Settings,
  FolderKanban,
  MapPin,
  Compass,
  UserCog,
  Shield,
  ShieldCheck,
  Trophy,
  Building,
  Landmark,
  Clock,
  CheckSquare,
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

type TermoKey = "termo_beneficiario" | "termo_grupo" | "termo_bloco" | "termo_sessao" | "termo_local";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  termoKey?: TermoKey;
}

const navPrincipal: NavItem[] = [
  { label: "Painel Geral", href: "/", icon: LayoutDashboard },
];

const navAtendimento: NavItem[] = [
  { label: "Beneficiários", href: "/beneficiarios", icon: Users, termoKey: "termo_beneficiario" },
  { label: "Matrículas", href: "/matriculas", icon: UserCheck },
  { label: "Turmas / Grupos", href: "/grupos", icon: ClipboardList, termoKey: "termo_grupo" },
  { label: "Grade Semanal", href: "/calendario", icon: Calendar, termoKey: "termo_bloco" },
  { label: "Planejamento", href: "/planejamento", icon: Clock },
  { label: "Sessões / Chamada", href: "/sessoes", icon: CheckSquare, termoKey: "termo_sessao" },
];

const navAuditoria: NavItem[] = [
  { label: "Supervisões", href: "/supervisoes", icon: ShieldCheck },
  { label: "Relatórios MROSC", href: "/relatorios", icon: BarChart3 },
  { label: "Metas Contratuais", href: "/metas", icon: Target },
  { label: "Logística Materiais", href: "/materiais", icon: Package },
  { label: "Pesquisas Satisfação", href: "/pesquisas", icon: MessageSquare },
];

const navEstrutura: NavItem[] = [
  { label: "Projetos Sociais", href: "/admin/objetos", icon: FolderKanban },
  { label: "Polos Físicos", href: "/admin/locais", icon: MapPin, termoKey: "termo_local" },
  { label: "Regiões Territoriais", href: "/admin/regioes", icon: Compass },
  { label: "Equipe de Campo (RH)", href: "/admin/funcionarios", icon: UserCog },
  { label: "Usuários & Acessos", href: "/admin/usuarios", icon: Shield },
  { label: "Modalidades", href: "/admin/modalidades", icon: Trophy },
  { label: "Organizações (OSCs)", href: "/admin/organizacoes", icon: Building },
  { label: "Concedentes Públicos", href: "/admin/concedentes", icon: Landmark },
  { label: "Configurações Gerais", href: "/admin/configuracoes", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { objeto, getTermo } = useObjeto();

  function resolveLabel(canonicalLabel: string, termoKey?: TermoKey) {
    if (!termoKey || !objeto) return canonicalLabel;
    return getTermo(termoKey);
  }

  function isLinkActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <Sidebar>
      <SidebarContent>
        {/* Logo / Projeto Ativo */}
        <div className="px-4 py-4 border-b border-sidebar-border">
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
              Projeto Ativo
            </span>
            <span className="font-semibold text-sm text-sidebar-foreground truncate" title={objeto?.nome ?? "Gestão de Projetos"}>
              {objeto?.nome ?? "Gestão de Projetos"}
            </span>
          </div>
        </div>

        {/* Visão Geral */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navPrincipal.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={isLinkActive(item.href)}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Atendimento & Campo */}
        <SidebarGroup>
          <SidebarGroupLabel>Atendimento & Campo</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navAtendimento.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={isLinkActive(item.href)}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{resolveLabel(item.label, item.termoKey)}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Supervisão & Auditoria */}
        <SidebarGroup>
          <SidebarGroupLabel>Supervisão & Auditoria</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navAuditoria.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={isLinkActive(item.href)}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Estrutura Institucional */}
        <SidebarGroup>
          <SidebarGroupLabel>Estrutura Institucional</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navEstrutura.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={isLinkActive(item.href)}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{resolveLabel(item.label, item.termoKey)}</span>
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
