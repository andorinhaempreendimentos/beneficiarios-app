"use client";

import React, { useState } from "react";
import type { Database } from "@/lib/database.types";
import {
  createOrganizacao,
  updateOrganizacao,
  toggleOrganizacaoAtivo,
} from "@/lib/actions/organizacoes";
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
import { Plus, Search, Edit2, Power, Building2, AlertCircle } from "lucide-react";

type Organizacao = Database["public"]["Tables"]["organizacoes"]["Row"];

interface OrganizacoesClientProps {
  initialOrganizacoes: Organizacao[];
}

export function OrganizacoesClient({ initialOrganizacoes }: OrganizacoesClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organizacao | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Confirmação de desativação/ativação
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<Organizacao | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    razao_social: "",
    nome_fantasia: "",
    cnpj: "",
    email: "",
    telefone: "",
    endereco_logradouro: "",
    endereco_numero: "",
    endereco_bairro: "",
    endereco_cidade: "",
    endereco_uf: "",
    endereco_cep: "",
    logotipo_url: "",
    ativo: true,
  });

  function openCreateModal() {
    setEditingOrg(null);
    setFormData({
      razao_social: "",
      nome_fantasia: "",
      cnpj: "",
      email: "",
      telefone: "",
      endereco_logradouro: "",
      endereco_numero: "",
      endereco_bairro: "",
      endereco_cidade: "",
      endereco_uf: "",
      endereco_cep: "",
      logotipo_url: "",
      ativo: true,
    });
    setErrorMsg(null);
    setModalOpen(true);
  }

  function openEditModal(org: Organizacao) {
    setEditingOrg(org);
    setFormData({
      razao_social: org.razao_social,
      nome_fantasia: org.nome_fantasia ?? "",
      cnpj: org.cnpj,
      email: org.email ?? "",
      telefone: org.telefone ?? "",
      endereco_logradouro: org.endereco_logradouro ?? "",
      endereco_numero: org.endereco_numero ?? "",
      endereco_bairro: org.endereco_bairro ?? "",
      endereco_cidade: org.endereco_cidade ?? "",
      endereco_uf: org.endereco_uf ?? "",
      endereco_cep: org.endereco_cep ?? "",
      logotipo_url: org.logotipo_url ?? "",
      ativo: org.ativo,
    });
    setErrorMsg(null);
    setModalOpen(true);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    let res;
    if (editingOrg) {
      res = await updateOrganizacao(editingOrg.id, formData);
    } else {
      res = await createOrganizacao(formData);
    }

    setLoading(false);

    if (res.success) {
      setModalOpen(false);
    } else {
      setErrorMsg(res.error ?? "Ocorreu um erro ao salvar a organização.");
    }
  }

  async function handleToggleAtivo() {
    if (!toggleTarget) return;
    await toggleOrganizacaoAtivo(toggleTarget.id, !toggleTarget.ativo);
    setToggleTarget(null);
  }

  const filteredOrgs = initialOrganizacoes.filter((org) => {
    const term = searchTerm.toLowerCase();
    return (
      org.razao_social.toLowerCase().includes(term) ||
      (org.nome_fantasia && org.nome_fantasia.toLowerCase().includes(term)) ||
      org.cnpj.includes(term)
    );
  });

  return (
    <div className="space-y-4">
      {/* Barra de ações superiores */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por razão social, nome fantasia ou CNPJ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={openCreateModal} className="gap-2">
          <Plus className="h-4 w-4" />
          <span>Nova Organização</span>
        </Button>
      </div>

      {/* Tabela ou estado vazio */}
      {initialOrganizacoes.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Nenhuma organização social cadastrada"
          description="Cadastre a primeira OSC responsável pela execução dos projetos esportivos."
          actionLabel="Adicionar Organização"
          onAction={openCreateModal}
        />
      ) : filteredOrgs.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          Nenhuma organização encontrada com o termo &quot;{searchTerm}&quot;.
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Razão Social / Nome Fantasia</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Cidade / UF</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrgs.map((org) => (
                <TableRow key={org.id}>
                  <TableCell>
                    <div className="font-medium text-foreground">
                      {org.razao_social}
                    </div>
                    {org.nome_fantasia && (
                      <div className="text-xs text-muted-foreground">
                        {org.nome_fantasia}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{org.cnpj}</TableCell>
                  <TableCell className="text-xs">
                    {org.email && <div>{org.email}</div>}
                    {org.telefone && (
                      <div className="text-muted-foreground">{org.telefone}</div>
                    )}
                    {!org.email && !org.telefone && (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    {org.endereco_cidade ? (
                      <span>
                        {org.endereco_cidade}
                        {org.endereco_uf ? `/${org.endereco_uf}` : ""}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={org.ativo ? "default" : "secondary"}>
                      {org.ativo ? "Ativa" : "Inativa"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(org)}
                        title="Editar organização"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setToggleTarget(org);
                          setConfirmOpen(true);
                        }}
                        title={org.ativo ? "Desativar organização" : "Ativar organização"}
                        className={org.ativo ? "text-muted-foreground hover:text-destructive" : "text-emerald-600"}
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
              {editingOrg ? "Editar Organização Social" : "Nova Organização Social"}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados cadastrais da entidade do terceiro setor responsável pelos projetos.
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
              <Label htmlFor="org_razao_social">Razão Social *</Label>
              <Input
                id="org_razao_social"
                name="razao_social"
                value={formData.razao_social}
                onChange={handleInputChange}
                placeholder="Ex: Associação Esportiva e Social Andorinha"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="org_nome_fantasia">Nome Fantasia</Label>
                <Input
                  id="org_nome_fantasia"
                  name="nome_fantasia"
                  value={formData.nome_fantasia}
                  onChange={handleInputChange}
                  placeholder="Ex: Projeto Andorinha"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="org_cnpj">CNPJ *</Label>
                <Input
                  id="org_cnpj"
                  name="cnpj"
                  value={formData.cnpj}
                  onChange={handleInputChange}
                  placeholder="00.000.000/0000-00"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="org_email">E-mail Institucional</Label>
                <Input
                  id="org_email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="contato@ong.org.br"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="org_telefone">Telefone</Label>
                <Input
                  id="org_telefone"
                  name="telefone"
                  value={formData.telefone}
                  onChange={handleInputChange}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>

            {/* Endereço */}
            <div className="border-t border-border pt-3 space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Endereço da Sede
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1 col-span-2">
                  <Label htmlFor="org_logradouro" className="text-xs">Logradouro</Label>
                  <Input
                    id="org_logradouro"
                    name="endereco_logradouro"
                    value={formData.endereco_logradouro}
                    onChange={handleInputChange}
                    placeholder="Rua, Avenida..."
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="org_numero" className="text-xs">Número</Label>
                  <Input
                    id="org_numero"
                    name="endereco_numero"
                    value={formData.endereco_numero}
                    onChange={handleInputChange}
                    placeholder="123"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1 col-span-2">
                  <Label htmlFor="org_cidade" className="text-xs">Cidade</Label>
                  <Input
                    id="org_cidade"
                    name="endereco_cidade"
                    value={formData.endereco_cidade}
                    onChange={handleInputChange}
                    placeholder="São Paulo"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="org_uf" className="text-xs">UF</Label>
                  <Input
                    id="org_uf"
                    name="endereco_uf"
                    value={formData.endereco_uf}
                    onChange={handleInputChange}
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="org_cep" className="text-xs">CEP</Label>
                  <Input
                    id="org_cep"
                    name="endereco_cep"
                    value={formData.endereco_cep}
                    onChange={handleInputChange}
                    placeholder="00000-000"
                  />
                </div>
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
                {loading ? "Salvando..." : editingOrg ? "Salvar Alterações" : "Criar Organização"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmação de Ativação / Desativação */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={toggleTarget?.ativo ? "Desativar Organização" : "Ativar Organização"}
        description={
          toggleTarget?.ativo
            ? `Tem certeza que deseja desativar "${toggleTarget.razao_social}"? Ela não poderá ser vinculada a novos projetos enquanto estiver inativa.`
            : `Deseja reativar "${toggleTarget?.razao_social}"?`
        }
        confirmLabel={toggleTarget?.ativo ? "Desativar" : "Ativar"}
        variant={toggleTarget?.ativo ? "destructive" : "default"}
        onConfirm={handleToggleAtivo}
      />
    </div>
  );
}
