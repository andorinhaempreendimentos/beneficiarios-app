"use client";

import React, { useState, useMemo } from "react";
import type { BlocoItem } from "@/lib/actions/blocos";
import {
  createBloco,
  updateBloco,
  toggleBlocoAtivo,
  deleteBloco,
} from "@/lib/actions/blocos";
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
  Calendar,
  Clock,
  MapPin,
  Users,
  AlertCircle,
  LayoutGrid,
  List,
} from "lucide-react";

interface ObjetoSimple {
  id: string;
  nome: string;
  tipo: string;
}

interface LocalSimple {
  id: string;
  nome: string;
  objeto_id: string;
}

interface FuncionarioSimple {
  id: string;
  nome_completo: string;
  cargo: string;
}

interface GrupoSimple {
  id: string;
  nome: string;
  objeto_id: string;
  local_id: string;
}

interface BlocosClientProps {
  initialBlocos: BlocoItem[];
  objetos: ObjetoSimple[];
  locais: LocalSimple[];
  instrutores: FuncionarioSimple[];
  grupos: GrupoSimple[];
}

const DIAS_SEMANA_MAP: { id: number; label: string; short: string }[] = [
  { id: 1, label: "Segunda-feira", short: "Seg" },
  { id: 2, label: "Terça-feira", short: "Ter" },
  { id: 3, label: "Quarta-feira", short: "Qua" },
  { id: 4, label: "Quinta-feira", short: "Qui" },
  { id: 5, label: "Sexta-feira", short: "Sex" },
  { id: 6, label: "Sábado", short: "Sáb" },
  { id: 0, label: "Domingo", short: "Dom" },
];

export function BlocosClient({
  initialBlocos,
  objetos,
  locais,
  instrutores,
  grupos,
}: BlocosClientProps) {
  const [viewMode, setViewMode] = useState<"grade" | "lista">("grade");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedObjetoId, setSelectedObjetoId] = useState<string>("todos");
  const [selectedLocalId, setSelectedLocalId] = useState<string>("todos");
  const [selectedInstrutorId, setSelectedInstrutorId] = useState<string>("todos");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BlocoItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Status toggle
  const [toggleOpen, setToggleOpen] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<BlocoItem | null>(null);

  // Exclusão
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BlocoItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    nome: "",
    objeto_id: "",
    local_id: "",
    dia_semana: "1" as string | number,
    data_especifica: "",
    hora_inicio: "08:00",
    hora_fim: "09:30",
    instrutor_id: "",
    grupos_ids: [] as string[],
    ativo: true,
  });

  // Objeto atualmente selecionado no formulário
  const currentFormObjeto = useMemo(() => {
    return objetos.find((o) => o.id === formData.objeto_id);
  }, [formData.objeto_id, objetos]);

  // Locais filtrados pelo projeto no formulário
  const formLocais = useMemo(() => {
    if (!formData.objeto_id) return [];
    return locais.filter((l) => l.objeto_id === formData.objeto_id);
  }, [formData.objeto_id, locais]);

  // Turmas disponíveis para o projeto e polo no formulário
  const formGrupos = useMemo(() => {
    if (!formData.objeto_id) return [];
    return grupos.filter(
      (g) =>
        g.objeto_id === formData.objeto_id &&
        (!formData.local_id || g.local_id === formData.local_id)
    );
  }, [formData.objeto_id, formData.local_id, grupos]);

  // Locais para filtro do topo
  const filterLocais = useMemo(() => {
    if (selectedObjetoId === "todos") return locais;
    return locais.filter((l) => l.objeto_id === selectedObjetoId);
  }, [selectedObjetoId, locais]);

  function openCreateModal() {
    setEditingItem(null);
    const defaultObj = objetos.length > 0 ? objetos[0] : null;
    const defaultObjId = defaultObj ? defaultObj.id : "";
    const availableLocs = locais.filter((l) => l.objeto_id === defaultObjId);
    const defaultLocId = availableLocs.length > 0 ? availableLocs[0].id : "";

    setFormData({
      nome: "",
      objeto_id: defaultObjId,
      local_id: defaultLocId,
      dia_semana: defaultObj?.tipo === "pontual" ? "" : 1,
      data_especifica: defaultObj?.tipo === "pontual" ? new Date().toISOString().split("T")[0] : "",
      hora_inicio: "08:00",
      hora_fim: "09:30",
      instrutor_id: "",
      grupos_ids: [],
      ativo: true,
    });
    setErrorMsg(null);
    setModalOpen(true);
  }

  function openEditModal(item: BlocoItem) {
    setEditingItem(item);
    setFormData({
      nome: item.nome ?? "",
      objeto_id: item.objeto_id,
      local_id: item.local_id,
      dia_semana: item.dia_semana !== null ? item.dia_semana : "",
      data_especifica: item.data_especifica ?? "",
      hora_inicio: item.hora_inicio,
      hora_fim: item.hora_fim,
      instrutor_id: item.instrutor_id ?? "",
      grupos_ids: item.turmas.map((t) => t.id),
      ativo: item.ativo,
    });
    setErrorMsg(null);
    setModalOpen(true);
  }

  function handleObjetoChangeInForm(newObjetoId: string) {
    const obj = objetos.find((o) => o.id === newObjetoId);
    const availableLocs = locais.filter((l) => l.objeto_id === newObjetoId);
    setFormData((prev) => ({
      ...prev,
      objeto_id: newObjetoId,
      local_id: availableLocs.length > 0 ? availableLocs[0].id : "",
      dia_semana: obj?.tipo === "pontual" ? "" : 1,
      data_especifica: obj?.tipo === "pontual" ? new Date().toISOString().split("T")[0] : "",
      grupos_ids: [],
    }));
  }

  function toggleGrupoSelection(grupoId: string) {
    setFormData((prev) => {
      const exists = prev.grupos_ids.includes(grupoId);
      if (exists) {
        return {
          ...prev,
          grupos_ids: prev.grupos_ids.filter((id) => id !== grupoId),
        };
      } else {
        return {
          ...prev,
          grupos_ids: [...prev.grupos_ids, grupoId],
        };
      }
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const isPontual = currentFormObjeto?.tipo === "pontual";

    const payload = {
      nome: formData.nome ? formData.nome : null,
      objeto_id: formData.objeto_id,
      local_id: formData.local_id,
      dia_semana: !isPontual && formData.dia_semana !== "" ? Number(formData.dia_semana) : null,
      data_especifica: isPontual && formData.data_especifica ? formData.data_especifica : null,
      hora_inicio: formData.hora_inicio,
      hora_fim: formData.hora_fim,
      instrutor_id: formData.instrutor_id ? formData.instrutor_id : null,
      grupos_ids: formData.grupos_ids,
      ativo: formData.ativo,
    };

    let result;
    if (editingItem) {
      result = await updateBloco(editingItem.id, payload);
    } else {
      result = await createBloco(payload);
    }

    setLoading(false);

    if (result.success) {
      setModalOpen(false);
    } else {
      setErrorMsg(result.error ?? "Erro ao salvar bloco de horário.");
    }
  }

  function handleOpenToggle(item: BlocoItem) {
    setToggleTarget(item);
    setToggleOpen(true);
  }

  async function handleConfirmToggle() {
    if (!toggleTarget) return;
    const result = await toggleBlocoAtivo(toggleTarget.id, !toggleTarget.ativo);
    if (result.success) {
      setToggleOpen(false);
      setToggleTarget(null);
    }
  }

  function handleOpenDelete(item: BlocoItem) {
    setDeleteTarget(item);
    setDeleteError(null);
    setDeleteOpen(true);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleteError(null);

    const result = await deleteBloco(deleteTarget.id);

    if (result.success) {
      setDeleteOpen(false);
      setDeleteTarget(null);
    } else {
      setDeleteError(result.error ?? "Erro ao excluir bloco de horário.");
    }
  }

  function formatDate(d: string | null) {
    if (!d) return "—";
    const [ano, mes, dia] = d.split("T")[0].split("-");
    if (!ano || !mes || !dia) return d;
    return `${dia}/${mes}/${ano}`;
  }

  const filteredBlocos = initialBlocos.filter((b) => {
    const term = searchTerm.toLowerCase();
    const nome = (b.nome ?? "").toLowerCase();
    const polo = (b.local?.nome ?? "").toLowerCase();
    const projeto = (b.objeto?.nome ?? "").toLowerCase();
    const instrutor = (b.instrutor?.nome_completo ?? "").toLowerCase();

    const matchesSearch =
      nome.includes(term) ||
      polo.includes(term) ||
      projeto.includes(term) ||
      instrutor.includes(term);

    const matchesObjeto =
      selectedObjetoId === "todos" || b.objeto_id === selectedObjetoId;

    const matchesLocal =
      selectedLocalId === "todos" || b.local_id === selectedLocalId;

    const matchesInstrutor =
      selectedInstrutorId === "todos" || b.instrutor_id === selectedInstrutorId;

    return matchesSearch && matchesObjeto && matchesLocal && matchesInstrutor;
  });

  return (
    <div className="space-y-4">
      {/* Barra de Busca, Filtros e Ação */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por horário, instrutor, polo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>

          <div className="w-40">
            <select
              value={selectedObjetoId}
              onChange={(e) => {
                setSelectedObjetoId(e.target.value);
                setSelectedLocalId("todos");
              }}
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

          <div className="w-40">
            <select
              value={selectedLocalId}
              onChange={(e) => setSelectedLocalId(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="todos">Todos os Polos</option>
              {filterLocais.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="w-44">
            <select
              value={selectedInstrutorId}
              onChange={(e) => setSelectedInstrutorId(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="todos">Todos os Instrutores</option>
              {instrutores.map((ins) => (
                <option key={ins.id} value={ins.id}>
                  {ins.nome_completo}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center border border-border rounded-md p-0.5 bg-muted/40">
            <Button
              variant={viewMode === "grade" ? "default" : "ghost"}
              size="icon-sm"
              onClick={() => setViewMode("grade")}
              title="Visualização em Grade Semanal"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "lista" ? "default" : "ghost"}
              size="icon-sm"
              onClick={() => setViewMode("lista")}
              title="Visualização em Lista"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          <Button onClick={openCreateModal} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" />
            <span>Novo Bloco</span>
          </Button>
        </div>
      </div>

      {filteredBlocos.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Nenhum bloco de horário cadastrado"
          description={
            searchTerm || selectedObjetoId !== "todos" || selectedLocalId !== "todos" || selectedInstrutorId !== "todos"
              ? "Tente ajustar os filtros ou termo de busca."
              : "Cadastre blocos de horário para definir a agenda semanal ou cronograma de atividades dos instrutores."
          }
          actionLabel={
            !searchTerm && selectedObjetoId === "todos" && selectedLocalId === "todos" && selectedInstrutorId === "todos"
              ? "Criar Bloco de Horário"
              : undefined
          }
          onAction={
            !searchTerm && selectedObjetoId === "todos" && selectedLocalId === "todos" && selectedInstrutorId === "todos"
              ? openCreateModal
              : undefined
          }
        />
      ) : viewMode === "grade" ? (
        /* VISUALIZAÇÃO EM GRADE SEMANAL */
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {DIAS_SEMANA_MAP.map((dia) => {
            const blocosDoDia = filteredBlocos.filter((b) => b.dia_semana === dia.id);
            return (
              <div
                key={dia.id}
                className="flex flex-col rounded-lg border border-border bg-card p-3 space-y-3 min-h-[220px]"
              >
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="text-xs font-bold text-foreground">
                    {dia.label}
                  </span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {blocosDoDia.length}
                  </Badge>
                </div>

                {blocosDoDia.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-[11px] text-muted-foreground/60 italic text-center p-2">
                    Sem atividades
                  </div>
                ) : (
                  <div className="space-y-2 flex-1">
                    {blocosDoDia.map((bloco) => (
                      <div
                        key={bloco.id}
                        className="p-2.5 rounded-md border border-border bg-muted/20 hover:border-primary/50 transition-colors space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground truncate">
                            {bloco.nome ?? "Bloco"}
                          </span>
                          <span className="text-[11px] font-mono text-primary font-semibold">
                            {bloco.hora_inicio}
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{bloco.hora_inicio} — {bloco.hora_fim}</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span className="truncate">
                            {bloco.instrutor?.nome_completo ?? "Sem instrutor"}
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{bloco.local?.nome ?? "Polo"}</span>
                        </div>
                        {bloco.turmas.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {bloco.turmas.map((t) => (
                              <Badge key={t.id} variant="secondary" className="text-[9px] px-1 py-0">
                                {t.nome}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center justify-end gap-1 pt-1 border-t border-border/60">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => openEditModal(bloco)}
                            title="Editar bloco"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleOpenDelete(bloco)}
                            title="Excluir bloco"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* VISUALIZAÇÃO EM TABELA / LISTA */
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bloco de Horário</TableHead>
                <TableHead>Dia / Data</TableHead>
                <TableHead>Horário</TableHead>
                <TableHead>Polo & Projeto</TableHead>
                <TableHead>Instrutor</TableHead>
                <TableHead>Grupos Associados</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBlocos.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary shrink-0" />
                      <span>{b.nome ?? "Bloco de Horário"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {b.dia_semana !== null ? (
                      <Badge variant="outline">
                        {DIAS_SEMANA_MAP.find((d) => d.id === b.dia_semana)?.label ?? `Dia ${b.dia_semana}`}
                      </Badge>
                    ) : (
                      <span className="text-xs font-mono">{formatDate(b.data_especifica)}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs font-mono font-bold">
                    {b.hora_inicio} — {b.hora_fim}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{b.local?.nome ?? "—"}</span>
                      <span className="text-xs text-muted-foreground">{b.objeto?.nome ?? "—"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs">
                    {b.instrutor ? (
                      <span>{b.instrutor.nome_completo}</span>
                    ) : (
                      <span className="text-muted-foreground italic">Não alocado</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {b.turmas.length === 0 ? (
                      <span className="text-xs text-muted-foreground italic">Nenhum grupo</span>
                    ) : (
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {b.turmas.map((t) => (
                          <Badge key={t.id} variant="secondary" className="text-[10px]">
                            {t.nome}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={b.ativo ? "default" : "secondary"}>
                      {b.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleOpenToggle(b)}
                        title={b.ativo ? "Desativar bloco" : "Ativar bloco"}
                      >
                        <Power
                          className={`h-4 w-4 ${b.ativo ? "text-muted-foreground" : "text-green-500"}`}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEditModal(b)}
                        title="Editar bloco"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleOpenDelete(b)}
                        title="Excluir bloco"
                        className="text-destructive hover:text-destructive"
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

      {/* Modal de Criação / Edição */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Editar Bloco de Horário" : "Novo Bloco de Horário"}
              </DialogTitle>
              <DialogDescription>
                Unidade intervalar da agenda que organiza as atividades e vincula o instrutor responsável (§3.4).
              </DialogDescription>
            </DialogHeader>

            {errorMsg && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="nome">Identificação do Bloco (Opcional)</Label>
                <Input
                  id="nome"
                  placeholder="Ex: 1º Bloco Manhã, Treino Noturno, Bateria A"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="objeto_id">Projeto Social *</Label>
                <select
                  id="objeto_id"
                  required
                  value={formData.objeto_id}
                  onChange={(e) => handleObjetoChangeInForm(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="" disabled>
                    Selecione o projeto...
                  </option>
                  {objetos.map((obj) => (
                    <option key={obj.id} value={obj.id}>
                      {obj.nome} ({obj.tipo === "continuo" ? "Contínuo" : "Pontual"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="local_id">Polo / Local *</Label>
                <select
                  id="local_id"
                  required
                  value={formData.local_id}
                  onChange={(e) => setFormData({ ...formData, local_id: e.target.value })}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="" disabled>
                    Selecione o polo...
                  </option>
                  {formLocais.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.nome}
                    </option>
                  ))}
                </select>
              </div>

              {currentFormObjeto?.tipo === "pontual" ? (
                <div className="sm:col-span-2 space-y-1.5">
                  <Label htmlFor="data_especifica">Data do Evento (Projeto Pontual) *</Label>
                  <Input
                    id="data_especifica"
                    type="date"
                    required
                    value={formData.data_especifica}
                    onChange={(e) => setFormData({ ...formData, data_especifica: e.target.value })}
                  />
                </div>
              ) : (
                <div className="sm:col-span-2 space-y-1.5">
                  <Label htmlFor="dia_semana">Dia da Semana (Grade Recorrente) *</Label>
                  <select
                    id="dia_semana"
                    required
                    value={formData.dia_semana}
                    onChange={(e) => setFormData({ ...formData, dia_semana: e.target.value })}
                    className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value={1}>Segunda-feira</option>
                    <option value={2}>Terça-feira</option>
                    <option value={3}>Quarta-feira</option>
                    <option value={4}>Quinta-feira</option>
                    <option value={5}>Sexta-feira</option>
                    <option value={6}>Sábado</option>
                    <option value={0}>Domingo</option>
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="hora_inicio">Horário de Início *</Label>
                <Input
                  id="hora_inicio"
                  type="time"
                  required
                  value={formData.hora_inicio}
                  onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="hora_fim">Horário de Término *</Label>
                <Input
                  id="hora_fim"
                  type="time"
                  required
                  value={formData.hora_fim}
                  onChange={(e) => setFormData({ ...formData, hora_fim: e.target.value })}
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="instrutor_id">Instrutor de Campo Responsável</Label>
                <select
                  id="instrutor_id"
                  value={formData.instrutor_id}
                  onChange={(e) => setFormData({ ...formData, instrutor_id: e.target.value })}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Nenhum instrutor alocado</option>
                  {instrutores.map((ins) => (
                    <option key={ins.id} value={ins.id}>
                      {ins.nome_completo} ({ins.cargo})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 space-y-2 pt-1 border-t border-border">
                <Label>Grupos Atendidos neste Bloco (§3.4)</Label>
                <p className="text-xs text-muted-foreground">
                  Selecione o(s) grupo(s) que realizam atividades neste horário:
                </p>
                {formGrupos.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic p-2 border border-dashed rounded-md">
                    Nenhum grupo cadastrado neste local.
                  </p>
                ) : (
                  <div className="max-h-36 overflow-y-auto space-y-1.5 border border-border rounded-md p-2 bg-muted/20">
                    {formGrupos.map((grp) => (
                      <label
                        key={grp.id}
                        className="flex items-center gap-2 text-sm p-1.5 rounded hover:bg-muted/50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.grupos_ids.includes(grp.id)}
                          onChange={() => toggleGrupoSelection(grp.id)}
                          className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                        />
                        <span>{grp.nome}</span>
                      </label>
                    ))}
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
                {loading ? "Salvando..." : editingItem ? "Salvar Alterações" : "Criar Bloco"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Alternância de Status */}
      <ConfirmDialog
        open={toggleOpen}
        onOpenChange={setToggleOpen}
        title={toggleTarget?.ativo ? "Desativar Bloco" : "Ativar Bloco"}
        description={`Tem certeza que deseja ${toggleTarget?.ativo ? "desativar" : "ativar"} o bloco de horário "${toggleTarget?.nome ?? "selecionado"}"?`}
        confirmLabel={toggleTarget?.ativo ? "Sim, desativar" : "Sim, ativar"}
        cancelLabel="Cancelar"
        variant={toggleTarget?.ativo ? "destructive" : "default"}
        onConfirm={handleConfirmToggle}
      />

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir Bloco de Horário"
        description={
          deleteError
            ? deleteError
            : `Tem certeza que deseja excluir o bloco "${deleteTarget?.nome ?? "selecionado"}"?`
        }
        confirmLabel="Sim, excluir"
        cancelLabel="Cancelar"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
