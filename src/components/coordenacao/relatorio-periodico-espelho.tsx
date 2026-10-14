"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Printer,
  ArrowLeft,
  Lock,
  Building,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  User,
  Clock,
  Layers,
} from "lucide-react";

interface SnapshotCadernoNivel2 {
  tipo_documento?: string;
  objeto_id?: string;
  objeto_nome?: string;
  termo_parceria?: string;
  regiao_id?: string | null;
  regiao_nome?: string;
  rotulo_periodo?: string;
  data_inicio?: string;
  data_fim?: string;
  coordenador_nome?: string;
  indicadores_executivos?: {
    polos_acompanhados: number;
    supervisoes_realizadas: number;
    taxa_conformidade: number;
    total_atendimentos: number;
  };
  tabela_consolidada?: {
    data: string;
    local_nome: string;
    instrutor_nome: string;
    horario: string;
    beneficiarios_presentes: number;
    situacao: string;
    ocorrencias: string | null;
    providencias: string | null;
  }[];
  sintese_qualitativa?: {
    pontos_positivos: string;
    dificuldades: string;
    pendencias: string;
    providencias: string;
  };
  fechado_em?: string;
}

interface RelatorioPeriodicoEspelhoProps {
  relatorio: {
    id: string;
    rotulo_periodo: string;
    data_inicio: string | null;
    data_fim: string | null;
    status: string;
    versao: number;
    fechado_em: string | null;
    resumo_execucao: string | null;
    analise_cumprimento_metas: string | null;
    resultados_alcancados: string | null;
    conclusao: string | null;
    anexos_dados: any;
    objeto?: {
      id: string;
      nome: string;
      termo_local?: string | null;
      termo_instrutor?: string | null;
      termo_grupo?: string | null;
      termo_sessao?: string | null;
      termo_beneficiario?: string | null;
      termo_parceria_numero?: string | null;
    } | null;
    regiao?: {
      id: string;
      nome: string;
    } | null;
  };
  coordenadorNome: string;
}

export function RelatorioPeriodicoEspelho({
  relatorio,
  coordenadorNome,
}: RelatorioPeriodicoEspelhoProps) {
  const snapshot: SnapshotCadernoNivel2 =
    (relatorio.anexos_dados as SnapshotCadernoNivel2) || {};

  const termoLocal = relatorio.objeto?.termo_local || "Polo";
  const termoInstrutor = relatorio.objeto?.termo_instrutor || "Professor";
  const termoBeneficiario = relatorio.objeto?.termo_beneficiario || "Beneficiário";

  const indicadores = snapshot.indicadores_executivos || {
    polos_acompanhados: 0,
    supervisoes_realizadas: 0,
    taxa_conformidade: 100,
    total_atendimentos: 0,
  };

  const tabelaSupervisoes = snapshot.tabela_consolidada || [];
  const sintese = snapshot.sintese_qualitativa || {
    pontos_positivos: relatorio.resumo_execucao || "Sem registro.",
    dificuldades: relatorio.analise_cumprimento_metas || "Sem registro.",
    pendencias: relatorio.resultados_alcancados || "Sem registro.",
    providencias: relatorio.conclusao || "Sem registro.",
  };

  const regiaoNome = snapshot.regiao_nome || relatorio.regiao?.nome || "Região Única";
  const objetoNome = snapshot.objeto_nome || relatorio.objeto?.nome || "Projeto Social";
  const termoParceria = snapshot.termo_parceria || relatorio.objeto?.termo_parceria_numero || "S/N";

  const handleImprimir = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Barra de Ações Superior (Oculta na Impressão) */}
      <div className="flex items-center justify-between gap-4 print:hidden border-b pb-4">
        <Link href="/coordenacao">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Painel da Coordenação
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs flex items-center gap-1 font-mono">
            <Lock className="h-3 w-3 text-green-600" />
            {relatorio.status === "fechado" ? "Congelado & Imutável (v" + relatorio.versao + ")" : "Em Elaboração"}
          </Badge>
          <Button onClick={handleImprimir} size="sm" className="gap-1.5 text-xs">
            <Printer className="h-3.5 w-3.5" />
            Imprimir / Exportar PDF
          </Button>
        </div>
      </div>

      {/* DOCUMENTO OFICIAL: CADERNO NÍVEL 2 */}
      <div className="bg-card border rounded-xl shadow-xs p-6 md:p-10 space-y-8 print:border-none print:shadow-none print:p-0">
        {/* Cabeçalho Oficial Governamental */}
        <div className="border-b-2 border-primary/20 pb-6 space-y-3 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Relatório Oficial de Governança e Auditoria Governamental
              </span>
              <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-foreground mt-0.5">
                Caderno Periódico de Supervisão Regional — Nível 2
              </h1>
            </div>
            <div className="text-right">
              <Badge variant="secondary" className="font-mono text-xs font-semibold">
                Ciclo: {relatorio.rotulo_periodo}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-3 border-t">
            <div>
              <span className="text-muted-foreground block font-medium">Objeto / Projeto:</span>
              <span className="font-semibold">{objetoNome}</span>
            </div>
            <div>
              <span className="text-muted-foreground block font-medium">Termo de Parceria:</span>
              <span className="font-semibold">{termoParceria}</span>
            </div>
            <div>
              <span className="text-muted-foreground block font-medium">Região Territorial:</span>
              <span className="font-semibold">{regiaoNome}</span>
            </div>
            <div>
              <span className="text-muted-foreground block font-medium">Coordenador(a) Titular:</span>
              <span className="font-semibold">{snapshot.coordenador_nome || coordenadorNome}</span>
            </div>
          </div>
        </div>

        {/* Indicadores Executivos em Destaque (§3.9.3) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-muted/30 p-4 rounded-lg border">
          <div className="text-center sm:text-left border-r pr-2 last:border-r-0">
            <span className="text-xs text-muted-foreground font-medium block">
              {termoLocal}s Acompanhados
            </span>
            <span className="text-2xl font-bold text-foreground">
              {indicadores.polos_acompanhados}
            </span>
          </div>
          <div className="text-center sm:text-left border-r pr-2 last:border-r-0">
            <span className="text-xs text-muted-foreground font-medium block">
              Supervisões Realizadas
            </span>
            <span className="text-2xl font-bold text-foreground">
              {indicadores.supervisoes_realizadas}
            </span>
          </div>
          <div className="text-center sm:text-left border-r pr-2 last:border-r-0">
            <span className="text-xs text-muted-foreground font-medium block">
              Taxa de Conformidade
            </span>
            <span className="text-2xl font-bold text-green-600">
              {indicadores.taxa_conformidade}%
            </span>
          </div>
          <div className="text-center sm:text-left">
            <span className="text-xs text-muted-foreground font-medium block">
              {termoBeneficiario}s Presenciais
            </span>
            <span className="text-2xl font-bold text-blue-600">
              {indicadores.total_atendimentos}
            </span>
          </div>
        </div>

        {/* Seção 1 — Resumo Geral das Supervisões (Tabela Consolidada) */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b pb-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider">
              1. Resumo Consolidado das Supervisões Realizadas no Período
            </h2>
          </div>

          {tabelaSupervisoes.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-3">
              Nenhuma vistoria de campo registrada no período de apuração.
            </p>
          ) : (
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/60 text-muted-foreground border-b font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3">{termoLocal}</th>
                    <th className="py-2.5 px-3">{termoInstrutor}</th>
                    <th className="py-2.5 px-3">Horário</th>
                    <th className="py-2.5 px-3 text-center">{termoBeneficiario}s</th>
                    <th className="py-2.5 px-3">Situação</th>
                    <th className="py-2.5 px-3">Pendências & Ocorrências</th>
                    <th className="py-2.5 px-3">Providências</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {tabelaSupervisoes.map((item, idx) => (
                    <tr key={idx} className="hover:bg-muted/20">
                      <td className="py-2.5 px-3 whitespace-nowrap font-medium">
                        {new Date(item.data + "T00:00:00").toLocaleDateString("pt-BR")}
                      </td>
                      <td className="py-2.5 px-3 font-semibold whitespace-nowrap">{item.local_nome}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">{item.instrutor_nome}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-mono">{item.horario}</td>
                      <td className="py-2.5 px-3 text-center font-bold">{item.beneficiarios_presentes}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {item.situacao === "Regular" && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                            Regular
                          </Badge>
                        )}
                        {item.situacao === "Requer Atenção" && (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                            Atenção
                          </Badge>
                        )}
                        {item.situacao === "Crítica" && (
                          <Badge variant="destructive" className="text-xs">
                            Crítica
                          </Badge>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground max-w-xs truncate">
                        {item.ocorrencias || "-"}
                      </td>
                      <td className="py-2.5 px-3 text-muted-foreground max-w-xs truncate">
                        {item.providencias || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Seção 2 — Síntese Qualitativa da Coordenação (Os 4 Blocos Canônicos) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b pb-2">
            <FileText className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider">
              2. Síntese Qualitativa da Coordenação Regional
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bloco 1: Pontos Positivos */}
            <div className="p-4 rounded-lg border bg-green-50/30 border-green-200 dark:bg-green-950/10 dark:border-green-800 space-y-1.5">
              <span className="text-xs font-bold text-green-800 dark:text-green-300 flex items-center gap-1.5 uppercase tracking-wide">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Pontos Positivos & Destaques da Execução
              </span>
              <p className="text-xs text-foreground whitespace-pre-line leading-relaxed">
                {sintese.pontos_positivos}
              </p>
            </div>

            {/* Bloco 2: Dificuldades */}
            <div className="p-4 rounded-lg border bg-amber-50/30 border-amber-200 dark:bg-amber-950/10 dark:border-amber-800 space-y-1.5">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 uppercase tracking-wide">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Dificuldades Encontradas & Fatores Externos
              </span>
              <p className="text-xs text-foreground whitespace-pre-line leading-relaxed">
                {sintese.dificuldades}
              </p>
            </div>

            {/* Bloco 3: Pendências */}
            <div className="p-4 rounded-lg border bg-orange-50/30 border-orange-200 dark:bg-orange-950/10 dark:border-orange-800 space-y-1.5">
              <span className="text-xs font-bold text-orange-800 dark:text-orange-300 flex items-center gap-1.5 uppercase tracking-wide">
                <Clock className="h-4 w-4 text-orange-600" />
                Pendências a Sanar para o Próximo Ciclo
              </span>
              <p className="text-xs text-foreground whitespace-pre-line leading-relaxed">
                {sintese.pendencias}
              </p>
            </div>

            {/* Bloco 4: Providências Adotadas */}
            <div className="p-4 rounded-lg border bg-blue-50/30 border-blue-200 dark:bg-blue-950/10 dark:border-blue-800 space-y-1.5">
              <span className="text-xs font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5 uppercase tracking-wide">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                Providências Adotadas & Recomendações
              </span>
              <p className="text-xs text-foreground whitespace-pre-line leading-relaxed">
                {sintese.providencias}
              </p>
            </div>
          </div>
        </div>

        {/* Seção 3 — Declaração Formal de Fé Pública e Encerramento Oficial */}
        <div className="pt-6 border-t space-y-6">
          <div className="bg-muted/40 p-4 rounded-lg border space-y-2 text-xs">
            <span className="font-bold uppercase tracking-wider block text-foreground">
              Declaração de Conformidade e Fé Pública
            </span>
            <p className="text-muted-foreground leading-relaxed">
              Declaro, sob as penas da lei e em conformidade com as diretrizes do Termo de Colaboração e do MROSC (Lei 13.019/2014),
              que as informações aqui consolidadas refletem com fidedignidade as condições de infraestrutura, assiduidade docente,
              presença dos beneficiários e registros de auditoria em campo apurados no período de {relatorio.rotulo_periodo}
              na circunscrição da região {regiaoNome}.
            </p>
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-muted-foreground font-mono text-[11px] border-t">
              <span>Carimbo Temporal: {relatorio.fechado_em ? new Date(relatorio.fechado_em).toLocaleString("pt-BR") : "Em Aberto"}</span>
              <span>Identificador do Snapshot: {relatorio.id}</span>
            </div>
          </div>

          {/* Campo Formal de Assinatura */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-around gap-8 text-center text-xs">
            <div className="space-y-1 w-72">
              <div className="border-b border-foreground/40 pb-1">
                <span className="font-bold">{snapshot.coordenador_nome || coordenadorNome}</span>
              </div>
              <span className="text-muted-foreground block">
                Coordenador(a) Regional ({regiaoNome})
              </span>
            </div>

            <div className="space-y-1 w-72">
              <div className="border-b border-foreground/40 pb-1">
                <span className="font-bold">Fiscal / Gestor da Parceria</span>
              </div>
              <span className="text-muted-foreground block">
                Órgão Concedente (Administração Pública)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
