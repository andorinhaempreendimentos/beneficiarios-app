"use client";

import React, { useState, useMemo } from "react";
import type { Database } from "@/lib/database.types";
import {
  createLocal,
  updateLocal,
  toggleLocalAtivo,
  deleteLocal,
} from "@/lib/actions/locais";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { EmptyState } from "@/components/admin/empty-state";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Power,
  MapPin,
  Compass,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

type LocalRow = Database["public"]["Tables"]["locais"]["Row"];
type ObjetoSimple = Pick<
  Database["public"]["Tables"]["objetos"]["Row"],
  "id" | "nome" | "termo_local"
>;
type RegiaoSimple = Pick<
  Database["public"]["Tables"]["regioes"]["Row"],
  "id" | "nome" | "objeto_id"
>;

export type LocalItem = LocalRow & {
  objeto: ObjetoSimple | null;
  regiao: Pick<RegiaoSimple, "id" | "nome"> | null;
  grupos: { id: string; nome: string }[];
};

interface LocaisClientProps {
  initialLocais: LocalItem[];
  objetos: ObjetoSimple[];
  regioes: RegiaoSimple[];
}

export function LocaisClient({
  initialLocais,
  objetos,
  regioes,
}: LocaisClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedObjetoId, setSelectedObjetoId] = useState<string>("todos");
  const [selectedRegiaoId, setSelectedRegiaoId] = useState<string>("todos");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<LocalItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Status toggle
  const [toggleOpen, setToggleOpen] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<LocalItem | null>(null);

  // Exclusão
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LocalItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    nome: "",
    objeto_id: "",
    regiao_id: "",
    descricao: "",
    endereco_logradouro: "",
    endereco_numero: "",
    endereco_bairro: "",
    endereco_cidade: "",
    endereco_uf: "",
    endereco_cep: "",
    slug: "",
    ativo: true,
  });

  // Regiões disponíveis filtradas pelo projeto escolhido no formulário
  const formRegioes = useMemo(() => {
    if (!formData.objeto_id) return [];
    return regioes.filter((r) => r.objeto_id === formData.objeto_id);
  }, [formData.objeto_id, regioes]);

  // Regiões disponíveis para o filtro de busca no topo
  const filterRegioes = useMemo(() => {
    if (selectedObjetoId === "todos") return regioes;
    return regioes.filter((r) => r.objeto_id === selectedObjetoId);
  }, [selectedObjetoId, regioes]);

  function openCreateModal() {
    setEditingItem(null);
    const defaultObjId = objetos.length > 0 ? objetos[0].id : "";
    const defaultRegs = regioes.filter((r) => r.objeto_id === defaultObjId);
    const defaultRegId = defaultRegs.length > 0 ? defaultRegs[0].id : "";

    setFormData({
      nome: "",
      objeto_id: defaultObjId,
      regiao_id: defaultRegId,
      descricao: "",
      endereco_logradouro: "",
      endereco_numero: "",
      endereco_bairro: "",
      endereco_cidade: "",
      endereco_uf: "",
      endereco_cep: "",
      slug: "",
      ativo: true,
    });
    setErrorMsg(null);
    setModalOpen(true);
  }

  function openEditModal(item: LocalItem) {
    setEditingItem(item);
    setFormData({
      nome: item.nome,
      objeto_id: item.objeto_id,
      regiao_id: item.regiao_id,
      descricao: item.descricao ?? "",
      endereco_logradouro: item.endereco_logradouro ?? "",
      endereco_numero: item.endereco_numero ?? "",
      endereco_bairro: item.endereco_bairro ?? "",
      endereco_cidade: item.endereco_cidade ?? "",
      endereco_uf: item.endereco_uf ?? "",
      endereco_cep: item.endereco_cep ?? "",
      slug: item.slug ?? "",
      ativo: item.ativo,
    });
    setErrorMsg(null);
    setModalOpen(true);
  }

  function handleObjetoChangeInForm(newObjetoId: string) {
    const availableRegs = regioes.filter((r) => r.objeto_id === newObjetoId);
    setFormData((prev) => ({
      ...prev,
      objeto_id: newObjetoId,
      regiao_id: availableRegs.length > 0 ? availableRegs[0].id : "",
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const payload = {
      nome: formData.nome,
      objeto_id: formData.objeto_id,
      regiao_id: formData.regiao_id,
      descricao: formData.descricao ? formData.descricao : null,
      endereco_logradouro: formData.endereco_logradouro ? formData.endereco_logradouro : null,
      endereco_numero: formData.endereco_numero ? formData.endereco_numero : null,
      endereco_bairro: formData.endereco_bairro ? formData.endereco_bairro : null,
      endereco_cidade: formData.endereco_cidade ? formData.endereco_cidade : null,
      endereco_uf: formData.endereco_uf ? formData.endereco_uf : null,
      endereco_cep: formData.endereco_cep ? formData.endereco_cep : null,
      slug: formData.slug ? formData.slug : null,
      ativo: formData.ativo,
    };

    let result;
    if (editingItem) {
      result = await updateLocal(editingItem.id, payload);
    } else {
      result = await createLocal(payload);
    }

    setLoading(false);

    if (result.success) {
      setModalOpen(false);
    } else {
      setErrorMsg(result.error ?? "Erro ao salvar local.");
    }
  }

  function handleOpenToggle(item: LocalItem) {
    setToggleTarget(item);
    setToggleOpen(true);
  }

  async function handleConfirmToggle() {
    if (!toggleTarget) return;
    const result = await toggleLocalAtivo(toggleTarget.id, !toggleTarget.ativo);
    if (result.success) {
      setToggleOpen(false);
      setToggleTarget(null);
    }
  }

  function handleOpenDelete(item: LocalItem) {
    setDeleteTarget(item);
    setDeleteError(null);
    setDeleteOpen(true);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleteError(null);

    const result = await deleteLocal(deleteTarget.id);

    if (result.success) {
      setDeleteOpen(false);
      setDeleteTarget(null);
    } else {
      setDeleteError(result.error ?? "Erro ao excluir polo/local.");
    }
  }

  const filteredLocais = initialLocais.filter((loc) => {
    const term = searchTerm.toLowerCase();
    const nome = loc.nome ? loc.nome.toLowerCase() : "";
    const cidade = loc.endereco_cidade ? loc.endereco_cidade.toLowerCase() : "";
    const bairro = loc.endereco_bairro ? loc.endereco_bairro.toLowerCase() : "";
    const nomeObjeto = loc.objeto?.nome ? loc.objeto.nome.toLowerCase() : "";
    const nomeRegiao = loc.regiao?.nome ? loc.regiao.nome.toLowerCase() : "";

    const matchesSearch =
      nome.includes(term) ||
      cidade.includes(term) ||
      bairro.includes(term) ||
      nomeObjeto.includes(term) ||
      nomeRegiao.includes(term);

    const matchesObjeto =
      selectedObjetoId === "todos" || loc.objeto_id === selectedObjetoId;

    const matchesRegiao =
      selectedRegiaoId === "todos" || loc.regiao_id === selectedRegiaoId;

    return matchesSearch && matchesObjeto && matchesRegiao;
  });

  return (
    <div className="space-y-4">
      {/* Barra de Busca, Filtros e Ação */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, bairro, cidade..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>

          <div className="w-full sm:w-48">
            <select
              value={selectedObjetoId}
              onChange={(e) => {
                setSelectedObjetoId(e.target.value);
                setSelectedRegiaoId("todos");
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

          <div className="w-full sm:w-48">
            <select
              value={selectedRegiaoId}
              onChange={(e) => setSelectedRegiaoId(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="todos">Todas as Regiões</option>
              {filterRegioes.map((reg) => (
                <option key={reg.id} value={reg.id}>
                  {reg.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Button onClick={openCreateModal} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          <span>Novo Polo</span>
        </Button>
      </div>

      {/* Tabela de Locais */}
      {filteredLocais.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="Nenhum polo/local encontrado"
          description={
            searchTerm || selectedObjetoId !== "todos" || selectedRegiaoId !== "todos"
              ? "Tente ajustar os filtros ou termo de busca."
              : "Cadastre os polos físicos de atendimento onde os instrutores realizam as atividades."
          }
          actionLabel={
            !searchTerm && selectedObjetoId === "todos" && selectedRegiaoId === "todos"
              ? "Criar Polo"
              : undefined
          }
          onAction={
            !searchTerm && selectedObjetoId === "todos" && selectedRegiaoId === "todos"
              ? openCreateModal
              : undefined
          }
        />
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Polo / Local</TableHead>
                <TableHead>Projeto</TableHead>
                <TableHead>Região Obrigatória</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Turmas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLocais.map((loc) => {
                const qtdTurmas = loc.grupos?.length ?? 0;
                return (
                  <TableRow key={loc.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 text-primary shrink-0" />
                          <span>{loc.nome}</span>
                        </div>
                        {loc.slug && (
                          <span className="text-xs text-muted-foreground font-mono flex items-center gap-1 mt-0.5">
                            <span>/{loc.slug}</span>
                            <ExternalLink className="h-3 w-3 opacity-60" />
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {loc.objeto?.nome ?? "Projeto não informado"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs">
                        <Compass className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium">{loc.regiao?.nome ?? "Região Única"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {loc.endereco_cidade
                        ? `${loc.endereco_bairro ? loc.endereco_bairro + ", " : ""}${loc.endereco_cidade}/${loc.endereco_uf ?? ""}`
                        : "Endereço não cadastrado"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {qtdTurmas} {qtdTurmas === 1 ? "turma" : "turmas"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={loc.ativo ? "default" : "secondary"}>
                        {loc.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleOpenToggle(loc)}
                          title={loc.ativo ? "Desativar polo" : "Ativar polo"}
                        >
                          <Power
                            className={`h-4 w-4 ${loc.ativo ? "text-muted-foreground" : "text-green-500"}`}
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEditModal(loc)}
                          title="Editar polo"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleOpenDelete(loc)}
                          title="Excluir polo"
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
        <DialogContent className="max-w-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Editar Polo / Local" : "Novo Polo / Local"}
              </DialogTitle>
              <DialogDescription>
                Regra Canônica §3.2: Todo polo físico pertence obrigatoriamente a uma Região Territorial vinculada ao projeto.
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
                <Label htmlFor="nome">Nome do Polo / Local *</Label>
                <Input
                  id="nome"
                  required
                  placeholder="Ex: Polo Vila Nova, Ginásio Municipal, Praça da Juventude"
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
                <Label htmlFor="regiao_id">Região Territorial (§3.2) *</Label>
                <select
                  id="regiao_id"
                  required
                  value={formData.regiao_id}
                  onChange={(e) => setFormData({ ...formData, regiao_id: e.target.value })}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="" disabled>
                    Selecione a região...
                  </option>
                  {formRegioes.map((reg) => (
                    <option key={reg.id} value={reg.id}>
                      {reg.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="slug">Slug para Link Público (Opcional)</Label>
                <Input
                  id="slug"
                  placeholder="polo-vila-nova (deixe em branco para gerar automático)"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Identificador para o formulário de autoinscrição pública deste polo.
                </p>
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="endereco_logradouro">Logradouro / Rua</Label>
                <Input
                  id="endereco_logradouro"
                  placeholder="Ex: Av. Brasil"
                  value={formData.endereco_logradouro}
                  onChange={(e) => setFormData({ ...formData, endereco_logradouro: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="endereco_numero">Número</Label>
                <Input
                  id="endereco_numero"
                  placeholder="Ex: 1000 ou S/N"
                  value={formData.endereco_numero}
                  onChange={(e) => setFormData({ ...formData, endereco_numero: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="endereco_bairro">Bairro</Label>
                <Input
                  id="endereco_bairro"
                  placeholder="Ex: Centro"
                  value={formData.endereco_bairro}
                  onChange={(e) => setFormData({ ...formData, endereco_bairro: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="endereco_cidade">Cidade</Label>
                <Input
                  id="endereco_cidade"
                  placeholder="Ex: São Paulo"
                  value={formData.endereco_cidade}
                  onChange={(e) => setFormData({ ...formData, endereco_cidade: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="endereco_uf">UF (Estado)</Label>
                <Input
                  id="endereco_uf"
                  placeholder="SP"
                  maxLength={2}
                  value={formData.endereco_uf}
                  onChange={(e) => setFormData({ ...formData, endereco_uf: e.target.value.toUpperCase() })}
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="descricao">Descrição da Estrutura Física</Label>
                <Textarea
                  id="descricao"
                  rows={2}
                  placeholder="Detalhes da quadra, vestiários, capacidade de público ou especificações do espaço..."
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
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
                {loading ? "Salvando..." : editingItem ? "Salvar Alterações" : "Criar Polo"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Alternância de Status */}
      <ConfirmDialog
        open={toggleOpen}
        onOpenChange={setToggleOpen}
        title={toggleTarget?.ativo ? "Desativar Polo" : "Ativar Polo"}
        description={`Tem certeza que deseja ${toggleTarget?.ativo ? "desativar" : "ativar"} o polo "${toggleTarget?.nome}"? Polos desativados não recebem novas chamadas ou matrículas.`}
        confirmLabel={toggleTarget?.ativo ? "Sim, desativar" : "Sim, ativar"}
        cancelLabel="Cancelar"
        variant={toggleTarget?.ativo ? "destructive" : "default"}
        onConfirm={handleConfirmToggle}
      />

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir Polo / Local"
        description={
          deleteError
            ? deleteError
            : `Tem certeza que deseja excluir o polo "${deleteTarget?.nome}"? Esta operação é irreversível.`
        }
        confirmLabel="Sim, excluir"
        cancelLabel="Cancelar"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
