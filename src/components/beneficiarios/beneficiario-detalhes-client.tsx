"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { BeneficiarioDetalhes } from "@/lib/actions/beneficiarios";
import { updateBeneficiario } from "@/lib/actions/beneficiarios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Edit2,
  Calendar,
  Phone,
  Baby,
  ShieldCheck,
  AlertCircle,
  FolderOpen,
  Copy,
  Check,
  Building,
} from "lucide-react";

interface BeneficiarioDetalhesClientProps {
  beneficiario: BeneficiarioDetalhes;
}

function formatarCpf(cpf: string): string {
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11) return cpf;
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
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

export function BeneficiarioDetalhesClient({
  beneficiario: initialBeneficiario,
}: BeneficiarioDetalhesClientProps) {
  const router = useRouter();
  const [beneficiario, setBeneficiario] =
    useState<BeneficiarioDetalhes>(initialBeneficiario);
  const [copiedCpf, setCopiedCpf] = useState(false);

  // Modal de Edição
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    nome_completo: beneficiario.nome_completo,
    data_nascimento: beneficiario.data_nascimento,
    genero: beneficiario.genero as "M" | "F" | "Outro" | "Nao_informado",
    telefone: beneficiario.telefone || "",
    nome_responsavel: beneficiario.nome_responsavel || "",
    telefone_responsavel: beneficiario.telefone_responsavel || "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const idadeAtual = calcularIdade(formData.data_nascimento);
  const isMenorForm = idadeAtual < 18;

  const handleCopyCpf = () => {
    navigator.clipboard.writeText(beneficiario.cpf);
    setCopiedCpf(true);
    setTimeout(() => setCopiedCpf(false), 2000);
  };

  const handleOpenEdit = () => {
    setFormData({
      nome_completo: beneficiario.nome_completo,
      data_nascimento: beneficiario.data_nascimento,
      genero: beneficiario.genero as "M" | "F" | "Outro" | "Nao_informado",
      telefone: beneficiario.telefone || "",
      nome_responsavel: beneficiario.nome_responsavel || "",
      telefone_responsavel: beneficiario.telefone_responsavel || "",
    });
    setFormError(null);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSaving(true);

    try {
      const payload = {
        nome_completo: formData.nome_completo.trim(),
        cpf: beneficiario.cpf,
        data_nascimento: formData.data_nascimento,
        genero: formData.genero,
        telefone: formData.telefone.trim() || null,
        nome_responsavel: formData.nome_responsavel.trim() || null,
        telefone_responsavel: formData.telefone_responsavel.trim() || null,
      };

      const res = await updateBeneficiario(beneficiario.id, payload);

      if (!res.success) {
        setFormError(res.error || "Erro ao atualizar beneficiário");
        setIsSaving(false);
        return;
      }

      setBeneficiario((prev) => ({
        ...prev,
        nome_completo: payload.nome_completo,
        data_nascimento: payload.data_nascimento,
        genero: payload.genero,
        telefone: payload.telefone,
        nome_responsavel: payload.nome_responsavel,
        telefone_responsavel: payload.telefone_responsavel,
        idade: calcularIdade(payload.data_nascimento),
      }));

      setIsEditModalOpen(false);
      router.refresh();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Erro inesperado ao salvar";
      setFormError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/beneficiarios">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {beneficiario.nome_completo}
              </h1>
              {beneficiario.matriculas.some((m) => m.vulneravel) && (
                <Badge
                  variant="outline"
                  className="bg-amber-500/10 text-amber-600 border-amber-300 dark:border-amber-700 dark:text-amber-400"
                >
                  Cota de Vulnerabilidade
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Cadastro Civil Universal • Cadastrado em{" "}
              {beneficiario.criado_em
                ? new Date(beneficiario.criado_em).toLocaleDateString("pt-BR")
                : "Data não registrada"}
            </p>
          </div>
        </div>

        <Button onClick={handleOpenEdit} variant="outline" size="sm">
          <Edit2 className="mr-2 h-4 w-4" /> Editar Dados Civis
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">
            Idade do Beneficiário
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl font-bold text-foreground">
              {beneficiario.idade}
            </h3>
            <span className="text-xs text-muted-foreground">
              {beneficiario.idade === 1 ? "ano" : "anos"} (
              {beneficiario.data_nascimento.split("-").reverse().join("/")})
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">
            Total de Matrículas
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl font-bold text-foreground">
              {beneficiario.total_matriculas}
            </h3>
            <span className="text-xs text-muted-foreground">
              ({beneficiario.matriculas_ativas} ativas)
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">
            Taxa de Assiduidade Geral
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {beneficiario.frequencia_stats?.percentual_presenca ?? 0}%
            </h3>
            <span className="text-xs text-muted-foreground">
              de presença
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">
            Total de Sessões Registradas
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl font-bold text-foreground">
              {beneficiario.frequencia_stats?.total_registros ?? 0}
            </h3>
            <span className="text-xs text-muted-foreground">
              chamadas nominais
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Coluna Esquerda: Dados Civis e Contato */}
        <div className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Dados Civis do Cidadão
              </h2>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={handleCopyCpf}
              >
                {copiedCpf ? (
                  <>
                    <Check className="mr-1 h-3.5 w-3.5 text-emerald-500" /> Copiado
                  </>
                ) : (
                  <>
                    <Copy className="mr-1 h-3.5 w-3.5" /> Copiar CPF
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">CPF (Chave Única)</p>
                <p className="font-mono font-medium text-foreground">
                  {formatarCpf(beneficiario.cpf)}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Data de Nascimento</p>
                <p className="font-medium text-foreground flex items-center gap-1.5 mt-0.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  {beneficiario.data_nascimento.split("-").reverse().join("/")} (
                  {beneficiario.idade} anos)
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Gênero</p>
                <p className="font-medium text-foreground">
                  {beneficiario.genero === "M"
                    ? "Masculino"
                    : beneficiario.genero === "F"
                    ? "Feminino"
                    : beneficiario.genero === "Outro"
                    ? "Outro"
                    : "Não informado"}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Telefone Próprio</p>
                <p className="font-medium text-foreground flex items-center gap-1.5 mt-0.5">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  {beneficiario.telefone || "Não cadastrado"}
                </p>
              </div>
            </div>

            {/* Responsável Legal */}
            <div className="pt-3 border-t border-border">
              <div className="flex items-center gap-2 mb-2">
                <Baby className="h-4 w-4 text-blue-500" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Responsável Legal {beneficiario.idade < 18 ? "(Obrigatório)" : "(Opcional)"}
                </h3>
              </div>
              <div className="space-y-2 text-sm bg-muted/30 p-3 rounded-md">
                <div>
                  <p className="text-xs text-muted-foreground">Nome do Responsável</p>
                  <p className="font-medium text-foreground">
                    {beneficiario.nome_responsavel || "Não informado"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Telefone do Responsável</p>
                  <p className="font-medium text-foreground">
                    {beneficiario.telefone_responsavel || "Não informado"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card de Frequência Resumida */}
          {beneficiario.frequencia_stats && (
            <div className="rounded-lg border border-border bg-card p-5 space-y-3">
              <h3 className="text-sm font-semibold text-foreground">
                Assiduidade & Presenças
              </h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded bg-emerald-500/10 p-2">
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 block font-medium">
                    Presente
                  </span>
                  <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                    {beneficiario.frequencia_stats.presentes}
                  </span>
                </div>
                <div className="rounded bg-destructive/10 p-2">
                  <span className="text-xs text-destructive block font-medium">
                    Faltas
                  </span>
                  <span className="text-lg font-bold text-destructive">
                    {beneficiario.frequencia_stats.faltas}
                  </span>
                </div>
                <div className="rounded bg-amber-500/10 p-2">
                  <span className="text-xs text-amber-600 dark:text-amber-400 block font-medium">
                    Justificadas
                  </span>
                  <span className="text-lg font-bold text-amber-700 dark:text-amber-300">
                    {beneficiario.frequencia_stats.justificadas}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Coluna Direita: Histórico de Matrículas nos Projetos Sociais */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
              <div>
                <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Building className="h-4 w-4 text-primary" />
                  Histórico de Matrículas nos Projetos
                </h2>
                <p className="text-xs text-muted-foreground">
                  Projetos e grupos em que o cidadão está ou esteve vinculado (§3.3).
                </p>
              </div>
              <Badge variant="secondary">
                {beneficiario.matriculas.length} vínculo(s)
              </Badge>
            </div>

            {beneficiario.matriculas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                Este cidadão ainda não foi matriculado em nenhum projeto ou turma.
              </div>
            ) : (
              <div className="space-y-4">
                {beneficiario.matriculas.map((mat) => (
                  <div
                    key={mat.id}
                    className="rounded-lg border border-border bg-background p-4 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/50 pb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground">
                            {mat.objeto_nome}
                          </h3>
                          {mat.vulneravel && (
                            <Badge
                              variant="outline"
                              className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-300 dark:border-amber-700 dark:text-amber-400 py-0"
                            >
                              Cota de Vulnerabilidade
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Matriculado em:{" "}
                          {mat.data_matricula.split("-").reverse().join("/")}
                        </p>
                      </div>

                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          mat.status === "ativo"
                            ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                            : mat.status === "lista_espera"
                            ? "border-amber-500 text-amber-600 dark:text-amber-400"
                            : mat.status === "pre_inscrito"
                            ? "border-blue-500 text-blue-600 dark:text-blue-400"
                            : "border-muted-foreground text-muted-foreground"
                        }`}
                      >
                        {mat.status === "ativo"
                          ? "Matrícula Ativa"
                          : mat.status === "lista_espera"
                          ? "Lista de Espera"
                          : mat.status === "pre_inscrito"
                          ? "Pré-Inscrito"
                          : mat.status === "concluido"
                          ? "Concluído"
                          : "Cancelado"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground block">Grupo:</span>
                        <Link
                          href={`/grupos/${mat.grupo_id}`}
                          className="font-medium text-foreground hover:underline"
                        >
                          {mat.grupo_nome}
                        </Link>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Local / Polo:</span>
                        <span className="font-medium text-foreground">
                          {mat.local_nome || "Não especificado"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Modalidade:</span>
                        <span className="font-medium text-foreground">
                          {mat.modalidade_nome || "Geral"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Edição de Dados Civis */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Dados Civis do Beneficiário</DialogTitle>
            <DialogDescription>
              Atualize as informações civis do cidadão. O CPF ({formatarCpf(beneficiario.cpf)}) é imutável.
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSaveEdit} className="space-y-4 py-2">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="edit_nome">
                  Nome Completo <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit_nome"
                  required
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
                <Label htmlFor="edit_nasc">
                  Data de Nascimento <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit_nasc"
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
                <p className="text-[11px] text-muted-foreground">
                  Idade calculada: {idadeAtual} {idadeAtual === 1 ? "ano" : "anos"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit_genero">
                  Gênero <span className="text-destructive">*</span>
                </Label>
                <select
                  id="edit_genero"
                  value={formData.genero}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      genero: e.target.value as "M" | "F" | "Outro" | "Nao_informado",
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

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="edit_tel">Telefone / WhatsApp</Label>
                <Input
                  id="edit_tel"
                  placeholder="(00) 00000-0000"
                  value={formData.telefone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, telefone: e.target.value }))
                  }
                />
              </div>
            </div>

            {isMenorForm && (
              <div className="mt-4 rounded-lg border border-amber-300 bg-amber-500/10 p-4 dark:border-amber-700">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-medium text-sm mb-2">
                  <Baby className="h-4 w-4" />
                  <span>
                    Menor de 18 Anos — Responsável Legal Obrigatório
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="edit_resp_nome" className="text-xs">
                      Nome do Responsável Legal{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="edit_resp_nome"
                      required={isMenorForm}
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
                    <Label htmlFor="edit_resp_tel" className="text-xs">
                      Telefone do Responsável
                    </Label>
                    <Input
                      id="edit_resp_tel"
                      value={formData.telefone_responsavel}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          telefone_responsavel: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
