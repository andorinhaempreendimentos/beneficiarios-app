"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  vincularModalidadeObjeto,
  desvincularModalidadeObjeto,
  toggleStatusModalidadeObjeto,
  ModalidadeVinculada,
} from "@/lib/actions/objeto-modalidades";
import { createModalidade } from "@/lib/actions/modalidades";
import {
  Activity,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Power,
  Link as LinkIcon,
} from "lucide-react";

interface CatalogoItem {
  id: string;
  nome: string;
  descricao?: string | null;
  ativo?: boolean;
}

interface ObjetoModalidadesTabProps {
  objetoId: string;
  initialVinculadas: ModalidadeVinculada[];
  catalogoModalidades: CatalogoItem[];
  termoGrupo?: string;
}

export function ObjetoModalidadesTab({
  objetoId,
  initialVinculadas,
  catalogoModalidades,
  termoGrupo = "Turma",
}: ObjetoModalidadesTabProps) {
  const [vinculadas, setVinculadas] = useState<ModalidadeVinculada[]>(initialVinculadas);
  const [catalogo, setCatalogo] = useState<CatalogoItem[]>(catalogoModalidades);

  // Seleção rápida de catálogo existente
  const [selectedModalidadeId, setSelectedModalidadeId] = useState("");
  const [isVincularLoading, setIsVincularLoading] = useState(false);

  // Drawer Lateral (Sheet) para criação inline
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [novaModalidade, setNovaModalidade] = useState({
    nome: "",
    descricao: "",
    ativo: true,
  });

  // Mensagens contextuais
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  // Lista de modalidades do catálogo ainda não vinculadas
  const disponiveis = catalogo.filter(
    (c) => !vinculadas.some((v) => v.modalidade_id === c.id)
  );

  async function handleVincularExistente(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedModalidadeId) return;

    setIsVincularLoading(true);
    setFeedback(null);

    const res = await vincularModalidadeObjeto(objetoId, selectedModalidadeId);
    setIsVincularLoading(false);

    if (res.success && res.data) {
      setVinculadas((prev) => [...prev, res.data!]);
      setSelectedModalidadeId("");
      setFeedback({
        type: "success",
        text: `Atividade "${res.data.modalidade?.nome}" vinculada ao projeto com sucesso!`,
      });
    } else {
      setFeedback({
        type: "error",
        text: res.error ?? "Erro ao vincular atividade ao projeto.",
      });
    }
  }

  async function handleDesvincular(modalidadeId: string, nome: string) {
    if (!confirm(`Deseja remover a modalidade "${nome}" deste projeto?`)) {
      return;
    }

    setFeedback(null);
    const res = await desvincularModalidadeObjeto(objetoId, modalidadeId);

    if (res.success) {
      setVinculadas((prev) => prev.filter((v) => v.modalidade_id !== modalidadeId));
      setFeedback({
        type: "success",
        text: `Modalidade "${nome}" desvinculada com sucesso.`,
      });
    } else {
      setFeedback({
        type: "error",
        text: res.error ?? "Erro ao desvincular modalidade.",
      });
    }
  }

  async function handleToggleStatus(item: ModalidadeVinculada) {
    const novoStatus = !item.ativo;
    const res = await toggleStatusModalidadeObjeto(item.id, objetoId, novoStatus);

    if (res.success) {
      setVinculadas((prev) =>
        prev.map((v) => (v.id === item.id ? { ...v, ativo: novoStatus } : v))
      );
    } else {
      setFeedback({
        type: "error",
        text: res.error ?? "Erro ao atualizar status da modalidade.",
      });
    }
  }

  async function handleCriarInline(e: React.FormEvent) {
    e.preventDefault();
    setSheetLoading(true);
    setSheetError(null);

    // 1. Cria a modalidade no catálogo geral
    const createRes = await createModalidade({
      nome: novaModalidade.nome,
      descricao: novaModalidade.descricao || null,
      ativo: novaModalidade.ativo,
    });

    if (!createRes.success || !createRes.data) {
      setSheetLoading(false);
      setSheetError(createRes.error ?? "Erro ao cadastrar modalidade.");
      return;
    }

    const recemCriada = createRes.data;

    // 2. Vincula a nova modalidade imediatamente a este projeto
    const vincularRes = await vincularModalidadeObjeto(objetoId, recemCriada.id);
    setSheetLoading(false);

    if (!vincularRes.success || !vincularRes.data) {
      setSheetError(
        vincularRes.error ?? "Modalidade criada no catálogo, mas houve erro ao vinculá-la ao projeto."
      );
      return;
    }

    // 3. Atualiza estados locais
    setCatalogo((prev) => [...prev, recemCriada]);
    setVinculadas((prev) => [...prev, vincularRes.data!]);
    setSheetOpen(false);
    setNovaModalidade({ nome: "", descricao: "", ativo: true });

    setFeedback({
      type: "success",
      text: `Nova atividade "${recemCriada.nome}" criada e vinculada com sucesso!`,
    });
  }

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

      {/* Card Principal de Gestão de Atividades */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <span>Atividades & Modalidades Vinculadas</span>
            </CardTitle>
            <CardDescription className="mt-1">
              Catálogo de práticas esportivas e atividades autorizadas para este projeto. Novas turmas ({termoGrupo}s)
              e sessões só podem ser abertas para as modalidades vinculadas aqui.
            </CardDescription>
          </div>

          <Button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="shrink-0 gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>+ Nova Modalidade</span>
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Seção de Vínculo Rápido de Modalidade Existente */}
          {disponiveis.length > 0 && (
            <form
              onSubmit={handleVincularExistente}
              className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 p-4 rounded-lg border border-dashed border-border bg-muted/20"
            >
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="vincular_select" className="text-xs font-medium">
                  Vincular Atividade do Catálogo Geral
                </Label>
                <select
                  id="vincular_select"
                  value={selectedModalidadeId}
                  onChange={(e) => setSelectedModalidadeId(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <option value="">Selecione uma modalidade já cadastrada...</option>
                  {disponiveis.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nome}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                type="submit"
                variant="secondary"
                disabled={!selectedModalidadeId || isVincularLoading}
                className="gap-2 shrink-0"
              >
                {isVincularLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LinkIcon className="h-4 w-4" />
                )}
                <span>Vincular ao Projeto</span>
              </Button>
            </form>
          )}

          {/* Listagem das Modalidades Vinculadas */}
          {vinculadas.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center rounded-lg border border-dashed border-border text-muted-foreground">
              <Activity className="h-10 w-10 stroke-1 mb-2 opacity-50" />
              <p className="text-sm font-medium">Nenhuma modalidade vinculada a este projeto.</p>
              <p className="text-xs mt-1 max-w-md">
                Selecione uma atividade existente no catálogo acima ou clique em <strong>+ Nova Modalidade</strong> para
                cadastrar uma nova atividade com o formulário lateral completo.
              </p>
            </div>
          ) : (
            <div className="rounded-md border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Atividade / Modalidade</TableHead>
                    <TableHead>Descrição / Regras</TableHead>
                    <TableHead className="w-[120px] text-center">Status no Projeto</TableHead>
                    <TableHead className="w-[100px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vinculadas.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-primary shrink-0" />
                          <span>{item.modalidade?.nome ?? "Modalidade"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-md truncate">
                        {item.modalidade?.descricao || "Sem descrição cadastrada"}
                      </TableCell>
                      <TableCell className="text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(item)}
                          title="Clique para alternar o status desta atividade no projeto"
                          className="inline-flex cursor-pointer"
                        >
                          <Badge
                            variant={item.ativo ? "default" : "secondary"}
                            className={
                              item.ativo
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                : "text-muted-foreground"
                            }
                          >
                            {item.ativo ? "Ativa" : "Inativa"}
                          </Badge>
                        </button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleToggleStatus(item)}
                            title={item.ativo ? "Desativar modalidade no projeto" : "Ativar modalidade no projeto"}
                          >
                            <Power className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() =>
                              handleDesvincular(item.modalidade_id, item.modalidade?.nome ?? "Modalidade")
                            }
                            title="Desvincular modalidade do projeto"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Painel Lateral Deslizante (Sheet) para Criação Inline Completa */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-6 z-[60]">
          <SheetHeader className="mb-4">
            <SheetTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <span>Nova Modalidade / Atividade</span>
            </SheetTitle>
            <SheetDescription>
              Cadastre a atividade no catálogo geral. Ela será vinculada automaticamente a este projeto após salvar.
            </SheetDescription>
          </SheetHeader>

          {sheetError && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive mb-4 border border-destructive/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{sheetError}</span>
            </div>
          )}

          <form onSubmit={handleCriarInline} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome_modalidade">Nome da Atividade / Modalidade *</Label>
              <Input
                id="nome_modalidade"
                value={novaModalidade.nome}
                onChange={(e) =>
                  setNovaModalidade((prev) => ({ ...prev, nome: e.target.value }))
                }
                placeholder="Ex: Natação Infantil, Futebol de Campo, Judô..."
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao_modalidade">Descrição / Regras Básicas</Label>
              <Textarea
                id="descricao_modalidade"
                value={novaModalidade.descricao}
                onChange={(e) =>
                  setNovaModalidade((prev) => ({ ...prev, descricao: e.target.value }))
                }
                placeholder="Detalhes operacionais da prática esportiva, requisitos de espaço ou público..."
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="modalidade_ativa"
                checked={novaModalidade.ativo}
                onChange={(e) =>
                  setNovaModalidade((prev) => ({ ...prev, ativo: e.target.checked }))
                }
                className="h-4 w-4 rounded border-input text-primary focus:ring-primary cursor-pointer"
              />
              <Label htmlFor="modalidade_ativa" className="text-sm font-normal cursor-pointer">
                Modalidade ativa no catálogo geral
              </Label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-border mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSheetOpen(false)}
                disabled={sheetLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={sheetLoading} className="gap-2">
                {sheetLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Salvando e Vinculando...</span>
                  </>
                ) : (
                  <span>Salvar e Vincular</span>
                )}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
