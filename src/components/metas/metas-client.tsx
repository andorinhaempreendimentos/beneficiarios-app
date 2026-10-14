"use client";

import React, { useState, useTransition, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type PainelMetasMroscData,
  type MetaMroscItem,
  salvarObjetoMeta,
  excluirObjetoMeta,
  registrarApuracaoDeclaratoria,
  uploadAnexoMeta,
} from "@/lib/actions/metas";
import { type TipoApuracaoMeta } from "@/lib/validations/fase-8";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Target,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Printer,
  Download,
  Sparkles,
  Loader2,
  Building,
  Users,
  ShieldCheck,
  Calendar,
  Layers,
  FileText,
  UploadCloud,
  Paperclip,
  Trash2,
  Edit2,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

interface MetasClientProps {
  initialData: PainelMetasMroscData;
  objetoId: string;
}

const tipoApuracaoLabels: Record<TipoApuracaoMeta, { label: string; automacao: boolean }> = {
  total_locais: { label: "Polos de Atendimento Ativos", automacao: true },
  total_beneficiarios: { label: "Beneficiários / Matrículas Ativas", automacao: true },
  frequencia_media: { label: "Frequência Média nas Aulas (%)", automacao: true },
  sessoes_realizadas: { label: "Aulas Concluídas com Fotos", automacao: true },
  supervisoes_realizadas: { label: "Visitas de Supervisão Homologadas", automacao: true },
  vulnerabilidade_social: { label: "Vulnerabilidade / Cota Social (%)", automacao: true },
  manual: { label: "Ações Externas / Lançamento Declaratório", automacao: false },
};

export function MetasClient({ initialData, objetoId }: MetasClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [data] = useState<PainelMetasMroscData>(initialData);
  const objeto = data.objeto;
  const indicadores = data.indicadores;
  const metas = data.metas;
  const estatisticas = data.estatisticasSistema;

  const [filtroSituacao, setFiltroSituacao] = useState<string>("todas");
  const [feedback, setFeedback] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);

  // Modal: Nova / Editar Meta
  const [modalMetaAberto, setModalMetaAberto] = useState(false);
  const [metaEmEdicaoId, setMetaEmEdicaoId] = useState<string | null>(null);
  const [formNumero, setFormNumero] = useState<number>(metas.length + 1);
  const [formDescricao, setFormDescricao] = useState("");
  const [formUnidade, setFormUnidade] = useState("Beneficiários");
  const [formQtdPrevista, setFormQtdPrevista] = useState<number>(100);
  const [formFonte, setFormFonte] = useState("Software de Gestão e Listas de Presença Nominal");
  const [formTipo, setFormTipo] = useState<TipoApuracaoMeta>("total_beneficiarios");

  // Modal: Lançar Apuração Declaratória
  const [modalDeclaratoriaAberto, setModalDeclaratoriaAberto] = useState(false);
  const [metaDeclarando, setMetaDeclarando] = useState<MetaMroscItem | null>(null);
  const [formQtdDeclarada, setFormQtdDeclarada] = useState<number>(0);
  const [formJustificativa, setFormJustificativa] = useState("");
  const [formAnexos, setFormAnexos] = useState<string[]>([]);
  const [uploadingAnexo, setUploadingAnexo] = useState(false);
  const anexoInputRef = useRef<HTMLInputElement>(null);

  // Abrir Modal de Nova Meta
  const handleAbrirNovaMeta = () => {
    setMetaEmEdicaoId(null);
    setFormNumero(metas.length + 1);
    setFormDescricao("");
    setFormUnidade("Beneficiários");
    setFormQtdPrevista(100);
    setFormFonte("Software de Gestão e Listas de Presença Nominal");
    setFormTipo("total_beneficiarios");
    setModalMetaAberto(true);
  };

  // Abrir Modal de Edição de Meta
  const handleAbrirEditarMeta = (meta: MetaMroscItem) => {
    setMetaEmEdicaoId(meta.id);
    setFormNumero(meta.numero_meta);
    setFormDescricao(meta.descricao);
    setFormUnidade(meta.unidade_medida);
    setFormQtdPrevista(meta.quantidade_prevista);
    setFormFonte(meta.fonte_verificacao);
    setFormTipo(meta.tipo_apuracao);
    setModalMetaAberto(true);
  };

  // Salvar Meta
  const handleSalvarMeta = () => {
    setFeedback(null);
    startTransition(async () => {
      const res = await salvarObjetoMeta({
        id: metaEmEdicaoId || undefined,
        objeto_id: objetoId,
        numero_meta: Number(formNumero),
        descricao: formDescricao.trim(),
        unidade_medida: formUnidade.trim(),
        quantidade_prevista: Number(formQtdPrevista),
        fonte_verificacao: formFonte.trim(),
        tipo_apuracao: formTipo,
      });

      if (res.success) {
        setFeedback({ tipo: "sucesso", texto: "Meta do Plano de Trabalho salva com sucesso!" });
        setModalMetaAberto(false);
        router.refresh();
      } else {
        setFeedback({ tipo: "erro", texto: res.error || "Erro ao salvar meta." });
      }
    });
  };

  // Excluir Meta
  const handleExcluirMeta = (metaId: string, descricao: string) => {
    if (!confirm(`Deseja realmente remover a meta "${descricao}" do Plano de Trabalho?`)) return;

    setFeedback(null);
    startTransition(async () => {
      const res = await excluirObjetoMeta(metaId);
      if (res.success) {
        setFeedback({ tipo: "sucesso", texto: "Meta removida com sucesso!" });
        router.refresh();
      } else {
        setFeedback({ tipo: "erro", texto: res.error || "Erro ao excluir meta." });
      }
    });
  };

  // Abrir Modal de Apuração Declaratória
  const handleAbrirDeclaratoria = (meta: MetaMroscItem) => {
    setMetaDeclarando(meta);
    setFormQtdDeclarada(meta.quantidade_declarada || 0);
    setFormJustificativa(meta.justificativa_declarada || "");
    setFormAnexos(meta.anexos_urls || []);
    setModalDeclaratoriaAberto(true);
  };

  // Upload de Anexo
  const handleUploadAnexo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAnexo(true);
    setFeedback(null);
    try {
      const formData = new FormData();
      formData.append("arquivo", file);
      const res = await uploadAnexoMeta(formData);
      if (res.success && res.url) {
        setFormAnexos((prev) => [...prev, res.url!]);
      } else {
        setFeedback({ tipo: "erro", texto: res.error || "Erro no upload do anexo." });
      }
    } catch {
      setFeedback({ tipo: "erro", texto: "Falha de conexão no upload do arquivo." });
    } finally {
      setUploadingAnexo(false);
      if (e.target) e.target.value = "";
    }
  };

  // Salvar Apuração Declaratória
  const handleSalvarDeclaratoria = () => {
    if (!metaDeclarando) return;
    setFeedback(null);

    startTransition(async () => {
      const res = await registrarApuracaoDeclaratoria({
        meta_id: metaDeclarando.id,
        quantidade_declarada: Number(formQtdDeclarada),
        justificativa_declarada: formJustificativa.trim(),
        anexos_urls: formAnexos,
      });

      if (res.success) {
        setFeedback({
          tipo: "sucesso",
          texto: `Realização da Meta ${metaDeclarando.numero_meta} registrada com sucesso!`,
        });
        setModalDeclaratoriaAberto(false);
        router.refresh();
      } else {
        setFeedback({ tipo: "erro", texto: res.error || "Erro ao registrar apuração declaratória." });
      }
    });
  };

  // Exportar Metas para CSV
  const handleExportarCSV = () => {
    const cabecalho = [
      "Numero da Meta",
      "Descricao do Indicador",
      "Unidade de Medida",
      "Quantidade Prevista",
      "Quantidade Realizada",
      "Percentual Atingido (%)",
      "Situacao MROSC",
      "Tipo de Apuracao",
      "Fonte de Verificacao",
      "Justificativa Declarada",
    ];

    const linhas = metas.map((m) => [
      `Meta ${m.numero_meta}`,
      `"${m.descricao.replace(/"/g, '""')}"`,
      m.unidade_medida,
      m.quantidade_prevista,
      m.quantidade_realizada,
      `${m.percentual}%`,
      m.situacao.toUpperCase(),
      tipoApuracaoLabels[m.tipo_apuracao]?.label || m.tipo_apuracao,
      `"${m.fonte_verificacao.replace(/"/g, '""')}"`,
      `"${(m.justificativa_declarada || "").replace(/"/g, '""')}"`,
    ]);

    const conteudoCSV = [cabecalho.join(";"), ...linhas.map((l) => l.join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + conteudoCSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `demonstrativo_metas_mrosc_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtragem
  const metasFiltradas = metas.filter((m) => {
    if (filtroSituacao === "todas") return true;
    return m.situacao === filtroSituacao;
  });

  return (
    <div className="space-y-6">
      {/* 1. Header do Painel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary font-semibold text-xs">
              MROSC • Art. 22, IV da Lei 13.019/2014
            </Badge>
            <span className="text-xs text-muted-foreground">• Plano de Trabalho Homologado</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Target className="h-7 w-7 text-primary" />
            Metas Contratuais & Indicadores
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Apuração automatizada e declaratória do Plano de Trabalho para auditoria governamental.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5 text-xs">
            <Printer className="h-3.5 w-3.5" />
            Imprimir Caderno
          </Button>

          <Button variant="outline" size="sm" onClick={handleExportarCSV} className="gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" />
            Exportar CSV
          </Button>

          <Button size="sm" onClick={handleAbrirNovaMeta} className="gap-1.5 text-xs bg-primary text-primary-foreground">
            <Plus className="h-3.5 w-3.5" />
            Nova Meta no Plano
          </Button>
        </div>
      </div>

      {/* Alerta de Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-between ${
            feedback.tipo === "sucesso"
              ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200"
              : "bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.tipo === "sucesso" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{feedback.texto}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs underline opacity-70 hover:opacity-100"
          >
            fechar
          </button>
        </div>
      )}

      {/* 2. Cartões KPI Globais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Índice Geral de Execução Contratual */}
        <Card className="border-border/60 shadow-xs relative overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-600 to-indigo-600" />
          <CardHeader className="pb-1 pt-4 px-4">
            <CardDescription className="text-xs flex items-center justify-between font-medium">
              <span>Execução Global</span>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-mono">
              {indicadores.indiceGeralExecucao}%
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Média ponderada do Plano de Trabalho
            </p>
          </CardContent>
        </Card>

        {/* KPI 2: Metas Cumpridas (>= 100%) */}
        <Card className="border-border/60 shadow-xs relative overflow-hidden">
          <div className="h-1 bg-emerald-500" />
          <CardHeader className="pb-1 pt-4 px-4">
            <CardDescription className="text-xs flex items-center justify-between font-medium">
              <span>Cumpridas (&ge; 100%)</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-emerald-600 font-mono">
              {indicadores.metasCumpridas}{" "}
              <span className="text-xs text-muted-foreground font-normal">/ {indicadores.totalMetas}</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Metas com meta pactuada atingida
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: Metas Parciais (1% a 99%) */}
        <Card className="border-border/60 shadow-xs relative overflow-hidden">
          <div className="h-1 bg-amber-500" />
          <CardHeader className="pb-1 pt-4 px-4">
            <CardDescription className="text-xs flex items-center justify-between font-medium">
              <span>Parciais (1% a 99%)</span>
              <Clock className="h-4 w-4 text-amber-600" />
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-amber-600 font-mono">
              {indicadores.metasParciais}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Em execução ao longo do ciclo
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Metas Pendentes (0%) */}
        <Card className="border-border/60 shadow-xs relative overflow-hidden">
          <div className="h-1 bg-rose-500" />
          <CardHeader className="pb-1 pt-4 px-4">
            <CardDescription className="text-xs flex items-center justify-between font-medium">
              <span>Pendentes (0%)</span>
              <AlertCircle className="h-4 w-4 text-rose-600" />
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl sm:text-3xl font-bold tracking-tight text-rose-600 font-mono">
              {indicadores.metasPendentes}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Sem realizações computadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Barra de Métricas Operacionais Brutas do Sistema */}
      <Card className="border-border/60 shadow-xs bg-muted/20">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              Métricas Primárias de Campo Apuradas pelo Sistema
            </span>
            <span className="text-[11px] text-muted-foreground">
              Atualização em tempo real via chamadas nominais e vistorias
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
            <div className="p-2.5 rounded-lg bg-background border border-border/50">
              <span className="text-[11px] text-muted-foreground block">{objeto?.termo_local} Ativos</span>
              <span className="text-base font-bold font-mono">{estatisticas.totalLocais}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-background border border-border/50">
              <span className="text-[11px] text-muted-foreground block">{objeto?.termo_beneficiario} Ativos</span>
              <span className="text-base font-bold font-mono">{estatisticas.totalBeneficiarios}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-background border border-border/50">
              <span className="text-[11px] text-muted-foreground block">Frequência Média</span>
              <span className="text-base font-bold font-mono text-blue-600">{estatisticas.frequenciaMedia}%</span>
            </div>
            <div className="p-2.5 rounded-lg bg-background border border-border/50">
              <span className="text-[11px] text-muted-foreground block">Aulas c/ Fotos</span>
              <span className="text-base font-bold font-mono">{estatisticas.sessoesRealizadas}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-background border border-border/50">
              <span className="text-[11px] text-muted-foreground block">Supervisões Homologadas</span>
              <span className="text-base font-bold font-mono">{estatisticas.supervisoesRealizadas}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-background border border-border/50">
              <span className="text-[11px] text-muted-foreground block">Vulnerabilidade Social</span>
              <span className="text-base font-bold font-mono text-indigo-600">{estatisticas.vulnerabilidadeSocial}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Tabela / Grid das Metas Contratuais */}
      <Card className="border-border/60 shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                Demonstrativo de Metas do Plano de Trabalho
              </CardTitle>
              <CardDescription className="text-xs">
                Relação analítica oficial prevista no Art. 22, IV da Lei 13.019/2014.
              </CardDescription>
            </div>

            {/* Filtro por Situação */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs text-muted-foreground">Filtrar:</span>
              <select
                value={filtroSituacao}
                onChange={(e) => setFiltroSituacao(e.target.value)}
                className="h-8 px-2.5 rounded-md border border-input bg-background text-xs font-medium"
              >
                <option value="todas">Todas as metas ({metas.length})</option>
                <option value="cumprida">Cumpridas ({indicadores.metasCumpridas})</option>
                <option value="parcial">Parciais ({indicadores.metasParciais})</option>
                <option value="pendente">Pendentes ({indicadores.metasPendentes})</option>
              </select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {metasFiltradas.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-xl bg-muted/10 space-y-2">
              <Target className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-sm font-semibold">Nenhuma meta encontrada.</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Cadastre as metas pactuadas no Plano de Trabalho clicando em &ldquo;Nova Meta no Plano&rdquo;.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {metasFiltradas.map((meta) => {
                const infoApuracao = tipoApuracaoLabels[meta.tipo_apuracao] || {
                  label: meta.tipo_apuracao,
                  automacao: false,
                };

                const corProgresso =
                  meta.situacao === "cumprida"
                    ? "bg-emerald-500"
                    : meta.situacao === "parcial"
                    ? "bg-amber-500"
                    : "bg-rose-500";

                const badgeSituacao =
                  meta.situacao === "cumprida" ? (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-semibold text-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1 inline" /> Cumprida
                    </Badge>
                  ) : meta.situacao === "parcial" ? (
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 font-semibold text-xs">
                      <Clock className="h-3 w-3 mr-1 inline" /> Parcial
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30 font-semibold text-xs">
                      <AlertCircle className="h-3 w-3 mr-1 inline" /> Pendente
                    </Badge>
                  );

                return (
                  <div key={meta.id} className="py-4 space-y-3 hover:bg-muted/10 px-2 rounded-lg transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border/60">
                            Meta {String(meta.numero_meta).padStart(2, "0")}
                          </span>
                          {badgeSituacao}
                          <Badge variant="secondary" className="text-[11px] font-medium">
                            {infoApuracao.automacao ? "⚙️ Apuração Automática" : "✍️ Apuração Declaratória"}
                          </Badge>
                        </div>

                        <h3 className="text-base font-semibold text-foreground pt-0.5">
                          {meta.descricao}
                        </h3>

                        <div className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                          <span>
                            Tipo: <strong className="text-foreground">{infoApuracao.label}</strong>
                          </span>
                          <span>•</span>
                          <span>
                            Fonte: <strong className="text-foreground">{meta.fonte_verificacao}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Botões de Ação da Meta */}
                      <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                        {meta.tipo_apuracao === "manual" && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleAbrirDeclaratoria(meta)}
                            className="h-8 text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            Lançar Realização
                          </Button>
                        )}

                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => handleAbrirEditarMeta(meta)}
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          title="Editar Meta"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => handleExcluirMeta(meta.id, meta.descricao)}
                          disabled={isPending}
                          className="h-8 w-8 text-muted-foreground hover:text-rose-600"
                          title="Remover Meta"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Barra de Progresso Previsto vs Realizado */}
                    <div className="space-y-1.5 bg-muted/20 p-3 rounded-lg border border-border/40">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          Previsto:{" "}
                          <strong className="text-foreground">
                            {meta.quantidade_prevista.toLocaleString("pt-BR")} {meta.unidade_medida}
                          </strong>
                        </span>

                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">
                            Realizado:{" "}
                            <strong className="text-foreground font-mono">
                              {meta.quantidade_realizada.toLocaleString("pt-BR")} {meta.unidade_medida}
                            </strong>
                          </span>
                          <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-background border border-border/60">
                            {meta.percentual}%
                          </span>
                        </div>
                      </div>

                      {/* Barra visual */}
                      <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 rounded-full ${corProgresso}`}
                          style={{ width: `${Math.min(meta.percentual, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Justificativa e Anexos (se existirem na meta declaratória) */}
                    {meta.tipo_apuracao === "manual" && meta.justificativa_declarada && (
                      <div className="p-3 rounded-lg bg-muted/30 border border-border/40 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground">
                            Síntese Descritiva da Realização:
                          </span>
                          {meta.anexos_urls.length > 0 && (
                            <Badge variant="secondary" className="text-[10px] gap-1">
                              <Paperclip className="h-3 w-3" />
                              {meta.anexos_urls.length} anexo(s) probatório(s)
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground italic">
                          &ldquo;{meta.justificativa_declarada}&rdquo;
                        </p>

                        {meta.anexos_urls.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {meta.anexos_urls.map((url, idx) => (
                              <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-background border border-border/60 text-[11px] text-primary hover:underline"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Anexo #{idx + 1}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 5. Modal: Nova Meta / Editar Meta */}
      <Dialog open={modalMetaAberto} onOpenChange={setModalMetaAberto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-primary" />
              {metaEmEdicaoId ? "Editar Meta Contratual" : "Cadastrar Meta no Plano de Trabalho"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configuração oficial do indicador pactuado perante a Administração Pública.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-1 space-y-1">
                <Label className="text-xs">Número:</Label>
                <Input
                  type="number"
                  min={1}
                  value={formNumero}
                  onChange={(e) => setFormNumero(Number(e.target.value))}
                  className="h-9 text-xs font-mono"
                />
              </div>

              <div className="col-span-3 space-y-1">
                <Label className="text-xs">Descrição do Indicador:</Label>
                <Input
                  placeholder="Ex: Atendimento de Beneficiários nos Polos"
                  value={formDescricao}
                  onChange={(e) => setFormDescricao(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Unidade de Medida:</Label>
                <Input
                  placeholder="Ex: Beneficiários, %, Aulas, Polos"
                  value={formUnidade}
                  onChange={(e) => setFormUnidade(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Meta Prevista (Plano de Trabalho):</Label>
                <Input
                  type="number"
                  step="any"
                  min={0.01}
                  value={formQtdPrevista}
                  onChange={(e) => setFormQtdPrevista(Number(e.target.value))}
                  className="h-9 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Mecanismo de Apuração:</Label>
              <select
                value={formTipo}
                onChange={(e) => setFormTipo(e.target.value as TipoApuracaoMeta)}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs font-medium"
              >
                <option value="total_beneficiarios">
                  ⚙️ Total de Beneficiários / Matrículas Ativas (Automático)
                </option>
                <option value="total_locais">
                  ⚙️ Total de Polos de Atendimento Ativos (Automático)
                </option>
                <option value="frequencia_media">
                  ⚙️ Frequência Média nas Chamadas Nominais (%) (Automático)
                </option>
                <option value="sessoes_realizadas">
                  ⚙️ Aulas / Sessões Concluídas com Fotos (Automático)
                </option>
                <option value="supervisoes_realizadas">
                  ⚙️ Visitas de Supervisão Homologadas (Automático)
                </option>
                <option value="vulnerabilidade_social">
                  ⚙️ Vulnerabilidade / Cota Social (%) (Automático)
                </option>
                <option value="manual">
                  ✍️ Ações Externas / Lançamento Declaratório (Manual)
                </option>
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Fonte de Verificação Oficial:</Label>
              <Input
                placeholder="Ex: Software de Gestão e Listas de Presença Nominal"
                value={formFonte}
                onChange={(e) => setFormFonte(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalMetaAberto(false)}
              disabled={isPending}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSalvarMeta}
              disabled={isPending || !formDescricao.trim() || formQtdPrevista <= 0}
              className="text-xs gap-1.5"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {metaEmEdicaoId ? "Salvar Alterações" : "Cadastrar Meta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 6. Modal: Lançar Apuração Declaratória (Ações Externas) */}
      <Dialog open={modalDeclaratoriaAberto} onOpenChange={setModalDeclaratoriaAberto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-indigo-600" />
              Lançar Apuração Declaratória
            </DialogTitle>
            <DialogDescription className="text-xs">
              Meta {metaDeclarando?.numero_meta}: {metaDeclarando?.descricao} • Previsto:{" "}
              {metaDeclarando?.quantidade_prevista} {metaDeclarando?.unidade_medida}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label className="text-xs">
                Quantidade Realizada ({metaDeclarando?.unidade_medida}):
              </Label>
              <Input
                type="number"
                step="any"
                min={0}
                value={formQtdDeclarada}
                onChange={(e) => setFormQtdDeclarada(Number(e.target.value))}
                className="h-9 text-xs font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Síntese Descritiva da Ação Realizada:</Label>
              <Textarea
                rows={4}
                placeholder="Descreva as datas, locais, público atingido e detalhes da atividade realizada..."
                value={formJustificativa}
                onChange={(e) => setFormJustificativa(e.target.value)}
                className="text-xs resize-none"
              />
            </div>

            {/* Anexos Opcionais */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Atas e Comprovantes Suplementares (Opcional):</Label>
                <span className="text-[10px] text-muted-foreground">100% facultativo perante MROSC</span>
              </div>

              <input
                ref={anexoInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleUploadAnexo}
                disabled={uploadingAnexo}
              />

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => anexoInputRef.current?.click()}
                disabled={uploadingAnexo}
                className="w-full text-xs gap-1.5 border-dashed"
              >
                {uploadingAnexo ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <UploadCloud className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                Anexar Ata, Documento ou Foto (Opcional)
              </Button>

              {formAnexos.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {formAnexos.map((url, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded bg-muted/30 border border-border/60 text-xs"
                    >
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline truncate max-w-xs"
                      >
                        Anexo #{idx + 1}
                      </a>
                      <button
                        type="button"
                        onClick={() => setFormAnexos((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-rose-600 hover:text-rose-800 text-xs font-semibold"
                      >
                        remover
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setModalDeclaratoriaAberto(false)}
              disabled={isPending}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSalvarDeclaratoria}
              disabled={isPending || !formJustificativa.trim()}
              className="text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Registrar Realização
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
