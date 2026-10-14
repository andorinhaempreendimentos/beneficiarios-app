import React from "react";
import Link from "next/link";
import { getAdminHubMetrics } from "@/lib/actions/admin-hub";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FolderKanban,
  MapPin,
  Compass,
  Users,
  ShieldCheck,
  Building,
  Landmark,
  Trophy,
  Settings,
  ArrowRight,
  Plus,
  UserCheck,
  ClipboardList,
  Calendar,
} from "lucide-react";

export const metadata = {
  title: "Painel Geral | Sistema de Gestão Social",
  description: "Visão executiva e controle operacional de projetos, polos, turmas e beneficiários.",
};

export default async function HomePage() {
  const metrics = await getAdminHubMetrics();

  function formatDate(d: string) {
    if (!d) return "—";
    const [ano, mes, dia] = d.split("-");
    if (!ano || !mes || !dia) return d;
    return `${dia}/${mes}/${ano}`;
  }

  const modulosOperacionais = [
    {
      title: "Beneficiários & Alunos",
      description: "Cadastro civil único por CPF, controle de histórico e perfil de vulnerabilidade.",
      href: "/beneficiarios",
      count: metrics.totalBeneficiarios,
      countLabel: "cadastrados",
      icon: Users,
    },
    {
      title: "Matrículas & Vagas",
      description: "Enturmações ativas, controle de cotas de vulnerabilidade e lista de espera.",
      href: "/matriculas",
      count: metrics.totalMatriculas,
      countLabel: "ativas",
      icon: UserCheck,
    },
    {
      title: "Turmas & Grupos",
      description: "Pelotões, baterias e turmas com delimitação de idade e capacidade de vagas.",
      href: "/grupos",
      count: metrics.totalGrupos,
      countLabel: "turmas",
      icon: ClipboardList,
    },
    {
      title: "Grade Semanal & Horários",
      description: "Planejamento temporal interativo com linha do tempo semanal dos polos.",
      href: "/calendario",
      count: null,
      countLabel: "Agenda semanal",
      icon: Calendar,
    },
  ];

  const modulosEstruturais = [
    {
      title: "Projetos Sociais (Objetos)",
      description: "Contratos de parceria, metas MROSC e vocabulário dinâmico por projeto.",
      href: "/admin/objetos",
      count: metrics.totalObjetos,
      countLabel: "projetos",
      icon: FolderKanban,
      actionHref: "/admin/objetos/novo",
      actionLabel: "Novo Projeto",
    },
    {
      title: "Polos e Locais de Atendimento",
      description: "Espaços físicos onde ocorrem as atividades práticas e vistorias técnicas.",
      href: "/admin/locais",
      count: metrics.totalLocais,
      countLabel: "polos",
      icon: MapPin,
      actionHref: "/admin/locais/novo",
      actionLabel: "Novo Polo",
    },
    {
      title: "Regiões Territoriais",
      description: "Subdivisões de atuação com alocação de polos e Coordenadores responsáveis.",
      href: "/admin/regioes",
      count: metrics.totalRegioes,
      countLabel: "regiões",
      icon: Compass,
    },
    {
      title: "Equipe de Campo (RH)",
      description: "Quadro de profissionais alocados para comprovação trabalhista MROSC.",
      href: "/admin/funcionarios",
      count: metrics.totalFuncionarios,
      countLabel: "colaboradores",
      icon: Users,
    },
    {
      title: "Usuários & Permissões",
      description: "Credenciais de acesso ao sistema com RBAC estrito e escopo por projeto.",
      href: "/admin/usuarios",
      count: metrics.totalUsuarios,
      countLabel: "usuários",
      icon: ShieldCheck,
    },
    {
      title: "Modalidades Esportivas",
      description: "Catálogo de modalidades e checklists técnicos de conformidade.",
      href: "/admin/modalidades",
      count: metrics.totalModalidades,
      countLabel: "modalidades",
      icon: Trophy,
    },
    {
      title: "Organizações Sociais (OSCs)",
      description: "Entidades do terceiro setor conveniadas para execução das ações.",
      href: "/admin/organizacoes",
      count: metrics.totalOrganizacoes,
      countLabel: "OSCs",
      icon: Building,
    },
    {
      title: "Concedentes Públicos",
      description: "Órgãos da administração pública que repassam os recursos orçamentários.",
      href: "/admin/concedentes",
      count: metrics.totalConcedentes,
      countLabel: "órgãos",
      icon: Landmark,
    },
    {
      title: "Configurações Gerais",
      description: "Identidade institucional da entidade gestora e parâmetros globais.",
      href: "/admin/configuracoes",
      count: null,
      countLabel: "Parâmetros",
      icon: Settings,
    },
  ];

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Painel Geral de Gestão"
        description="Visão executiva consolidada: monitoramento de atendimento aos beneficiários, infraestrutura de polos e governança institucional."
      />

      {/* Cards de Métricas Principais (Visão de Alto Nível) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Projetos Ativos
            </CardTitle>
            <FolderKanban className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalObjetos}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {metrics.objetosContinuos} contínuos • {metrics.objetosPontuais} pontuais
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Polos Físicos
            </CardTitle>
            <MapPin className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalLocais}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Em {metrics.totalRegioes} regiões territoriais
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Turmas / Grupos
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalGrupos}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Espaços de atendimento
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Beneficiários
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalBeneficiarios}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Cidadãos atendidos
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Matrículas Ativas
            </CardTitle>
            <UserCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalMatriculas}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Vagas preenchidas
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Equipe de Campo
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalFuncionarios}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {metrics.totalUsuarios} contas de acesso
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Seção 1: Operação e Atendimento de Campo */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Atendimento & Campo</h2>
          <p className="text-xs text-muted-foreground">
            Gestão direta de alunos, matrículas, grupos e horários das atividades práticas.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {modulosOperacionais.map((m) => {
            const Icon = m.icon;
            return (
              <Card key={m.href} className="flex flex-col justify-between hover:border-primary/50 transition-colors shadow-xs">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    {m.count !== null && (
                      <Badge variant="outline" className="font-semibold text-xs">
                        {m.count} {m.countLabel}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-sm mt-3">{m.title}</CardTitle>
                  <CardDescription className="text-xs">{m.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="border-t border-border pt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      render={<Link href={m.href} />}
                      className="gap-1.5 p-0 h-auto text-xs font-semibold text-primary hover:text-primary/80"
                    >
                      <span>Acessar Módulo</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Seção 2: Estrutura Institucional & Governança */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Estrutura Institucional & Governança</h2>
          <p className="text-xs text-muted-foreground">
            Parametrização de projetos, infraestrutura territorial, equipe e contratos com parceiros.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modulosEstruturais.map((m) => {
            const Icon = m.icon;
            return (
              <Card key={m.href} className="flex flex-col justify-between hover:border-primary/50 transition-colors shadow-xs">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    {m.count !== null && (
                      <Badge variant="outline" className="font-semibold text-xs">
                        {m.count} {m.countLabel}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-sm mt-3">{m.title}</CardTitle>
                  <CardDescription className="text-xs">{m.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      render={<Link href={m.href} />}
                      className="gap-1.5 p-0 h-auto text-xs font-semibold text-primary hover:text-primary/80"
                    >
                      <span>Acessar Módulo</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                    {m.actionHref && (
                      <Button
                        variant="outline"
                        size="sm"
                        render={<Link href={m.actionHref} />}
                        className="gap-1 h-7 text-xs"
                      >
                        <Plus className="h-3 w-3" />
                        <span>{m.actionLabel}</span>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Seção 3: Projetos Recentes */}
      <Card className="shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">Projetos Sociais Formalizados</CardTitle>
            <CardDescription className="text-xs">
              Contratos e termos de parceria ativos na plataforma.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" render={<Link href="/admin/objetos" />}>
            <span>Ver Todos os Projetos</span>
          </Button>
        </CardHeader>
        <CardContent>
          {metrics.recentObjetos.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-4">
              Nenhum projeto social cadastrado ainda.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {metrics.recentObjetos.map((obj) => (
                <div key={obj.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/objetos/${obj.id}`}
                        className="text-sm font-semibold hover:underline"
                      >
                        {obj.nome}
                      </Link>
                      <Badge variant={obj.tipo === "continuo" ? "default" : "outline"} className="text-[10px]">
                        {obj.tipo === "continuo" ? "Contínuo" : "Pontual"}
                      </Badge>
                      <Badge variant={obj.ativo ? "default" : "secondary"} className="text-[10px]">
                        {obj.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      OSC: {obj.organizacao?.nome_fantasia || obj.organizacao?.razao_social || "Não informada"} • Concedente: {obj.concedente?.sigla || obj.concedente?.nome || "Não informado"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-muted-foreground font-mono">
                      {formatDate(obj.data_inicio)} — {formatDate(obj.data_fim)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      render={<Link href={`/admin/objetos/${obj.id}`} />}
                      className="gap-1 h-7 text-xs"
                    >
                      <span>Gerenciar</span>
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
