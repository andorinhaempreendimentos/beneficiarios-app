"use client";

import React, { useState, useMemo } from "react";
import type { UsuarioComDetalhes } from "@/lib/actions/usuarios";
import {
  createUsuario,
  updateUsuario,
  toggleUsuarioAtivo,
  deleteUsuario,
} from "@/lib/actions/usuarios";
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
  ShieldCheck,
  AlertCircle,
  FolderLock,
  UserCheck,
  Briefcase,
  UserPlus,
  Link2,
  Building2,
  MapPin,
} from "lucide-react";
import { maskCpf, maskPhone } from "@/lib/utils/masks";

interface ObjetoSimple {
  id: string;
  nome: string;
}

interface FuncionarioSimple {
  id: string;
  nome_completo: string;
  cargo: string;
  usuario_id: string | null;
}

interface OrganizacaoSimple {
  id: string;
  razao_social: string;
  nome_fantasia: string | null;
}

interface LocalSimple {
  id: string;
  nome: string;
  objeto_id: string;
}

interface UsuariosClientProps {
  initialUsuarios: UsuarioComDetalhes[];
  objetos: ObjetoSimple[];
  funcionarios: FuncionarioSimple[];
  organizacoes?: OrganizacaoSimple[];
  locais?: LocalSimple[];
}

const PAPEIS_INFO: Record<
  string,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive"; desc: string }
> = {
  super_admin: {
    label: "Super Admin",
    variant: "destructive",
    desc: "Acesso irrestrito a todos os projetos, OSCs, concedentes e configurações",
  },
  admin_geral: {
    label: "Admin Geral",
    variant: "default",
    desc: "Gestão executiva e operacional dos projetos sob a OSC",
  },
  coordenador: {
    label: "Coordenador",
    variant: "secondary",
    desc: "Gestão regional de polos, fechamento de relatórios e validação de vistorias",
  },
  supervisor: {
    label: "Supervisor",
    variant: "outline",
    desc: "Auditoria presencial de conformidade e aplicação de checklists nos polos",
  },
  instrutor: {
    label: "Instrutor",
    variant: "outline",
    desc: "Registro de chamadas nominais, fotos comprobatórias e ponto eletrônico",
  },
  leitor: {
    label: "Leitor / Auditor",
    variant: "secondary",
    desc: "Apenas leitura para fiscalização do Concedente e órgãos de controle",
  },
};

export function UsuariosClient({
  initialUsuarios,
  objetos,
  funcionarios,
  organizacoes = [],
  locais = [],
}: UsuariosClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPapel, setSelectedPapel] = useState<string>("todos");
  const [selectedObjetoId, setSelectedObjetoId] = useState<string>("todos");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<UsuarioComDetalhes | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Status toggle
  const [toggleOpen, setToggleOpen] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<UsuarioComDetalhes | null>(null);

  // Exclusão
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UsuarioComDetalhes | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    nome_completo: "",
    email: "",
    senha: "",
    papel: "instrutor" as
      | "super_admin"
      | "admin_geral"
      | "coordenador"
      | "supervisor"
      | "instrutor"
      | "leitor",
    ativo: true,
    funcionario_id: "",
    objetos_ids: [] as string[],
    // Vínculo dinâmico de RH (§3.2 e §4.1)
    rhMode: "novo" as "novo" | "existente" | "nenhum",
    novo_cpf: "",
    novo_cargo: "Instrutor de Atividades",
    novo_organizacao_id: "",
    novo_objeto_id: "",
    novo_local_id: "",
    novo_telefone: "",
    novo_carga_horaria: 40,
  });

  function getCargoSugerido(papel: string): string {
    switch (papel) {
      case "instrutor":
        return "Instrutor de Atividades";
      case "supervisor":
        return "Supervisor de Campo";
      case "coordenador":
        return "Coordenador Regional";
      default:
        return "Colaborador de Campo";
    }
  }

  // Locais filtrados para o projeto selecionado na seção de novo RH
  const locaisParaRh = useMemo<LocalSimple[]>(() => {
    if (!formData.novo_objeto_id) return [];
    return locais.filter((l) => l.objeto_id === formData.novo_objeto_id);
  }, [formData.novo_objeto_id, locais]);

  function openCreateModal() {
    setEditingItem(null);
    const defaultOrgId = organizacoes.length > 0 ? organizacoes[0].id : "";
    const defaultObjId = objetos.length > 0 ? objetos[0].id : "";
    const availableLocs = locais.filter((l) => l.objeto_id === defaultObjId);
    const defaultLocId = availableLocs.length > 0 ? availableLocs[0].id : "";

    setFormData({
      nome_completo: "",
      email: "",
      senha: "",
      papel: "instrutor",
      ativo: true,
      funcionario_id: "",
      objetos_ids: defaultObjId ? [defaultObjId] : [],
      rhMode: "novo",
      novo_cpf: "",
      novo_cargo: "Instrutor de Atividades",
      novo_organizacao_id: defaultOrgId,
      novo_objeto_id: defaultObjId,
      novo_local_id: defaultLocId,
      novo_telefone: "",
      novo_carga_horaria: 40,
    });
    setErrorMsg(null);
    setModalOpen(true);
  }

  function openEditModal(item: UsuarioComDetalhes) {
    setEditingItem(item);
    const hasFuncionario = !!item.funcionario;
    const defaultOrgId = organizacoes.length > 0 ? organizacoes[0].id : "";
    const defaultObjId =
      item.acessos.length > 0
        ? item.acessos[0].objeto_id
        : objetos.length > 0
        ? objetos[0].id
        : "";
    const availableLocs = locais.filter(
      (l) => l.objeto_id === (item.funcionario?.objeto_id ?? defaultObjId)
    );
    const defaultLocId = availableLocs.length > 0 ? availableLocs[0].id : "";

    setFormData({
      nome_completo: item.nome_completo ?? "",
      email: item.email ?? "",
      senha: "",
      papel: (item.papel as typeof formData.papel) ?? "instrutor",
      ativo: item.ativo,
      funcionario_id: item.funcionario?.id ?? "",
      objetos_ids: item.acessos.map((a) => a.objeto_id),
      rhMode: hasFuncionario ? "novo" : "nenhum",
      novo_cpf: item.funcionario?.cpf ? maskCpf(item.funcionario.cpf) : "",
      novo_cargo: item.funcionario?.cargo ?? getCargoSugerido(item.papel),
      novo_organizacao_id: item.funcionario?.organizacao_id ?? defaultOrgId,
      novo_objeto_id: item.funcionario?.objeto_id ?? defaultObjId,
      novo_local_id: item.funcionario?.local_id ?? defaultLocId,
      novo_telefone: item.funcionario?.telefone ? maskPhone(item.funcionario.telefone) : "",
      novo_carga_horaria: item.funcionario?.carga_horaria_semanal ?? 40,
    });
    setErrorMsg(null);
    setModalOpen(true);
  }

  function handlePapelChange(newPapel: typeof formData.papel) {
    setFormData((prev) => ({
      ...prev,
      papel: newPapel,
      novo_cargo: getCargoSugerido(newPapel),
    }));
  }

  function handleNovoObjetoChange(newObjId: string) {
    const available = locais.filter((l) => l.objeto_id === newObjId);
    setFormData((prev) => ({
      ...prev,
      novo_objeto_id: newObjId,
      novo_local_id: available.length > 0 ? available[0].id : "",
      objetos_ids: prev.objetos_ids.includes(newObjId)
        ? prev.objetos_ids
        : [...prev.objetos_ids, newObjId],
    }));
  }

  function toggleObjetoSelection(objId: string) {
    setFormData((prev) => {
      const exists = prev.objetos_ids.includes(objId);
      if (exists) {
        return {
          ...prev,
          objetos_ids: prev.objetos_ids.filter((id) => id !== objId),
        };
      } else {
        return {
          ...prev,
          objetos_ids: [...prev.objetos_ids, objId],
        };
      }
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const isPapelDeCampo = ["instrutor", "supervisor", "coordenador"].includes(formData.papel);

    // Validações específicas para dados de RH
    if (isPapelDeCampo && formData.rhMode === "novo") {
      const pureCpf = formData.novo_cpf.replace(/\D/g, "");
      if (pureCpf.length !== 11) {
        setErrorMsg("Por favor, preencha um CPF válido com 11 dígitos para o registro de RH.");
        setLoading(false);
        return;
      }
      if (!formData.novo_cargo.trim()) {
        setErrorMsg("Por favor, informe o cargo contratual do colaborador para o RH.");
        setLoading(false);
        return;
      }
      if (!formData.novo_organizacao_id) {
        setErrorMsg("Por favor, selecione a Organização Social empregadora.");
        setLoading(false);
        return;
      }
      if (!formData.novo_objeto_id) {
        setErrorMsg("Por favor, selecione o projeto social de alocação.");
        setLoading(false);
        return;
      }
    }

    // Validação de escopo de projetos para Admin Geral (§4.2)
    if (formData.papel === "admin_geral" && formData.objetos_ids.length === 0) {
      setErrorMsg(
        "Por favor, selecione ao menos um projeto social autorizado para o Admin Geral."
      );
      setLoading(false);
      return;
    }

    let objetosIdsFinais =
      formData.papel === "super_admin"
        ? []
        : formData.objetos_ids;

    if (
      isPapelDeCampo &&
      formData.rhMode === "novo" &&
      formData.novo_objeto_id &&
      !objetosIdsFinais.includes(formData.novo_objeto_id)
    ) {
      objetosIdsFinais = [...objetosIdsFinais, formData.novo_objeto_id];
    }

    const payload = {
      nome_completo: formData.nome_completo,
      email: formData.email,
      senha: formData.senha ? formData.senha : undefined,
      papel: formData.papel,
      ativo: formData.ativo,
      funcionario_id:
        formData.rhMode === "existente" && formData.funcionario_id
          ? formData.funcionario_id
          : formData.rhMode === "novo" && formData.funcionario_id
          ? formData.funcionario_id
          : null,
      novo_funcionario:
        isPapelDeCampo && formData.rhMode === "novo"
          ? {
              cpf: formData.novo_cpf,
              cargo: formData.novo_cargo.trim(),
              organizacao_id: formData.novo_organizacao_id,
              objeto_id: formData.novo_objeto_id,
              local_id: formData.novo_local_id ? formData.novo_local_id : null,
              telefone: formData.novo_telefone ? formData.novo_telefone : null,
              carga_horaria_semanal: formData.novo_carga_horaria
                ? Number(formData.novo_carga_horaria)
                : 40,
            }
          : null,
      objetos_ids: objetosIdsFinais,
    };

    let result;
    if (editingItem) {
      result = await updateUsuario(editingItem.id, payload);
    } else {
      result = await createUsuario(payload);
    }

    setLoading(false);

    if (result.success) {
      setModalOpen(false);
    } else {
      setErrorMsg(result.error ?? "Erro ao salvar usuário.");
    }
  }

  function handleOpenToggle(item: UsuarioComDetalhes) {
    setToggleTarget(item);
    setToggleOpen(true);
  }

  async function handleConfirmToggle() {
    if (!toggleTarget) return;
    const result = await toggleUsuarioAtivo(toggleTarget.id, !toggleTarget.ativo);
    if (result.success) {
      setToggleOpen(false);
      setToggleTarget(null);
    }
  }

  function handleOpenDelete(item: UsuarioComDetalhes) {
    setDeleteTarget(item);
    setDeleteError(null);
    setDeleteOpen(true);
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleteError(null);

    const result = await deleteUsuario(deleteTarget.id);

    if (result.success) {
      setDeleteOpen(false);
      setDeleteTarget(null);
    } else {
      setDeleteError(result.error ?? "Erro ao excluir usuário.");
    }
  }

  const filteredUsuarios = initialUsuarios.filter((u) => {
    const term = searchTerm.toLowerCase();
    const nome = u.nome_completo ? u.nome_completo.toLowerCase() : "";
    const email = u.email ? u.email.toLowerCase() : "";

    const matchesSearch = nome.includes(term) || email.includes(term);

    const matchesPapel =
      selectedPapel === "todos" || u.papel === selectedPapel;

    const matchesObjeto =
      selectedObjetoId === "todos" ||
      u.papel === "super_admin" ||
      u.acessos.some((a) => a.objeto_id === selectedObjetoId);

    return matchesSearch && matchesPapel && matchesObjeto;
  });

  return (
    <div className="space-y-4">
      {/* Barra de Busca, Filtros e Ação */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>

          <div className="w-40">
            <select
              value={selectedPapel}
              onChange={(e) => setSelectedPapel(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="todos">Todos os Papéis</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin_geral">Admin Geral</option>
              <option value="coordenador">Coordenador</option>
              <option value="supervisor">Supervisor</option>
              <option value="instrutor">Instrutor</option>
              <option value="leitor">Leitor</option>
            </select>
          </div>

          <div className="w-48">
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
          <span>Novo Usuário</span>
        </Button>
      </div>

      {/* Tabela de Usuários */}
      {filteredUsuarios.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="Nenhum usuário encontrado"
          description={
            searchTerm || selectedPapel !== "todos" || selectedObjetoId !== "todos"
              ? "Tente ajustar os filtros ou termo de busca."
              : "Cadastre contas de login e defina papéis e escopo de projetos para a equipe."
          }
          actionLabel={
            !searchTerm && selectedPapel === "todos" && selectedObjetoId === "todos"
              ? "Criar Usuário"
              : undefined
          }
          onAction={
            !searchTerm && selectedPapel === "todos" && selectedObjetoId === "todos"
              ? openCreateModal
              : undefined
          }
        />
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário / Login</TableHead>
                <TableHead>Papel RBAC</TableHead>
                <TableHead>Escopo de Projetos (§4.2)</TableHead>
                <TableHead>Vínculo RH (§3.2)</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsuarios.map((u) => {
                const papelMeta = PAPEIS_INFO[u.papel] ?? {
                  label: u.papel,
                  variant: "outline" as const,
                  desc: "",
                };

                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">
                          {u.nome_completo ?? "Sem nome"}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {u.email ?? "E-mail não informado"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={papelMeta.variant}>{papelMeta.label}</Badge>
                    </TableCell>
                    <TableCell>
                      {u.papel === "super_admin" ? (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <FolderLock className="h-3.5 w-3.5" />
                          <span>Global (Todos os Projetos)</span>
                        </span>
                      ) : u.acessos.length === 0 ? (
                        <span className="text-xs text-destructive italic">
                          Nenhum projeto atribuído
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {u.acessos.map((ac) => (
                            <Badge key={ac.id} variant="outline" className="text-[11px]">
                              {ac.objeto_nome}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {u.funcionario ? (
                        <div className="flex items-center gap-1 text-xs">
                          <UserCheck className="h-3.5 w-3.5 text-green-500" />
                          <span>{u.funcionario.nome_completo}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">
                          Apenas Login
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.ativo ? "default" : "secondary"}>
                        {u.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleOpenToggle(u)}
                          title={u.ativo ? "Desativar usuário" : "Ativar usuário"}
                        >
                          <Power
                            className={`h-4 w-4 ${u.ativo ? "text-muted-foreground" : "text-green-500"}`}
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEditModal(u)}
                          title="Editar permissões"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleOpenDelete(u)}
                          title="Excluir usuário"
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
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-4">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? "Editar Usuário & Acessos" : "Novo Usuário do Sistema"}
              </DialogTitle>
              <DialogDescription>
                Controle de autenticação, atribuição de papel institucional e escopo de projetos (§4).
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
                <Label htmlFor="nome_completo">Nome Completo *</Label>
                <Input
                  id="nome_completo"
                  required
                  placeholder="Nome do usuário"
                  value={formData.nome_completo}
                  onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail de Acesso (Login) *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  disabled={!!editingItem}
                  placeholder="usuario@andorinha.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                {editingItem && (
                  <p className="text-[11px] text-muted-foreground">
                    O e-mail de login de contas existentes não pode ser alterado diretamente.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="senha">
                  {editingItem ? "Redefinir Senha (opcional)" : "Senha de Acesso *"}
                </Label>
                <Input
                  id="senha"
                  type="password"
                  required={!editingItem}
                  placeholder={editingItem ? "Deixe em branco para manter a senha atual" : "Mínimo 6 caracteres"}
                  value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="papel">Papel Institucional (RBAC §4.1) *</Label>
                <select
                  id="papel"
                  required
                  value={formData.papel}
                  onChange={(e) =>
                    handlePapelChange(e.target.value as typeof formData.papel)
                  }
                  className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="super_admin">Super Admin (Acesso irrestrito a todo o sistema)</option>
                  <option value="admin_geral">Admin Geral (Gestão executiva da OSC)</option>
                  <option value="coordenador">Coordenador (Gestão regional de polos e relatórios)</option>
                  <option value="supervisor">Supervisor (Auditoria e vistorias de campo)</option>
                  <option value="instrutor">Instrutor (Chamadas nominais e ponto eletrônico)</option>
                  <option value="leitor">Leitor / Auditor (Consulta pública e auditoria)</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  {PAPEIS_INFO[formData.papel]?.desc}
                </p>
              </div>

              {formData.papel !== "super_admin" && (
                <div className="space-y-2 pt-1 border-t border-border">
                  <Label>Escopo de Projetos Autorizados (§4.2)</Label>
                  <p className="text-xs text-muted-foreground">
                    Selecione quais projetos este usuário poderá visualizar e operar:
                  </p>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 border border-border rounded-md p-2 bg-muted/20">
                    {objetos.map((obj) => (
                      <label
                        key={obj.id}
                        className="flex items-center gap-2 text-sm p-1.5 rounded hover:bg-muted/50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.objetos_ids.includes(obj.id)}
                          onChange={() => toggleObjetoSelection(obj.id)}
                          className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                        />
                        <span>{obj.nome}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Seção de Vínculo de RH Dinâmico para Papéis de Campo (§3.2 e §4.1) */}
              {["instrutor", "supervisor", "coordenador"].includes(formData.papel) && (
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-3.5 space-y-3">
                    <div className="flex items-center justify-between border-b border-primary/20 pb-2">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-primary" />
                        <Label className="font-semibold text-foreground text-sm">
                          Vínculo Trabalhista / RH do Profissional
                        </Label>
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-background">
                        Prestação de Contas
                      </Badge>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Como o perfil atua diretamente nas atividades em campo, configure o registro de RH para prestação de contas:
                    </p>

                    {/* Alternador de Modo de RH */}
                    <div className="grid grid-cols-3 gap-1.5 p-1 bg-background/80 rounded-md border text-xs">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, rhMode: "novo" }))
                        }
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded font-medium transition-colors ${
                          formData.rhMode === "novo"
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <UserPlus className="h-3.5 w-3.5" />
                        <span>{editingItem?.funcionario ? "Dados do RH" : "Novo RH"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, rhMode: "existente" }))
                        }
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded font-medium transition-colors ${
                          formData.rhMode === "existente"
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <Link2 className="h-3.5 w-3.5" />
                        <span>Vincular Existente</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, rhMode: "nenhum" }))
                        }
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded font-medium transition-colors ${
                          formData.rhMode === "nenhum"
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <span>Sem Vínculo</span>
                      </button>
                    </div>

                    {/* Formulário de Novo RH */}
                    {formData.rhMode === "novo" && (
                      <div className="space-y-3 pt-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label htmlFor="novo_cpf" className="text-xs">
                              CPF do Colaborador *
                            </Label>
                            <Input
                              id="novo_cpf"
                              value={formData.novo_cpf}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  novo_cpf: maskCpf(e.target.value),
                                }))
                              }
                              placeholder="000.000.000-00"
                              maxLength={14}
                              className="h-8 text-xs bg-background"
                              required
                            />
                          </div>

                          <div className="space-y-1">
                            <Label htmlFor="novo_cargo" className="text-xs">
                              Cargo Contratual *
                            </Label>
                            <Input
                              id="novo_cargo"
                              value={formData.novo_cargo}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  novo_cargo: e.target.value,
                                }))
                              }
                              placeholder="Ex: Instrutor de Futebol"
                              className="h-8 text-xs bg-background"
                              required
                            />
                          </div>

                          <div className="space-y-1">
                            <Label htmlFor="novo_org" className="text-xs">
                              OSC / Empregadora *
                            </Label>
                            <select
                              id="novo_org"
                              value={formData.novo_organizacao_id}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  novo_organizacao_id: e.target.value,
                                }))
                              }
                              className="h-8 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                              required
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

                          <div className="space-y-1">
                            <Label htmlFor="novo_obj" className="text-xs">
                              Projeto Social de Alocação *
                            </Label>
                            <select
                              id="novo_obj"
                              value={formData.novo_objeto_id}
                              onChange={(e) => handleNovoObjetoChange(e.target.value)}
                              className="h-8 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                              required
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

                          <div className="space-y-1">
                            <Label htmlFor="novo_loc" className="text-xs">
                              Polo / Núcleo de Atuação
                            </Label>
                            <select
                              id="novo_loc"
                              value={formData.novo_local_id}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  novo_local_id: e.target.value,
                                }))
                              }
                              className="h-8 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            >
                              <option value="">Sem polo fixo / Equipe geral</option>
                              {locaisParaRh.map((loc) => (
                                <option key={loc.id} value={loc.id}>
                                  {loc.nome}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1">
                            <Label htmlFor="novo_tel" className="text-xs">
                              Telefone / WhatsApp
                            </Label>
                            <Input
                              id="novo_tel"
                              value={formData.novo_telefone}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  novo_telefone: maskPhone(e.target.value),
                                }))
                              }
                              placeholder="(00) 00000-0000"
                              maxLength={15}
                              className="h-8 text-xs bg-background"
                            />
                          </div>
                        </div>
                        <p className="text-[11px] text-muted-foreground pt-1">
                          {editingItem?.funcionario
                            ? "✓ Os dados do usuário e a ficha de RH vinculada serão atualizados simultaneamente."
                            : "✓ O login do usuário e a ficha de RH serão criados e vinculados simultaneamente."}
                        </p>
                      </div>
                    )}

                    {/* Vincular a Funcionário Já Existente */}
                    {formData.rhMode === "existente" && (
                      <div className="space-y-1.5 pt-1">
                        <Label htmlFor="funcionario_id_select" className="text-xs">
                          Selecione o Funcionário Cadastrado
                        </Label>
                        <select
                          id="funcionario_id_select"
                          value={formData.funcionario_id}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              funcionario_id: e.target.value,
                            }))
                          }
                          className="h-8 w-full rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                          <option value="">Selecione na lista de colaboradores...</option>
                          {funcionarios.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.nome_completo} ({f.cargo})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Sem Vínculo */}
                    {formData.rhMode === "nenhum" && (
                      <p className="text-xs text-muted-foreground italic p-2 bg-background/60 rounded border border-dashed">
                        Este usuário terá acesso ao sistema com o perfil selecionado, mas não gerará registro na folha de RH nem estará associado a um contrato de trabalho no convênio.
                      </p>
                    )}
                  </div>
                )}

              {/* Seção Simples de Vínculo para Papéis Administrativos */}
              {!["instrutor", "supervisor", "coordenador"].includes(formData.papel) && (
                <div className="space-y-1.5 pt-1 border-t border-border">
                  <Label htmlFor="funcionario_id">Vínculo com Funcionário (RH de Campo Opcional)</Label>
                  <select
                    id="funcionario_id"
                    value={formData.funcionario_id}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        funcionario_id: e.target.value,
                      }))
                    }
                    className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">Apenas conta de acesso (sem vínculo em carteira)</option>
                    {funcionarios.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.nome_completo} ({f.cargo})
                      </option>
                    ))}
                  </select>
                </div>
              )}
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
                {loading ? "Salvando..." : editingItem ? "Salvar Alterações" : "Criar Usuário"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Alternância de Status */}
      <ConfirmDialog
        open={toggleOpen}
        onOpenChange={setToggleOpen}
        title={toggleTarget?.ativo ? "Desativar Usuário" : "Ativar Usuário"}
        description={`Tem certeza que deseja ${toggleTarget?.ativo ? "desativar" : "ativar"} o usuário "${toggleTarget?.nome_completo}"? Usuários desativados perdem o acesso imediato ao sistema.`}
        confirmLabel={toggleTarget?.ativo ? "Sim, desativar" : "Sim, ativar"}
        cancelLabel="Cancelar"
        variant={toggleTarget?.ativo ? "destructive" : "default"}
        onConfirm={handleConfirmToggle}
      />

      {/* Modal de Confirmação de Exclusão */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir Usuário"
        description={
          deleteError
            ? deleteError
            : `Tem certeza que deseja excluir o usuário "${deleteTarget?.nome_completo}"? O acesso será revogado permanentemente.`
        }
        confirmLabel="Sim, excluir"
        cancelLabel="Cancelar"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
