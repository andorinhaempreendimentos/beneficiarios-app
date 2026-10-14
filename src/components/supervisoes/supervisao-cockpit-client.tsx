"use client";

import React, { useState, useTransition, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type getSupervisaoDetalhes,
  salvarRascunhoSupervisao,
  concluirSupervisao,
  uploadFotoSupervisao,
} from "@/lib/actions/supervisoes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ShieldCheck,
  MapPin,
  Calendar,
  Clock,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ArrowRight,
  Star,
  Camera,
  Trash2,
  Lock,
  Loader2,
  FileText,
  Building,
  Package,
  Shirt,
  Sparkles,
  Save,
  Check,
} from "lucide-react";

type SupervisaoDetalhes = NonNullable<Awaited<ReturnType<typeof getSupervisaoDetalhes>>["data"]>;

interface SupervisaoCockpitClientProps {
  initialData: SupervisaoDetalhes;
}

export function SupervisaoCockpitClient({ initialData }: SupervisaoCockpitClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [visita, setVisita] = useState(initialData.visita);
  const { instrutores, blocosDoLocal } = initialData;

  const isConcluida = visita.status === "concluida";

  // Termos dinâmicos do objeto
  const termoLocal = visita.objeto?.termo_local || "Polo";
  const termoInstrutor = visita.objeto?.termo_instrutor || "Professor";
  const termoGrupo = visita.objeto?.termo_grupo || "Turma";
  const termoSessao = visita.objeto?.termo_sessao || "Sessão";

  // Navegação entre etapas (1: Atividade, 2: Vistoria Setorizada, 3: Apontamentos, 4: Espelho de Revisão)
  const [etapaAtiva, setEtapaAtiva] = useState<number>(isConcluida ? 4 : 1);

  // Estados dos Campos Editáveis
  const [blocoId, setBlocoId] = useState<string>(visita.bloco_id || "");
  const [instrutorId, setInstrutorId] = useState<string>(visita.instrutor_funcionario_id || "");
  const [professorPresente, setProfessorPresente] = useState<boolean>(visita.professor_presente ?? true);
  const [gradeConforme, setGradeConforme] = useState<boolean>(visita.grade_conforme ?? true);
  const [chamadaConferida, setChamadaConferida] = useState<boolean>(visita.chamada_conferida ?? true);
  const [qtdBeneficiarios, setQtdBeneficiarios] = useState<number>(visita.qtd_beneficiarios_presentes ?? 0);
  const [atividadeAcompanhada, setAtividadeAcompanhada] = useState<string>(visita.atividade_acompanhada || "");

  // Setores de Infraestrutura (1 a 5)
  const [espacoFisicoStatus, setEspacoFisicoStatus] = useState<"Adequado" | "Requer atenção">(
    (visita.espaco_fisico_status as "Adequado" | "Requer atenção") || "Adequado"
  );
  const [notaEstrutura, setNotaEstrutura] = useState<number>(visita.nota_estrutura || 4);
  const [obsEstrutura, setObsEstrutura] = useState<string>(visita.obs_estrutura || "");

  const [materiaisColetivosStatus, setMateriaisColetivosStatus] = useState<"Adequados" | "Pendentes">(
    (visita.materiais_coletivos_status as "Adequados" | "Pendentes") || "Adequados"
  );
  const [notaMateriaisColetivos, setNotaMateriaisColetivos] = useState<number>(
    visita.nota_materiais_coletivos || 4
  );
  const [obsMateriaisColetivos, setObsMateriaisColetivos] = useState<string>(
    visita.obs_materiais_coletivos || ""
  );

  const [materiaisConcedidosStatus, setMateriaisConcedidosStatus] = useState<"Adequados" | "Pendentes">(
    (visita.materiais_concedidos_status as "Adequados" | "Pendentes") || "Adequados"
  );
  const [notaMateriaisConcedidos, setNotaMateriaisConcedidos] = useState<number>(
    visita.nota_materiais_concedidos || 4
  );
  const [obsMateriaisConcedidos, setObsMateriaisConcedidos] = useState<string>(
    visita.obs_materiais_concedidos || ""
  );

  // Fotos Estruturadas
  const [fotos, setFotos] = useState<{
    atividade: string[];
    estrutura: string[];
    materiais_coletivos: string[];
    materiais_concedidos: string[];
  }>(() => {
    if (visita.fotos && typeof visita.fotos === "object") {
      const f = visita.fotos as Record<string, string[]>;
      return {
        atividade: Array.isArray(f.atividade) ? f.atividade : [],
        estrutura: Array.isArray(f.estrutura) ? f.estrutura : [],
        materiais_coletivos: Array.isArray(f.materiais_coletivos) ? f.materiais_coletivos : [],
        materiais_concedidos: Array.isArray(f.materiais_concedidos) ? f.materiais_concedidos : [],
      };
    }
    return { atividade: [], estrutura: [], materiais_coletivos: [], materiais_concedidos: [] };
  });

  // Apontamentos e Parecer Global
  const [observacoes, setObservacoes] = useState<string>(visita.observacoes || "");
  const [ocorrencias, setOcorrencias] = useState<string>(visita.ocorrencias || "");
  const [orientacoesProfessor, setOrientacoesProfessor] = useState<string>(
    visita.orientacoes_professor || ""
  );
  const [providencias, setProvidencias] = useState<string>(visita.providencias || "");
  const [prazoRegularizacao, setPrazoRegularizacao] = useState<string>(
    visita.prazo_regularizacao || ""
  );
  const [situacao, setSituacao] = useState<"Regular" | "Requer Atenção" | "Crítica">(
    (visita.situacao as "Regular" | "Requer Atenção" | "Crítica") || "Regular"
  );

  // Upload de fotos setorizadas
  const [uploadingSetor, setUploadingSetor] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Modal de Conclusão / Check-out
  const [modalConcluirAberto, setModalConcluirAberto] = useState(false);
  const [horaFimInput, setHoraFimInput] = useState(() => {
    const agora = new Date();
    return agora.toTimeString().substring(0, 5);
  });
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);
  const [salvandoSucesso, setSalvandoSucesso] = useState(false);

  // Upload handler para fotos por setor
  const handleUploadFoto = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setor: "atividade" | "estrutura" | "materiais_coletivos" | "materiais_concedidos"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingSetor(setor);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("foto", file);

      const res = await uploadFotoSupervisao(formData);
      if (res.success && res.url) {
        setFotos((prev) => ({
          ...prev,
          [setor]: [...prev[setor], res.url as string],
        }));
      } else {
        setUploadError(res.error || "Erro no upload.");
      }
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Erro ao carregar arquivo.");
    } finally {
      setUploadingSetor(null);
      if (e.target) e.target.value = "";
    }
  };

  const handleRemoverFoto = (
    setor: "atividade" | "estrutura" | "materiais_coletivos" | "materiais_concedidos",
    index: number
  ) => {
    if (isConcluida) return;
    setFotos((prev) => ({
      ...prev,
      [setor]: prev[setor].filter((_, i) => i !== index),
    }));
  };

  // Salvar Rascunho sem finalizar
  const handleSalvarRascunho = () => {
    setErroSalvar(null);
    setSalvandoSucesso(false);

    const blocoSelecionado = blocosDoLocal.find((b) => b.id === blocoId);
    const turmasAuditadas =
      blocoSelecionado?.bloco_grupos
        ?.map((bg) => bg.grupo?.nome)
        .filter((nome): nome is string => Boolean(nome)) ?? [];

    startTransition(async () => {
      const res = await salvarRascunhoSupervisao({
        id: visita.id,
        bloco_id: blocoId || null,
        instrutor_funcionario_id: instrutorId,
        professor_presente: professorPresente,
        grade_conforme: gradeConforme,
        chamada_conferida: chamadaConferida,
        turmas_auditadas: turmasAuditadas,
        qtd_beneficiarios_presentes: Number(qtdBeneficiarios),
        atividade_acompanhada: atividadeAcompanhada,
        espaco_fisico_status: espacoFisicoStatus,
        nota_estrutura: notaEstrutura,
        obs_estrutura: obsEstrutura,
        materiais_coletivos_status: materiaisColetivosStatus,
        nota_materiais_coletivos: notaMateriaisColetivos,
        obs_materiais_coletivos: obsMateriaisColetivos,
        materiais_concedidos_status: materiaisConcedidosStatus,
        nota_materiais_concedidos: notaMateriaisConcedidos,
        obs_materiais_concedidos: obsMateriaisConcedidos,
        fotos,
        observacoes,
        ocorrencias,
        orientacoes_professor: orientacoesProfessor,
        providencias,
        prazo_regularizacao: prazoRegularizacao || null,
        situacao,
      });

      if (res.success) {
        setSalvandoSucesso(true);
        setTimeout(() => setSalvandoSucesso(false), 3000);
      } else {
        setErroSalvar(res.error || "Erro ao salvar rascunho.");
      }
    });
  };

  // Concluir e Travar a Vistoria como Imutável
  const handleConfirmarConclusao = () => {
    setErroSalvar(null);

    const blocoSelecionado = blocosDoLocal.find((b) => b.id === blocoId);
    const turmasAuditadas =
      blocoSelecionado?.bloco_grupos
        ?.map((bg) => bg.grupo?.nome)
        .filter((nome): nome is string => Boolean(nome)) ?? [];

    startTransition(async () => {
      const res = await concluirSupervisao({
        id: visita.id,
        hora_fim: horaFimInput,
        professor_presente: professorPresente,
        grade_conforme: gradeConforme,
        chamada_conferida: chamadaConferida,
        turmas_auditadas: turmasAuditadas,
        qtd_beneficiarios_presentes: Number(qtdBeneficiarios),
        atividade_acompanhada: atividadeAcompanhada,
        espaco_fisico_status: espacoFisicoStatus,
        nota_estrutura: notaEstrutura,
        obs_estrutura: obsEstrutura,
        materiais_coletivos_status: materiaisColetivosStatus,
        nota_materiais_coletivos: notaMateriaisColetivos,
        obs_materiais_coletivos: obsMateriaisColetivos,
        materiais_concedidos_status: materiaisConcedidosStatus,
        nota_materiais_concedidos: notaMateriaisConcedidos,
        obs_materiais_concedidos: obsMateriaisConcedidos,
        fotos,
        observacoes,
        ocorrencias,
        orientacoes_professor: orientacoesProfessor,
        providencias,
        prazo_regularizacao: prazoRegularizacao || null,
        situacao,
      });

      if (res.success && res.data) {
        setVisita((prev) => ({
          ...prev,
          status: "concluida",
          hora_fim: res.data.hora_fim,
          situacao: res.data.situacao,
        }));
        setModalConcluirAberto(false);
        setEtapaAtiva(4);
        router.refresh();
      } else {
        setErroSalvar(res.error || "Erro ao concluir supervisão.");
      }
    });
  };

  // Renderizar estrelas para notas 1 a 5
  const renderNotaInput = (
    label: string,
    valor: number,
    onChange: (n: number) => void,
    disabled = false
  ) => {
    const niveis = [
      { nota: 1, rotulo: "Crítica" },
      { nota: 2, rotulo: "Ruim" },
      { nota: 3, rotulo: "Regular" },
      { nota: 4, rotulo: "Boa" },
      { nota: 5, rotulo: "Ótima" },
    ];

    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold">{label}</Label>
          <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            {valor} de 5 — {niveis[valor - 1]?.rotulo}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {niveis.map((n) => (
            <button
              key={n.nota}
              type="button"
              disabled={disabled}
              onClick={() => onChange(n.nota)}
              className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-md border transition-all ${
                valor === n.nota
                  ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted border-border/60"
              } ${disabled ? "cursor-default opacity-80" : ""}`}
            >
              {n.nota} • {n.rotulo}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      {/* 1. Header do Cockpit */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link href="/supervisoes">
          <Button variant="outline" size="sm" className="gap-2 text-xs">
            <ArrowLeft className="h-4 w-4" />
            Voltar para Supervisões
          </Button>
        </Link>

        <div className="flex items-center gap-2">
          {isConcluida ? (
            <Badge
              variant="outline"
              className="gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold px-3 py-1 text-xs"
            >
              <Lock className="h-3.5 w-3.5" />
              Vistoria Homologada (Imutável)
            </Badge>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSalvarRascunho}
                disabled={isPending}
                className="gap-1.5 text-xs h-8"
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : salvandoSucesso ? (
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                ) : (
                  <Save className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                {salvandoSucesso ? "Rascunho Salvo" : "Salvar Rascunho"}
              </Button>
              <Badge
                variant="outline"
                className="gap-1.5 border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400 font-semibold px-3 py-1 text-xs"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                Auditoria em Andamento
              </Badge>
            </div>
          )}
        </div>
      </div>

      {erroSalvar && (
        <div className="p-3 text-xs text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300 rounded-md border border-rose-200">
          {erroSalvar}
        </div>
      )}

      {/* 2. Banner de Vistoria Homologada */}
      {isConcluida && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-950 dark:text-emerald-200">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="font-semibold text-sm">
                Vistoria Concluída — Snapshot Probatório Imutável (§3.6)
              </p>
              <p className="text-xs text-emerald-800 dark:text-emerald-300">
                Auditoria presencial encerrada às {visita.hora_fim?.substring(0, 5)}, com parecer{" "}
                <strong>{visita.situacao}</strong> homologado. Os dados de infraestrutura, fotos e
                apontamentos pedagógicos foram congelados com fé pública para o relatório MROSC.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Card de Informações do Polo Auditado */}
      <Card className="border-border/60 shadow-xs overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500" />
        <CardHeader className="pb-3 pt-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className="text-xs font-semibold">
                  {visita.objeto?.nome ?? "Projeto"}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {termoLocal} #{visita.local_id.substring(0, 6)}
                </Badge>
              </div>
              <CardTitle className="text-xl font-bold tracking-tight">
                {visita.local?.nome ?? "Polo de Atendimento"}
              </CardTitle>
              <CardDescription className="text-xs flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-blue-500" />
                  {new Date(visita.data + "T00:00:00").toLocaleDateString("pt-BR", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-blue-500" />
                  Check-in: {visita.hora_inicio?.substring(0, 5)}
                  {visita.hora_fim ? ` • Check-out: ${visita.hora_fim.substring(0, 5)}` : ""}
                </span>
                <span className="flex items-center gap-1">
                  <UserCheck className="h-3 w-3 text-blue-500" />
                  Supervisor: {visita.supervisor?.nome_completo ?? "Supervisor"}
                </span>
              </CardDescription>
            </div>

            {/* Parecer Global ou Situação Atual */}
            <div className="rounded-lg bg-muted/40 p-3 border border-border/50 text-right self-start md:self-auto">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                Parecer Global
              </span>
              <span
                className={`text-base font-bold ${
                  situacao === "Regular"
                    ? "text-emerald-600"
                    : situacao === "Requer Atenção"
                    ? "text-amber-600"
                    : "text-rose-600"
                }`}
              >
                {situacao}
              </span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 4. Barra de Etapas da Vistoria (Wizard) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => setEtapaAtiva(1)}
          className={`p-3 rounded-lg border text-left transition-all ${
            etapaAtiva === 1
              ? "border-blue-600 bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100 shadow-xs"
              : "border-border/60 hover:bg-muted/40 text-muted-foreground"
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block opacity-70">
            Etapa 1
          </span>
          <span className="text-xs font-semibold block mt-0.5">Atividade em Campo</span>
        </button>

        <button
          type="button"
          onClick={() => setEtapaAtiva(2)}
          className={`p-3 rounded-lg border text-left transition-all ${
            etapaAtiva === 2
              ? "border-blue-600 bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100 shadow-xs"
              : "border-border/60 hover:bg-muted/40 text-muted-foreground"
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block opacity-70">
            Etapa 2
          </span>
          <span className="text-xs font-semibold block mt-0.5">Vistoria Setorizada</span>
        </button>

        <button
          type="button"
          onClick={() => setEtapaAtiva(3)}
          className={`p-3 rounded-lg border text-left transition-all ${
            etapaAtiva === 3
              ? "border-blue-600 bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100 shadow-xs"
              : "border-border/60 hover:bg-muted/40 text-muted-foreground"
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block opacity-70">
            Etapa 3
          </span>
          <span className="text-xs font-semibold block mt-0.5">Apontamentos & Prazo</span>
        </button>

        <button
          type="button"
          onClick={() => setEtapaAtiva(4)}
          className={`p-3 rounded-lg border text-left transition-all ${
            etapaAtiva === 4
              ? "border-blue-600 bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100 shadow-xs"
              : "border-border/60 hover:bg-muted/40 text-muted-foreground"
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block opacity-70">
            Etapa 4
          </span>
          <span className="text-xs font-semibold block mt-0.5">Espelho de Revisão</span>
        </button>
      </div>

      {/* ETAPA 1: Atividade em Campo */}
      {etapaAtiva === 1 && (
        <Card className="border-border/60 shadow-xs space-y-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-blue-600" />
              Auditoria da Atividade em Campo (§3.6)
            </CardTitle>
            <CardDescription className="text-xs">
              Cruzamento da grade horária, conferência de presença do profissional e contagem de
              beneficiários em quadra.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Seleção de Bloco / Horário do Local */}
              <div className="space-y-1.5">
                <Label htmlFor="bloco-select" className="text-xs font-semibold">
                  Bloco de Horário Auditado
                </Label>
                <select
                  id="bloco-select"
                  disabled={isConcluida}
                  value={blocoId}
                  onChange={(e) => setBlocoId(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                >
                  <option value="">Selecione o bloco / horário da vistoria...</option>
                  {blocosDoLocal.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.hora_inicio.slice(0, 5)} às {b.hora_fim.slice(0, 5)} (Dia {b.dia_semana})
                    </option>
                  ))}
                </select>
              </div>

              {/* Confirmação do Instrutor */}
              <div className="space-y-1.5">
                <Label htmlFor="instrutor-select" className="text-xs font-semibold">
                  {termoInstrutor} Auditado *
                </Label>
                <select
                  id="instrutor-select"
                  disabled={isConcluida}
                  value={instrutorId}
                  onChange={(e) => setInstrutorId(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
                >
                  {instrutores.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.nome_completo} ({inst.cargo})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Checkboxes de Conformidade Operacional */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-y border-border/50 py-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  disabled={isConcluida}
                  checked={professorPresente}
                  onChange={(e) => setProfessorPresente(e.target.checked)}
                  className="rounded border-input text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <span className="font-medium">{termoInstrutor} Presente no Polo</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  disabled={isConcluida}
                  checked={gradeConforme}
                  onChange={(e) => setGradeConforme(e.target.checked)}
                  className="rounded border-input text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <span className="font-medium">Grade de Horários Respeitada</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  disabled={isConcluida}
                  checked={chamadaConferida}
                  onChange={(e) => setChamadaConferida(e.target.checked)}
                  className="rounded border-input text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <span className="font-medium">Diário / Chamada Conferida</span>
              </label>
            </div>

            {/* Contagem de Alunos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="qtd-beneficiarios" className="text-xs font-semibold">
                  Beneficiários Presentes em Atividade (Contagem Física) *
                </Label>
                <Input
                  id="qtd-beneficiarios"
                  type="number"
                  min="0"
                  disabled={isConcluida}
                  value={qtdBeneficiarios}
                  onChange={(e) => setQtdBeneficiarios(Number(e.target.value))}
                  className="h-9 text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  Quantidade real de alunos verificados em quadra no momento da fiscalização.
                </p>
              </div>

              {/* Upload da Foto da Atividade */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center justify-between">
                  <span>Foto Probatória da Turma em Atividade</span>
                  <span className="text-muted-foreground text-[11px]">
                    {fotos.atividade.length} foto(s)
                  </span>
                </Label>
                {!isConcluida && (
                  <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-input bg-background hover:bg-muted/40 text-xs font-semibold shadow-xs">
                    <Camera className="h-4 w-4 text-blue-600" />
                    {uploadingSetor === "atividade" ? "Enviando..." : "Fotografar Turma"}
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      disabled={uploadingSetor === "atividade"}
                      onChange={(e) => handleUploadFoto(e, "atividade")}
                      className="hidden"
                    />
                  </label>
                )}

                {/* Previews das Fotos da Atividade */}
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {fotos.atividade.map((url, idx) => (
                    <div
                      key={idx}
                      className="group relative aspect-video rounded-md overflow-hidden border border-border/60 bg-black/5"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Atividade ${idx + 1}`} className="w-full h-full object-cover" />
                      {!isConcluida && (
                        <button
                          type="button"
                          onClick={() => handleRemoverFoto("atividade", idx)}
                          className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded hover:bg-rose-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Descrição Qualitativa da Atividade */}
            <div className="space-y-1.5">
              <Label htmlFor="atividade-acompanhada" className="text-xs font-semibold">
                Descrição Qualitativa da Atividade Acompanhada *
              </Label>
              <Textarea
                id="atividade-acompanhada"
                rows={3}
                disabled={isConcluida}
                placeholder="Descreva o conteúdo técnico/pedagógico observado, aquecimento, exercícios aplicados e postura da turma..."
                value={atividadeAcompanhada}
                onChange={(e) => setAtividadeAcompanhada(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                onClick={() => setEtapaAtiva(2)}
                className="gap-2 text-xs bg-blue-600 hover:bg-blue-700 text-white"
              >
                Próxima: Vistoria Setorizada
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ETAPA 2: Vistoria Setorizada */}
      {etapaAtiva === 2 && (
        <div className="space-y-4">
          <Card className="border-border/60 shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Building className="h-5 w-5 text-blue-600" />
                Vistoria Setorizada de Infraestrutura e Materiais (§3.6)
              </CardTitle>
              <CardDescription className="text-xs">
                Avaliação padronizada em 5 níveis com parecer e fotos comprobatórias para cada
                setor.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Setor A: Espaço Físico */}
          <Card className="border-border/60 shadow-xs">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  Setor A: Estrutura Física do {termoLocal}
                </CardTitle>
                <select
                  disabled={isConcluida}
                  value={espacoFisicoStatus}
                  onChange={(e) =>
                    setEspacoFisicoStatus(e.target.value as "Adequado" | "Requer atenção")
                  }
                  className="h-8 px-2 rounded-md border border-input bg-background text-xs"
                >
                  <option value="Adequado">Adequado</option>
                  <option value="Requer atenção">Requer atenção</option>
                </select>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {renderNotaInput("Avaliação do Espaço Físico", notaEstrutura, setNotaEstrutura, isConcluida)}
              <div className="space-y-1.5">
                <Label htmlFor="obs-estrutura" className="text-xs font-medium">
                  Parecer Descritivo (Piso, Redes, Iluminação, Vestiários, Acessibilidade)
                </Label>
                <Textarea
                  id="obs-estrutura"
                  rows={2}
                  disabled={isConcluida}
                  placeholder="Relate as condições de conservação, limpeza e segurança da quadra/campo..."
                  value={obsEstrutura}
                  onChange={(e) => setObsEstrutura(e.target.value)}
                  className="text-xs"
                />
              </div>

              {/* Upload de Fotos Estrutura */}
              {!isConcluida && (
                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-input bg-background hover:bg-muted/40 text-xs font-semibold shadow-xs">
                  <Camera className="h-4 w-4 text-blue-600" />
                  {uploadingSetor === "estrutura" ? "Enviando..." : "Fotografar Estrutura"}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    disabled={uploadingSetor === "estrutura"}
                    onChange={(e) => handleUploadFoto(e, "estrutura")}
                    className="hidden"
                  />
                </label>
              )}
              <div className="grid grid-cols-4 gap-2">
                {fotos.estrutura.map((url, idx) => (
                  <div
                    key={idx}
                    className="group relative aspect-video rounded-md overflow-hidden border border-border/60"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Estrutura ${idx + 1}`} className="w-full h-full object-cover" />
                    {!isConcluida && (
                      <button
                        type="button"
                        onClick={() => handleRemoverFoto("estrutura", idx)}
                        className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded hover:bg-rose-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Setor B: Materiais Coletivos */}
          <Card className="border-border/60 shadow-xs">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  Setor B: Materiais de Uso Coletivo (Bolas, Cones, Tatames, Cronômetros)
                </CardTitle>
                <select
                  disabled={isConcluida}
                  value={materiaisColetivosStatus}
                  onChange={(e) =>
                    setMateriaisColetivosStatus(e.target.value as "Adequados" | "Pendentes")
                  }
                  className="h-8 px-2 rounded-md border border-input bg-background text-xs"
                >
                  <option value="Adequados">Adequados</option>
                  <option value="Pendentes">Pendentes</option>
                </select>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {renderNotaInput(
                "Avaliação dos Materiais Coletivos",
                notaMateriaisColetivos,
                setNotaMateriaisColetivos,
                isConcluida
              )}
              <div className="space-y-1.5">
                <Label htmlFor="obs-materiais-coletivos" className="text-xs font-medium">
                  Parecer Descritivo (Quantidade, Desgaste, Avarias)
                </Label>
                <Textarea
                  id="obs-materiais-coletivos"
                  rows={2}
                  disabled={isConcluida}
                  placeholder="Relate o estado dos equipamentos de treino utilizados..."
                  value={obsMateriaisColetivos}
                  onChange={(e) => setObsMateriaisColetivos(e.target.value)}
                  className="text-xs"
                />
              </div>

              {!isConcluida && (
                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-input bg-background hover:bg-muted/40 text-xs font-semibold shadow-xs">
                  <Camera className="h-4 w-4 text-blue-600" />
                  {uploadingSetor === "materiais_coletivos"
                    ? "Enviando..."
                    : "Fotografar Materiais Coletivos"}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    disabled={uploadingSetor === "materiais_coletivos"}
                    onChange={(e) => handleUploadFoto(e, "materiais_coletivos")}
                    className="hidden"
                  />
                </label>
              )}
              <div className="grid grid-cols-4 gap-2">
                {fotos.materiais_coletivos.map((url, idx) => (
                  <div
                    key={idx}
                    className="group relative aspect-video rounded-md overflow-hidden border border-border/60"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Materiais Coletivos ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {!isConcluida && (
                      <button
                        type="button"
                        onClick={() => handleRemoverFoto("materiais_coletivos", idx)}
                        className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded hover:bg-rose-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Setor C: Materiais Concedidos */}
          <Card className="border-border/60 shadow-xs">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Shirt className="h-4 w-4 text-muted-foreground" />
                  Setor C: Materiais Concedidos (Uniformes / Kits Individuais em Posse dos Alunos)
                </CardTitle>
                <select
                  disabled={isConcluida}
                  value={materiaisConcedidosStatus}
                  onChange={(e) =>
                    setMateriaisConcedidosStatus(e.target.value as "Adequados" | "Pendentes")
                  }
                  className="h-8 px-2 rounded-md border border-input bg-background text-xs"
                >
                  <option value="Adequados">Adequados</option>
                  <option value="Pendentes">Pendentes</option>
                </select>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {renderNotaInput(
                "Avaliação dos Materiais Concedidos",
                notaMateriaisConcedidos,
                setNotaMateriaisConcedidos,
                isConcluida
              )}
              <div className="space-y-1.5">
                <Label htmlFor="obs-materiais-concedidos" className="text-xs font-medium">
                  Parecer Descritivo (Uso de Uniformes, Kits Faltantes)
                </Label>
                <Textarea
                  id="obs-materiais-concedidos"
                  rows={2}
                  disabled={isConcluida}
                  placeholder="Relate a adesão aos uniformes e kits individuais entregues..."
                  value={obsMateriaisConcedidos}
                  onChange={(e) => setObsMateriaisConcedidos(e.target.value)}
                  className="text-xs"
                />
              </div>

              {!isConcluida && (
                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-input bg-background hover:bg-muted/40 text-xs font-semibold shadow-xs">
                  <Camera className="h-4 w-4 text-blue-600" />
                  {uploadingSetor === "materiais_concedidos"
                    ? "Enviando..."
                    : "Fotografar Uniformes/Kits"}
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    disabled={uploadingSetor === "materiais_concedidos"}
                    onChange={(e) => handleUploadFoto(e, "materiais_concedidos")}
                    className="hidden"
                  />
                </label>
              )}
              <div className="grid grid-cols-4 gap-2">
                {fotos.materiais_concedidos.map((url, idx) => (
                  <div
                    key={idx}
                    className="group relative aspect-video rounded-md overflow-hidden border border-border/60"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Materiais Concedidos ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {!isConcluida && (
                      <button
                        type="button"
                        onClick={() => handleRemoverFoto("materiais_concedidos", idx)}
                        className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded hover:bg-rose-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEtapaAtiva(1)}
              className="gap-2 text-xs"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar: Atividade
            </Button>
            <Button
              type="button"
              onClick={() => setEtapaAtiva(3)}
              className="gap-2 text-xs bg-blue-600 hover:bg-blue-700 text-white"
            >
              Próxima: Apontamentos e Prazos
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ETAPA 3: Apontamentos, Orientações e Parecer Global */}
      {etapaAtiva === 3 && (
        <Card className="border-border/60 shadow-xs space-y-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Apontamentos Pedagógicos, Providências e Parecer Global (§3.6)
            </CardTitle>
            <CardDescription className="text-xs">
              Registro de ocorrências, feedbacks transmitidos presencialmente e classificação geral
              da visita.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="observacoes" className="text-xs font-semibold">
                Observações Gerais da Supervisão
              </Label>
              <Textarea
                id="observacoes"
                rows={2}
                disabled={isConcluida}
                placeholder="Impressões gerais sobre o ambiente do polo e receptividade da comunidade..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ocorrencias" className="text-xs font-semibold">
                Ocorrências / Dificuldades Identificadas
              </Label>
              <Textarea
                id="ocorrencias"
                rows={2}
                disabled={isConcluida}
                placeholder="Problemas operacionais, intercorrências com alunos, atrasos ou falhas..."
                value={ocorrencias}
                onChange={(e) => setOcorrencias(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="orientacoes" className="text-xs font-semibold">
                Orientações Repassadas ao {termoInstrutor}
              </Label>
              <Textarea
                id="orientacoes"
                rows={2}
                disabled={isConcluida}
                placeholder="Feedbacks técnicos e pedagógicos transmitidos presencialmente ao profissional..."
                value={orientacoesProfessor}
                onChange={(e) => setOrientacoesProfessor(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border/50 pt-4">
              <div className="space-y-1.5">
                <Label htmlFor="providencias" className="text-xs font-semibold">
                  Pendências e Providências Exigidas da Organização
                </Label>
                <Textarea
                  id="providencias"
                  rows={2}
                  disabled={isConcluida}
                  placeholder="Ações corretivas necessárias para sanar inconformidades..."
                  value={providencias}
                  onChange={(e) => setProvidencias(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="prazo" className="text-xs font-semibold">
                    Prazo Limite para Regularização
                  </Label>
                  <Input
                    id="prazo"
                    type="date"
                    disabled={isConcluida}
                    value={prazoRegularizacao}
                    onChange={(e) => setPrazoRegularizacao(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                {/* Parecer Global */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    Parecer Global da Visita (Situação Oficial MROSC) *
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["Regular", "Requer Atenção", "Crítica"] as const).map((sit) => (
                      <button
                        key={sit}
                        type="button"
                        disabled={isConcluida}
                        onClick={() => setSituacao(sit)}
                        className={`py-2 px-2 rounded-md text-xs font-bold border transition-all ${
                          situacao === sit
                            ? sit === "Regular"
                              ? "bg-emerald-600 text-white border-emerald-600"
                              : sit === "Requer Atenção"
                              ? "bg-amber-600 text-white border-amber-600"
                              : "bg-rose-600 text-white border-rose-600"
                            : "bg-muted/40 text-muted-foreground hover:bg-muted border-border/60"
                        } ${isConcluida ? "cursor-default" : ""}`}
                      >
                        {sit}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEtapaAtiva(2)}
                className="gap-2 text-xs"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar: Vistoria Setorizada
              </Button>
              <Button
                type="button"
                onClick={() => setEtapaAtiva(4)}
                className="gap-2 text-xs bg-blue-600 hover:bg-blue-700 text-white"
              >
                Próxima: Espelho de Revisão
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ETAPA 4: Espelho de Revisão e Homologação Final */}
      {etapaAtiva === 4 && (
        <Card className="border-border/60 shadow-xs space-y-4">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  Espelho Consolidado de Revisão da Supervisão (§3.6)
                </CardTitle>
                <CardDescription className="text-xs">
                  Conferência final de todos os apontamentos, notas e fotos antes do congelamento
                  imutável.
                </CardDescription>
              </div>

              {!isConcluida && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setEtapaAtiva(1)}
                  className="gap-1.5 text-xs"
                >
                  Alterar Apontamentos
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4 text-xs">
            {/* Tabela Resumo */}
            <div className="rounded-lg border border-border/60 divide-y divide-border/50 overflow-hidden bg-muted/10">
              <div className="p-3 flex justify-between items-center bg-muted/30">
                <span className="font-semibold">{termoLocal} Auditado:</span>
                <span className="font-bold">{visita.local?.nome}</span>
              </div>
              <div className="p-3 flex justify-between items-center">
                <span className="text-muted-foreground">{termoInstrutor} Presente:</span>
                <span className="font-semibold">
                  {professorPresente ? (
                    <span className="text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Presente ({visita.instrutor?.nome_completo})
                    </span>
                  ) : (
                    <span className="text-rose-600 flex items-center gap-1">
                      <XCircle className="h-3.5 w-3.5" /> Ausente
                    </span>
                  )}
                </span>
              </div>
              <div className="p-3 flex justify-between items-center">
                <span className="text-muted-foreground">Beneficiários em Quadra:</span>
                <span className="font-semibold">{qtdBeneficiarios} alunos verificados</span>
              </div>
              <div className="p-3 flex justify-between items-center">
                <span className="text-muted-foreground">Conformidade Operacional:</span>
                <span className="font-semibold">
                  Grade {gradeConforme ? "Conforme" : "Não conforme"} • Chamada{" "}
                  {chamadaConferida ? "Conferida" : "Pendente"}
                </span>
              </div>
              <div className="p-3 flex justify-between items-center">
                <span className="text-muted-foreground">Notas dos Setores:</span>
                <div className="flex gap-3 font-semibold">
                  <span>Estrutura: {notaEstrutura}/5</span>
                  <span>Coletivos: {notaMateriaisColetivos}/5</span>
                  <span>Concedidos: {notaMateriaisConcedidos}/5</span>
                </div>
              </div>
              <div className="p-3 flex justify-between items-center bg-muted/20">
                <span className="font-semibold">Parecer Global Final:</span>
                <Badge
                  variant="outline"
                  className={
                    situacao === "Regular"
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold border-emerald-500/30"
                      : situacao === "Requer Atenção"
                      ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold border-amber-500/30"
                      : "bg-rose-500/10 text-rose-700 dark:text-rose-400 font-bold border-rose-500/30"
                  }
                >
                  {situacao}
                </Badge>
              </div>
            </div>

            {/* Galeria Geral das Fotos da Vistoria */}
            <div className="space-y-2">
              <span className="font-semibold block">
                Galeria Probatória Consolidada (
                {fotos.atividade.length +
                  fotos.estrutura.length +
                  fotos.materiais_coletivos.length +
                  fotos.materiais_concedidos.length}{" "}
                fotos)
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[
                  ...fotos.atividade.map((u) => ({ url: u, tipo: "Atividade" })),
                  ...fotos.estrutura.map((u) => ({ url: u, tipo: "Estrutura" })),
                  ...fotos.materiais_coletivos.map((u) => ({ url: u, tipo: "Coletivos" })),
                  ...fotos.materiais_concedidos.map((u) => ({ url: u, tipo: "Concedidos" })),
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="aspect-video relative rounded-md overflow-hidden border border-border/60 bg-black/5"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.url} alt={item.tipo} className="w-full h-full object-cover" />
                    <span className="absolute bottom-1 left-1 text-[9px] bg-black/60 text-white px-1 rounded">
                      {item.tipo}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ações Finais */}
            {!isConcluida && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border/50">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEtapaAtiva(3)}
                  className="gap-2 text-xs w-full sm:w-auto"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar para Apontamentos
                </Button>

                <Button
                  type="button"
                  onClick={() => {
                    const agora = new Date();
                    setHoraFimInput(agora.toTimeString().substring(0, 5));
                    setModalConcluirAberto(true);
                  }}
                  className="gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-10 px-6 shadow-sm w-full sm:w-auto"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Finalizar Supervisão e Congelar Snapshot
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 5. Modal de Conclusão / Check-out */}
      <Dialog open={modalConcluirAberto} onOpenChange={setModalConcluirAberto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              Homologar e Finalizar Supervisão
            </DialogTitle>
            <DialogDescription className="text-xs">
              Atenção: Ao confirmar a finalização, todos os dados, notas e fotos serão travados em um
              snapshot imutável para prestação de contas governamental (§3.6).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="hora-saida-input" className="text-xs font-semibold">
                Horário Real de Saída do Polo (Check-out) *
              </Label>
              <Input
                id="hora-saida-input"
                type="time"
                value={horaFimInput}
                onChange={(e) => setHoraFimInput(e.target.value)}
                className="text-xs h-9"
              />
            </div>
            <div className="rounded-md bg-muted/40 p-2.5 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Polo Auditado:</span>
                <span className="font-semibold">{visita.local?.nome}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Parecer Global:</span>
                <span className="font-bold text-foreground">{situacao}</span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => setModalConcluirAberto(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5"
              disabled={isPending}
              onClick={handleConfirmarConclusao}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Confirmar e Homologar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
