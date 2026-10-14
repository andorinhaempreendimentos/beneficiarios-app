"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Users,
  Clock,
  ShieldCheck,
  Compass,
  ArrowRight,
  Sparkles,
  Layers,
  Award,
  CheckCircle2,
  FileSpreadsheet,
  Target,
  Package,
} from "lucide-react";

interface RelatoriosHubClientProps {
  objetoNome: string;
  termoLocal?: string;
  termoInstrutor?: string;
  termoGrupo?: string;
  termoBeneficiario?: string;
  totalRelatoriosFechados: number;
}

export function RelatoriosHubClient({
  objetoNome,
  termoLocal = "Polo",
  termoInstrutor = "Professor",
  termoGrupo = "Turma",
  termoBeneficiario = "Beneficiário",
  totalRelatoriosFechados,
}: RelatoriosHubClientProps) {
  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="border-b pb-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs uppercase tracking-wider">
            MROSC & Lei 13.019/2014
          </Badge>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground font-medium">{objetoNome}</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight mt-1 flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          Central de Relatórios & Prestação de Contas Governamental
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Consolidação probatória e documental do objeto (§3.8 e §3.9): cadernos executivos, espelhos nominais e auditoria com fé pública.
        </p>
      </div>

      {/* Seção 1: Relatórios Oficiais com Fé Pública (Os Três Níveis Canônicos) */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Cadernos e Relatórios Oficiais com Fé Pública (§3.9.2 a §3.9.4)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Nível 3: Relatório Master Governamental */}
          <Card className="hover:border-primary transition-all flex flex-col justify-between border-l-4 border-l-blue-600 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                  Nível 3 — Master
                </Badge>
                <Award className="h-5 w-5 text-blue-600" />
              </div>
              <CardTitle className="text-base font-bold mt-2">
                Relatório de Execução do Objeto (MROSC)
              </CardTitle>
              <CardDescription className="text-xs">
                Caderno executivo máximo protocolado perante o Concedente. 16 seções completas, 8 anexos analíticos e Tríplice Assinatura.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-1">
              <div className="text-xs text-muted-foreground space-y-1 bg-muted/40 p-2.5 rounded-md border">
                <p>• 16 seções do corpo executivo</p>
                <p>• 8 cadernos analíticos de anexos</p>
                <p>• Snapshot imutável point-in-time e versionamento</p>
              </div>
              <Link href="/relatorios/master">
                <Button className="w-full text-xs gap-1.5 bg-blue-600 hover:bg-blue-700">
                  Acessar Relatório Master Nível 3
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Nível 2: Caderno Consolidado da Coordenação */}
          <Card className="hover:border-primary transition-all flex flex-col justify-between border-l-4 border-l-indigo-600 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs">
                  Nível 2 — Regional
                </Badge>
                <Compass className="h-5 w-5 text-indigo-600" />
              </div>
              <CardTitle className="text-base font-bold mt-2">
                Caderno Periódico da Coordenação
              </CardTitle>
              <CardDescription className="text-xs">
                Consolidação territorial de todos os {termoLocal.toLowerCase()}s da região com a Síntese Qualitativa dos 4 blocos e tabela de fiscalizações.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-1">
              <div className="text-xs text-muted-foreground space-y-1 bg-muted/40 p-2.5 rounded-md border">
                <p>• Tabela consolidada de vistorias</p>
                <p>• 4 blocos dissertativos canônicos</p>
                <p>• Declaração de fé pública do Coordenador</p>
              </div>
              <Link href="/coordenacao">
                <Button variant="outline" className="w-full text-xs gap-1.5">
                  Ir para Coordenação Regional
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Nível 1: Relatório de Supervisão Unitária */}
          <Card className="hover:border-primary transition-all flex flex-col justify-between border-l-4 border-l-green-600 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                  Nível 1 — Unitário
                </Badge>
                <ShieldCheck className="h-5 w-5 text-green-600" />
              </div>
              <CardTitle className="text-base font-bold mt-2">
                Supervisão Unitária (Vistoria em Campo)
              </CardTitle>
              <CardDescription className="text-xs">
                Auditoria individual presencial com checklist da modalidade, notas de 1 a 5, fotos probatórias e parecer global da situação.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-1">
              <div className="text-xs text-muted-foreground space-y-1 bg-muted/40 p-2.5 rounded-md border">
                <p>• Independente do fechamento do mês</p>
                <p>• Mural de evidências fotográficas</p>
                <p>• Espelho pronto para DOCX e PDF</p>
              </div>
              <Link href="/supervisoes">
                <Button variant="outline" className="w-full text-xs gap-1.5">
                  Ver Vistorias de Campo
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Seção 2: Relatórios Operacionais e Analíticos Contínuos (§3.9.5) */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Relatórios Analíticos Contínuos & Auditoria Diária (§3.9.5)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Relatório Analítico A: Assiduidade & Busca Ativa */}
          <Card className="hover:border-primary transition-all border-l-4 border-l-amber-500 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                  Analítico Contínuo
                </Badge>
                <Users className="h-5 w-5 text-amber-600" />
              </div>
              <CardTitle className="text-base font-bold mt-2">
                Assiduidade dos {termoBeneficiario}s & Busca Ativa
              </CardTitle>
              <CardDescription className="text-xs">
                Extrato atômico nominal de cumprimento da meta pactuada de frequência perante o Concedente, com cálculo tripartite e motor de combate à evasão.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-xs bg-muted/40 p-2.5 rounded-md border">
                <div>
                  <span className="text-muted-foreground block">Fórmula Oficial:</span>
                  <span className="font-semibold">(Presenças + Justificadas) / Aulas</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Combate à Evasão:</span>
                  <span className="font-semibold text-amber-700 dark:text-amber-400">Busca Ativa &lt; Meta %</span>
                </div>
              </div>

              <Link href="/relatorios/assiduidade">
                <Button variant="outline" className="w-full text-xs gap-1.5 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/20">
                  Abrir Espelho Nominal de Assiduidade
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Relatório Analítico B: Recursos Humanos & Ponto Eletrônico */}
          <Card className="hover:border-primary transition-all border-l-4 border-l-emerald-600 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                  RH & Folha de Ponto
                </Badge>
                <Clock className="h-5 w-5 text-emerald-600" />
              </div>
              <CardTitle className="text-base font-bold mt-2">
                Recursos Humanos & Ponto Eletrônico da Equipe
              </CardTitle>
              <CardDescription className="text-xs">
                Demonstrativo de cumprimento de jornada de trabalho dos {termoInstrutor.toLowerCase()}s e equipe de apoio com flexibilidade de retificação auditada (§3.9.6).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-xs bg-muted/40 p-2.5 rounded-md border">
                <div>
                  <span className="text-muted-foreground block">Rastreabilidade:</span>
                  <span className="font-semibold">Motivo de ajuste auditado</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Flexibilidade RH:</span>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">Abonos e inclusões retroativas</span>
                </div>
              </div>

              <Link href="/relatorios/ponto">
                <Button variant="outline" className="w-full text-xs gap-1.5 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/20">
                  Abrir Folha de Ponto da Equipe
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Relatório Analítico C: Cumprimento de Metas MROSC */}
          <Card className="hover:border-primary transition-all border-l-4 border-l-blue-600 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                  Plano de Trabalho
                </Badge>
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <CardTitle className="text-base font-bold mt-2">
                Demonstrativo de Metas Contratuais
              </CardTitle>
              <CardDescription className="text-xs">
                Apuração automatizada e declaratória dos indicadores pactuados com o Concedente (Art. 22, IV da Lei 13.019/2014).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-xs bg-muted/40 p-2.5 rounded-md border">
                <div>
                  <span className="text-muted-foreground block">Mecanismo:</span>
                  <span className="font-semibold">Automático & Declaratório</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Classificação:</span>
                  <span className="font-semibold text-blue-700 dark:text-blue-400">Cumprida, Parcial, Pendente</span>
                </div>
              </div>

              <Link href="/metas">
                <Button variant="outline" className="w-full text-xs gap-1.5 border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/20">
                  Abrir Demonstrativo de Metas
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Relatório Analítico D: Logística & Anexo VII */}
          <Card className="hover:border-primary transition-all border-l-4 border-l-purple-600 shadow-xs">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
                  Anexo VII MROSC
                </Badge>
                <Package className="h-5 w-5 text-purple-600" />
              </div>
              <CardTitle className="text-base font-bold mt-2">
                Materiais e Uniformes Distribuídos
              </CardTitle>
              <CardDescription className="text-xs">
                Controle patrimonial de equipamentos de polo e extrato nominal de entrega de kits aos alunos com fé pública docente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-xs bg-muted/40 p-2.5 rounded-md border">
                <div>
                  <span className="text-muted-foreground block">Eixos:</span>
                  <span className="font-semibold">Coletivo & Individual</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Fé Pública:</span>
                  <span className="font-semibold text-purple-700 dark:text-purple-400">Carimbo do Instrutor</span>
                </div>
              </div>

              <Link href="/materiais">
                <Button variant="outline" className="w-full text-xs gap-1.5 border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/20">
                  Abrir Painel de Materiais & Uniformes
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
