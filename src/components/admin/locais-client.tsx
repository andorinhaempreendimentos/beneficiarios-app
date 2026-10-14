"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Database } from "@/lib/database.types";
import { toggleLocalAtivo, deleteLocal } from "@/lib/actions/locais";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  ExternalLink,
  Calendar,
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
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedObjetoId, setSelectedObjetoId] = useState<string>("todos");
  const [selectedRegiaoId, setSelectedRegiaoId] = useState<string>("todos");

  // Status toggle
  const [toggleOpen, setToggleOpen] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<LocalItem | null>(null);

  // Exclusão
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LocalItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Regiões disponíveis para o filtro de busca no topo
  const filterRegioes = useMemo(() => {
    if (selectedObjetoId === "todos") return regioes;
    return regioes.filter((r) => r.objeto_id === selectedObjetoId);
  }, [selectedObjetoId, regioes]);

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
      router.refresh();
    }
  }

  function handleOpenDelete(item: LocalItem) {
    setDeleteTarget(item);
    setDeleteError(null);
    setDeleteOpen(true);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    const result = await deleteLocal(deleteTarget.id);
    if (result.success) {
      setDeleteOpen(false);
      setDeleteTarget(null);
      setDeleteError(null);
      router.refresh();
    } else {
      setDeleteError(result.error ?? "Erro ao excluir local.");
    }
  }

  const filteredLocais = useMemo(() => {
    return initialLocais.filter((loc) => {
      const matchSearch =
        loc.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (loc.endereco_cidade &&
          loc.endereco_cidade.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (loc.endereco_bairro &&
          loc.endereco_bairro.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (loc.slug && loc.slug.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchObjeto =
        selectedObjetoId === "todos" || loc.objeto_id === selectedObjetoId;

      const matchRegiao =
        selectedRegiaoId === "todos" || loc.regiao_id === selectedRegiaoId;

      return matchSearch && matchObjeto && matchRegiao;
    });
  }, [initialLocais, searchTerm, selectedObjetoId, selectedRegiaoId]);

  return (
    <div className="space-y-4">
      {/* Barra de Filtros e Criação */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-1 flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome do polo, cidade, bairro ou slug..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filtro por Projeto */}
          <div className="w-full sm:w-56">
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

          {/* Filtro por Região */}
          <div className="w-full sm:w-56">
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

        {/* Link para Página Dedicada de Criação */}
        <Link
          href="/admin/locais/novo"
          className={buttonVariants({ variant: "default", className: "gap-2 shrink-0" })}
        >
          <Plus className="h-4 w-4" />
          <span>Novo Polo</span>
        </Link>
      </div>

      {/* Tabela de Locais */}
      {filteredLocais.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="Nenhum polo/local encontrado"
          description={
            searchTerm || selectedObjetoId !== "todos" || selectedRegiaoId !== "todos"
              ? "Tente ajustar os filtros ou termo de busca."
              : "Cadastre os polos físicos de atendimento onde os instrutores realizam as atividades e planejam as grades."
          }
          actionLabel={
            !searchTerm && selectedObjetoId === "todos" && selectedRegiaoId === "todos"
              ? "Criar Polo"
              : undefined
          }
          onAction={
            !searchTerm && selectedObjetoId === "todos" && selectedRegiaoId === "todos"
              ? () => router.push("/admin/locais/novo")
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
                <TableHead>Grupos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLocais.map((loc) => {
                const qtdGrupos = loc.grupos?.length ?? 0;
                return (
                  <TableRow key={loc.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <Link
                          href={`/admin/locais/${loc.id}`}
                          className="flex items-center gap-1.5 hover:underline text-foreground hover:text-primary transition-colors font-semibold"
                        >
                          <MapPin className="h-4 w-4 text-primary shrink-0" />
                          <span>{loc.nome}</span>
                        </Link>
                        {loc.slug && (
                          <Link
                            href={`/inscricao/${loc.slug}`}
                            target="_blank"
                            className="text-xs text-muted-foreground font-mono flex items-center gap-1 mt-0.5 hover:underline"
                          >
                            <span>/{loc.slug}</span>
                            <ExternalLink className="h-3 w-3 opacity-60" />
                          </Link>
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
                        {qtdGrupos} {qtdGrupos === 1 ? "grupo" : "grupos"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={loc.ativo ? "default" : "secondary"}>
                        {loc.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Ver / Editar Grade Semanal */}
                        <Link
                          href={`/admin/locais/${loc.id}?tab=grade`}
                          className={buttonVariants({
                            variant: "ghost",
                            size: "icon-sm",
                            className: "text-primary hover:text-primary",
                          })}
                          title="Grade de Horários Interativa"
                        >
                          <Calendar className="h-4 w-4" />
                        </Link>

                        {/* Editar Dados Cadastrais */}
                        <Link
                          href={`/admin/locais/${loc.id}?tab=dados`}
                          className={buttonVariants({
                            variant: "ghost",
                            size: "icon-sm",
                          })}
                          title="Editar Dados do Polo"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Link>

                        {/* Alternar Ativo/Inativo */}
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

                        {/* Excluir Polo */}
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
