"use client";

import React, { useState } from "react";
import {
  type PainelMetasMroscData,
  type MetaMroscItem,
  salvarObjetoMeta,
  excluirObjetoMeta,
} from "@/lib/actions/metas";
import { type TipoApuracaoMeta } from "@/lib/validations/fase-8";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Trash2,
  Loader2,
  TrendingUp,
  Sparkles,
} from "lucide-react";

interface VocabularioObjeto {
  termo_beneficiario: string;
  termo_instrutor: string;
  termo_grupo: string;
  termo_sessao: string;
  termo_bloco: string;
  termo_local: string;
  termo_materiais_coletivos: string;
  termo_materiais_concedidos: string;
}

interface ObjetoMetasTabProps {
  objetoId: string;
  initialData: PainelMetasMroscData;
  vocabulario: VocabularioObjeto;
}

export function ObjetoMetasTab({
  objetoId,
  initialData,
  vocabulario,
}: ObjetoMetasTabProps) {
  const [data, setData] = useState<PainelMetasMroscData>(initialData);
  const [modalOpen, setModalOpen] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const tBen = vocabulario.termo_beneficiario || "Aluno";
  const tLoc = vocabulario.termo_local || "Polo";
  const tSess = vocabulario.termo_sessao || "Aula";
  const tGrp = vocabulario.termo_grupo || "Turma";

  // Mapeamento dinâmico de tipos de apuração com o vocabulário do Objeto
  const tipoApuracaoOpcoes: {
    valor: TipoApuracaoMeta;
    label: string;
    unidadeSugerida: string;
    fonteSugerida: string;
  }[] = [
    {
      valor: "total_beneficiarios",
      label: `Total de ${tBen}s Atendidos (Apuração Automática)`,
      unidadeSugerida: `${tBen}s`,
      fonteSugerida: `Sistema de Gestão e Matrículas Ativas de ${tBen}s`,
    },
    {
      valor: "sessoes_realizadas",
      label: `Total de ${tSess}s Realizadas (Apuração Automática)`,
      unidadeSugerida: `${tSess}s`,
      fonteSugerida: `Registro Eletrônico de ${tSess}s e Fotos Comprobatórias`,
    },
    {
      valor: "frequencia_media",
      label: `Frequência Média nas ${tSess}s (Apuração Automática)`,
      unidadeSugerida: "%",
      fonteSugerida: `Listas de Chamada Nominal e Frequência Registrada`,
    },
    {
      valor: "total_locais",
      label: `Total de ${tLoc}s Ativos (Apuração Automática)`,
      unidadeSugerida: `${tLoc}s`,
      fonteSugerida: `Cadastro Estrutural de ${tLoc}s de Atendimento`,
    },
    {
      valor: "supervisoes_realizadas",
      label: `Vistorias de Supervisão Homologadas (Apuração Automática)`,
      unidadeSugerida: "Vistorias",
      fonteSugerida: `Relatórios de Supervisão Presencial e Pareceres Finais`,
    },
    {
      valor: "vulnerabilidade_social",
      label: `${tBen}s em Vulnerabilidade Social (Apuração Automática)`,
      unidadeSugerida: "%",
      fonteSugerida: `Critérios de Vulnerabilidade nos Formulários de Inscrição`,
    },
    {
      valor: "manual",
      label: "Ação Declaratória / Comprovação Documental Externa",
      unidadeSugerida: "Ações",
      fonteSugerida: `Relatórios Periódicos, Atas e Documentos Anexados`,
    },
  ];

  // Formulário para Nova Meta
  const proximoNumero = (data.metas?.length ?? 0) + 1;
  const [formMeta, setFormMeta] = useState({
    numero_meta: proximoNumero,
    descricao: "",
    tipo_apuracao: "total_beneficiarios" as TipoApuracaoMeta,
    quantidade_prevista: "",
    unidade_medida: `${tBen}s`,
    fonte_verificacao: `Sistema de Gestão e Matrículas Ativas de ${tBen}s`,
  });

  function handleTipoApuracaoChange(tipo: TipoApuracaoMeta) {
    const opcao = tipoApuracaoOpcoes.find((o) => o.valor === tipo);
    setFormMeta((prev) => ({
      ...prev,
      tipo_apuracao: tipo,
      unidade_medida: opcao?.unidadeSugerida || prev.unidade_medida,
      fonte_verificacao: opcao?.fonteSugerida || prev.fonte_verificacao,
    }));
  }

  function handleOpenNovaMeta() {
    const nextNum = (data.metas?.length ?? 0) + 1;
    const defaultOpcao = tipoApuracaoOpcoes[0];
    setFormMeta({
      numero_meta: nextNum,
      descricao: "",
      tipo_apuracao: defaultOpcao.valor,
      quantidade_prevista: "",
      unidade_medida: defaultOpcao.unidadeSugerida,
      fonte_verificacao: defaultOpcao.fonteSugerida,
    });
    setFormError(null);
    setModalOpen(true);
  }

  async function handleSalvarMeta(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setFormError(null);

    const qtd = Number(formMeta.quantidade_prevista);
    if (isNaN(qtd) || qtd <= 0) {
      setFormError("A quantidade prevista deve ser um número maior que zero.");
      setSalvando(false);
      return;
    }

    const res = await salvarObjetoMeta({
      objeto_id: objetoId,
      numero_meta: Number(formMeta.numero_meta),
      descricao: formMeta.descricao,
      tipo_apuracao: formMeta.tipo_apuracao,
      quantidade_prevista: qtd,
      unidade_medida: formMeta.unidade_medida,
      fonte_verificacao: formMeta.fonte_verificacao,
    });

    setSalvando(false);

    if (res.success) {
      setModalOpen(false);
      setFeedback({
        type: "success",
        text: `Meta ${formMeta.numero_meta} cadastrada com sucesso!`,
      });
      // Recarrega a página suavemente para sincronizar os cálculos automáticos do MROSC
      window.location.reload();
    } else {
      setFormError(res.error ?? "Erro ao salvar meta.");
    }
  }

  async function handleExcluirMeta(meta: MetaMroscItem) {
    if (
      !confirm(
        `Deseja realmente excluir a Meta ${meta.numero_meta} ("${meta.descricao}") deste projeto?`
      )
    ) {
      return;
    }

    const res = await excluirObjetoMeta(meta.id);
    if (res.success) {
      setFeedback({
        type: "success",
        text: `Meta ${meta.numero_meta} removida com sucesso.`,
      });
      setData((prev) => ({
        ...prev,
        metas: prev.metas.filter((m) => m.id !== meta.id),
      }));
    } else {
      setFeedback({
        type: "error",
        text: res.error ?? "Erro ao excluir meta.",
      });
    }
  }

  const { indicadores, metas } = data;

  return (
    <div className="space-y-6">
      {/* Alerta de Feedback */}
      {feedback && (
        <div
          className={`flex items-center gap-2 p-4 rounded-lg text-sm border ${
            feedback.type === "success"
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
              : "bg-destructive/10 text-destructive border-destructive/20"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Indicadores Consolidados */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total de Metas
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{indicadores.totalMetas}</div>
            <p className="text-xs text-muted-foreground mt-1">Pactuadas no Plano de Trabalho</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Metas Cumpridas
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {indicadores.metasCumpridas}
            </div>
            <p className="text-xs text-muted-foreground mt-1">100% ou mais atingidas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Em Andamento / Parciais
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {indicadores.metasParciais}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Execução entre 1% e 99%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Índice Geral de Execução
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {indicadores.indiceGeralExecucao}%
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-primary h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(indicadores.indiceGeralExecucao, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela do Quadro de Metas */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <span>Quadro de Metas do Projeto (MROSC)</span>
            </CardTitle>
            <CardDescription className="mt-1">
              Metas contratuais atreladas às entidades do sistema ({tBen}s, {tSess}s, {tLoc}s e vistorias).
              Os indicadores refletem automaticamente os dados reais gerados em campo.
            </CardDescription>
          </div>

          <Button type="button" onClick={handleOpenNovaMeta} className="shrink-0 gap-2">
            <Plus className="h-4 w-4" />
            <span>+ Adicionar Meta</span>
          </Button>
        </CardHeader>

        <CardContent>
          {metas.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center rounded-lg border border-dashed border-border text-muted-foreground">
              <Target className="h-10 w-10 stroke-1 mb-2 opacity-50" />
              <p className="text-sm font-medium">Nenhuma meta contratual cadastrada para este projeto.</p>
              <p className="text-xs mt-1 max-w-md">
                Cadastre as metas pactuadas no termo de parceria atreladas aos {tBen}s, {tSess}s ou {tLoc}s
                para acompanhar a apuração automática em tempo real.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleOpenNovaMeta}
                className="mt-4 gap-2"
              >
                <Plus className="h-4 w-4" />
                <span>Cadastrar Primeira Meta</span>
              </Button>
            </div>
          ) : (
            <div className="rounded-md border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Nº</TableHead>
                    <TableHead>Descrição da Meta</TableHead>
                    <TableHead>Tipo de Apuração</TableHead>
                    <TableHead className="w-[140px] text-right">Previsto</TableHead>
                    <TableHead className="w-[140px] text-right">Realizado</TableHead>
                    <TableHead className="w-[130px] text-center">Progresso</TableHead>
                    <TableHead className="w-[100px] text-center">Situação</TableHead>
                    <TableHead className="w-[80px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metas.map((m) => {
                    const rotulo =
                      tipoApuracaoOpcoes.find((o) => o.valor === m.tipo_apuracao)?.label ??
                      m.tipo_apuracao;

                    return (
                      <TableRow key={m.id}>
                        <TableCell className="font-bold text-foreground">
                          Meta {m.numero_meta}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-foreground">{m.descricao}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            Fonte: {m.fonte_verificacao}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            {m.tipo_apuracao !== "manual" ? (
                              <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                            ) : null}
                            <span>{rotulo}</span>
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {m.quantidade_prevista} {m.unidade_medida}
                        </TableCell>
                        <TableCell className="text-right font-bold text-foreground">
                          {m.quantidade_realizada} {m.unidade_medida}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-xs font-bold">{m.percentual}%</span>
                            <div className="w-20 bg-muted rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-1.5 rounded-full ${
                                  m.percentual >= 100
                                    ? "bg-emerald-500"
                                    : m.percentual > 0
                                    ? "bg-amber-500"
                                    : "bg-muted-foreground/30"
                                }`}
                                style={{ width: `${Math.min(m.percentual, 100)}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={
                              m.situacao === "cumprida"
                                ? "default"
                                : m.situacao === "parcial"
                                ? "secondary"
                                : "outline"
                            }
                            className={
                              m.situacao === "cumprida"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                : m.situacao === "parcial"
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                : "text-muted-foreground"
                            }
                          >
                            {m.situacao === "cumprida"
                              ? "Cumprida"
                              : m.situacao === "parcial"
                              ? "Parcial"
                              : "Pendente"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleExcluirMeta(m)}
                            title="Excluir meta do projeto"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Criação de Meta com Vocabulário Dinâmico */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <span>Adicionar Meta ao Projeto</span>
            </DialogTitle>
            <DialogDescription>
              Vincule uma meta quantitativa ao Plano de Trabalho do Objeto. As metas automáticas
              consomem os dados de {tBen}s, {tSess}s e {tLoc}s em tempo real.
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSalvarMeta} className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              <div className="space-y-1.5 col-span-1">
                <Label htmlFor="meta_num">Nº Meta *</Label>
                <Input
                  id="meta_num"
                  type="number"
                  min="1"
                  value={formMeta.numero_meta}
                  onChange={(e) =>
                    setFormMeta((prev) => ({ ...prev, numero_meta: Number(e.target.value) }))
                  }
                  required
                />
              </div>

              <div className="space-y-1.5 col-span-3">
                <Label htmlFor="meta_tipo">Tipo de Apuração (Mecanismo Canônico) *</Label>
                <select
                  id="meta_tipo"
                  value={formMeta.tipo_apuracao}
                  onChange={(e) =>
                    handleTipoApuracaoChange(e.target.value as TipoApuracaoMeta)
                  }
                  className="h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                  required
                >
                  {tipoApuracaoOpcoes.map((opcao) => (
                    <option key={opcao.valor} value={opcao.valor}>
                      {opcao.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="meta_desc">Descrição da Meta *</Label>
              <Input
                id="meta_desc"
                value={formMeta.descricao}
                onChange={(e) =>
                  setFormMeta((prev) => ({ ...prev, descricao: e.target.value }))
                }
                placeholder={`Ex: Atender 500 ${tBen}s nas escolinhas esportivas regulares`}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="meta_qtd">Quantidade Prevista *</Label>
                <Input
                  id="meta_qtd"
                  type="number"
                  step="any"
                  min="0.1"
                  value={formMeta.quantidade_prevista}
                  onChange={(e) =>
                    setFormMeta((prev) => ({ ...prev, quantidade_prevista: e.target.value }))
                  }
                  placeholder="Ex: 500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="meta_unidade">Unidade de Medida *</Label>
                <Input
                  id="meta_unidade"
                  value={formMeta.unidade_medida}
                  onChange={(e) =>
                    setFormMeta((prev) => ({ ...prev, unidade_medida: e.target.value }))
                  }
                  placeholder={`Ex: ${tBen}s, %, ${tSess}s, ${tLoc}s`}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="meta_fonte">Fonte de Verificação Oficial *</Label>
              <Textarea
                id="meta_fonte"
                value={formMeta.fonte_verificacao}
                onChange={(e) =>
                  setFormMeta((prev) => ({ ...prev, fonte_verificacao: e.target.value }))
                }
                placeholder="Ex: Software de Gestão, Listas de Presença e Registro Fotográfico"
                rows={2}
                required
              />
            </div>

            <DialogFooter className="pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                disabled={salvando}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={salvando} className="gap-2">
                {salvando ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <span>Adicionar Meta</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
