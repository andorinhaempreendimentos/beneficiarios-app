"use client";

import React, { useState, useMemo } from "react";
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
  Search,
  X,
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

type TermoKey =
  | "termo_beneficiario"
  | "termo_grupo"
  | "termo_bloco"
  | "termo_sessao"
  | "termo_local";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  termoKey?: TermoKey;
  keywords?: string[];
}

// 1. Visão Geral
const navPrincipal: NavItem[] = [
  {
    label: "Painel Geral",
    href: "/",
    icon: LayoutDashboard,
    keywords: ["inicio", "dashboard", "visao geral", "metricas", "resumo"],
  },
];

// 2. Estrutura Institucional (Topo da Pirâmide de Dados)
const navEstrutura: NavItem[] = [
  {
    label: "Projetos Sociais",
    href: "/admin/objetos",
    icon: FolderKanban,
    keywords: ["objetos", "contratos", "parcerias", "termos", "mrosc", "convenios", "projetos"],
  },
  {
    label: "Regiões Territoriais",
    href: "/admin/regioes",
    icon: Compass,
    keywords: ["regioes", "areas", "zonas", "coordenadores", "territorios"],
  },
  {
    label: "Polos de Atendimento",
    href: "/admin/locais",
    icon: MapPin,
    termoKey: "termo_local",
    keywords: ["locais", "polos", "quadras", "arenas", "nucleos", "espacos", "grade"],
  },
  {
    label: "Equipe de Campo (RH)",
    href: "/admin/funcionarios",
    icon: UserCog,
    keywords: ["funcionarios", "professores", "instrutores", "coordenadores", "supervisores", "rh", "colaboradores"],
  },
  {
    label: "Usuários & Acessos",
    href: "/admin/usuarios",
    icon: Shield,
    keywords: ["usuarios", "login", "permissoes", "rbac", "papeis", "senhas", "acessos"],
  },
  {
    label: "Modalidades Esportivas",
    href: "/admin/modalidades",
    icon: Trophy,
    keywords: ["modalidades", "esportes", "futebol", "natacao", "basquete", "vistoria", "checklist"],
  },
  {
    label: "Organizações (OSCs)",
    href: "/admin/organizacoes",
    icon: Building,
    keywords: ["ongs", "institutos", "organizacoes", "associacoes", "fundacoes", "terceiro setor"],
  },
  {
    label: "Concedentes Públicos",
    href: "/admin/concedentes",
    icon: Landmark,
    keywords: ["concedentes", "secretarias", "ministerios", "prefeituras", "governo", "repasses"],
  },
  {
    label: "Configurações Gerais",
    href: "/admin/configuracoes",
    icon: Settings,
    keywords: ["configuracoes", "sistema", "logotipo", "contato", "suporte", "parametros"],
  },
];

// 3. Atendimento & Campo (Execução das Atividades)
const navAtendimento: NavItem[] = [
  {
    label: "Turmas / Grupos",
    href: "/grupos",
    icon: ClipboardList,
    termoKey: "termo_grupo",
    keywords: ["grupos", "turmas", "pelotoes", "baterias", "vagas", "capacidade", "faixa etaria"],
  },
  {
    label: "Beneficiários",
    href: "/beneficiarios",
    icon: Users,
    termoKey: "termo_beneficiario",
    keywords: ["alunos", "beneficiarios", "criancas", "jovens", "inscritos", "cpf", "cidadaos"],
  },
  {
    label: "Matrículas & Vagas",
    href: "/matriculas",
    icon: UserCheck,
    keywords: ["matriculas", "enturmacao", "vagas", "cotas", "vulnerabilidade", "espera"],
  },
  {
    label: "Grade Semanal",
    href: "/calendario",
    icon: Calendar,
    termoKey: "termo_bloco",
    keywords: ["calendario", "grade", "horarios", "dias", "semana", "blocos", "agenda"],
  },
  {
    label: "Planejamento Temporal",
    href: "/planejamento",
    icon: Clock,
    keywords: ["planejamento", "tempo", "grade", "alocacao", "rotina", "horarios"],
  },
  {
    label: "Sessões & Chamada",
    href: "/sessoes",
    icon: CheckSquare,
    termoKey: "termo_sessao",
    keywords: ["sessoes", "chamada", "frequencia", "presenca", "fotos", "aulas", "ponto eletronico"],
  },
];

// 4. Supervisão & Auditoria (Prestação de Contas Governamental)
const navAuditoria: NavItem[] = [
  {
    label: "Supervisões de Campo",
    href: "/supervisoes",
    icon: ShieldCheck,
    keywords: ["supervisoes", "vistorias", "fiscalizacao", "checklist", "parecer", "auditoria"],
  },
  {
    label: "Coordenação Regional",
    href: "/coordenacao",
    icon: Compass,
    keywords: ["coordenacao", "regional", "regiao", "sintese", "fechamento", "caderno", "polos", "pendencias"],
  },
  {
    label: "Relatórios MROSC",
    href: "/relatorios",
    icon: BarChart3,
    keywords: ["relatorios", "mrosc", "prestacao de contas", "comprovacao", "fotos", "mensal"],
  },
  {
    label: "Metas Contratuais",
    href: "/metas",
    icon: Target,
    keywords: ["metas", "mrosc", "indicadores", "apuracao", "contrato", "concedente"],
  },
  {
    label: "Logística de Materiais",
    href: "/materiais",
    icon: Package,
    keywords: ["materiais", "uniformes", "kits", "equipamentos", "remessas", "entregas"],
  },
  {
    label: "Pesquisas de Satisfação",
    href: "/pesquisas",
    icon: MessageSquare,
    keywords: ["pesquisas", "satisfacao", "questionarios", "nps", "avaliacao", "whatsapp"],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { objeto, getTermo } = useObjeto();
  const [searchQuery, setSearchQuery] = useState("");

  function resolveLabel(canonicalLabel: string, termoKey?: TermoKey) {
    if (!termoKey || !objeto) return canonicalLabel;
    return getTermo(termoKey);
  }

  function isLinkActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  // Filtra itens com base no texto pesquisado
  function matchesQuery(item: NavItem): boolean {
    if (!searchQuery.trim()) return true;
    const term = searchQuery.toLowerCase().trim();
    const resolved = resolveLabel(item.label, item.termoKey).toLowerCase();
    const canonical = item.label.toLowerCase();
    const inKeywords = (item.keywords ?? []).some((k) => k.toLowerCase().includes(term));
    return resolved.includes(term) || canonical.includes(term) || inKeywords;
  }

  const filteredPrincipal = useMemo(
    () => navPrincipal.filter(matchesQuery),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchQuery, objeto]
  );

  const filteredEstrutura = useMemo(
    () => navEstrutura.filter(matchesQuery),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchQuery, objeto]
  );

  const filteredAtendimento = useMemo(
    () => navAtendimento.filter(matchesQuery),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchQuery, objeto]
  );

  const filteredAuditoria = useMemo(
    () => navAuditoria.filter(matchesQuery),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchQuery, objeto]
  );

  const hasAnyResults =
    filteredPrincipal.length > 0 ||
    filteredEstrutura.length > 0 ||
    filteredAtendimento.length > 0 ||
    filteredAuditoria.length > 0;

  return (
    <Sidebar>
      <SidebarContent>
        {/* Header do Projeto Ativo */}
        <div className="px-4 py-4 border-b border-sidebar-border">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
              Projeto Ativo
            </span>
            <span
              className="font-semibold text-sm text-sidebar-foreground truncate"
              title={objeto?.nome ?? "Gestão de Projetos Sociais"}
            >
              {objeto?.nome ?? "Gestão de Projetos Sociais"}
            </span>
          </div>
        </div>

        {/* 1. Campo de Busca no Topo da Sidebar */}
        <div className="px-3 pt-3 pb-1">
          <div className="relative flex items-center">
            <Search className="absolute left-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar no menu..."
              className="h-8 w-full rounded-md border border-sidebar-border bg-sidebar-accent/40 pl-8 pr-7 text-xs text-sidebar-foreground placeholder:text-muted-foreground/80 focus:outline-none focus:ring-1 focus:ring-sidebar-ring transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 text-muted-foreground hover:text-sidebar-foreground p-0.5 rounded transition-colors"
                title="Limpar busca"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Mensagem caso não encontre nenhum item */}
        {!hasAnyResults && (
          <div className="px-4 py-6 text-center text-xs text-muted-foreground space-y-1">
            <p className="font-medium">Nenhum módulo encontrado</p>
            <p className="text-[11px] opacity-80">
              Não encontramos resultados para &ldquo;{searchQuery}&rdquo;.
            </p>
          </div>
        )}

        {/* Visão Geral */}
        {filteredPrincipal.length > 0 && (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredPrincipal.map((item) => (
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
        )}

        {/* 2. Hierarquia Nível 1: Estrutura Institucional (Topo da Pirâmide) */}
        {filteredEstrutura.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Estrutura Institucional</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredEstrutura.map((item) => (
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
        )}

        {/* 3. Hierarquia Nível 2: Atendimento & Campo (Execução das Atividades) */}
        {filteredAtendimento.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Atendimento & Campo</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredAtendimento.map((item) => (
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
        )}

        {/* 4. Hierarquia Nível 3: Supervisão & Auditoria (Prestação de Contas) */}
        {filteredAuditoria.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Supervisão & Auditoria</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredAuditoria.map((item) => (
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
        )}
      </SidebarContent>
    </Sidebar>
  );
}
