"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import type { BeneficiarioListItem } from "@/lib/actions/beneficiarios";
import {
  createBeneficiario,
  updateBeneficiario,
  deleteBeneficiario,
} from "@/lib/actions/beneficiarios";
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
  Eye,
  EyeOff,
  UserCheck,
  ShieldAlert,
  Baby,
  AlertCircle,
  FileText,
} from "lucide-react";
import { maskCpf, maskPhone } from "@/lib/utils/masks";

interface ObjetoSimple {
  id: string;
  nome: string;
}

interface BeneficiariosClientProps {
  initialBeneficiarios: BeneficiarioListItem[];
  objetos: ObjetoSimple[];
}

interface BeneficiarioFormData {
  nome_completo: string;
  cpf: string;
  data_nascimento: string;
  genero: "M" | "F" | "Outro" | "Nao_informado";
  telefone: string;
  nome_responsavel: string;
  telefone_responsavel: string;
}

const initialFormState: BeneficiarioFormData = {
  nome_completo: "",
  cpf: "",
  data_nascimento: "",
  genero: "M",
  telefone: "",
  nome_responsavel: "",
  telefone_responsavel: "",
};

function formatarCpf(cpf: string): string {
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11) return cpf;
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function mascaraCpfPrivacidade(cpf: string): string {
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11) return cpf;
  return clean.replace(/(\d{3})\d{3}\d{3}(\d{2})/, "$1.***.***-$2");
}

function calcularIdade(dataNascimento: string): number {
  if (!dataNascimento) return 0;
  const parts = dataNascimento.split("-").map(Number);
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    return 0;
  }
  const [ano, mes, dia] = parts;
  const nasc = new Date(ano, mes - 1, dia);
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
    idade--;
  }
  return idade >= 0 ? idade : 0;
}

export function BeneficiariosClient({
  initialBeneficiarios,
  objetos,
}: BeneficiariosClientProps) {
  const [beneficiarios, setBeneficiarios] =
    useState<BeneficiarioListItem[]>(initialBeneficiarios);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroObjeto, setFiltroObjeto] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroVulneravel, setFiltroVulneravel] = useState("todos");
  const [mostrarCpfCompleto, setMostrarCpfCompleto] = useState(false);

  // Modal de Criação / Edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<BeneficiarioFormData>(initialFormState);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Modal de Exclusão
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingNome, setDeletingNome] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const idadeCalculadaForm = useMemo(
    () => calcularIdade(formData.data_nascimento),
    [formData.data_nascimento]
  );
  const isMenorDeIdadeForm = Boolean(formData.data_nascimento && idadeCalculadaForm < 18);

  const filteredBeneficiarios = useMemo(() => {
    return beneficiarios.filter((b) => {
      // Busca por nome ou CPF
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const cleanTerm = term.replace(/\D/g, "");
        const nomeMatch = b.nome_completo.toLowerCase().includes(term);
        const cpfMatch = cleanTerm.length >= 3 && b.cpf.includes(cleanTerm);
        if (!nomeMatch && !cpfMatch) return false;
      }

      // Filtro por Projeto
      if (filtroObjeto !== "todos") {
        const participa = b.matriculas.some((m) => m.objeto_id === filtroObjeto);
        if (!participa) return false;
      }

      // Filtro por Status
      if (filtroStatus !== "todos") {
        const temStatus = b.matriculas.some((m) => m.status === filtroStatus);
        if (!temStatus) return false;
      }

      // Filtro por Vulnerabilidade
      if (filtroVulneravel === "sim") {
        const isVuln = b.matriculas.some((m) => m.vulneravel);
        if (!isVuln) return false;
      } else if (filtroVulneravel === "nao") {
        const isReg = b.matriculas.every((m) => !m.vulneravel);
        if (!isReg) return false;
      }

      return true;
    });
  }, [beneficiarios, searchTerm, filtroObjeto, filtroStatus, filtroVulneravel]);

  // Estatísticas Rápidas
  const stats = useMemo(() => {
    const total = beneficiarios.length;
    const comAtivas = beneficiarios.filter((b) => b.matriculas_ativas > 0).length;
    const menores = beneficiarios.filter((b) => b.idade < 18).length;
    const vulneraveis = beneficiarios.filter((b) =>
      b.matriculas.some((m) => m.vulneravel)
    ).length;
    return { total, comAtivas, menores, vulneraveis };
  }, [beneficiarios]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: BeneficiarioListItem) => {
    setEditingId(b.id);
    setFormData({
      nome_completo: b.nome_completo,
      cpf: b.cpf ? maskCpf(b.cpf) : "",
      data_nascimento: b.data_nascimento,
      genero: b.genero as BeneficiarioFormData["genero"],
      telefone: b.telefone ? maskPhone(b.telefone) : "",
      nome_responsavel: b.nome_responsavel || "",
      telefone_responsavel: b.telefone_responsavel ? maskPhone(b.telefone_responsavel) : "",
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, cpf: maskCpf(e.target.value) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSaving(true);

    try {
      const payload = {
        nome_completo: formData.nome_completo.trim(),
        cpf: formData.cpf.replace(/\D/g, ""),
        data_nascimento: formData.data_nascimento,
        genero: formData.genero,
        telefone: formData.telefone.trim() || null,
        nome_responsavel: formData.nome_responsavel.trim() || null,
        telefone_responsavel: formData.telefone_responsavel.trim() || null,
      };

      if (editingId) {
        const res = await updateBeneficiario(editingId, payload);
        if (!res.success) {
          setFormError(res.error || "Erro ao atualizar beneficiário");
          setIsSaving(false);
          return;
        }

        setBeneficiarios((prev) =>
          prev.map((item) =>
            item.id === editingId
              ? {
                  ...item,
                  nome_completo: payload.nome_completo,
                  cpf: payload.cpf,
                  data_nascimento: payload.data_nascimento,
                  genero: payload.genero,
                  telefone: payload.telefone,
                  nome_responsavel: payload.nome_responsavel,
                  telefone_responsavel: payload.telefone_responsavel,
                  idade: calcularIdade(payload.data_nascimento),
                }
              : item
          )
        );
      } else {
        const res = await createBeneficiario(payload);
        if (!res.success || !res.data) {
          setFormError(res.error || "Erro ao cadastrar beneficiário");
          setIsSaving(false);
          return;
        }

        const novo: BeneficiarioListItem = {
          id: res.data.id,
          nome_completo: res.data.nome_completo,
          cpf: res.data.cpf,
          data_nascimento: res.data.data_nascimento,
          genero: res.data.genero,
          telefone: res.data.telefone,
          nome_responsavel: res.data.nome_responsavel,
          telefone_responsavel: res.data.telefone_responsavel,
          idade: calcularIdade(res.data.data_nascimento),
          total_matriculas: 0,
          matriculas_ativas: 0,
          matriculas: [],
          criado_em: res.data.criado_em,
          atualizado_em: res.data.atualizado_em,
        };

        setBeneficiarios((prev) => [novo, ...prev]);
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

  const handleOpenDelete = (b: BeneficiarioListItem) => {
    setDeletingId(b.id);
    setDeletingNome(b.nome_completo);
    setDeleteError(null);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    setDeleteError(null);

    const res = await deleteBeneficiario(deletingId);
    if (!res.success) {
      setDeleteError(res.error || "Erro ao excluir beneficiário");
      setIsDeleting(false);
      return;
    }

    setBeneficiarios((prev) => prev.filter((item) => item.id !== deletingId));
    setIsDeleting(false);
    setDeleteConfirmOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Beneficiários & Cidadãos
          </h1>
          <p className="text-sm text-muted-foreground">
            Cadastro civil universal único por CPF, desacoplado dos projetos e
            grupos vinculados.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMostrarCpfCompleto(!mostrarCpfCompleto)}
            title="Alternar privacidade de exibição do CPF"
          >
            {mostrarCpfCompleto ? (
              <>
                <EyeOff className="mr-2 h-4 w-4" /> Mascarar CPF
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" /> Mostrar CPF
              </>
            )}
          </Button>
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" /> Novo Beneficiário
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Total de Cidadãos
              </p>
              <h3 className="text-2xl font-bold text-foreground">
                {stats.total}
              </h3>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Com Matrícula Ativa
              </p>
              <h3 className="text-2xl font-bold text-foreground">
                {stats.comAtivas}
              </h3>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Baby className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Menores de 18 Anos
              </p>
              <h3 className="text-2xl font-bold text-foreground">
                {stats.menores}
              </h3>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Cota de Vulnerabilidade
              </p>
              <h3 className="text-2xl font-bold text-foreground">
                {stats.vulneraveis}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros de Pesquisa */}
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome do beneficiário ou CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filtroObjeto}
            onChange={(e) => setFiltroObjeto(e.target.value)}
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
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="todos">Todos os Status</option>
            <option value="ativo">Matrícula Ativa</option>
            <option value="pre_inscrito">Pré-Inscrito</option>
            <option value="lista_espera">Lista de Espera</option>
            <option value="concluido">Concluído</option>
            <option value="cancelado">Cancelado</option>
          </select>

          <select
            value={filtroVulneravel}
            onChange={(e) => setFiltroVulneravel(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="todos">Vulnerabilidade (Todos)</option>
            <option value="sim">Sim (Cota MROSC)</option>
            <option value="nao">Não (Regular)</option>
          </select>
        </div>
      </div>

      {/* Tabela de Beneficiários */}
      <div className="rounded-lg border border-border bg-card">
        {filteredBeneficiarios.length === 0 ? (
          <EmptyState
            title="Nenhum beneficiário encontrado"
            description="Não encontramos registros que correspondam aos filtros selecionados. Cadastre um novo cidadão para iniciar."
            actionLabel="Cadastrar Beneficiário"
            onAction={handleOpenCreate}
            icon={Users}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Beneficiário / Cidadão</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Idade</TableHead>
                <TableHead>Contato & Responsável</TableHead>
                <TableHead>Matrículas Ativas</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBeneficiarios.map((b) => (
                <TableRow key={b.id}>
                  {/* Nome e Gênero */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {b.nome_completo
                          .split(" ")
                          .slice(0, 2)
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </div>
                      <div>
                        <Link
                          href={`/beneficiarios/${b.id}`}
                          className="font-medium text-foreground hover:underline"
                        >
                          {b.nome_completo}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">
                            {b.genero === "M"
                              ? "Masculino"
                              : b.genero === "F"
                              ? "Feminino"
                              : b.genero === "Outro"
                              ? "Outro"
                              : "Não informado"}
                          </span>
                          {b.matriculas.some((m) => m.vulneravel) && (
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-300 dark:border-amber-700 dark:text-amber-400 py-0"
                            >
                              Cota MROSC
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  {/* CPF */}
                  <TableCell className="font-mono text-xs">
                    {mostrarCpfCompleto
                      ? formatarCpf(b.cpf)
                      : mascaraCpfPrivacidade(b.cpf)}
                  </TableCell>

                  {/* Idade */}
                  <TableCell>
                    <div className="text-sm font-medium">
                      {b.idade} {b.idade === 1 ? "ano" : "anos"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Nasc: {b.data_nascimento.split("-").reverse().join("/")}
                    </div>
                  </TableCell>

                  {/* Contato & Responsável */}
                  <TableCell>
                    {b.telefone ? (
                      <div className="text-xs font-mono">{b.telefone}</div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sem telefone</span>
                    )}
                    {b.idade < 18 && (
                      <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                        <span className="font-medium text-foreground">Resp:</span>{" "}
                        {b.nome_responsavel || "Não informado"}
                      </div>
                    )}
                  </TableCell>

                  {/* Matrículas Ativas */}
                  <TableCell>
                    {b.matriculas.length === 0 ? (
                      <span className="text-xs text-muted-foreground">
                        Nenhuma matrícula
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {b.matriculas.map((m) => (
                          <Link key={m.id} href={`/grupos/${m.grupo_id}`}>
                            <Badge
                              variant="outline"
                              className={`text-[11px] cursor-pointer hover:bg-accent transition-colors ${
                                m.status === "ativo"
                                  ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                                  : m.status === "lista_espera"
                                  ? "border-amber-500 text-amber-600 dark:text-amber-400"
                                  : m.status === "pre_inscrito"
                                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                                  : "border-muted-foreground text-muted-foreground"
                              }`}
                            >
                              {m.grupo_nome}
                              {m.status !== "ativo" && (
                                <span className="ml-1 opacity-75">
                                  ({m.status === "lista_espera" ? "Fila" : m.status})
                                </span>
                              )}
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    )}
                  </TableCell>

                  {/* Ações */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/beneficiarios/${b.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Ver Ficha Completa"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenEdit(b)}
                        title="Editar Dados Civis"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleOpenDelete(b)}
                        title="Excluir Beneficiário"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Modal de Criação / Edição */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Beneficiário" : "Novo Beneficiário"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Atualize os dados civis cadastrais do cidadão."
                : "Cadastre o cidadão no registro civil universal único por CPF."}
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
                <Label htmlFor="nome_completo">
                  Nome Completo <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nome_completo"
                  required
                  placeholder="Nome completo do cidadão"
                  value={formData.nome_completo}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      nome_completo: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">
                  CPF <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cpf"
                  required
                  placeholder="000.000.000-00"
                  value={formData.cpf}
                  onChange={handleCpfChange}
                  maxLength={14}
                  disabled={Boolean(editingId)} // CPF é imutável em edição para preservar integridade
                />
                {editingId && (
                  <p className="text-[11px] text-muted-foreground">
                    O CPF é a chave de identidade civil e não pode ser alterado.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_nascimento">
                  Data de Nascimento <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="data_nascimento"
                  type="date"
                  required
                  value={formData.data_nascimento}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      data_nascimento: e.target.value,
                    }))
                  }
                />
                {formData.data_nascimento && (
                  <p className="text-[11px] text-muted-foreground">
                    Idade calculada: {idadeCalculadaForm}{" "}
                    {idadeCalculadaForm === 1 ? "ano" : "anos"}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="genero">
                  Gênero <span className="text-destructive">*</span>
                </Label>
                <select
                  id="genero"
                  value={formData.genero}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      genero: e.target.value as BeneficiarioFormData["genero"],
                    }))
                  }
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                  <option value="Outro">Outro</option>
                  <option value="Nao_informado">Não informado</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone / WhatsApp</Label>
                <Input
                  id="telefone"
                  placeholder="(00) 00000-0000"
                  value={formData.telefone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, telefone: maskPhone(e.target.value) }))
                  }
                  maxLength={15}
                />
              </div>
            </div>

            {/* Alerta e campos de responsável se for menor de 18 anos */}
            {isMenorDeIdadeForm && (
              <div className="mt-4 rounded-lg border border-amber-300 bg-amber-500/10 p-4 dark:border-amber-700">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-medium text-sm mb-2">
                  <Baby className="h-4 w-4" />
                  <span>
                    Participante Menor de 18 Anos — Responsável Legal Obrigatório
                  </span>
                </div>
                <p className="text-xs text-amber-700/80 dark:text-amber-300/80 mb-3">
                  Pela legislação civil e exigências do MROSC, menores de idade
                  devem possuir um responsável legal registrado no sistema.
                </p>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="nome_responsavel" className="text-xs">
                      Nome do Responsável Legal{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="nome_responsavel"
                      required={isMenorDeIdadeForm}
                      placeholder="Nome do pai, mãe ou tutor"
                      value={formData.nome_responsavel}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          nome_responsavel: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="telefone_responsavel" className="text-xs">
                      Telefone do Responsável
                    </Label>
                    <Input
                      id="telefone_responsavel"
                      placeholder="(00) 00000-0000"
                      value={formData.telefone_responsavel}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          telefone_responsavel: maskPhone(e.target.value),
                        }))
                      }
                      maxLength={15}
                    />
                  </div>
                </div>
              </div>
            )}

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
                  : "Cadastrar Beneficiário"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Exclusão */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Excluir Beneficiário"
        description={`Tem certeza que deseja excluir o cidadão "${deletingNome}"? Essa ação apagará o cadastro civil do sistema. Se houver matrículas vinculadas, o cancelamento prévio das matrículas será exigido.`}
        confirmLabel={isDeleting ? "Excluindo..." : "Excluir Definitivamente"}
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
      {deleteError && (
        <Dialog open={Boolean(deleteError)} onOpenChange={() => setDeleteError(null)}>
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
