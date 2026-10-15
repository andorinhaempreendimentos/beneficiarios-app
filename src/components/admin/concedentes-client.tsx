"use client";

import React, { useState } from "react";
import type { Database } from "@/lib/database.types";
import {
  createConcedente,
  updateConcedente,
  toggleConcedenteAtivo,
} from "@/lib/actions/concedentes";
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
import { Plus, Search, Edit2, Power, Landmark, AlertCircle } from "lucide-react";
import { maskCnpj } from "@/lib/utils/masks";
import { SelectUf } from "@/components/ui/select-uf";

type Concedente = Database["public"]["Tables"]["concedentes"]["Row"];

interface ConcedentesClientProps {
  initialConcedentes: Concedente[];
}

export function ConcedentesClient({ initialConcedentes }: ConcedentesClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Concedente | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Confirmação de ativação/desativação
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<Concedente | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    nome: "",
    sigla: "",
    esfera: "municipal" as "municipal" | "estadual" | "federal",
    cnpj: "",
    municipio: "",
    uf: "",
    ativo: true,
  });

  function openCreateModal() {
    setEditingItem(null);
    setFormData({
      nome: "",
      sigla: "",
      esfera: "municipal",
      cnpj: "",
      municipio: "",
      uf: "",
      ativo: true,
    });
    setErrorMsg(null);
    setModalOpen(true);
  }

  function openEditModal(item: Concedente) {
    setEditingItem(item);
    setFormData({
      nome: item.nome,
      sigla: item.sigla ?? "",
      esfera: item.esfera as "municipal" | "estadual" | "federal",
      cnpj: item.cnpj ? maskCnpj(item.cnpj) : "",
      municipio: item.municipio ?? "",
      uf: item.uf ?? "",
      ativo: item.ativo,
    });
    setErrorMsg(null);
    setModalOpen(true);
  }

  function handleInputChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    let res;
    if (editingItem) {
      res = await updateConcedente(editingItem.id, formData);
    } else {
      res = await createConcedente(formData);
    }

    setLoading(false);

    if (res.success) {
      setModalOpen(false);
    } else {
      setErrorMsg(res.error ?? "Ocorreu um erro ao salvar o concedente.");
    }
  }

  async function handleToggleAtivo() {
    if (!toggleTarget) return;
    await toggleConcedenteAtivo(toggleTarget.id, !toggleTarget.ativo);
    setToggleTarget(null);
  }

  const filteredItems = initialConcedentes.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.nome.toLowerCase().includes(term) ||
      (item.sigla && item.sigla.toLowerCase().includes(term)) ||
      (item.municipio && item.municipio.toLowerCase().includes(term)) ||
      (item.cnpj && item.cnpj.includes(term))
    );
  });

  function getEsferaBadge(esfera: string) {
    switch (esfera) {
      case "municipal":
        return <Badge variant="outline">Municipal</Badge>;
      case "estadual":
        return <Badge variant="secondary">Estadual</Badge>;
      case "federal":
        return <Badge variant="default">Federal</Badge>;
      default:
        return <Badge variant="outline">{esfera}</Badge>;
    }
  }

  return (
    <div className="space-y-4">
      {/* Barra de ações superiores */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, sigla, cidade ou CNPJ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={openCreateModal} className="gap-2">
          <Plus className="h-4 w-4" />
          <span>Novo Concedente</span>
        </Button>
      </div>

      {/* Tabela ou estado vazio */}
      {initialConcedentes.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="Nenhum concedente público cadastrado"
          description="Cadastre os órgãos da administração pública (Secretarias, Ministérios, Prefeituras) financiadores das parcerias."
          actionLabel="Adicionar Concedente"
          onAction={openCreateModal}
        />
      ) : filteredItems.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          Nenhum concedente encontrado com o termo &quot;{searchTerm}&quot;.
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Órgão / Concedente</TableHead>
                <TableHead>Esfera</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Município / UF</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-medium text-foreground">{item.nome}</div>
                    {item.sigla && (
                      <div className="text-xs text-muted-foreground font-mono">
                        {item.sigla}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{getEsferaBadge(item.esfera)}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {item.cnpj ?? <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-xs">
                    {item.municipio ? (
                      <span>
                        {item.municipio}
                        {item.uf ? `/${item.uf}` : ""}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.ativo ? "default" : "secondary"}>
                      {item.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(item)}
                        title="Editar concedente"
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
                        title={item.ativo ? "Desativar concedente" : "Ativar concedente"}
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
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Editar Concedente Público" : "Novo Concedente Público"}
            </DialogTitle>
            <DialogDescription>
              Dados do órgão governamental responsável pela concessão dos recursos e fiscalização.
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
              <Label htmlFor="conc_nome">Nome do Órgão / Concedente *</Label>
              <Input
                id="conc_nome"
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                placeholder="Ex: Secretaria Municipal de Esportes e Lazer"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="conc_sigla">Sigla</Label>
                <Input
                  id="conc_sigla"
                  name="sigla"
                  value={formData.sigla}
                  onChange={handleInputChange}
                  placeholder="Ex: SEME / SP"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="conc_esfera">Esfera Administrativa *</Label>
                <select
                  id="conc_esfera"
                  name="esfera"
                  value={formData.esfera}
                  onChange={handleInputChange}
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  required
                >
                  <option value="municipal">Municipal</option>
                  <option value="estadual">Estadual</option>
                  <option value="federal">Federal</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="conc_cnpj">CNPJ do Concedente</Label>
              <Input
                id="conc_cnpj"
                name="cnpj"
                value={formData.cnpj}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, cnpj: maskCnpj(e.target.value) }))
                }
                placeholder="00.000.000/0000-00"
                maxLength={18}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="conc_municipio">Município</Label>
                <Input
                  id="conc_municipio"
                  name="municipio"
                  value={formData.municipio}
                  onChange={handleInputChange}
                  placeholder="São Paulo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="conc_uf">UF</Label>
                <SelectUf
                  value={formData.uf}
                  onValueChange={(val) => setFormData((prev) => ({ ...prev, uf: val }))}
                  placeholder="UF..."
                />
              </div>
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
                {loading ? "Salvando..." : editingItem ? "Salvar Alterações" : "Criar Concedente"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmação de Ativação / Desativação */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={toggleTarget?.ativo ? "Desativar Concedente" : "Ativar Concedente"}
        description={
          toggleTarget?.ativo
            ? `Tem certeza que deseja desativar o concedente "${toggleTarget.nome}"? Ele não aparecerá como opção ativa ao criar novos projetos.`
            : `Deseja reativar o concedente "${toggleTarget?.nome}"?`
        }
        confirmLabel={toggleTarget?.ativo ? "Desativar" : "Ativar"}
        variant={toggleTarget?.ativo ? "destructive" : "default"}
        onConfirm={handleToggleAtivo}
      />
    </div>
  );
}
