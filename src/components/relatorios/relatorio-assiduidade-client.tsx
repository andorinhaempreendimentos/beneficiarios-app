"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import {
  type RelatorioAssiduidadeData,
  type AlunoAssiduidadeItem,
} from "@/lib/actions/relatorios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  Search,
  Filter,
  ArrowLeft,
  Download,
  Printer,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Building,
  GraduationCap,
  Sparkles,
} from "lucide-react";

interface RelatorioAssiduidadeClientProps {
  initialData: RelatorioAssiduidadeData;
  objetoId: string;
}

export function RelatorioAssiduidadeClient({
  initialData,
  objetoId,
}: RelatorioAssiduidadeClientProps) {
  const [data] = useState<RelatorioAssiduidadeData>(initialData);
  const { objeto, indicadores, itens, locais, turmas } = data;

  const termoLocal = objeto?.termo_local || "";
  const termoInstrutor = objeto?.termo_instrutor || "";
  const termoGrupo = objeto?.termo_grupo || "";
  const termoBeneficiario = objeto?.termo_beneficiario || "";
  const metaObjeto = objeto?.meta_frequencia || 75;

  // Filtros em tela
  const [filtroLocal, setFiltroLocal] = useState<string>("todos");
  const [filtroTurma, setFiltroTurma] = useState<string>("todos");
  const [filtroMeta, setFiltroMeta] = useState<string>("todos");
  const [busca, setBusca] = useState<string>("");

  // Turmas filtradas pelo polo selecionado
  const turmasFiltradas = filtroLocal === "todos"
    ? turmas
    : turmas.filter((t) => t.local_id === filtroLocal);

  // Filtragem dos itens
  const itensExibidos = itens.filter((item) => {
    const matchLocal = filtroLocal === "todos" || item.local_id === filtroLocal;
    const matchTurma = filtroTurma === "todos" || item.grupo_id === filtroTurma;
    const matchMeta =
      filtroMeta === "todos" ||
      (filtroMeta === "abaixo" && item.status_assiduidade === "abaixo_da_meta") ||
      (filtroMeta === "dentro" && item.status_assiduidade === "dentro_da_meta");

    const matchBusca =
      !busca.trim() ||
      item.nome_completo.toLowerCase().includes(busca.toLowerCase()) ||
      item.cpf.includes(busca) ||
      item.turma_nome.toLowerCase().includes(busca.toLowerCase()) ||
      item.local_nome.toLowerCase().includes(busca.toLowerCase());

    return matchLocal && matchTurma && matchMeta && matchBusca;
  });

  // Exportar para CSV com delimitador ; (padrão Brasil/Excel)
  const handleExportarCSV = () => {
    const cabecalho = [
      termoBeneficiario,
      "CPF",
      termoGrupo,
      termoLocal,
      termoInstrutor,
      "Aulas Realizadas",
      "Presenças",
      "Faltas",
      "Faltas Justificadas",
      "% Frequência",
      "Meta Pactuada",
      "Situação da Meta",
      "Vínculo Cadastral",
    ].join(";");

    const linhas = itensExibidos.map((item) =>
      [
        `"${item.nome_completo}"`,
        `"${item.cpf}"`,
        `"${item.turma_nome}"`,
        `"${item.local_nome}"`,
        `"${item.professor_nome}"`,
        item.aulas_realizadas,
        item.presencas,
        item.faltas,
        item.faltas_justificadas,
        `${item.percentual_frequencia}%`,
        `${item.meta_objeto}%`,
        item.status_assiduidade === "dentro_da_meta" ? "Dentro da Meta" : "Abaixo da Meta",
        item.situacao_matricula,
      ].join(";")
    );

    const csvContent = "\uFEFF" + [cabecalho, ...linhas].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `assiduidade_beneficiarios_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Topo / Barra de Retorno */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 print:hidden">
        <div>
          <Link href="/relatorios">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs -ml-2 mb-1">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Hub de Relatórios
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Espelho Nominal de Assiduidade & Combate à Evasão
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Extrato individual atômico (§3.9.5.A) com a Fórmula Tripartite Oficial e filtro de Busca Ativa para retenção no projeto.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleExportarCSV} variant="outline" size="sm" className="gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" />
            Exportar CSV / Excel
          </Button>
          <Button onClick={() => window.print()} variant="secondary" size="sm" className="gap-1.5 text-xs">
            <Printer className="h-3.5 w-3.5" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* 4 KPIs de Assiduidade & Retenção */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total de Beneficiários */}
        <Card className="shadow-xs border-l-4 border-l-blue-600">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {termoBeneficiario}s Apurados
            </CardTitle>
            <GraduationCap className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{indicadores.totalAlunos}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {indicadores.totalAulasApuradas} sessões auditadas
            </p>
          </CardContent>
        </Card>

        {/* KPI 2: Frequência Média Geral */}
        <Card className="shadow-xs border-l-4 border-l-green-600">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Frequência Média Geral
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {indicadores.frequenciaMediaGeral}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Meta contratual pactuada: {metaObjeto}%
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: Em Risco de Evasão (Busca Ativa) */}
        <Card className="shadow-xs border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Risco de Evasão (Busca Ativa)
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {indicadores.totalAlunosRiscoEvasao}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Frequência abaixo de {metaObjeto}%
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Taxa de Retenção */}
        <Card className="shadow-xs border-l-4 border-l-indigo-600">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Taxa de Retenção
            </CardTitle>
            <Sparkles className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{indicadores.taxaRetencaoGeral}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Alunos cumprindo a meta
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Filtros */}
      <div className="p-4 bg-muted/30 rounded-lg border space-y-3 print:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Seletor de Polo */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">{termoLocal}:</label>
            <select
              aria-label={`Selecionar ${termoLocal}`}
              value={filtroLocal}
              onChange={(e) => {
                setFiltroLocal(e.target.value);
                setFiltroTurma("todos");
              }}
              className="w-full text-xs bg-background border rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="todos">Todos os {termoLocal.toLowerCase()}s</option>
              {locais.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Seletor de Turma */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">{termoGrupo}:</label>
            <select
              aria-label={`Selecionar ${termoGrupo}`}
              value={filtroTurma}
              onChange={(e) => setFiltroTurma(e.target.value)}
              className="w-full text-xs bg-background border rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="todos">Todas as {termoGrupo.toLowerCase()}s</option>
              {turmasFiltradas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro de Meta */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Situação da Meta:</label>
            <select
              aria-label="Filtrar por Situação da Meta"
              value={filtroMeta}
              onChange={(e) => setFiltroMeta(e.target.value)}
              className="w-full text-xs bg-background border rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="todos">Todos os Alunos</option>
              <option value="abaixo">Abaixo da Meta (Busca Ativa)</option>
              <option value="dentro">Dentro da Meta (&ge; {metaObjeto}%)</option>
            </select>
          </div>

          {/* Busca por Texto */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Buscar Aluno ou CPF:</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Nome, CPF ou turma..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-8 text-xs h-8 bg-background"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabela Nominal Atômica (§3.9.5.A) */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">
                Relação Nominal de Assiduidade dos {termoBeneficiario}s
              </CardTitle>
              <CardDescription className="text-xs">
                Listagem nominal oficial calculada pela fórmula tripartite: Presenças + Justificadas / Aulas Realizadas.
              </CardDescription>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              {itensExibidos.length} registros
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {itensExibidos.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-xs italic">
              Nenhum participante encontrado com os filtros selecionados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 text-muted-foreground border-b font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">{termoBeneficiario}</th>
                    <th className="py-2.5 px-3">CPF</th>
                    <th className="py-2.5 px-3">{termoGrupo}</th>
                    <th className="py-2.5 px-3">{termoLocal}</th>
                    <th className="py-2.5 px-3">{termoInstrutor}</th>
                    <th className="py-2.5 px-3 text-center">Aulas</th>
                    <th className="py-2.5 px-3 text-center">Presenças</th>
                    <th className="py-2.5 px-3 text-center">Faltas</th>
                    <th className="py-2.5 px-3 text-center">Justificadas</th>
                    <th className="py-2.5 px-3 text-center">% Frequência</th>
                    <th className="py-2.5 px-3">Situação</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {itensExibidos.map((item) => (
                    <tr
                      key={item.matricula_id}
                      className={`hover:bg-muted/20 ${
                        item.status_assiduidade === "abaixo_da_meta"
                          ? "bg-amber-50/20 dark:bg-amber-950/10"
                          : ""
                      }`}
                    >
                      <td className="py-2.5 px-3 font-semibold whitespace-nowrap">
                        {item.nome_completo}
                        {item.vulneravel && (
                          <Badge variant="secondary" className="ml-1.5 text-[10px] px-1 py-0 font-normal">
                            Vulnerável
                          </Badge>
                        )}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-mono text-muted-foreground">
                        {item.cpf}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">{item.turma_nome}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">{item.local_nome}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">{item.professor_nome}</td>
                      <td className="py-2.5 px-3 text-center font-semibold">{item.aulas_realizadas}</td>
                      <td className="py-2.5 px-3 text-center text-green-700 dark:text-green-400 font-bold">
                        {item.presencas}
                      </td>
                      <td className="py-2.5 px-3 text-center text-red-600 dark:text-red-400">
                        {item.faltas}
                      </td>
                      <td className="py-2.5 px-3 text-center text-blue-600 dark:text-blue-400">
                        {item.faltas_justificadas}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`font-bold ${
                            item.status_assiduidade === "dentro_da_meta"
                              ? "text-green-600"
                              : "text-amber-600"
                          }`}
                        >
                          {item.percentual_frequencia}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {item.status_assiduidade === "dentro_da_meta" ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                            Dentro da Meta
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-xs flex items-center gap-1 w-fit">
                            <AlertTriangle className="h-3 w-3 text-amber-600" />
                            Abaixo da Meta
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
