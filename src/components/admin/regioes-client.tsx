"use client";

import React, { useState } from "react";
import type { Database } from "@/lib/database.types";
import {
  createRegiao,
  updateRegiao,
  deleteRegiao,
} from "@/lib/actions/regioes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Search, Edit2, Trash2, Compass, AlertCircle } from "lucide-react";

type RegiaoRow = Database["public"]["Tables"]["regioes"]["Row"];
type ObjetoSimple = Pick<Database["public"]["Tables"]["objetos"]["Row"], "id" | "nome">;

export interface CoordenadorSimple {
  id: string;
  nome_completo: string | null;
  papel: string;
}

export interface LocalSimple {
  id: string;
  nome: string;
  objeto_id: string;
  regiao_id?: string | null;
}

export type RegiaoItem = RegiaoRow & {
  objeto: ObjetoSimple | null;
  coordenador: CoordenadorSimple | null;
  locais: { id: string; nome: string }[];
};

interface RegioesClientProps {
  initialRegioes: RegiaoItem[];
  objetos: ObjetoSimple[];
  coordenadores: CoordenadorSimple[];
  locais: LocalSimple[];
}

export function RegioesClient({
  initialRegioes,
  objetos,
  coordenadores,
  locais,
}: RegioesClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedObjetoId, setSelectedObjetoId] = useState<string>("todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RegiaoItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Exclusão
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RegiaoItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<{
    nome: string;
    objeto_id: string;
    coordenador_id: string;
    locais_ids: string[];
  }>({
    nome: "",
    objeto_id: "",
    coordenador_id: "",
    locais_ids: [],
  });

  // Polos disponíveis filtrados pelo objeto do formulário
  const availableLocaisDoObjeto = React.useMemo(() => {
    if (!formData.objeto_id) return [];
    return locais.filter((l) => l.objeto_id === formData.objeto_id);
  }, [formData.objeto_id, locais]);

  function openCreateModal() {
    setEditingItem(null);
    setFormData({
      nome: "",
      objeto_id: objetos.length > 0 ? objetos[0].id : "",
      coordenador_id: "",
      locais_ids: [],
    });
    setErrorMsg(null);
    setModalOpen(true);
  }

  function openEditModal(item: RegiaoItem) {
    setEditingItem(item);
    setFormData({
      nome: item.nome,
      objeto_id: item.objeto_id,
      coordenador_id: item.coordenador_id ?? "",
      locais_ids: (item.locais ?? []).map((l) => l.id),
    });
    setErrorMsg(null);
    setModalOpen(true);
  }

  function handleToggleLocal(localId: string) {
    setFormData((prev) => {
      const exists = prev.locais_ids.includes(localId);
      return {
        ...prev,
        locais_ids: exists
          ? prev.locais_ids.filter((id) => id !== localId)
          : [...prev.locais_ids, localId],
      };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const payload = {
      nome: formData.nome,
      objeto_id: formData.objeto_id,
      coordenador_id: formData.coordenador_id ? formData.coordenador_id : null,
      locais_ids: formData.locais_ids,
    };

    let result;
    if (editingItem) {
      result = await updateRegiao(editingItem.id, payload);
    } else {
      result = await createRegiao(payload);
    }

    setLoading(false);

    if (result.success) {
      setModalOpen(false);
    } else {
      setErrorMsg(result.error ?? "Erro ao salvar região.");
    }
  }

  function handleOpenDelete(item: RegiaoItem) {
    setDeleteTarget(item);
    setDeleteError(null);
    setDeleteOpen(true);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleteError(null);

    const result = await deleteRegiao(deleteTarget.id);

    if (result.success) {
      setDeleteOpen(false);
      setDeleteTarget(null);
    } else {
      setDeleteError(result.error ?? "Erro ao excluir região.");
    }
  }

  const filteredRegioes = initialRegioes.filter((reg) => {
    const nomeRegiao = reg.nome ? reg.nome.toLowerCase() : "";
    const nomeObjeto = reg.objeto?.nome ? reg.objeto.nome.toLowerCase() : "";
    const nomeCoordenador = reg.coordenador?.nome_completo ? reg.coordenador.nome_completo.toLowerCase() : "";
    const term = searchTerm.toLowerCase();

    const matchesSearch =
      nomeRegiao.includes(term) ||
      nomeObjeto.includes(term) ||
      nomeCoordenador.includes(term);

    const matchesObjeto =
      selectedObjetoId === "todos" || reg.objeto_id === selectedObjetoId;

    return matchesSearch && matchesObjeto;
  });

  return (
    <div className="space-y-4">
      {/* Barra de Busca, Filtro e Ação */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, projeto ou coordenador..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>

          <div className="w-full sm:w-60">
            <select
              value={selectedObjetoId}
              onChange={(e) => setSelectedObjetoId(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="todos">Todos os Projetos</option>
              {objetos.map((obj) => (
                <option key={obj.id} value={obj.id}>
                  {obj.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Button onClick={openCreateModal} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          <span>Nova Região</span>
        </Button>
      </div>

      {/* Tabela de Regiões */}
      {filteredRegioes.length === 0 ? (
        <EmptyState
          icon={Compass}
          title="Nenhuma região territorial encontrada"
          description={
            searchTerm || selectedObjetoId !== "todos"
              ? "Tente ajustar os filtros ou termo de busca."
              : "Cadastre regiões para descentralizar os polos físicos de atendimento sob coordenadores responsáveis."
          }
          actionLabel={!searchTerm && selectedObjetoId === "todos" ? "Criar Região" : undefined}
          onAction={!searchTerm && selectedObjetoId === "todos" ? openCreateModal : undefined}
        />
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Região</TableHead>
                <TableHead>Projeto Vinculado</TableHead>
                <TableHead>Coordenador Titular</TableHead>
                <TableHead>Polos Vinculados</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRegioes.map((reg) => {
                const qtdPolos = reg.locais?.length ?? 0;
                return (
                  <TableRow key={reg.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Compass className="h-4 w-4 text-primary shrink-0" />
                        <span>{reg.nome}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {reg.objeto?.nome ?? "Projeto não informado"}
                    </TableCell>
                    <TableCell>
                      {reg.coordenador ? (
                        <div>
                          <div className="text-sm font-medium">{reg.coordenador.nome_completo ?? "Coordenador"}</div>
                          <div className="text-xs text-muted-foreground capitalize">
                            Papel: {reg.coordenador.papel.replace("_", " ")}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          Sem coordenador atribuído
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {qtdPolos > 0 ? (
                        <div className="space-y-1">
                          <Badge variant="outline" className="font-semibold text-xs">
                            {qtdPolos} {qtdPolos === 1 ? "polo" : "polos"}
                          </Badge>
                          <div className="text-xs text-muted-foreground flex flex-wrap gap-1 max-w-xs">
                            {reg.locais.map((loc) => (
                              <span
                                key={loc.id}
                                className="inline-block bg-muted/70 border border-border/50 px-1.5 py-0.5 rounded text-[11px]"
                              >
                                {loc.nome}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          Nenhum polo atribuído
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEditModal(reg)}
                          title="Editar região"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleOpenDelete(reg)}
                          title="Excluir região"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modal de Criação / Edição */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Editar Região Territorial" : "Nova Região Territorial"}
              </DialogTitle>
              <DialogDescription>
                Regra Canônica §3.2: Cada região territorial organiza os polos físicos e vincula um Coordenador responsável.
              </DialogDescription>
            </DialogHeader>

            {errorMsg && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="nome">Nome da Região *</Label>
                <Input
                  id="nome"
                  required
                  placeholder="Ex: Zona Norte, Polo Central, Região Metropolitana"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="objeto_id">Projeto Social (Objeto) *</Label>
                <select
                  id="objeto_id"
                  required
                  value={formData.objeto_id}
                  onChange={(e) => {
                    const newObjId = e.target.value;
                    setFormData({
                      ...formData,
                      objeto_id: newObjId,
                      locais_ids: [],
                    });
                  }}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="" disabled>
                    Selecione o projeto...
                  </option>
                  {objetos.map((obj) => (
                    <option key={obj.id} value={obj.id}>
                      {obj.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="coordenador_id">Coordenador Titular Responsável</Label>
                <select
                  id="coordenador_id"
                  value={formData.coordenador_id}
                  onChange={(e) => setFormData({ ...formData, coordenador_id: e.target.value })}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Nenhum coordenador atribuído no momento</option>
                  {coordenadores.map((coord) => (
                    <option key={coord.id} value={coord.id}>
                      {coord.nome_completo ?? "Usuário"} ({coord.papel.replace("_", " ")})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  O coordenador titular acompanha os relatórios, valida vistorias e fecha prestações de contas da região.
                </p>
              </div>

              {/* Seção de Atribuição de Polos Físicos */}
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <Label>Polos Físicos desta Região</Label>
                  <span className="text-xs text-muted-foreground">
                    {formData.locais_ids.length} selecionado(s)
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Selecione quais polos físicos pertencem a esta área geográfica (§3.2). Polos sem região atribuída também podem ser vinculados aqui.
                </p>

                {availableLocaisDoObjeto.length === 0 ? (
                  <div className="p-3 text-center border border-dashed rounded-md bg-muted/30 text-xs text-muted-foreground">
                    Nenhum polo cadastrado para o projeto selecionado. Você poderá cadastrar polos em Polos / Locais e associá-los depois.
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 rounded-md border border-border bg-muted/10">
                    {availableLocaisDoObjeto.map((loc) => {
                      const isChecked = formData.locais_ids.includes(loc.id);
                      const isOtherRegiao =
                        loc.regiao_id &&
                        loc.regiao_id !== editingItem?.id &&
                        loc.regiao_id !== "";
                      const outraRegiaoNome = isOtherRegiao
                        ? initialRegioes.find((r) => r.id === loc.regiao_id)?.nome
                        : null;

                      return (
                        <label
                          key={loc.id}
                          className={`flex items-start gap-2.5 p-2 rounded-md cursor-pointer transition-colors text-sm hover:bg-accent/50 ${
                            isChecked ? "bg-accent/30 font-medium" : ""
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleLocal(loc.id)}
                            className="mt-0.5 h-4 w-4 rounded border-input text-primary focus:ring-primary"
                          />
                          <div className="flex-1 text-xs">
                            <span className="text-foreground">{loc.nome}</span>
                            {isOtherRegiao && (
                              <span className="block text-[11px] text-amber-600 dark:text-amber-400">
                                (Atualmente na região: {outraRegiaoNome ?? "Outra"})
                              </span>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Salvando..." : editingItem ? "Salvar Alterações" : "Criar Região"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir Região Territorial"
        description={
          deleteError
            ? deleteError
            : `Tem certeza que deseja excluir a região "${deleteTarget?.nome}"? Esta operação é irreversível.`
        }
        confirmLabel="Sim, excluir"
        cancelLabel="Cancelar"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
