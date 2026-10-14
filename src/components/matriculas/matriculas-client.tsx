"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import type { MatriculaListItem } from "@/lib/actions/matriculas";
import {
  createMatricula,
  updateMatricula,
  cancelarMatricula,
  reativarMatricula,
  promoverFilaEspera,
  deleteMatricula,
} from "@/lib/actions/matriculas";
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
  UserCheck,
  ShieldAlert,
  Users,
  Clock,
  Ban,
  RotateCcw,
  Trash2,
  AlertCircle,
  ExternalLink,
  ChevronUp,
  MapPin,
} from "lucide-react";

interface ObjetoSimple {
  id: string;
  nome: string;
  termo_grupo: string;
  termo_beneficiario: string;
}

interface LocalSimple {
  id: string;
  nome: string;
  objeto_id: string;
}

interface GrupoSimple {
  id: string;
  nome: string;
  objeto_id: string;
  local_id: string;
  capacidade_maxima: number;
  idade_minima: number | null;
  idade_maxima: number | null;
  vagas_ocupadas: number;
}

interface BeneficiarioSimple {
  id: string;
  nome_completo: string;
  cpf: string;
  idade: number;
  data_nascimento: string;
}

interface MatriculasClientProps {
  initialMatriculas: MatriculaListItem[];
  objetos: ObjetoSimple[];
  locais: LocalSimple[];
  grupos: GrupoSimple[];
  beneficiarios: BeneficiarioSimple[];
}

function formatarCpf(cpf: string): string {
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11) return cpf;
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export function MatriculasClient({
  initialMatriculas,
  objetos,
  locais,
  grupos,
  beneficiarios,
}: MatriculasClientProps) {
  const [matriculas, setMatriculas] =
    useState<MatriculaListItem[]>(initialMatriculas);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroObjeto, setFiltroObjeto] = useState("todos");
  const [filtroLocal, setFiltroLocal] = useState("todos");
  const [filtroGrupo, setFiltroGrupo] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroVulneravel, setFiltroVulneravel] = useState("todos");

  // Modal Nova Matrícula
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formBeneficiarioId, setFormBeneficiarioId] = useState("");
  const [formObjetoId, setFormObjetoId] = useState("");
  const [formLocalId, setFormLocalId] = useState("");
  const [formGrupoId, setFormGrupoId] = useState("");
  const [formDataMatricula, setFormDataMatricula] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [formStatus, setFormStatus] = useState<
    "ativo" | "lista_espera" | "pre_inscrito"
  >("ativo");
  const [formVulneravel, setFormVulneravel] = useState(false);
  const [formSearchBenef, setFormSearchBenef] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Modal Cancelamento
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null);
  const [cancelTargetNome, setCancelTargetNome] = useState("");
  const [motivoCancelamento, setMotivoCancelamento] = useState("");
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);

  // Confirmação de Exclusão
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteTargetNome, setDeleteTargetNome] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Grupos e Locais filtrados para o formulário
  const locaisForm = useMemo(() => {
    if (!formObjetoId) return [];
    return locais.filter((l) => l.objeto_id === formObjetoId);
  }, [formObjetoId, locais]);

  const gruposForm = useMemo(() => {
    if (!formLocalId) return [];
    return grupos.filter((g) => g.local_id === formLocalId);
  }, [formLocalId, grupos]);

  const beneficiarioSelecionado = useMemo(() => {
    return beneficiarios.find((b) => b.id === formBeneficiarioId) || null;
  }, [formBeneficiarioId, beneficiarios]);

  const grupoSelecionado = useMemo(() => {
    return grupos.find((g) => g.id === formGrupoId) || null;
  }, [formGrupoId, grupos]);

  // Validação de Faixa Etária em tempo real no formulário
  const validacaoFaixaEtaria = useMemo(() => {
    if (!beneficiarioSelecionado || !grupoSelecionado) return null;
    const idade = beneficiarioSelecionado.idade;
    const min = grupoSelecionado.idade_minima;
    const max = grupoSelecionado.idade_maxima;

    if (min !== null && idade < min) {
      return {
        valido: false,
        mensagem: `Idade insuficiente: o participante tem ${idade} anos, mas a idade mínima é ${min} anos.`,
      };
    }
    if (max !== null && idade > max) {
      return {
        valido: false,
        mensagem: `Idade excedente: o participante tem ${idade} anos, mas a idade máxima é ${max} anos.`,
      };
    }
    return {
      valido: true,
      mensagem: `Faixa etária compatível (${idade} anos).`,
    };
  }, [beneficiarioSelecionado, grupoSelecionado]);

  // KPIs
  const stats = useMemo(() => {
    const total = matriculas.length;
    const ativas = matriculas.filter((m) => m.status === "ativo").length;
    const espera = matriculas.filter(
      (m) => m.status === "lista_espera" || m.status === "pre_inscrito"
    ).length;
    const vulneraveis = matriculas.filter((m) => m.vulneravel).length;
    const pctVulneravel = total > 0 ? Math.round((vulneraveis / total) * 100) : 0;
    return { total, ativas, espera, vulneraveis, pctVulneravel };
  }, [matriculas]);

  // Beneficiários filtrados na busca do modal
  const beneficiariosFiltradosModal = useMemo(() => {
    if (!formSearchBenef.trim()) return beneficiarios.slice(0, 10);
    const term = formSearchBenef.toLowerCase().trim();
    const cleanDigits = term.replace(/\D/g, "");
    return beneficiarios
      .filter((b) => {
        const nomeMatch = b.nome_completo.toLowerCase().includes(term);
        const cpfMatch = cleanDigits.length >= 3 && b.cpf.includes(cleanDigits);
        return nomeMatch || cpfMatch;
      })
      .slice(0, 15);
  }, [beneficiarios, formSearchBenef]);

  // Filtros da Listagem
  const filteredMatriculas = useMemo(() => {
    return matriculas.filter((m) => {
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const cleanDigits = term.replace(/\D/g, "");
        const nomeMatch = m.beneficiario.nome_completo.toLowerCase().includes(term);
        const cpfMatch = cleanDigits.length >= 3 && m.beneficiario.cpf.includes(cleanDigits);
        const grupoMatch = m.grupo.nome.toLowerCase().includes(term);
        if (!nomeMatch && !cpfMatch && !grupoMatch) return false;
      }

      if (filtroObjeto !== "todos" && m.objeto_id !== filtroObjeto) {
        return false;
      }

      if (filtroLocal !== "todos" && m.grupo.local?.id !== filtroLocal) {
        return false;
      }

      if (filtroGrupo !== "todos" && m.grupo_id !== filtroGrupo) {
        return false;
      }

      if (filtroStatus !== "todos" && m.status !== filtroStatus) {
        return false;
      }

      if (filtroVulneravel === "sim" && !m.vulneravel) return false;
      if (filtroVulneravel === "nao" && m.vulneravel) return false;

      return true;
    });
  }, [
    matriculas,
    searchTerm,
    filtroObjeto,
    filtroLocal,
    filtroGrupo,
    filtroStatus,
    filtroVulneravel,
  ]);

  const handleOpenCreate = () => {
    setFormBeneficiarioId("");
    const primeiroObjeto = objetos.length > 0 ? objetos[0].id : "";
    const locaisDoObjeto = locais.filter((l) => l.objeto_id === primeiroObjeto);
    const primeiroLocal = locaisDoObjeto.length > 0 ? locaisDoObjeto[0].id : "";
    const gruposDoLocal = grupos.filter((g) => g.local_id === primeiroLocal);
    const primeiroGrupo = gruposDoLocal.length > 0 ? gruposDoLocal[0].id : "";

    setFormObjetoId(primeiroObjeto);
    setFormLocalId(primeiroLocal);
    setFormGrupoId(primeiroGrupo);
    setFormDataMatricula(new Date().toISOString().split("T")[0]);
    setFormStatus("ativo");
    setFormVulneravel(false);
    setFormSearchBenef("");
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleObjetoChange = (objetoId: string) => {
    setFormObjetoId(objetoId);
    const locaisDoObjeto = locais.filter((l) => l.objeto_id === objetoId);
    const primeiroLocal = locaisDoObjeto.length > 0 ? locaisDoObjeto[0].id : "";
    setFormLocalId(primeiroLocal);
    const gruposDoLocal = grupos.filter((g) => g.local_id === primeiroLocal);
    setFormGrupoId(gruposDoLocal.length > 0 ? gruposDoLocal[0].id : "");
  };

  const handleLocalChange = (localId: string) => {
    setFormLocalId(localId);
    const gruposDoLocal = grupos.filter((g) => g.local_id === localId);
    setFormGrupoId(gruposDoLocal.length > 0 ? gruposDoLocal[0].id : "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formBeneficiarioId) {
      setFormError("Selecione um beneficiário para efetuar a matrícula.");
      return;
    }

    if (!formGrupoId) {
      setFormError("Selecione um grupo para a matrícula.");
      return;
    }

    if (validacaoFaixaEtaria && !validacaoFaixaEtaria.valido) {
      setFormError(validacaoFaixaEtaria.mensagem);
      return;
    }

    setIsSaving(true);

    try {
      const res = await createMatricula({
        objeto_id: formObjetoId,
        grupo_id: formGrupoId,
        beneficiario_id: formBeneficiarioId,
        data_matricula: formDataMatricula,
        status: formStatus,
        vulneravel: formVulneravel,
        dados_adicionais: {},
      });

      if (!res.success || !res.data) {
        setFormError(res.error || "Erro ao criar matrícula");
        setIsSaving(false);
        return;
      }

      // Atualizar lista local
      const bSel = beneficiarios.find((b) => b.id === formBeneficiarioId);
      const oSel = objetos.find((o) => o.id === formObjetoId);
      const gSel = grupos.find((g) => g.id === formGrupoId);
      const lSel = locais.find((l) => l.id === formLocalId);

      const nova: MatriculaListItem = {
        id: res.data.id,
        objeto_id: formObjetoId,
        grupo_id: formGrupoId,
        beneficiario_id: formBeneficiarioId,
        status: formStatus,
        vulneravel: formVulneravel,
        dados_adicionais: {},
        data_matricula: formDataMatricula,
        data_cancelamento: null,
        motivo_cancelamento: null,
        criado_em: res.data.criado_em,
        atualizado_em: res.data.atualizado_em,
        beneficiario: {
          id: bSel?.id || formBeneficiarioId,
          nome_completo: bSel?.nome_completo || "Beneficiário",
          cpf: bSel?.cpf || "",
          data_nascimento: bSel?.data_nascimento || "",
          genero: "Nao_informado",
          telefone: null,
          nome_responsavel: null,
          telefone_responsavel: null,
          idade: bSel?.idade || 0,
        },
        objeto: {
          id: oSel?.id || formObjetoId,
          nome: oSel?.nome || "Projeto",
          tipo: "continuo",
          termo_grupo: oSel?.termo_grupo || "Grupo",
          termo_beneficiario: oSel?.termo_beneficiario || "Beneficiário",
          termo_local: "Local",
        },
        grupo: {
          id: gSel?.id || formGrupoId,
          nome: gSel?.nome || "Grupo",
          capacidade_maxima: gSel?.capacidade_maxima || 25,
          idade_minima: gSel?.idade_minima ?? null,
          idade_maxima: gSel?.idade_maxima ?? null,
          ativo: true,
          local: lSel ? { id: lSel.id, nome: lSel.nome } : null,
          modalidade: null,
        },
      };

      setMatriculas((prev) => [nova, ...prev]);
      setIsModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar matrícula";
      setFormError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleVulneravel = async (mat: MatriculaListItem) => {
    const novoValor = !mat.vulneravel;
    const res = await updateMatricula(mat.id, { vulneravel: novoValor });
    if (res.success) {
      setMatriculas((prev) =>
        prev.map((m) => (m.id === mat.id ? { ...m, vulneravel: novoValor } : m))
      );
    }
  };

  const handleOpenCancel = (mat: MatriculaListItem) => {
    setCancelTargetId(mat.id);
    setCancelTargetNome(mat.beneficiario.nome_completo);
    setMotivoCancelamento("");
    setCancelError(null);
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancelTargetId) return;
    if (!motivoCancelamento.trim()) {
      setCancelError("O motivo do cancelamento é obrigatório.");
      return;
    }

    setIsCanceling(true);
    setCancelError(null);

    const res = await cancelarMatricula(cancelTargetId, motivoCancelamento);
    if (!res.success) {
      setCancelError(res.error || "Erro ao cancelar matrícula");
      setIsCanceling(false);
      return;
    }

    setMatriculas((prev) =>
      prev.map((m) =>
        m.id === cancelTargetId
          ? {
              ...m,
              status: "cancelado",
              data_cancelamento: new Date().toISOString().split("T")[0],
              motivo_cancelamento: motivoCancelamento.trim(),
            }
          : m
      )
    );

    setIsCanceling(false);
    setCancelModalOpen(false);
  };

  const handleReativar = async (mat: MatriculaListItem) => {
    const res = await reativarMatricula(mat.id);
    if (res.success && res.data) {
      setMatriculas((prev) =>
        prev.map((m) =>
          m.id === mat.id
            ? {
                ...m,
                status: res.data.status as MatriculaListItem["status"],
                data_cancelamento: null,
                motivo_cancelamento: null,
              }
            : m
        )
      );
    }
  };

  const handlePromover = async (mat: MatriculaListItem) => {
    const res = await promoverFilaEspera(mat.id);
    if (res.success) {
      setMatriculas((prev) =>
        prev.map((m) => (m.id === mat.id ? { ...m, status: "ativo" } : m))
      );
    } else {
      alert(res.error || "Não foi possível promover da fila de espera.");
    }
  };

  const handleOpenDelete = (mat: MatriculaListItem) => {
    setDeleteTargetId(mat.id);
    setDeleteTargetNome(mat.beneficiario.nome_completo);
    setDeleteError(null);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    setDeleteError(null);

    const res = await deleteMatricula(deleteTargetId);
    if (!res.success) {
      setDeleteError(res.error || "Erro ao excluir matrícula");
      setIsDeleting(false);
      return;
    }

    setMatriculas((prev) => prev.filter((m) => m.id !== deleteTargetId));
    setIsDeleting(false);
    setDeleteConfirmOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Gestão de Matrículas & Inscrições
          </h1>
          <p className="text-sm text-muted-foreground">
            Controle de vínculos entre cidadãos e grupos de atendimento com validação rígida de faixa etária e cotas MROSC (§3.3).
          </p>
        </div>

        <Button onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" /> Nova Matrícula
        </Button>
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
                Total de Matrículas
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
                Matrículas Ativas
              </p>
              <h3 className="text-2xl font-bold text-foreground">
                {stats.ativas}
              </h3>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Fila de Espera / Pré-Inscritos
              </p>
              <h3 className="text-2xl font-bold text-foreground">
                {stats.espera}
              </h3>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Cota de Vulnerabilidade
              </p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-bold text-foreground">
                  {stats.vulneraveis}
                </h3>
                <span className="text-xs text-muted-foreground">
                  ({stats.pctVulneravel}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por beneficiário, CPF ou grupo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filtroObjeto}
            onChange={(e) => {
              setFiltroObjeto(e.target.value);
              setFiltroLocal("todos");
              setFiltroGrupo("todos");
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
            onChange={(e) => {
              setFiltroLocal(e.target.value);
              setFiltroGrupo("todos");
            }}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="todos">Todos os Locais</option>
            {locais
              .filter((l) => filtroObjeto === "todos" || l.objeto_id === filtroObjeto)
              .map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.nome}
                </option>
              ))}
          </select>

          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="todos">Todos os Status</option>
            <option value="ativo">Ativo</option>
            <option value="lista_espera">Lista de Espera</option>
            <option value="pre_inscrito">Pré-Inscrito</option>
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

      {/* Tabela de Matrículas */}
      <div className="rounded-lg border border-border bg-card">
        {filteredMatriculas.length === 0 ? (
          <EmptyState
            title="Nenhuma matrícula encontrada"
            description="Não encontramos matrículas com os filtros selecionados. Clique em Nova Matrícula para registrar um participante."
            actionLabel="Nova Matrícula"
            onAction={handleOpenCreate}
            icon={UserCheck}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Beneficiário</TableHead>
                <TableHead>Projeto & Local</TableHead>
                <TableHead>Grupo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cota MROSC</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMatriculas.map((mat) => {
                const b = mat.beneficiario;

                return (
                  <TableRow key={mat.id}>
                    {/* Beneficiário */}
                    <TableCell>
                      <div>
                        <Link
                          href={`/beneficiarios/${b.id}`}
                          className="font-medium text-foreground hover:underline flex items-center gap-1.5"
                        >
                          {b.nome_completo}
                          <ExternalLink className="h-3 w-3 opacity-40" />
                        </Link>
                        <div className="text-xs text-muted-foreground font-mono">
                          CPF: {formatarCpf(b.cpf)} • {b.idade} anos
                        </div>
                      </div>
                    </TableCell>

                    {/* Projeto & Local */}
                    <TableCell>
                      <div className="text-sm font-medium">
                        {mat.objeto.nome}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" />
                        <span>{mat.grupo.local?.nome || "Local não atribuído"}</span>
                      </div>
                    </TableCell>

                    {/* Grupo */}
                    <TableCell>
                      <Link
                        href={`/grupos/${mat.grupo_id}`}
                        className="text-sm font-medium hover:underline text-foreground"
                      >
                        {mat.grupo.nome}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {mat.objeto.termo_grupo}
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          mat.status === "ativo"
                            ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                            : mat.status === "lista_espera"
                            ? "border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-500/10"
                            : mat.status === "pre_inscrito"
                            ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-500/10"
                            : mat.status === "concluido"
                            ? "border-purple-500 text-purple-600 dark:text-purple-400"
                            : "border-destructive text-destructive bg-destructive/10"
                        }`}
                      >
                        {mat.status === "ativo"
                          ? "Ativo"
                          : mat.status === "lista_espera"
                          ? "Lista de Espera"
                          : mat.status === "pre_inscrito"
                          ? "Pré-Inscrito"
                          : mat.status === "concluido"
                          ? "Concluído"
                          : "Cancelado"}
                      </Badge>
                      {mat.status === "cancelado" && mat.motivo_cancelamento && (
                        <p
                          className="text-[10px] text-muted-foreground mt-0.5 max-w-[150px] truncate"
                          title={mat.motivo_cancelamento}
                        >
                          Motivo: {mat.motivo_cancelamento}
                        </p>
                      )}
                    </TableCell>

                    {/* Cota MROSC */}
                    <TableCell>
                      <button
                        onClick={() => handleToggleVulneravel(mat)}
                        title="Clique para alternar o status de vulnerabilidade social"
                        className="cursor-pointer"
                      >
                        {mat.vulneravel ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-300 dark:border-amber-700 py-0 hover:bg-amber-500/20"
                          >
                            Vulnerável (Cota)
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground hover:underline">
                            Regular
                          </span>
                        )}
                      </button>
                    </TableCell>

                    {/* Data */}
                    <TableCell className="text-xs text-muted-foreground">
                      <div>
                        {mat.data_matricula.split("-").reverse().join("/")}
                      </div>
                      {mat.data_cancelamento && (
                        <div className="text-[10px] text-destructive">
                          Canc: {mat.data_cancelamento.split("-").reverse().join("/")}
                        </div>
                      )}
                    </TableCell>

                    {/* Ações */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {(mat.status === "lista_espera" ||
                          mat.status === "pre_inscrito") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-emerald-600 hover:text-emerald-700"
                            onClick={() => handlePromover(mat)}
                            title="Promover para Vaga Ativa"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                        )}

                        {mat.status === "cancelado" ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600 hover:text-blue-700"
                            onClick={() => handleReativar(mat)}
                            title="Reativar Matrícula"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-amber-600 hover:text-amber-700"
                            onClick={() => handleOpenCancel(mat)}
                            title="Cancelar Matrícula"
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleOpenDelete(mat)}
                          title="Excluir Registro"
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

      {/* Modal Nova Matrícula */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Matrícula no Grupo</DialogTitle>
            <DialogDescription>
              Vincule um cidadão previamente cadastrado a um grupo ativo com verificação automática de restrições etárias.
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {/* Seleção do Beneficiário */}
            <div className="space-y-2 rounded-lg border border-border p-3 bg-muted/20">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                1. Selecione o Beneficiário <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar por nome ou CPF..."
                  value={formSearchBenef}
                  onChange={(e) => setFormSearchBenef(e.target.value)}
                  className="pl-8 text-xs h-8"
                />
              </div>

              <div className="max-h-36 overflow-y-auto space-y-1 mt-2 border border-border rounded p-1 bg-background">
                {beneficiariosFiltradosModal.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => setFormBeneficiarioId(b.id)}
                    className={`flex items-center justify-between p-2 rounded text-xs cursor-pointer transition-colors ${
                      formBeneficiarioId === b.id
                        ? "bg-primary text-primary-foreground font-medium"
                        : "hover:bg-muted"
                    }`}
                  >
                    <span>{b.nome_completo}</span>
                    <span className="font-mono opacity-80">
                      CPF: {formatarCpf(b.cpf)} ({b.idade} anos)
                    </span>
                  </div>
                ))}
              </div>

              {beneficiarioSelecionado && (
                <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>
                    Selecionado: {beneficiarioSelecionado.nome_completo} ({beneficiarioSelecionado.idade} anos)
                  </span>
                </div>
              )}
            </div>

            {/* Seleção de Destino */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="form_obj" className="text-xs">
                  Projeto / Objeto <span className="text-destructive">*</span>
                </Label>
                <select
                  id="form_obj"
                  required
                  value={formObjetoId}
                  onChange={(e) => handleObjetoChange(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {objetos.map((obj) => (
                    <option key={obj.id} value={obj.id}>
                      {obj.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="form_loc" className="text-xs">
                  Local / Polo <span className="text-destructive">*</span>
                </Label>
                <select
                  id="form_loc"
                  required
                  value={formLocalId}
                  onChange={(e) => handleLocalChange(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {locaisForm.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="form_grp" className="text-xs">
                  Grupo <span className="text-destructive">*</span>
                </Label>
                <select
                  id="form_grp"
                  required
                  value={formGrupoId}
                  onChange={(e) => setFormGrupoId(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {gruposForm.map((grp) => (
                    <option key={grp.id} value={grp.id}>
                      {grp.nome} ({grp.vagas_ocupadas}/{grp.capacidade_maxima})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Alerta de Validação Etária */}
            {validacaoFaixaEtaria && (
              <div
                className={`flex items-center gap-2 rounded-md p-3 text-xs ${
                  validacaoFaixaEtaria.valido
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : "bg-destructive/10 text-destructive border border-destructive/20 font-medium"
                }`}
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{validacaoFaixaEtaria.mensagem}</span>
              </div>
            )}

            {/* Parâmetros da Matrícula */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-2 border-t border-border">
              <div className="space-y-1">
                <Label htmlFor="data_mat" className="text-xs">
                  Data da Matrícula <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="data_mat"
                  type="date"
                  required
                  value={formDataMatricula}
                  onChange={(e) => setFormDataMatricula(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="status_mat" className="text-xs">
                  Status Inicial <span className="text-destructive">*</span>
                </Label>
                <select
                  id="status_mat"
                  value={formStatus}
                  onChange={(e) =>
                    setFormStatus(
                      e.target.value as "ativo" | "lista_espera" | "pre_inscrito"
                    )
                  }
                  className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="ativo">Ativo (Vaga Garantida)</option>
                  <option value="lista_espera">Lista de Espera</option>
                  <option value="pre_inscrito">Pré-Inscrito (Para Homologação)</option>
                </select>
              </div>
            </div>

            {/* Switch de Cota MROSC */}
            <div className="flex items-center justify-between rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-500/10 p-3">
              <div>
                <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                  Cota de Vulnerabilidade Social (MROSC)
                </p>
                <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80">
                  Beneficiário provém de família de baixa renda, rede pública ou encaminhado pelo CRAS.
                </p>
              </div>
              <input
                type="checkbox"
                checked={formVulneravel}
                onChange={(e) => setFormVulneravel(e.target.checked)}
                className="h-5 w-5 rounded border-amber-400 text-amber-600 focus:ring-amber-500"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSaving || (validacaoFaixaEtaria !== null && !validacaoFaixaEtaria.valido)}
              >
                {isSaving ? "Matriculando..." : "Confirmar Matrícula"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Cancelamento com Motivo Obrigatório */}
      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Ban className="h-5 w-5" />
              Cancelar Matrícula
            </DialogTitle>
            <DialogDescription>
              Informe o motivo formal do cancelamento da matrícula de{" "}
              <span className="font-semibold text-foreground">
                {cancelTargetNome}
              </span>
              . Esse registro será auditado na prestação de contas governamental.
            </DialogDescription>
          </DialogHeader>

          {cancelError && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{cancelError}</span>
            </div>
          )}

          <div className="space-y-3 py-2">
            <Label htmlFor="motivo_cancel">
              Motivo do Cancelamento <span className="text-destructive">*</span>
            </Label>
            <Input
              id="motivo_cancel"
              placeholder="Ex: Mudança de bairro, desistência voluntária, conflito de horários"
              value={motivoCancelamento}
              onChange={(e) => setMotivoCancelamento(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelModalOpen(false)}
              disabled={isCanceling}
            >
              Voltar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleConfirmCancel}
              disabled={isCanceling}
            >
              {isCanceling ? "Cancelando..." : "Confirmar Cancelamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação de Exclusão */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Excluir Registro de Matrícula"
        description={`Tem certeza que deseja apagar o registro de matrícula de "${deleteTargetNome}"? Se houver presenças registradas nesta matrícula, a exclusão será bloqueada pela auditoria governamental.`}
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
