"use client";

import React, { useState } from "react";
import type { Database } from "@/lib/database.types";
import {
  createModalidade,
  updateModalidade,
  toggleModalidadeAtivo,
  addChecklistItem,
  removeChecklistItem,
} from "@/lib/actions/modalidades";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { EmptyState } from "@/components/admin/empty-state";
import {
  Plus,
  Search,
  Edit2,
  Power,
  Dumbbell,
  ListChecks,
  Trash2,
  AlertCircle,
} from "lucide-react";

type Modalidade = Database["public"]["Tables"]["modalidades"]["Row"] & {
  checklist_itens: Database["public"]["Tables"]["modalidade_checklist_itens"]["Row"][];
};

interface ModalidadesClientProps {
  initialModalidades: Modalidade[];
}

export function ModalidadesClient({ initialModalidades }: ModalidadesClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Modalidade | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Gestão de itens de checklist
  const [checklistModalOpen, setChecklistModalOpen] = useState(false);
  const [activeModalidade, setActiveModalidade] = useState<Modalidade | null>(null);
  const [novoItemDescricao, setNovoItemDescricao] = useState("");
  const [checklistLoading, setChecklistLoading] = useState(false);

  // Confirmação de ativação/desativação
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<Modalidade | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
    ativo: true,
  });

  function openCreateModal() {
    setEditingItem(null);
    setFormData({
      nome: "",
      descricao: "",
      ativo: true,
    });
    setErrorMsg(null);
    setModalOpen(true);
  }

  function openEditModal(item: Modalidade) {
    setEditingItem(item);
    setFormData({
      nome: item.nome,
      descricao: item.descricao ?? "",
      ativo: item.ativo,
    });
    setErrorMsg(null);
    setModalOpen(true);
  }

  function openChecklistModal(item: Modalidade) {
    setActiveModalidade(item);
    setNovoItemDescricao("");
    setChecklistModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    let res;
    if (editingItem) {
      res = await updateModalidade(editingItem.id, formData);
    } else {
      res = await createModalidade(formData);
    }

    setLoading(false);

    if (res.success) {
      setModalOpen(false);
    } else {
      setErrorMsg(res.error ?? "Ocorreu um erro ao salvar a modalidade.");
    }
  }

  async function handleAddChecklistItem(e: React.FormEvent) {
    e.preventDefault();
    if (!activeModalidade || !novoItemDescricao.trim()) return;

    setChecklistLoading(true);
    const res = await addChecklistItem(activeModalidade.id, novoItemDescricao.trim());
    setChecklistLoading(false);

    if (res.success) {
      setNovoItemDescricao("");
      // Atualiza estado local
      const updatedItem = initialModalidades.find((m) => m.id === activeModalidade.id);
      if (updatedItem) setActiveModalidade(updatedItem);
    }
  }

  async function handleRemoveChecklistItem(itemId: string) {
    await removeChecklistItem(itemId);
  }

  async function handleToggleAtivo() {
    if (!toggleTarget) return;
    await toggleModalidadeAtivo(toggleTarget.id, !toggleTarget.ativo);
    setToggleTarget(null);
  }

  const filteredItems = initialModalidades.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.nome.toLowerCase().includes(term) ||
      (item.descricao && item.descricao.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-4">
      {/* Barra de ações superiores */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar modalidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={openCreateModal} className="gap-2">
          <Plus className="h-4 w-4" />
          <span>Nova Modalidade</span>
        </Button>
      </div>

      {/* Tabela ou estado vazio */}
      {initialModalidades.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="Nenhuma prática ou modalidade esportiva cadastrada"
          description="Cadastre as modalidades do catálogo global (Futebol, Natação, Iniciação Esportiva, etc.) para vincular aos projetos."
          actionLabel="Adicionar Modalidade"
          onAction={openCreateModal}
        />
      ) : filteredItems.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          Nenhuma modalidade encontrada com o termo &quot;{searchTerm}&quot;.
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Modalidade</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Itens de Vistoria</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-medium text-foreground">{item.nome}</div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-md truncate">
                    {item.descricao || "—"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openChecklistModal(item)}
                      className="gap-1.5 h-7 text-xs"
                    >
                      <ListChecks className="h-3.5 w-3.5" />
                      <span>{item.checklist_itens?.length ?? 0} itens</span>
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.ativo ? "default" : "secondary"}>
                      {item.ativo ? "Ativa" : "Inativa"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(item)}
                        title="Editar modalidade"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setToggleTarget(item);
                          setConfirmOpen(true);
                        }}
                        title={item.ativo ? "Desativar modalidade" : "Ativar modalidade"}
                        className={
                          item.ativo
                            ? "text-muted-foreground hover:text-destructive"
                            : "text-emerald-600"
                        }
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modal de Criação / Edição */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Editar Modalidade" : "Nova Modalidade Esportiva"}
            </DialogTitle>
            <DialogDescription>
              Catálogo universal de atividades e práticas físicas do sistema.
            </DialogDescription>
          </DialogHeader>

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-lg text-sm bg-destructive/10 text-destructive border border-destructive/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mod_nome">Nome da Modalidade *</Label>
              <Input
                id="mod_nome"
                value={formData.nome}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, nome: e.target.value }))
                }
                placeholder="Ex: Futebol, Natação, Iniciação Esportiva..."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mod_descricao">Descrição / Finalidade</Label>
              <Textarea
                id="mod_descricao"
                value={formData.descricao}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, descricao: e.target.value }))
                }
                placeholder="Breve resumo sobre a modalidade, objetivos pedagógicos ou formato."
                rows={3}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : editingItem ? "Salvar Alterações" : "Criar Modalidade"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Gerenciamento do Checklist da Modalidade */}
      <Dialog open={checklistModalOpen} onOpenChange={setChecklistModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5" />
              <span>Checklist de Vistoria: {activeModalidade?.nome}</span>
            </DialogTitle>
            <DialogDescription>
              Itens padronizados que os supervisores checam obrigatoriamente durante as visitas em campo para esta modalidade.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Formulário para adicionar item */}
            <form onSubmit={handleAddChecklistItem} className="flex gap-2">
              <Input
                placeholder="Ex: Cones e coletes organizados e em bom estado"
                value={novoItemDescricao}
                onChange={(e) => setNovoItemDescricao(e.target.value)}
                required
              />
              <Button type="submit" disabled={checklistLoading} size="sm">
                Adicionar
              </Button>
            </form>

            {/* Lista dos itens atuais */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {!activeModalidade?.checklist_itens ||
              activeModalidade.checklist_itens.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  Nenhum item de vistoria cadastrado para esta modalidade.
                </p>
              ) : (
                activeModalidade.checklist_itens.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-border text-sm bg-muted/40"
                  >
                    <span>{item.descricao}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveChecklistItem(item.id)}
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      title="Remover item"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setChecklistModalOpen(false)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação de Ativação / Desativação */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={toggleTarget?.ativo ? "Desativar Modalidade" : "Ativar Modalidade"}
        description={
          toggleTarget?.ativo
            ? `Tem certeza que deseja desativar a modalidade "${toggleTarget.nome}"? Ela não poderá ser selecionada em novos grupos ou projetos.`
            : `Deseja reativar a modalidade "${toggleTarget?.nome}"?`
        }
        confirmLabel={toggleTarget?.ativo ? "Desativar" : "Ativar"}
        variant={toggleTarget?.ativo ? "destructive" : "default"}
        onConfirm={handleToggleAtivo}
      />
    </div>
  );
}
