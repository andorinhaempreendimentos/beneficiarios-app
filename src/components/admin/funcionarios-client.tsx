"use client";

import React, { useState, useMemo } from "react";
import type { Database } from "@/lib/database.types";
import {
  createFuncionario,
  updateFuncionario,
  deleteFuncionario,
} from "@/lib/actions/funcionarios";
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
  Users,
  MapPin,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

type FuncionarioRow = Database["public"]["Tables"]["funcionarios"]["Row"];
type ObjetoSimple = Pick<Database["public"]["Tables"]["objetos"]["Row"], "id" | "nome">;
type OrganizacaoSimple = Pick<
  Database["public"]["Tables"]["organizacoes"]["Row"],
  "id" | "razao_social" | "nome_fantasia"
>;
type LocalSimple = Pick<
  Database["public"]["Tables"]["locais"]["Row"],
  "id" | "nome" | "objeto_id"
>;

interface UsuarioVinculo {
  id: string;
  nome_completo: string | null;
  papel: string;
}

export type FuncionarioItem = FuncionarioRow & {
  objeto: ObjetoSimple | null;
  organizacao: OrganizacaoSimple | null;
  local: Pick<LocalSimple, "id" | "nome"> | null;
  usuario: UsuarioVinculo | null;
};

interface FuncionariosClientProps {
  initialFuncionarios: FuncionarioItem[];
  objetos: ObjetoSimple[];
  organizacoes: OrganizacaoSimple[];
  locais: LocalSimple[];
  usuarios: UsuarioVinculo[];
}

export function FuncionariosClient({
  initialFuncionarios,
  objetos,
  organizacoes,
  locais,
  usuarios,
}: FuncionariosClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedObjetoId, setSelectedObjetoId] = useState<string>("todos");
  const [selectedLocalId, setSelectedLocalId] = useState<string>("todos");
  const [selectedSituacao, setSelectedSituacao] = useState<string>("todos");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FuncionarioItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Exclusão
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FuncionarioItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    nome_completo: "",
    cpf: "",
    cargo: "",
    objeto_id: "",
    organizacao_id: "",
    local_id: "",
    email: "",
    telefone: "",
    data_admissao: "",
    data_desligamento: "",
    carga_horaria_semanal: 40,
    situacao: "ativo" as "ativo" | "afastado" | "desligado",
    usuario_id: "",
  });

  // Locais filtrados para o formulário
  const formLocais = useMemo(() => {
    if (!formData.objeto_id) return [];
    return locais.filter((l) => l.objeto_id === formData.objeto_id);
  }, [formData.objeto_id, locais]);

  // Locais filtrados para a busca no topo
  const filterLocais = useMemo(() => {
    if (selectedObjetoId === "todos") return locais;
    return locais.filter((l) => l.objeto_id === selectedObjetoId);
  }, [selectedObjetoId, locais]);

  function openCreateModal() {
    setEditingItem(null);
    const defaultObjId = objetos.length > 0 ? objetos[0].id : "";
    const defaultOrgId = organizacoes.length > 0 ? organizacoes[0].id : "";
    const availableLocs = locais.filter((l) => l.objeto_id === defaultObjId);

    setFormData({
      nome_completo: "",
      cpf: "",
      cargo: "",
      objeto_id: defaultObjId,
      organizacao_id: defaultOrgId,
      local_id: availableLocs.length > 0 ? availableLocs[0].id : "",
      email: "",
      telefone: "",
      data_admissao: new Date().toISOString().split("T")[0],
      data_desligamento: "",
      carga_horaria_semanal: 40,
      situacao: "ativo",
      usuario_id: "",
    });
    setErrorMsg(null);
    setModalOpen(true);
  }

  function openEditModal(item: FuncionarioItem) {
    setEditingItem(item);
    setFormData({
      nome_completo: item.nome_completo,
      cpf: item.cpf,
      cargo: item.cargo,
      objeto_id: item.objeto_id,
      organizacao_id: item.organizacao_id,
      local_id: item.local_id ?? "",
      email: item.email ?? "",
      telefone: item.telefone ?? "",
      data_admissao: item.data_admissao ?? "",
      data_desligamento: item.data_desligamento ?? "",
      carga_horaria_semanal: item.carga_horaria_semanal ?? 40,
      situacao: (item.situacao as "ativo" | "afastado" | "desligado") ?? "ativo",
      usuario_id: item.usuario_id ?? "",
    });
    setErrorMsg(null);
    setModalOpen(true);
  }

  function handleObjetoChangeInForm(newObjetoId: string) {
    const availableLocs = locais.filter((l) => l.objeto_id === newObjetoId);
    setFormData((prev) => ({
      ...prev,
      objeto_id: newObjetoId,
      local_id: availableLocs.length > 0 ? availableLocs[0].id : "",
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const payload = {
      nome_completo: formData.nome_completo,
      cpf: formData.cpf,
      cargo: formData.cargo,
      objeto_id: formData.objeto_id,
      organizacao_id: formData.organizacao_id,
      local_id: formData.local_id ? formData.local_id : null,
      email: formData.email ? formData.email : null,
      telefone: formData.telefone ? formData.telefone : null,
      data_admissao: formData.data_admissao ? formData.data_admissao : null,
      data_desligamento: formData.data_desligamento ? formData.data_desligamento : null,
      carga_horaria_semanal: formData.carga_horaria_semanal ? Number(formData.carga_horaria_semanal) : null,
      situacao: formData.situacao,
      usuario_id: formData.usuario_id ? formData.usuario_id : null,
    };

    let result;
    if (editingItem) {
      result = await updateFuncionario(editingItem.id, payload);
    } else {
      result = await createFuncionario(payload);
    }

    setLoading(false);

    if (result.success) {
      setModalOpen(false);
    } else {
      setErrorMsg(result.error ?? "Erro ao salvar funcionário.");
    }
  }

  function handleOpenDelete(item: FuncionarioItem) {
    setDeleteTarget(item);
    setDeleteError(null);
    setDeleteOpen(true);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleteError(null);

    const result = await deleteFuncionario(deleteTarget.id);

    if (result.success) {
      setDeleteOpen(false);
      setDeleteTarget(null);
    } else {
      setDeleteError(result.error ?? "Erro ao excluir funcionário.");
    }
  }

  function formatCPF(cpf: string) {
    const digits = cpf.replace(/\D/g, "");
    if (digits.length !== 11) return cpf;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
  }

  const filteredFuncionarios = initialFuncionarios.filter((f) => {
    const term = searchTerm.toLowerCase();
    const nome = f.nome_completo ? f.nome_completo.toLowerCase() : "";
    const cpf = f.cpf ? f.cpf.toLowerCase() : "";
    const cargo = f.cargo ? f.cargo.toLowerCase() : "";
    const org = f.organizacao?.razao_social ? f.organizacao.razao_social.toLowerCase() : "";

    const matchesSearch =
      nome.includes(term) ||
      cpf.includes(term) ||
      cargo.includes(term) ||
      org.includes(term);

    const matchesObjeto =
      selectedObjetoId === "todos" || f.objeto_id === selectedObjetoId;

    const matchesLocal =
      selectedLocalId === "todos" || f.local_id === selectedLocalId;

    const matchesSituacao =
      selectedSituacao === "todos" || f.situacao === selectedSituacao;

    return matchesSearch && matchesObjeto && matchesLocal && matchesSituacao;
  });

  return (
    <div className="space-y-4">
      {/* Barra de Busca, Filtros e Ação */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CPF ou cargo..."
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

          <div className="w-32">
            <select
              value={selectedSituacao}
              onChange={(e) => setSelectedSituacao(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="todos">Todas Situações</option>
              <option value="ativo">Ativos</option>
              <option value="afastado">Afastados</option>
              <option value="desligado">Desligados</option>
            </select>
          </div>
        </div>

        <Button onClick={openCreateModal} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          <span>Novo Funcionário</span>
        </Button>
      </div>

      {/* Tabela de Funcionários */}
      {filteredFuncionarios.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Nenhum funcionário encontrado"
          description={
            searchTerm || selectedObjetoId !== "todos" || selectedLocalId !== "todos" || selectedSituacao !== "todos"
              ? "Tente ajustar os filtros ou termo de busca."
              : "Cadastre os colaboradores contratados pela Organização Social para prestação de contas de recursos humanos perante o Concedente."
          }
          actionLabel={
            !searchTerm && selectedObjetoId === "todos" && selectedLocalId === "todos" && selectedSituacao === "todos"
              ? "Cadastrar Funcionário"
              : undefined
          }
          onAction={
            !searchTerm && selectedObjetoId === "todos" && selectedLocalId === "todos" && selectedSituacao === "todos"
              ? openCreateModal
              : undefined
          }
        />
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador / CPF</TableHead>
                <TableHead>Cargo & Carga Horária</TableHead>
                <TableHead>Projeto & Empregador</TableHead>
                <TableHead>Polo Alocado</TableHead>
                <TableHead>Acesso ao Sistema</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFuncionarios.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">{f.nome_completo}</span>
                      <span className="text-xs text-muted-foreground font-mono">
                        CPF: {formatCPF(f.cpf)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{f.cargo}</span>
                      <span className="text-xs text-muted-foreground">
                        {f.carga_horaria_semanal ? `${f.carga_horaria_semanal}h semanais` : "Carga não inf."}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{f.objeto?.nome ?? "—"}</span>
                      <span className="text-xs text-muted-foreground truncate max-w-[160px]">
                        {f.organizacao?.nome_fantasia || f.organizacao?.razao_social || "—"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {f.local ? (
                      <div className="flex items-center gap-1 text-xs">
                        <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{f.local.nome}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        Sem polo fixo
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {f.usuario ? (
                      <Badge variant="outline" className="gap-1 font-mono text-[11px]">
                        <ShieldCheck className="h-3 w-3 text-green-500" />
                        <span>{f.usuario.papel.replace("_", " ")}</span>
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sem login</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        f.situacao === "ativo"
                          ? "default"
                          : f.situacao === "afastado"
                          ? "secondary"
                          : "outline"
                      }
                      className="capitalize"
                    >
                      {f.situacao}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEditModal(f)}
                        title="Editar funcionário"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleOpenDelete(f)}
                        title="Excluir funcionário"
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
        <DialogContent className="max-w-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Editar Funcionário / RH" : "Novo Funcionário / RH"}
              </DialogTitle>
              <DialogDescription>
                Registro de vínculo de trabalho perante a prestação de contas do Concedente (§3.2 e §4).
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
                <Label htmlFor="nome_completo">Nome Completo *</Label>
                <Input
                  id="nome_completo"
                  required
                  placeholder="Nome do colaborador conforme documento"
                  value={formData.nome_completo}
                  onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cpf">CPF (apenas números ou formatado) *</Label>
                <Input
                  id="cpf"
                  required
                  placeholder="000.000.000-00"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cargo">Cargo Contratual *</Label>
                <Input
                  id="cargo"
                  required
                  placeholder="Ex: Instrutor de Futebol, Coordenador Pedagógico, Supervisor"
                  value={formData.cargo}
                  onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="objeto_id">Projeto Social de Alocação *</Label>
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
                      {obj.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="organizacao_id">Organização Empregadora *</Label>
                <select
                  id="organizacao_id"
                  required
                  value={formData.organizacao_id}
                  onChange={(e) => setFormData({ ...formData, organizacao_id: e.target.value })}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="" disabled>
                    Selecione a OSC...
                  </option>
                  {organizacoes.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.nome_fantasia || org.razao_social}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="local_id">Polo de Atuação (Opcional)</Label>
                <select
                  id="local_id"
                  value={formData.local_id}
                  onChange={(e) => setFormData({ ...formData, local_id: e.target.value })}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Sem polo fixo / Equipe geral</option>
                  {formLocais.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="usuario_id">Vínculo com Conta de Login (Opcional)</Label>
                <select
                  id="usuario_id"
                  value={formData.usuario_id}
                  onChange={(e) => setFormData({ ...formData, usuario_id: e.target.value })}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Nenhum usuário associado (apenas RH)</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nome_completo ?? "Usuário"} ({u.papel})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground">
                  Necessário caso o colaborador vá assinar presença ou emitir relatórios no sistema.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="carga_horaria_semanal">Carga Horária (h/sem)</Label>
                <Input
                  id="carga_horaria_semanal"
                  type="number"
                  min={0}
                  max={60}
                  value={formData.carga_horaria_semanal}
                  onChange={(e) =>
                    setFormData({ ...formData, carga_horaria_semanal: Number(e.target.value) })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="situacao">Situação Cadastral</Label>
                <select
                  id="situacao"
                  value={formData.situacao}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      situacao: e.target.value as "ativo" | "afastado" | "desligado",
                    })
                  }
                  className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="ativo">Ativo</option>
                  <option value="afastado">Afastado</option>
                  <option value="desligado">Desligado</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colaborador@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="telefone">Telefone / WhatsApp</Label>
                <Input
                  id="telefone"
                  placeholder="(00) 00000-0000"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="data_admissao">Data de Admissão</Label>
                <Input
                  id="data_admissao"
                  type="date"
                  value={formData.data_admissao}
                  onChange={(e) => setFormData({ ...formData, data_admissao: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="data_desligamento">Data de Desligamento</Label>
                <Input
                  id="data_desligamento"
                  type="date"
                  value={formData.data_desligamento}
                  onChange={(e) => setFormData({ ...formData, data_desligamento: e.target.value })}
                />
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
                {loading ? "Salvando..." : editingItem ? "Salvar Alterações" : "Cadastrar Funcionário"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir Funcionário / RH"
        description={
          deleteError
            ? deleteError
            : `Tem certeza que deseja excluir o cadastro de "${deleteTarget?.nome_completo}"?`
        }
        confirmLabel="Sim, excluir"
        cancelLabel="Cancelar"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
