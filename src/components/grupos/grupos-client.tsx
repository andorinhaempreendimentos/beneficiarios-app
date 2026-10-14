"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import type { GrupoListItem } from "@/lib/actions/grupos";
import {
  createGrupo,
  updateGrupo,
  toggleGrupoAtivo,
  deleteGrupo,
} from "@/lib/actions/grupos";
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
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Power,
  Layers,
  MapPin,
  Trophy,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

interface ObjetoSimple {
  id: string;
  nome: string;
}

interface LocalSimple {
  id: string;
  nome: string;
  objeto_id: string;
}

interface ModalidadeSimple {
  id: string;
  nome: string;
}

interface GruposClientProps {
  initialGrupos: GrupoListItem[];
  objetos: ObjetoSimple[];
  locais: LocalSimple[];
  modalidades: ModalidadeSimple[];
}

interface FormData {
  nome: string;
  objeto_id: string;
  local_id: string;
  modalidade_id: string;
  capacidade_maxima: number;
  idade_minima: string;
  idade_maxima: string;
  ativo: boolean;
}

const initialFormState: FormData = {
  nome: "",
  objeto_id: "",
  local_id: "",
  modalidade_id: "",
  capacidade_maxima: 25,
  idade_minima: "",
  idade_maxima: "",
  ativo: true,
};

export function GruposClient({
  initialGrupos,
  objetos,
  locais,
  modalidades,
}: GruposClientProps) {
  const [grupos, setGrupos] = useState<GrupoListItem[]>(initialGrupos);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroObjeto, setFiltroObjeto] = useState("todos");
  const [filtroLocal, setFiltroLocal] = useState("todos");
  const [filtroModalidade, setFiltroModalidade] = useState("todos");
  const [filtroAtivo, setFiltroAtivo] = useState("todos");

  // Modal de Criação / Edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormState);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Confirmações
  const [toggleConfirmOpen, setToggleConfirmOpen] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<GrupoListItem | null>(null);
  const [isToggling, setIsToggling] = useState(false);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GrupoListItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Locais filtrados no form conforme o objeto selecionado
  const locaisDisponiveisForm = useMemo(() => {
    if (!formData.objeto_id) return [];
    return locais.filter((l) => l.objeto_id === formData.objeto_id);
  }, [formData.objeto_id, locais]);

  // Locais para filtro na listagem
  const locaisParaFiltro = useMemo(() => {
    if (filtroObjeto === "todos") return locais;
    return locais.filter((l) => l.objeto_id === filtroObjeto);
  }, [filtroObjeto, locais]);

  const handleOpenCreate = () => {
    setEditingId(null);
    const primeiroObjeto = objetos.length > 0 ? objetos[0].id : "";
    const primeiroLocal =
      locais.find((l) => l.objeto_id === primeiroObjeto)?.id || "";

    setFormData({
      ...initialFormState,
      objeto_id: primeiroObjeto,
      local_id: primeiroLocal,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (grupo: GrupoListItem) => {
    setEditingId(grupo.id);
    setFormData({
      nome: grupo.nome,
      objeto_id: grupo.objeto_id,
      local_id: grupo.local_id,
      modalidade_id: grupo.modalidade_id || "",
      capacidade_maxima: grupo.capacidade_maxima,
      idade_minima:
        grupo.idade_minima !== null ? String(grupo.idade_minima) : "",
      idade_maxima:
        grupo.idade_maxima !== null ? String(grupo.idade_maxima) : "",
      ativo: grupo.ativo,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleObjetoChange = (objetoId: string) => {
    const locaisDoObjeto = locais.filter((l) => l.objeto_id === objetoId);
    setFormData((prev) => ({
      ...prev,
      objeto_id: objetoId,
      local_id: locaisDoObjeto.length > 0 ? locaisDoObjeto[0].id : "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSaving(true);

    try {
      const payload = {
        nome: formData.nome.trim(),
        objeto_id: formData.objeto_id,
        local_id: formData.local_id,
        modalidade_id: formData.modalidade_id ? formData.modalidade_id : null,
        capacidade_maxima: Number(formData.capacidade_maxima),
        idade_minima: formData.idade_minima
          ? Number(formData.idade_minima)
          : null,
        idade_maxima: formData.idade_maxima
          ? Number(formData.idade_maxima)
          : null,
        ativo: formData.ativo,
      };

      if (editingId) {
        const res = await updateGrupo(editingId, payload);
        if (!res.success) {
          setFormError(res.error || "Erro ao atualizar grupo");
          setIsSaving(false);
          return;
        }

        const objetoSel = objetos.find((o) => o.id === payload.objeto_id);
        const localSel = locais.find((l) => l.id === payload.local_id);
        const modSel = modalidades.find((m) => m.id === payload.modalidade_id);

        setGrupos((prev) =>
          prev.map((g) =>
            g.id === editingId
              ? {
                  ...g,
                  ...payload,
                  objeto: objetoSel
                    ? {
                        id: objetoSel.id,
                        nome: objetoSel.nome,
                        termo_grupo: g.objeto?.termo_grupo || "Grupo",
                      }
                    : g.objeto,
                  local: localSel
                    ? {
                        id: localSel.id,
                        nome: localSel.nome,
                        regiao: g.local?.regiao || null,
                      }
                    : g.local,
                  modalidade: modSel
                    ? { id: modSel.id, nome: modSel.nome }
                    : null,
                }
              : g
          )
        );
      } else {
        const res = await createGrupo(payload);
        if (!res.success || !res.data) {
          setFormError(res.error || "Erro ao criar grupo");
          setIsSaving(false);
          return;
        }

        const objetoSel = objetos.find((o) => o.id === payload.objeto_id);
        const localSel = locais.find((l) => l.id === payload.local_id);
        const modSel = modalidades.find((m) => m.id === payload.modalidade_id);

        const novo: GrupoListItem = {
          id: res.data.id,
          nome: res.data.nome,
          objeto_id: res.data.objeto_id,
          local_id: res.data.local_id,
          modalidade_id: res.data.modalidade_id,
          capacidade_maxima: res.data.capacidade_maxima,
          idade_minima: res.data.idade_minima,
          idade_maxima: res.data.idade_maxima,
          ativo: res.data.ativo,
          criado_em: res.data.criado_em,
          atualizado_em: res.data.atualizado_em,
          objeto: objetoSel
            ? {
                id: objetoSel.id,
                nome: objetoSel.nome,
                termo_grupo: "Grupo",
              }
            : null,
          local: localSel
            ? {
                id: localSel.id,
                nome: localSel.nome,
                regiao: null,
              }
            : null,
          modalidade: modSel ? { id: modSel.id, nome: modSel.nome } : null,
          vagas_ocupadas: 0,
          lista_espera_qtd: 0,
          pre_inscritos_qtd: 0,
        };

        setGrupos((prev) => [novo, ...prev]);
      }

      setIsModalOpen(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erro inesperado ao salvar";
      setFormError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenToggle = (grupo: GrupoListItem) => {
    setToggleTarget(grupo);
    setToggleConfirmOpen(true);
  };

  const handleConfirmToggle = async () => {
    if (!toggleTarget) return;
    setIsToggling(true);
    const novoStatus = !toggleTarget.ativo;
    const res = await toggleGrupoAtivo(toggleTarget.id, novoStatus);

    if (res.success) {
      setGrupos((prev) =>
        prev.map((g) =>
          g.id === toggleTarget.id ? { ...g, ativo: novoStatus } : g
        )
      );
    }
    setIsToggling(false);
    setToggleConfirmOpen(false);
  };

  const handleOpenDelete = (grupo: GrupoListItem) => {
    setDeleteTarget(grupo);
    setDeleteError(null);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);

    const res = await deleteGrupo(deleteTarget.id);
    if (!res.success) {
      setDeleteError(res.error || "Erro ao excluir grupo");
      setIsDeleting(false);
      return;
    }

    setGrupos((prev) => prev.filter((g) => g.id !== deleteTarget.id));
    setIsDeleting(false);
    setDeleteConfirmOpen(false);
  };

  const filteredGrupos = useMemo(() => {
    return grupos.filter((g) => {
      const term = searchTerm.toLowerCase().trim();
      const nome = g.nome.toLowerCase();
      const local = g.local?.nome ? g.local.nome.toLowerCase() : "";
      const mod = g.modalidade?.nome ? g.modalidade.nome.toLowerCase() : "";

      const matchTerm =
        !term ||
        nome.includes(term) ||
        local.includes(term) ||
        mod.includes(term);

      const matchObjeto =
        filtroObjeto === "todos" || g.objeto_id === filtroObjeto;
      const matchLocal = filtroLocal === "todos" || g.local_id === filtroLocal;
      const matchMod =
        filtroModalidade === "todos" || g.modalidade_id === filtroModalidade;
      const matchAtivo =
        filtroAtivo === "todos" ||
        (filtroAtivo === "ativo" ? g.ativo : !g.ativo);

      return matchTerm && matchObjeto && matchLocal && matchMod && matchAtivo;
    });
  }, [
    grupos,
    searchTerm,
    filtroObjeto,
    filtroLocal,
    filtroModalidade,
    filtroAtivo,
  ]);

  return (
    <div className="space-y-6">
      {/* Barra de Filtros e Ações */}
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, local, modalidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <select
            value={filtroObjeto}
            onChange={(e) => {
              setFiltroObjeto(e.target.value);
              setFiltroLocal("todos");
            }}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="todos">Todos os Projetos</option>
            {objetos.map((obj) => (
              <option key={obj.id} value={obj.id}>
                {obj.nome}
              </option>
            ))}
          </select>

          <select
            value={filtroLocal}
            onChange={(e) => setFiltroLocal(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="todos">Todos os Locais</option>
            {locaisParaFiltro.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.nome}
              </option>
            ))}
          </select>

          <select
            value={filtroModalidade}
            onChange={(e) => setFiltroModalidade(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="todos">Todas as Modalidades</option>
            {modalidades.map((mod) => (
              <option key={mod.id} value={mod.id}>
                {mod.nome}
              </option>
            ))}
          </select>

          <select
            value={filtroAtivo}
            onChange={(e) => setFiltroAtivo(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="todos">Status (Todos)</option>
            <option value="ativo">Ativos</option>
            <option value="inativo">Inativos</option>
          </select>
        </div>

        <Button onClick={handleOpenCreate} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" /> Novo Grupo
        </Button>
      </div>

      {/* Tabela de Grupos */}
      <div className="rounded-lg border border-border bg-card">
        {filteredGrupos.length === 0 ? (
          <EmptyState
            title="Nenhum grupo encontrado"
            description={
              searchTerm ||
              filtroObjeto !== "todos" ||
              filtroLocal !== "todos" ||
              filtroModalidade !== "todos"
                ? "Não foram encontrados grupos com os filtros aplicados."
                : "Cadastre grupos para organizar os horários, delimitar faixas etárias e controlar vagas de atendimento."
            }
            actionLabel="Criar Novo Grupo"
            onAction={handleOpenCreate}
            icon={Layers}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Grupo</TableHead>
                <TableHead>Projeto & Local</TableHead>
                <TableHead>Modalidade</TableHead>
                <TableHead>Faixa Etária</TableHead>
                <TableHead>Vagas & Lotação</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGrupos.map((g) => {
                const percentual = Math.min(
                  100,
                  Math.round((g.vagas_ocupadas / g.capacidade_maxima) * 100)
                );
                const lotado = g.vagas_ocupadas >= g.capacidade_maxima;

                return (
                  <TableRow key={g.id}>
                    <TableCell>
                      <Link
                        href={`/grupos/${g.id}`}
                        className="font-medium text-foreground hover:underline flex items-center gap-1.5"
                      >
                        {g.nome}
                        <ExternalLink className="h-3 w-3 opacity-40" />
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {g.objeto?.termo_grupo || "Grupo"}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-sm font-medium">
                        {g.objeto?.nome}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <MapPin className="h-3 w-3" />
                        <span>{g.local?.nome}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      {g.modalidade ? (
                        <div className="flex items-center gap-1.5 text-sm">
                          <Trophy className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{g.modalidade.nome}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Multimodal / Livre
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      {g.idade_minima !== null || g.idade_maxima !== null ? (
                        <span className="text-sm">
                          {g.idade_minima !== null && g.idade_maxima !== null
                            ? `${g.idade_minima} a ${g.idade_maxima} anos`
                            : g.idade_minima !== null
                            ? `A partir de ${g.idade_minima} anos`
                            : `Até ${g.idade_maxima} anos`}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Livre (sem restrição)
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">
                          {g.vagas_ocupadas} / {g.capacidade_maxima}
                        </span>
                        {lotado ? (
                          <Badge
                            variant="destructive"
                            className="text-[10px] py-0"
                          >
                            Lotado
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            ({percentual}%)
                          </span>
                        )}
                      </div>

                      {g.lista_espera_qtd > 0 && (
                        <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                          Fila de espera: {g.lista_espera_qtd}
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={g.ativo ? "default" : "secondary"}
                        className={
                          g.ativo
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            : ""
                        }
                      >
                        {g.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/grupos/${g.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Ver Detalhes do Grupo"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleOpenEdit(g)}
                          title="Editar Grupo"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 ${
                            g.ativo ? "text-amber-600" : "text-emerald-600"
                          }`}
                          onClick={() => handleOpenToggle(g)}
                          title={g.ativo ? "Desativar Grupo" : "Ativar Grupo"}
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleOpenDelete(g)}
                          title="Excluir Grupo"
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
        )}
      </div>

      {/* Modal de Criação / Edição */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Grupo" : "Novo Grupo"}
            </DialogTitle>
            <DialogDescription>
              Preencha os parâmetros de capacidade, faixa etária e vínculo
              territorial.
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="nome">
                  Nome do Grupo <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nome"
                  required
                  placeholder="Ex: Grupo A - Sub-11, Pelotão Geral 10k, Chave Prata"
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, nome: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="objeto_id">
                  Projeto / Objeto <span className="text-destructive">*</span>
                </Label>
                <select
                  id="objeto_id"
                  required
                  value={formData.objeto_id}
                  onChange={(e) => handleObjetoChange(e.target.value)}
                  disabled={Boolean(editingId)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {objetos.map((obj) => (
                    <option key={obj.id} value={obj.id}>
                      {obj.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="local_id">
                  Local / Polo de Atendimento{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <select
                  id="local_id"
                  required
                  value={formData.local_id}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      local_id: e.target.value,
                    }))
                  }
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {locaisDisponiveisForm.length === 0 ? (
                    <option value="">Nenhum local cadastrado</option>
                  ) : (
                    locaisDisponiveisForm.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.nome}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="modalidade_id">Modalidade Esportiva</Label>
                <select
                  id="modalidade_id"
                  value={formData.modalidade_id}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      modalidade_id: e.target.value,
                    }))
                  }
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Livre / Multimodal</option>
                  {modalidades.map((mod) => (
                    <option key={mod.id} value={mod.id}>
                      {mod.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacidade_maxima">
                  Capacidade Máxima de Vagas{" "}
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="capacidade_maxima"
                  type="number"
                  min="1"
                  required
                  value={formData.capacidade_maxima}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      capacidade_maxima: Number(e.target.value),
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="idade_minima">Idade Mínima (anos)</Label>
                <Input
                  id="idade_minima"
                  type="number"
                  min="0"
                  placeholder="Opcional"
                  value={formData.idade_minima}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      idade_minima: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="idade_maxima">Idade Máxima (anos)</Label>
                <Input
                  id="idade_maxima"
                  type="number"
                  min="0"
                  placeholder="Opcional"
                  value={formData.idade_maxima}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      idade_maxima: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving
                  ? "Salvando..."
                  : editingId
                  ? "Salvar Alterações"
                  : "Criar Grupo"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmação de Toggle Ativo/Inativo */}
      <ConfirmDialog
        open={toggleConfirmOpen}
        onOpenChange={setToggleConfirmOpen}
        title={toggleTarget?.ativo ? "Desativar Grupo" : "Ativar Grupo"}
        description={`Tem certeza que deseja ${
          toggleTarget?.ativo ? "desativar" : "ativar"
        } o grupo "${toggleTarget?.nome}"? Grupos inativos não recebem novas inscrições.`}
        confirmLabel={
          isToggling
            ? "Processando..."
            : toggleTarget?.ativo
            ? "Desativar"
            : "Ativar"
        }
        variant={toggleTarget?.ativo ? "destructive" : "default"}
        onConfirm={handleConfirmToggle}
      />

      {/* Confirmação de Exclusão */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Excluir Grupo"
        description={`Tem certeza que deseja excluir o grupo "${deleteTarget?.nome}"? Essa ação não pode ser desfeita.`}
        confirmLabel={isDeleting ? "Excluindo..." : "Excluir Definitivamente"}
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
      {deleteError && (
        <Dialog
          open={Boolean(deleteError)}
          onOpenChange={() => setDeleteError(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Não foi possível excluir
              </DialogTitle>
              <DialogDescription className="pt-2 text-foreground font-normal">
                {deleteError}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => setDeleteError(null)}>Entendi</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
