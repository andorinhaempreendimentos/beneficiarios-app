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
} from "lucide-react";

export const metadata = {
  title: "Hub Administrativo | Sistema de Gestão Social",
  description: "Painel de controle institucional e parametrização geral do sistema.",
};

export default async function AdminPage() {
  const metrics = await getAdminHubMetrics();

  function formatDate(d: string) {
    if (!d) return "—";
    const [ano, mes, dia] = d.split("-");
    if (!ano || !mes || !dia) return d;
    return `${dia}/${mes}/${ano}`;
  }

  const modulos = [
    {
      title: "Projetos Sociais (Objetos)",
      description: "Contratos de parceria, formato contínuo/pontual e vocabulário dinâmico.",
      href: "/admin/objetos",
      count: metrics.totalObjetos,
      countLabel: "projetos",
      icon: FolderKanban,
      actionHref: "/admin/objetos/novo",
      actionLabel: "Novo Projeto",
    },
    {
      title: "Regiões Territoriais",
      description: "Organização territorial e vinculação de coordenadores titulares (§3.2).",
      href: "/admin/regioes",
      count: metrics.totalRegioes,
      countLabel: "regiões",
      icon: Compass,
    },
    {
      title: "Polos e Locais de Atendimento",
      description: "Espaços físicos vinculados a regiões onde ocorrem aulas e vistorias.",
      href: "/admin/locais",
      count: metrics.totalLocais,
      countLabel: "polos",
      icon: MapPin,
    },
    {
      title: "Funcionários / RH de Campo",
      description: "Equipe de execução em carteira para folhas de pagamento e ponto MROSC.",
      href: "/admin/funcionarios",
      count: metrics.totalFuncionarios,
      countLabel: "colaboradores",
      icon: Users,
    },
    {
      title: "Usuários & RBAC",
      description: "Controle de login, atribuição de papéis e escopo de projetos autorizados (§4).",
      href: "/admin/usuarios",
      count: metrics.totalUsuarios,
      countLabel: "contas de acesso",
      icon: ShieldCheck,
    },
    {
      title: "Organizações Sociais (OSCs)",
      description: "Entidades do terceiro setor conveniadas para execução dos projetos.",
      href: "/admin/organizacoes",
      count: metrics.totalOrganizacoes,
      countLabel: "OSCs",
      icon: Building,
    },
    {
      title: "Concedentes Públicos",
      description: "Órgãos das esferas municipal, estadual ou federal repassadores de recursos.",
      href: "/admin/concedentes",
      count: metrics.totalConcedentes,
      countLabel: "órgãos",
      icon: Landmark,
    },
    {
      title: "Modalidades Esportivas",
      description: "Catálogo de modalidades e itens de checklist de vistoria técnica.",
      href: "/admin/modalidades",
      count: metrics.totalModalidades,
      countLabel: "modalidades",
      icon: Trophy,
    },
    {
      title: "Configurações Globais",
      description: "Identidade institucional da organização e preferências da plataforma.",
      href: "/admin/configuracoes",
      count: null,
      countLabel: "Parâmetros gerais",
      icon: Settings,
    },
  ];

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Hub Administrativo"
        description="Gestão institucional, parametrização de projetos, infraestrutura de polos, equipe de campo e segurança de acessos."
      />

      {/* Cards de Métricas Principais */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Projetos Sociais Ativos
            </CardTitle>
            <FolderKanban className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalObjetos}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.objetosContinuos} contínuos • {metrics.objetosPontuais} pontuais
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Polos e Núcleos Físicos
            </CardTitle>
            <MapPin className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalLocais}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Distribuídos em {metrics.totalRegioes} regiões
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Equipe de Campo (RH)
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalFuncionarios}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Vínculos trabalhistas para comprovação
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Usuários & RBAC
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalUsuarios}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Controle de acessos com escopo ativo
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grade de Módulos Administrativos */}
      <div>
        <h3 className="text-base font-semibold mb-4">Módulos Administrativos</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modulos.map((m) => {
            const Icon = m.icon;
            return (
              <Card key={m.href} className="flex flex-col justify-between hover:border-primary/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    {m.count !== null && (
                      <Badge variant="outline" className="font-semibold">
                        {m.count} {m.countLabel}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-base mt-3">{m.title}</CardTitle>
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

      {/* Resumo dos Projetos Mais Recentes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base">Projetos Sociais Recentes</CardTitle>
            <CardDescription className="text-xs">
              Últimos contratos e vínculos formalizados no sistema.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" render={<Link href="/admin/objetos" />}>
            <span>Ver Todos</span>
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
