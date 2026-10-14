"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type PainelCoordenadorData,
  salvarRascunhoSintese,
  fecharCicloPeriodico,
} from "@/lib/actions/coordenacao";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Building,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Calendar,
  Clock,
  UserCheck,
  MapPin,
  FileText,
  Lock,
  ShieldCheck,
  ArrowRight,
  Search,
  Filter,
  Sparkles,
  Loader2,
  AlertCircle,
  Eye,
  Check,
  ChevronRight,
  Layers,
} from "lucide-react";

interface CoordenacaoClientProps {
  initialData: PainelCoordenadorData;
  objetoId: string;
  objetoNome?: string;
  termoLocal?: string;
  termoInstrutor?: string;
  termoGrupo?: string;
  termoSessao?: string;
}

export function CoordenacaoClient({
  initialData,
  objetoId,
  objetoNome = "Projeto Social",
  termoLocal = "Polo",
  termoInstrutor = "Professor",
  termoGrupo = "Turma",
  termoSessao = "Sessão",
}: CoordenacaoClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [data, setData] = useState<PainelCoordenadorData>(initialData);
  const { coordenador, regioes, regiaoAtiva, indicadores, polos, ocorrencias, relatoriosRecentes } = data;

  const [abaAtiva, setAbaAtiva] = useState<string>("polos");
  const [buscaPolo, setBuscaPolo] = useState("");
  const [buscaOcorrencia, setBuscaOcorrencia] = useState("");

  // Estado da Síntese Qualitativa da Coordenação (4 blocos canônicos)
  const hoje = new Date();
  const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split("T")[0];
  const ultimoDiaMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split("T")[0];
  const rotuloPadrao = `${hoje.toLocaleString("pt-BR", { month: "long" })} / ${hoje.getFullYear()}`;

  const [periodoRotulo, setPeriodoRotulo] = useState(
    rotuloPadrao.charAt(0).toUpperCase() + rotuloPadrao.slice(1)
  );
  const [dataInicio, setDataInicio] = useState(primeiroDiaMes);
  const [dataFim, setDataFim] = useState(ultimoDiaMes);

  const [pontosPositivos, setPontosPositivos] = useState("");
  const [dificuldades, setDificuldades] = useState("");
  const [pendencias, setPendencias] = useState("");
  const [providencias, setProvidencias] = useState("");

  const [feedbackMensagem, setFeedbackMensagem] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);
  const [modalConfirmarFechamento, setModalConfirmarFechamento] = useState(false);

  // Filtragem de Polos
  const polosFiltrados = polos.filter((p) => {
    return (
      !buscaPolo.trim() ||
      p.nome.toLowerCase().includes(buscaPolo.toLowerCase()) ||
      (p.bairro && p.bairro.toLowerCase().includes(buscaPolo.toLowerCase()))
    );
  });

  // Filtragem de Ocorrências
  const ocorrenciasFiltradas = ocorrencias.filter((o) => {
    return (
      !buscaOcorrencia.trim() ||
      o.local_nome.toLowerCase().includes(buscaOcorrencia.toLowerCase()) ||
      o.instrutor_nome.toLowerCase().includes(buscaOcorrencia.toLowerCase()) ||
      (o.ocorrencias && o.ocorrencias.toLowerCase().includes(buscaOcorrencia.toLowerCase()))
    );
  });

  // Troca de Região
  const handleTrocarRegiao = (novaRegiaoId: string) => {
    router.push(`/coordenacao?regiao_id=${novaRegiaoId}&objeto_id=${objetoId}`);
  };

  // Salvar Rascunho da Síntese
  const handleSalvarRascunho = () => {
    setFeedbackMensagem(null);
    startTransition(async () => {
      const res = await salvarRascunhoSintese({
        objeto_id: objetoId,
        regiao_id: regiaoAtiva?.id === "regiao-geral" ? undefined : regiaoAtiva?.id,
        rotulo_periodo: periodoRotulo,
        data_inicio: dataInicio,
        data_fim: dataFim,
        pontos_positivos: pontosPositivos,
        dificuldades: dificuldades,
        pendencias: pendencias,
        providencias: providencias,
      });

      if (res.success) {
        setFeedbackMensagem({
          tipo: "sucesso",
          texto: "Rascunho da síntese qualitativa salvo com sucesso!",
        });
      } else {
        setFeedbackMensagem({
          tipo: "erro",
          texto: res.error || "Não foi possível salvar o rascunho.",
        });
      }
    });
  };

  // Homologar Fechamento do Ciclo Oficial
  const handleExecutarFechamento = () => {
    setFeedbackMensagem(null);
    startTransition(async () => {
      const res = await fecharCicloPeriodico({
        objeto_id: objetoId,
        regiao_id: regiaoAtiva?.id === "regiao-geral" ? undefined : regiaoAtiva?.id,
        regiao_nome: regiaoAtiva?.nome,
        rotulo_periodo: periodoRotulo,
        data_inicio: dataInicio,
        data_fim: dataFim,
        coordenador_nome: coordenador?.nome,
        sintese: {
          pontos_positivos: pontosPositivos,
          dificuldades: dificuldades,
          pendencias: pendencias,
          providencias: providencias,
        },
      });

      setModalConfirmarFechamento(false);

      if (res.success && res.data) {
        setFeedbackMensagem({
          tipo: "sucesso",
          texto: "Ciclo periódico fechado com sucesso! Snapshot imutável gerado com fé pública.",
        });
        // Redireciona para o espelho do relatório fechado
        router.push(`/coordenacao/relatorio/${res.data.id}`);
      } else {
        setFeedbackMensagem({
          tipo: "erro",
          texto: res.error || "Falha ao fechar o ciclo periódico.",
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Topo / Cabeçalho da Coordenação Regional */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs uppercase tracking-wider">
              {regiaoAtiva ? regiaoAtiva.nome : "Coordenação Geral"}
            </Badge>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground font-medium">{objetoNome}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mt-1 flex items-center gap-2">
            <Layers className="h-6 w-6 text-primary" />
            Painel da Coordenação Regional
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gestão territorial descentralizada, central de pendências de {termoLocal.toLowerCase()}s e fechamento periódico oficial (§3.7 e §3.9.3).
          </p>
        </div>

        {/* Seletor de Região (caso haja mais de uma) */}
        {regioes.length > 1 && (
          <div className="flex items-center gap-2 bg-muted/50 p-1.5 rounded-lg border">
            <span className="text-xs font-medium text-muted-foreground pl-2">Região:</span>
            <select
              aria-label="Selecionar Região Territorial"
              value={regiaoAtiva?.id ?? ""}
              onChange={(e) => handleTrocarRegiao(e.target.value)}
              className="text-xs font-semibold bg-background border rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {regioes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nome}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Mini-Dashboard de Topo (4 KPIs Canônicos) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Polos Ativos */}
        <Card className="shadow-xs border-l-4 border-l-blue-600">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {termoLocal}s Ativos na Região
            </CardTitle>
            <Building className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{indicadores.totalPolosAtivos}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {indicadores.totalAlunosAtendidos} atendidos em turmas
            </p>
          </CardContent>
        </Card>

        {/* KPI 2: Vistorias Concluídas no Mês */}
        <Card className="shadow-xs border-l-4 border-l-green-600">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Supervisões no Ciclo
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{indicadores.supervisoesConcluidasMes}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Vistorias presenciais concluídas
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: Inconformidades Abertas */}
        <Card className="shadow-xs border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Ocorrências em Aberto
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{indicadores.inconformidadesAbertas}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Pendências que exigem saneamento
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Taxa de Regularidade */}
        <Card className="shadow-xs border-l-4 border-l-indigo-600">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Taxa de Conformidade
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{indicadores.taxaConformidadeRegional}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Índice de conformidade das ações
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerta de Feedback (se houver) */}
      {feedbackMensagem && (
        <div
          className={`p-4 rounded-lg flex items-center justify-between gap-3 text-sm border ${
            feedbackMensagem.tipo === "sucesso"
              ? "bg-green-50 text-green-800 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800"
              : "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMensagem.tipo === "sucesso" ? (
              <Check className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
            )}
            <span>{feedbackMensagem.texto}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFeedbackMensagem(null)}
            className="text-xs h-7 px-2 hover:bg-transparent"
          >
            Fechar
          </Button>
        </div>
      )}

      {/* Abas Principais da Coordenação */}
      <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="w-full space-y-4">
        <TabsList className="grid grid-cols-3 max-w-xl">
          <TabsTrigger value="polos" className="text-xs font-medium">
            {termoLocal}s & Cobertura ({polos.length})
          </TabsTrigger>
          <TabsTrigger value="ocorrencias" className="text-xs font-medium">
            Pendências & Prazos ({ocorrencias.length})
          </TabsTrigger>
          <TabsTrigger value="fechamento" className="text-xs font-medium">
            Fechamento do Ciclo
          </TabsTrigger>
        </TabsList>

        {/* ABA 1: Polos & Cobertura Regional */}
        <TabsContent value="polos" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Buscar ${termoLocal.toLowerCase()} por nome ou bairro...`}
                value={buscaPolo}
                onChange={(e) => setBuscaPolo(e.target.value)}
                className="pl-8 text-xs h-9"
              />
            </div>
            <p className="text-xs text-muted-foreground self-end sm:self-center">
              Total listado: {polosFiltrados.length} {termoLocal.toLowerCase()}s
            </p>
          </div>

          {polosFiltrados.length === 0 ? (
            <Card className="border-dashed py-12 text-center">
              <CardContent className="space-y-3">
                <Building className="h-10 w-10 text-muted-foreground/50 mx-auto" />
                <p className="text-sm font-medium">Nenhum {termoLocal.toLowerCase()} localizado nesta região.</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Verifique se os {termoLocal.toLowerCase()}s estão cadastrados e vinculados à região &ldquo;{regiaoAtiva?.nome}&rdquo;.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {polosFiltrados.map((polo) => (
                <Card key={polo.id} className="hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base font-semibold">{polo.nome}</CardTitle>
                        <CardDescription className="text-xs flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {polo.bairro || "Bairro não informado"}
                        </CardDescription>
                      </div>
                      {polo.ultima_situacao === "Regular" && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                          Regular
                        </Badge>
                      )}
                      {polo.ultima_situacao === "Requer Atenção" && (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                          Atenção
                        </Badge>
                      )}
                      {polo.ultima_situacao === "Crítica" && (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                          Crítica
                        </Badge>
                      )}
                      {!polo.ultima_situacao && (
                        <Badge variant="secondary" className="text-xs">
                          Sem vistoria
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-2 p-2 bg-muted/40 rounded-md">
                      <div>
                        <span className="text-muted-foreground block">{termoGrupo}s:</span>
                        <span className="font-semibold text-sm">{polo.total_turmas}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Matrículas Ativas:</span>
                        <span className="font-semibold text-sm">{polo.total_alunos}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-muted-foreground pt-1 border-t">
                      <span>Última vistoria:</span>
                      <span className="font-medium text-foreground">
                        {polo.ultima_supervisao_data
                          ? new Date(polo.ultima_supervisao_data + "T00:00:00").toLocaleDateString("pt-BR")
                          : "Nunca auditado"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ABA 2: Central de Pendências & Prazos (T05) */}
        <TabsContent value="ocorrencias" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por polo, professor ou ocorrência..."
                value={buscaOcorrencia}
                onChange={(e) => setBuscaOcorrencia(e.target.value)}
                className="pl-8 text-xs h-9"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Mostrando {ocorrenciasFiltradas.length} apontamentos registrados
            </p>
          </div>

          {ocorrenciasFiltradas.length === 0 ? (
            <Card className="border-dashed py-12 text-center">
              <CardContent className="space-y-3">
                <CheckCircle2 className="h-10 w-10 text-green-500/70 mx-auto" />
                <p className="text-sm font-medium">Nenhuma inconformidade em aberto nesta região!</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Todas as vistorias de campo dos supervisores indicam situação regular ou as ocorrências foram saneadas.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {ocorrenciasFiltradas.map((item) => (
                <Card
                  key={item.visita_id}
                  className={`border-l-4 ${
                    item.vencida
                      ? "border-l-red-600 bg-red-50/20 dark:bg-red-950/10"
                      : item.situacao === "Crítica"
                      ? "border-l-red-500"
                      : "border-l-amber-500"
                  }`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{item.local_nome}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {termoInstrutor}: {item.instrutor_nome}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.situacao === "Crítica" ? (
                          <Badge variant="destructive" className="text-xs">
                            Situação Crítica
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-xs">
                            Requer Atenção
                          </Badge>
                        )}

                        {item.prazo_regularizacao && (
                          <Badge
                            variant={item.vencida ? "destructive" : "secondary"}
                            className="text-xs flex items-center gap-1"
                          >
                            <Clock className="h-3 w-3" />
                            {item.vencida
                              ? `Vencida há ${Math.abs(item.dias_restantes || 0)} dias`
                              : item.dias_restantes === 0
                              ? "Vence Hoje"
                              : `Prazo: ${item.dias_restantes} dias restantes`}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-xs pt-1">
                    <div className="space-y-1">
                      <span className="font-medium text-foreground block">Inconformidade / Ocorrência:</span>
                      <p className="text-muted-foreground whitespace-pre-line bg-muted/30 p-2.5 rounded-md border text-xs">
                        {item.ocorrencias || "Sem detalhamento textual."}
                      </p>
                    </div>

                    {item.providencias && (
                      <div className="space-y-1">
                        <span className="font-medium text-foreground block">Providência Exigida pelo Supervisor:</span>
                        <p className="text-muted-foreground whitespace-pre-line bg-amber-50/40 text-amber-900 dark:bg-amber-950/20 dark:text-amber-300 p-2.5 rounded-md border border-amber-200 dark:border-amber-800 text-xs">
                          {item.providencias}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t text-muted-foreground">
                      <span>Vistoriado em: {new Date(item.data_visita + "T00:00:00").toLocaleDateString("pt-BR")}</span>
                      <Link href={`/supervisoes/${item.visita_id}`}>
                        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
                          Ver Espelho da Vistoria
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ABA 3: Fechamento Periódico & Síntese Qualitativa (T06) */}
        <TabsContent value="fechamento" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Fechamento Periódico & Síntese da Coordenação
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Caderno Oficial de Supervisão Nível 2 (§3.9.3) — Consolidação territorial das fiscalizações e parecer executivo.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="font-mono text-xs w-fit">
                  {regiaoAtiva?.nome || "Região Única"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Definição do Período */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg border">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Rótulo do Ciclo / Período</Label>
                  <Input
                    placeholder="Ex: Outubro / 2026"
                    value={periodoRotulo}
                    onChange={(e) => setPeriodoRotulo(e.target.value)}
                    className="h-8 text-xs bg-background"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Data Inicial</Label>
                  <Input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    className="h-8 text-xs bg-background"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Data Final</Label>
                  <Input
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    className="h-8 text-xs bg-background"
                  />
                </div>
              </div>

              {/* Os 4 Blocos Dissertativos Canônicos (§3.7 e §3.9.3) */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold tracking-tight border-b pb-1">
                  Síntese Qualitativa da Coordenação (4 Blocos Canônicos)
                </h3>

                {/* Bloco 1: Pontos Positivos */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-green-700 dark:text-green-400 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" />
                      1. Pontos Positivos & Destaques da Execução
                    </Label>
                    <span className="text-xs text-muted-foreground">Mínimo 10 caracteres</span>
                  </div>
                  <Textarea
                    placeholder="Descreva os avanços pedagógicos, engajamento dos beneficiários, pontualidade das turmas e boas práticas observadas nos polos..."
                    rows={3}
                    value={pontosPositivos}
                    onChange={(e) => setPontosPositivos(e.target.value)}
                    className="text-xs"
                  />
                </div>

                {/* Bloco 2: Dificuldades */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4" />
                      2. Dificuldades Encontradas & Fatores Externos
                    </Label>
                    <span className="text-xs text-muted-foreground">Mínimo 10 caracteres</span>
                  </div>
                  <Textarea
                    placeholder="Relate problemas climáticos, avarias estruturais nos espaços, absenteísmo pontual ou atrasos logísticos ocorridos no período..."
                    rows={3}
                    value={dificuldades}
                    onChange={(e) => setDificuldades(e.target.value)}
                    className="text-xs"
                  />
                </div>

                {/* Bloco 3: Pendências */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-orange-700 dark:text-orange-400 flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      3. Pendências a Sanar para o Próximo Ciclo
                    </Label>
                    <span className="text-xs text-muted-foreground">Mínimo 10 caracteres</span>
                  </div>
                  <Textarea
                    placeholder="Aponte reposição de materiais pendentes, manutenções requisitadas junto ao Concedente ou ajustes no corpo técnico..."
                    rows={3}
                    value={pendencias}
                    onChange={(e) => setPendencias(e.target.value)}
                    className="text-xs"
                  />
                </div>

                {/* Bloco 4: Providências Adotadas */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4" />
                      4. Providências Adotadas & Recomendações da Coordenação
                    </Label>
                    <span className="text-xs text-muted-foreground">Mínimo 10 caracteres</span>
                  </div>
                  <Textarea
                    placeholder="Descreva as orientações emitidas aos supervisores e professores, notificações de regularização e medidas preventivas pactuadas..."
                    rows={3}
                    value={providencias}
                    onChange={(e) => setProvidencias(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handleSalvarRascunho}
                  disabled={isPending}
                  className="w-full sm:w-auto text-xs"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                  Salvar Rascunho
                </Button>

                <Button
                  variant="default"
                  onClick={() => setModalConfirmarFechamento(true)}
                  disabled={
                    isPending ||
                    pontosPositivos.trim().length < 10 ||
                    dificuldades.trim().length < 10 ||
                    pendencias.trim().length < 10 ||
                    providencias.trim().length < 10
                  }
                  className="w-full sm:w-auto text-xs gap-1.5 bg-blue-600 hover:bg-blue-700"
                >
                  <Lock className="h-3.5 w-3.5" />
                  Homologar Fechamento Oficial (Caderno Nível 2)
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Histórico de Relatórios Periódicos do Projeto / Região */}
          {relatoriosRecentes.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  Cadernos Periódicos Emitidos Anteriores
                </CardTitle>
                <CardDescription className="text-xs">
                  Relatórios já homologados e congelados com fé pública nesta região.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {relatoriosRecentes.map((rel) => (
                  <div
                    key={rel.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{rel.rotulo_periodo}</span>
                        <Badge
                          variant={rel.status === "fechado" ? "default" : "outline"}
                          className="text-xs"
                        >
                          {rel.status === "fechado" ? "Fechado & Imutável" : "Em Elaboração"}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-mono">v{rel.versao}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {rel.fechado_em
                          ? `Homologado em ${new Date(rel.fechado_em).toLocaleDateString("pt-BR")}`
                          : "Ainda aberto"}
                      </p>
                    </div>

                    <Link href={`/coordenacao/relatorio/${rel.id}`}>
                      <Button variant="ghost" size="sm" className="text-xs gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        Visualizar Caderno
                      </Button>
                    </Link>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal de Confirmação de Fechamento Imutável */}
      <Dialog open={modalConfirmarFechamento} onOpenChange={setModalConfirmarFechamento}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Lock className="h-5 w-5" />
              Confirmar Fechamento Oficial do Ciclo?
            </DialogTitle>
            <DialogDescription className="space-y-2 pt-2 text-xs">
              <p>
                Ao homologar o fechamento do período <strong>&ldquo;{periodoRotulo}&rdquo;</strong> para a região{" "}
                <strong>&ldquo;{regiaoAtiva?.nome}&rdquo;</strong>, o sistema irá:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                <li>Compilar todas as supervisões e atendimentos ocorridos entre {dataInicio} e {dataFim};</li>
                <li>Gerar o snapshot imutável em JSON para fins de auditoria e prestação de contas governamental;</li>
                <li>Congelar a síntese qualitativa da coordenação sem possibilidade de alteração retroativa.</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModalConfirmarFechamento(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleExecutarFechamento}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Confirmar e Homologar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
