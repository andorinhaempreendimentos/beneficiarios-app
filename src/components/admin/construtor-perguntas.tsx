"use client";

import React, { useState } from "react";
import type { PerguntaInscricaoItem } from "@/lib/actions/perguntas-inscricao";
import {
  createPerguntaInscricao,
  updatePerguntaInscricao,
  deletePerguntaInscricao,
  reordenarPerguntasInscricao,
} from "@/lib/actions/perguntas-inscricao";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import {
  Lock,
  Plus,
  Smartphone,
  ChevronUp,
  ChevronDown,
  Edit2,
  Trash2,
  HelpCircle,
  FileText,
  ListFilter,
  ToggleLeft,
  Hash,
  Calendar,
  Upload,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";

interface ConstrutorPerguntasProps {
  objetoId: string;
  objetoNome: string;
  termoBeneficiario: string;
  initialPerguntas: PerguntaInscricaoItem[];
}

interface PerguntaFormData {
  titulo: string;
  tipo:
    | "texto_curto"
    | "opcoes"
    | "sim_nao"
    | "numero"
    | "data"
    | "arquivo";
  opcoesString: string;
  obrigatorio: boolean;
  exibir_autoinscricao: boolean;
}

const initialFormState: PerguntaFormData = {
  titulo: "",
  tipo: "texto_curto",
  opcoesString: "",
  obrigatorio: false,
  exibir_autoinscricao: true,
};

const TIPOS_INFO = {
  texto_curto: { label: "Texto Curto", icon: FileText, desc: "Campo de resposta em linha única (ex: nome da escola, apelido)" },
  opcoes: { label: "Opções (Dropdown)", icon: ListFilter, desc: "Menu de múltipla escolha com opções pré-definidas" },
  sim_nao: { label: "Sim / Não", icon: ToggleLeft, desc: "Seleção binária rápida" },
  numero: { label: "Número", icon: Hash, desc: "Campo numérico (ex: tamanho de calçado, peso)" },
  data: { label: "Data", icon: Calendar, desc: "Seletor de data (ex: data do atestado médico)" },
  arquivo: { label: "Upload de Arquivo / Foto", icon: Upload, desc: "Comprovante, atestado ou documento" },
};

export function ConstrutorPerguntas({
  objetoId,
  objetoNome,
  termoBeneficiario,
  initialPerguntas,
}: ConstrutorPerguntasProps) {
  const [perguntas, setPerguntas] =
    useState<PerguntaInscricaoItem[]>(initialPerguntas);

  // Modal Criação / Edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PerguntaFormData>(initialFormState);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Modal Simulador Mobile
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false);

  // Confirmação de Exclusão
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteTargetTitulo, setDeleteTargetTitulo] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: PerguntaInscricaoItem) => {
    setEditingId(p.id);
    setFormData({
      titulo: p.titulo,
      tipo: p.tipo,
      opcoesString: p.opcoes.join(", "),
      obrigatorio: p.obrigatorio,
      exibir_autoinscricao: p.exibir_autoinscricao,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const opcoesArray =
      formData.tipo === "opcoes"
        ? formData.opcoesString
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

    if (formData.tipo === "opcoes" && opcoesArray.length === 0) {
      setFormError("Informe pelo menos 2 alternativas separadas por vírgula para perguntas com opções.");
      return;
    }

    setIsSaving(true);

    try {
      if (editingId) {
        const res = await updatePerguntaInscricao(editingId, objetoId, {
          titulo: formData.titulo,
          tipo: formData.tipo,
          opcoes: opcoesArray,
          obrigatorio: formData.obrigatorio,
          exibir_autoinscricao: formData.exibir_autoinscricao,
        });

        if (!res.success) {
          setFormError(res.error || "Erro ao atualizar pergunta");
          setIsSaving(false);
          return;
        }

        setPerguntas((prev) =>
          prev.map((p) =>
            p.id === editingId
              ? {
                  ...p,
                  titulo: formData.titulo.trim(),
                  tipo: formData.tipo,
                  opcoes: opcoesArray,
                  obrigatorio: formData.obrigatorio,
                  exibir_autoinscricao: formData.exibir_autoinscricao,
                }
              : p
          )
        );
      } else {
        const res = await createPerguntaInscricao({
          objeto_id: objetoId,
          titulo: formData.titulo,
          tipo: formData.tipo,
          opcoes: opcoesArray,
          obrigatorio: formData.obrigatorio,
          exibir_autoinscricao: formData.exibir_autoinscricao,
          ordem: perguntas.length + 1,
        });

        if (!res.success || !res.data) {
          setFormError(res.error || "Erro ao criar pergunta");
          setIsSaving(false);
          return;
        }

        const nova: PerguntaInscricaoItem = {
          id: res.data.id,
          objeto_id: res.data.objeto_id,
          titulo: res.data.titulo,
          tipo: res.data.tipo as PerguntaInscricaoItem["tipo"],
          opcoes: opcoesArray,
          obrigatorio: res.data.obrigatorio,
          exibir_autoinscricao: res.data.exibir_autoinscricao,
          ordem: res.data.ordem,
          criado_em: res.data.criado_em,
        };

        setPerguntas((prev) => [...prev, nova]);
      }

      setIsModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro inesperado ao salvar";
      setFormError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMove = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= perguntas.length) return;

    const newList = [...perguntas];
    const [moved] = newList.splice(index, 1);
    newList.splice(targetIndex, 0, moved);

    const updatedWithOrder = newList.map((item, idx) => ({
      ...item,
      ordem: idx + 1,
    }));

    setPerguntas(updatedWithOrder);
    await reordenarPerguntasInscricao(
      objetoId,
      updatedWithOrder.map((p) => p.id)
    );
  };

  const handleOpenDelete = (p: PerguntaInscricaoItem) => {
    setDeleteTargetId(p.id);
    setDeleteTargetTitulo(p.titulo);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);

    const res = await deletePerguntaInscricao(deleteTargetId, objetoId);
    if (res.success) {
      setPerguntas((prev) => prev.filter((p) => p.id !== deleteTargetId));
    }
    setIsDeleting(false);
    setDeleteConfirmOpen(false);
  };

  const perguntasPublicasMobile = perguntas.filter((p) => p.exibir_autoinscricao);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            Construtor de Formulário Híbrido (§3.3.2)
          </h2>
          <p className="text-xs text-muted-foreground">
            Personalize perguntas específicas deste convênio ({objetoNome}) sem violar o núcleo civil universal do cidadão.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMobilePreviewOpen(true)}
          >
            <Smartphone className="mr-2 h-4 w-4" /> Visualizar no Celular
          </Button>
          <Button size="sm" onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" /> Nova Pergunta
          </Button>
        </div>
      </div>

      {/* Seção 1: Campos Civis Padrão Protegidos por Lei */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-border pb-2.5">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-foreground">
              Campos Civis Padrão Protegidos por Lei (Imutáveis)
            </h3>
          </div>
          <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-300 dark:border-amber-700">
            Conformidade MROSC
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground">
          Estes campos são obrigatórios por lei federal (Lei 13.019/2014) e pelo modelo universal desacoplado. Não precisam ser recriados:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
          <div className="rounded border border-border/60 bg-muted/30 p-2.5 text-xs flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="font-medium">Nome Completo</span>
          </div>

          <div className="rounded border border-border/60 bg-muted/30 p-2.5 text-xs flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="font-medium">CPF (Único)</span>
          </div>

          <div className="rounded border border-border/60 bg-muted/30 p-2.5 text-xs flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="font-medium">Data Nascimento</span>
          </div>

          <div className="rounded border border-border/60 bg-muted/30 p-2.5 text-xs flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="font-medium">Gênero</span>
          </div>

          <div className="rounded border border-border/60 bg-muted/30 p-2.5 text-xs flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="font-medium">Telefone / Whats</span>
          </div>

          <div className="rounded border border-border/60 bg-muted/30 p-2.5 text-xs flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="font-medium">Responsável Legal</span>
          </div>
        </div>
      </div>

      {/* Seção 2: Perguntas Customizadas do Convênio */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2.5">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Perguntas Customizadas deste Convênio ({perguntas.length})
            </h3>
            <p className="text-xs text-muted-foreground">
              Respostas salvas diretamente no JSONB da matrícula específica deste projeto.
            </p>
          </div>

          <Button size="sm" variant="outline" onClick={handleOpenCreate}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Adicionar
          </Button>
        </div>

        {perguntas.length === 0 ? (
          <div className="text-center py-10 border border-dashed rounded-lg bg-muted/10">
            <HelpCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-40" />
            <h4 className="text-sm font-semibold text-foreground">
              Nenhuma pergunta personalizada adicionada
            </h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
              Deseja perguntar o tamanho do uniforme, turno escolar, contatos de emergência ou anexar atestados?
            </p>
            <Button size="sm" onClick={handleOpenCreate}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Criar Primeira Pergunta
            </Button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {perguntas.map((p, index) => {
              const infoTipo = TIPOS_INFO[p.tipo] || TIPOS_INFO.texto_curto;
              const IconeTipo = infoTipo.icon;

              return (
                <div
                  key={p.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3.5 rounded-lg border border-border bg-background gap-3 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-0.5 pt-0.5">
                      <button
                        onClick={() => handleMove(index, "up")}
                        disabled={index === 0}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                        title="Subir ordem"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <span className="text-[10px] font-mono font-bold text-muted-foreground">
                        #{index + 1}
                      </span>
                      <button
                        onClick={() => handleMove(index, "down")}
                        disabled={index === perguntas.length - 1}
                        className="text-muted-foreground hover:text-foreground disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                        title="Descer ordem"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-foreground">
                          {p.titulo}
                        </span>
                        {p.obrigatorio ? (
                          <Badge variant="destructive" className="text-[10px] py-0">
                            Obrigatória
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] py-0">
                            Opcional
                          </Badge>
                        )}
                        {p.exibir_autoinscricao ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] py-0 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          >
                            <Eye className="mr-1 h-3 w-3" /> Pública
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] py-0 text-muted-foreground">
                            <EyeOff className="mr-1 h-3 w-3" /> Triagem Interna
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <IconeTipo className="h-3.5 w-3.5 text-primary" />
                        <span>{infoTipo.label}</span>
                        {p.tipo === "opcoes" && p.opcoes.length > 0 && (
                          <span className="text-[11px] font-mono text-foreground/80">
                            [{p.opcoes.join(", ")}]
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 self-end sm:self-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleOpenEdit(p)}
                      title="Editar Pergunta"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleOpenDelete(p)}
                      title="Excluir Pergunta"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Criação / Edição de Pergunta */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Pergunta" : "Nova Pergunta da Inscrição"}
            </DialogTitle>
            <DialogDescription>
              Defina o enunciado, formato de resposta e regras de exibição.
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="titulo">
                Enunciado da Pergunta <span className="text-destructive">*</span>
              </Label>
              <Input
                id="titulo"
                required
                placeholder="Ex: Qual o tamanho do uniforme? Possui atestado médico?"
                value={formData.titulo}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, titulo: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">
                Tipo de Resposta <span className="text-destructive">*</span>
              </Label>
              <select
                id="tipo"
                value={formData.tipo}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    tipo: e.target.value as PerguntaFormData["tipo"],
                  }))
                }
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="texto_curto">Texto Curto</option>
                <option value="opcoes">Opções (Dropdown / Múltipla Escolha)</option>
                <option value="sim_nao">Sim / Não (Botões Alternáveis)</option>
                <option value="numero">Número (Apenas dígitos)</option>
                <option value="data">Data (Seletor de Calendário)</option>
                <option value="arquivo">Upload de Arquivo / Foto</option>
              </select>
              <p className="text-[11px] text-muted-foreground">
                {TIPOS_INFO[formData.tipo]?.desc}
              </p>
            </div>

            {formData.tipo === "opcoes" && (
              <div className="space-y-2 rounded-md border border-border p-3 bg-muted/20">
                <Label htmlFor="opcoesString">
                  Alternativas <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="opcoesString"
                  placeholder="Ex: P, M, G, GG, XG ou Manhã, Tarde, Noite"
                  value={formData.opcoesString}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      opcoesString: e.target.value,
                    }))
                  }
                />
                <p className="text-[11px] text-muted-foreground">
                  Separe cada alternativa com vírgula.
                </p>
              </div>
            )}

            <div className="space-y-3 pt-2 border-t border-border">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.obrigatorio}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      obrigatorio: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                />
                <span className="text-sm font-medium text-foreground">
                  Resposta Obrigatória (impede envio com campo em branco)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.exibir_autoinscricao}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      exibir_autoinscricao: e.target.checked,
                    }))
                  }
                  className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                />
                <span className="text-sm font-medium text-foreground">
                  Exibir na Autoinscrição Pública (celular da comunidade)
                </span>
              </label>
              <p className="text-[11px] text-muted-foreground pl-6">
                Se desmarcado, esta pergunta fica reservada para triagem interna da equipe no polo.
              </p>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={isSaving}>
                {isSaving
                  ? "Salvando..."
                  : editingId
                  ? "Salvar Alterações"
                  : "Criar Pergunta"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Simulador Mobile (Prévia em Tempo Real) */}
      <Dialog open={isMobilePreviewOpen} onOpenChange={setIsMobilePreviewOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-background">
          <DialogHeader className="p-4 border-b border-border">
            <DialogTitle className="flex items-center gap-2 text-sm font-semibold">
              <Smartphone className="h-4 w-4 text-primary" />
              Simulador Mobile — Experiência da Comunidade
            </DialogTitle>
            <DialogDescription className="text-xs">
              Prévia de como a família do {termoBeneficiario} verá o formulário pelo celular.
            </DialogDescription>
          </DialogHeader>

          {/* Smartphone Frame Mockup */}
          <div className="p-4 bg-muted/40 max-h-[75vh] overflow-y-auto">
            <div className="w-full max-w-[340px] mx-auto bg-card rounded-2xl border-4 border-foreground/20 shadow-xl overflow-hidden text-xs">
              {/* Smartphone Notch / Topbar */}
              <div className="bg-primary text-primary-foreground p-3 text-center">
                <div className="w-12 h-1 bg-primary-foreground/30 rounded-full mx-auto mb-2" />
                <h4 className="font-bold text-sm">{objetoNome}</h4>
                <p className="text-[11px] opacity-80">
                  Formulário de Inscrição Oficial
                </p>
              </div>

              {/* Formulário Renderizado */}
              <div className="p-4 space-y-4">
                {/* Seção Civil Fixa */}
                <div className="space-y-2">
                  <span className="font-semibold text-foreground text-[11px] block border-b pb-1">
                    1. Dados do {termoBeneficiario}
                  </span>

                  <div>
                    <span className="text-[10px] text-muted-foreground block">
                      Nome Completo *
                    </span>
                    <div className="h-7 rounded border border-input bg-background/50 px-2 flex items-center text-muted-foreground">
                      João da Silva
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">
                        CPF *
                      </span>
                      <div className="h-7 rounded border border-input bg-background/50 px-2 flex items-center text-muted-foreground font-mono">
                        123.456.789-00
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">
                        Nascimento *
                      </span>
                      <div className="h-7 rounded border border-input bg-background/50 px-2 flex items-center text-muted-foreground">
                        12/05/2012
                      </div>
                    </div>
                  </div>

                  <div className="p-2 rounded bg-amber-500/10 border border-amber-300 text-amber-800 dark:text-amber-300 text-[10px]">
                    Menor de 18 anos: Nome do responsável obrigatório.
                  </div>
                </div>

                {/* Seção Customizada do Convênio */}
                {perguntasPublicasMobile.length > 0 && (
                  <div className="space-y-3 pt-1 border-t">
                    <span className="font-semibold text-foreground text-[11px] block border-b pb-1">
                      2. Informações Complementares
                    </span>

                    {perguntasPublicasMobile.map((p) => (
                      <div key={p.id} className="space-y-1">
                        <span className="text-[10px] text-foreground font-medium block">
                          {p.titulo} {p.obrigatorio && <span className="text-destructive">*</span>}
                        </span>

                        {p.tipo === "texto_curto" && (
                          <div className="h-7 rounded border border-input bg-background px-2 flex items-center text-muted-foreground">
                            Digite sua resposta...
                          </div>
                        )}

                        {p.tipo === "opcoes" && (
                          <div className="h-7 rounded border border-input bg-background px-2 flex items-center justify-between text-muted-foreground">
                            <span>Selecione...</span>
                            <span className="text-[10px]">▼</span>
                          </div>
                        )}

                        {p.tipo === "sim_nao" && (
                          <div className="flex gap-2">
                            <div className="flex-1 h-7 rounded border border-primary bg-primary/10 text-primary font-medium flex items-center justify-center">
                              Sim
                            </div>
                            <div className="flex-1 h-7 rounded border border-input bg-background flex items-center justify-center text-muted-foreground">
                              Não
                            </div>
                          </div>
                        )}

                        {p.tipo === "numero" && (
                          <div className="h-7 rounded border border-input bg-background px-2 flex items-center text-muted-foreground font-mono">
                            0
                          </div>
                        )}

                        {p.tipo === "data" && (
                          <div className="h-7 rounded border border-input bg-background px-2 flex items-center text-muted-foreground">
                            DD/MM/AAAA
                          </div>
                        )}

                        {p.tipo === "arquivo" && (
                          <div className="h-10 rounded border border-dashed border-input bg-muted/20 flex flex-col items-center justify-center text-[10px] text-muted-foreground">
                            <Upload className="h-3 w-3 mb-0.5" />
                            Anexar foto ou arquivo
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Botão de Envio Fake */}
                <div className="pt-2">
                  <div className="w-full h-8 rounded-lg bg-primary text-primary-foreground font-semibold flex items-center justify-center text-xs shadow">
                    Confirmar Inscrição
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-muted/20 border-t flex justify-end">
            <Button size="sm" onClick={() => setIsMobilePreviewOpen(false)}>
              Fechar Prévia
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmação de Exclusão */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Excluir Pergunta da Inscrição"
        description={`Tem certeza que deseja apagar a pergunta "${deleteTargetTitulo}"? Respostas já coletadas em matrículas anteriores serão mantidas no histórico, mas novos inscritos não verão mais este campo.`}
        confirmLabel={isDeleting ? "Excluindo..." : "Excluir Definitivamente"}
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
