"use client";

import React, { useState, useEffect, useTransition, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type getSessaoDetalhes,
  concluirSessao,
  uploadFotoSessao,
} from "@/lib/actions/sessoes";
import {
  registrarEntregaAluno,
  registrarEntregasTurmaLote,
  uploadFotoMaterial,
} from "@/lib/actions/materiais";
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
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Camera,
  UploadCloud,
  Trash2,
  ArrowLeft,
  Lock,
  Search,
  Sparkles,
  ShieldCheck,
  Calendar,
  Loader2,
  FileText,
  UserCheck,
  AlertTriangle,
  Image as ImageIcon,
  Shirt,
} from "lucide-react";

type SessaoDetalhes = NonNullable<Awaited<ReturnType<typeof getSessaoDetalhes>>["data"]>;

interface SessaoAtivaClientProps {
  initialData: SessaoDetalhes;
}

export function SessaoAtivaClient({ initialData }: SessaoAtivaClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [sessao, setSessao] = useState(initialData.sessao);
  const [grupos] = useState(initialData.grupos);
  const [alunos, setAlunos] = useState(initialData.alunos);

  const isConcluida = sessao.status === "concluida";

  const termoSessao = sessao.objeto?.termo_sessao || "";
  const termoInstrutor = sessao.objeto?.termo_instrutor || "";
  const termoLocal = sessao.objeto?.termo_local || "";
  const termoGrupo = sessao.objeto?.termo_grupo || "";

  // Estado das fotos
  const [fotos, setFotos] = useState<string[]>(
    Array.isArray(sessao.fotos_urls) ? (sessao.fotos_urls as string[]) : []
  );
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [fotoError, setFotoError] = useState<string | null>(null);

  // Observações gerais da aula
  const [observacoes, setObservacoes] = useState(sessao.observacoes || "");

  // Busca na lista de chamada
  const [busca, setBusca] = useState("");
  const [filtroGrupo, setFiltroGrupo] = useState<string>("todos");

  // Aluno sendo editado para justificativa
  const [justificandoMatriculaId, setJustificandoMatriculaId] = useState<string | null>(null);
  const [textoJustificativa, setTextoJustificativa] = useState("");

  // Modal de encerramento
  const [modalConcluirAberto, setModalConcluirAberto] = useState(false);
  const [horaFimInput, setHoraFimInput] = useState(() => {
    const agora = new Date();
    return agora.toTimeString().substring(0, 5);
  });
  const [erroConclusao, setErroConclusao] = useState<string | null>(null);

  // Cronômetro da aula em andamento
  const [tempoDecorrido, setTempoDecorrido] = useState("");

  // Estados de Entrega de Kits & Uniformes (§3.10.B - Fé Pública do Professor)
  const materiaisIndividuais = initialData.materiaisIndividuais || [];
  const [materialSelecionadoId, setMaterialSelecionadoId] = useState<string>(
    materiaisIndividuais[0]?.id || ""
  );
  const [selecionadosEntrega, setSelecionadosEntrega] = useState<string[]>([]);
  const [comprovanteEntregaUrl, setComprovanteEntregaUrl] = useState<string | null>(null);
  const [uploadingComprovante, setUploadingComprovante] = useState(false);
  const [feedbackEntrega, setFeedbackEntrega] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);
  const comprovanteInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isConcluida) return;

    function calcularDecorrido() {
      if (!sessao.hora_inicio) return;
      const [horas, minutos] = sessao.hora_inicio.split(":").map(Number);
      const dataSessao = new Date(sessao.data + "T00:00:00");
      dataSessao.setHours(horas, minutos, 0, 0);

      const agora = new Date();
      const diffMs = agora.getTime() - dataSessao.getTime();

      if (diffMs < 0) {
        setTempoDecorrido("00:00:00");
        return;
      }

      const totalSeg = Math.floor(diffMs / 1000);
      const h = Math.floor(totalSeg / 3600);
      const m = Math.floor((totalSeg % 3600) / 60);
      const s = totalSeg % 60;

      const format = (n: number) => String(n).padStart(2, "0");
      setTempoDecorrido(`${format(h)}:${format(m)}:${format(s)}`);
    }

    calcularDecorrido();
    const interval = setInterval(calcularDecorrido, 1000);
    return () => clearInterval(interval);
  }, [sessao.hora_inicio, sessao.data, isConcluida]);

  // Contadores de Presença
  const totalAlunos = alunos.length;
  const presentesCount = alunos.filter((a) => a.status_presenca === "presente").length;
  const faltasCount = alunos.filter((a) => a.status_presenca === "falta").length;
  const justificadasCount = alunos.filter((a) => a.status_presenca === "justificada").length;
  const taxaPresenca = totalAlunos > 0 ? Math.round((presentesCount / totalAlunos) * 100) : 0;

  // Filtragem dos alunos na chamada
  const alunosFiltrados = alunos.filter((aluno) => {
    const matchBusca =
      aluno.nome_completo.toLowerCase().includes(busca.toLowerCase()) ||
      (aluno.cpf && aluno.cpf.includes(busca));
    const matchGrupo = filtroGrupo === "todos" || aluno.grupo_id === filtroGrupo;
    return matchBusca && matchGrupo;
  });

  // Alterar presença individual
  const handleAlterarStatus = (
    matriculaId: string,
    novoStatus: "presente" | "falta" | "justificada"
  ) => {
    if (isConcluida) return;

    if (novoStatus === "justificada") {
      const alunoAtual = alunos.find((a) => a.matricula_id === matriculaId);
      setTextoJustificativa(alunoAtual?.justificativa || "");
      setJustificandoMatriculaId(matriculaId);
      return;
    }

    setAlunos((prev) =>
      prev.map((a) =>
        a.matricula_id === matriculaId
          ? { ...a, status_presenca: novoStatus, justificativa: null }
          : a
      )
    );
  };

  // Salvar justificativa
  const handleSalvarJustificativa = () => {
    if (!justificandoMatriculaId) return;

    setAlunos((prev) =>
      prev.map((a) =>
        a.matricula_id === justificandoMatriculaId
          ? {
              ...a,
              status_presenca: "justificada",
              justificativa: textoJustificativa.trim() || "Justificativa informada",
            }
          : a
      )
    );
    setJustificandoMatriculaId(null);
    setTextoJustificativa("");
  };

  // Marcar todos presentes
  const handleMarcarTodosPresentes = () => {
    if (isConcluida) return;
    setAlunos((prev) =>
      prev.map((a) => ({
        ...a,
        status_presenca: "presente",
        justificativa: null,
      }))
    );
  };

  // Upload de Foto Probatória
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setUploadingFoto(true);
    setFotoError(null);

    try {
      const formData = new FormData();
      formData.append("foto", file);

      const res = await uploadFotoSessao(formData);
      if (res.success && res.url) {
        setFotos((prev) => [...prev, res.url]);
      } else {
        setFotoError(res.error || "Erro ao fazer upload da imagem.");
      }
    } catch (err: unknown) {
      setFotoError(err instanceof Error ? err.message : "Erro inesperado ao enviar foto.");
    } finally {
      setUploadingFoto(false);
      // Limpar o input para permitir selecionar o mesmo arquivo novamente se desejar
      if (e.target) e.target.value = "";
    }
  };

  const handleRemoverFoto = (indexParaRemover: number) => {
    if (isConcluida) return;
    setFotos((prev) => prev.filter((_, idx) => idx !== indexParaRemover));
  };

  // Handlers de Entrega de Kits & Uniformes (§3.10.B - Fé Pública do Professor)
  const handleToggleSelecionadoEntrega = (matriculaId: string) => {
    setSelecionadosEntrega((prev) =>
      prev.includes(matriculaId) ? prev.filter((id) => id !== matriculaId) : [...prev, matriculaId]
    );
  };

  const handleSelecionarPresentesPendentes = () => {
    const pendentes = alunos
      .filter((a) => a.status_presenca === "presente")
      .filter((a) => !a.entregas.some((e) => e.objeto_material_id === materialSelecionadoId))
      .map((a) => a.matricula_id);
    setSelecionadosEntrega(pendentes);
  };

  const handleUploadComprovanteEntrega = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingComprovante(true);
    setFeedbackEntrega(null);
    try {
      const formData = new FormData();
      formData.append("foto", file);
      const res = await uploadFotoMaterial(formData);
      if (res.success && res.url) {
        setComprovanteEntregaUrl(res.url);
        setFeedbackEntrega({
          tipo: "sucesso",
          texto: "Foto da folha física anexada com sucesso (comprovação opcional para MROSC).",
        });
      } else {
        setFeedbackEntrega({
          tipo: "erro",
          texto: res.error || "Erro no upload do comprovante.",
        });
      }
    } catch {
      setFeedbackEntrega({ tipo: "erro", texto: "Falha de conexão no upload do comprovante." });
    } finally {
      setUploadingComprovante(false);
    }
  };

  const handleEntregarKitIndividual = async (aluno: (typeof alunos)[0]) => {
    if (!materialSelecionadoId) {
      setFeedbackEntrega({ tipo: "erro", texto: "Selecione um item no catálogo para entrega." });
      return;
    }

    setFeedbackEntrega(null);
    startTransition(async () => {
      const res = await registrarEntregaAluno({
        objeto_material_id: materialSelecionadoId,
        matricula_id: aluno.matricula_id,
        instrutor_id: sessao.funcionario_id,
        data_entrega: sessao.data,
        tamanho_entregue: aluno.tamanho_uniforme || undefined,
        foto_comprovante_url: comprovanteEntregaUrl || undefined,
      });

      if (res.success) {
        const matNome =
          materiaisIndividuais.find((m) => m.id === materialSelecionadoId)?.nome_item || "Kit";
        setAlunos((prev) =>
          prev.map((a) =>
            a.matricula_id === aluno.matricula_id
              ? {
                  ...a,
                  entregas: [
                    ...a.entregas,
                    {
                      objeto_material_id: materialSelecionadoId,
                      material_nome: matNome,
                      data_entrega: sessao.data,
                      tamanho_entregue: aluno.tamanho_uniforme || null,
                    },
                  ],
                }
              : a
          )
        );
        setFeedbackEntrega({
          tipo: "sucesso",
          texto: `Kit entregue para ${aluno.nome_completo} com fé pública registrada!`,
        });
      } else {
        setFeedbackEntrega({ tipo: "erro", texto: res.error || "Erro ao registrar entrega." });
      }
    });
  };

  const handleEntregarKitsLote = async () => {
    if (!materialSelecionadoId) {
      setFeedbackEntrega({ tipo: "erro", texto: "Selecione um item no catálogo para entrega." });
      return;
    }
    if (selecionadosEntrega.length === 0) {
      setFeedbackEntrega({ tipo: "erro", texto: "Selecione pelo menos um aluno para realizar a entrega." });
      return;
    }

    setFeedbackEntrega(null);
    startTransition(async () => {
      const res = await registrarEntregasTurmaLote({
        objeto_material_id: materialSelecionadoId,
        grupo_id: grupos[0]?.id || (sessao.grupos_ids as string[])?.[0] || "",
        matriculas_ids: selecionadosEntrega,
        instrutor_id: sessao.funcionario_id,
        data_entrega: sessao.data,
        foto_comprovante_url: comprovanteEntregaUrl || undefined,
      });

      if (res.success) {
        const matNome =
          materiaisIndividuais.find((m) => m.id === materialSelecionadoId)?.nome_item || "Kit";
        const entreguesSet = new Set(selecionadosEntrega);

        setAlunos((prev) =>
          prev.map((a) =>
            entreguesSet.has(a.matricula_id) &&
            !a.entregas.some((e) => e.objeto_material_id === materialSelecionadoId)
              ? {
                  ...a,
                  entregas: [
                    ...a.entregas,
                    {
                      objeto_material_id: materialSelecionadoId,
                      material_nome: matNome,
                      data_entrega: sessao.data,
                      tamanho_entregue: a.tamanho_uniforme || null,
                    },
                  ],
                }
              : a
          )
        );
        setFeedbackEntrega({
          tipo: "sucesso",
          texto: `${res.count ?? selecionadosEntrega.length} kit(s) entregue(s) com fé pública registrada!`,
        });
        setSelecionadosEntrega([]);
      } else {
        setFeedbackEntrega({ tipo: "erro", texto: res.error || "Erro ao registrar entregas em lote." });
      }
    });
  };

  // Concluir Sessão
  const handleConfirmarConclusao = () => {
    setErroConclusao(null);

    if (fotos.length < 2) {
      setErroConclusao(
        "Regra Canônica §3.5: É obrigatório anexar no mínimo 2 fotos probatórias da sessão para prestação de contas governamental."
      );
      return;
    }

    startTransition(async () => {
      const payload = {
        sessao_id: sessao.id,
        hora_fim: horaFimInput,
        fotos_urls: fotos,
        observacoes: observacoes.trim() || undefined,
        presencas: alunos.map((a) => ({
          matricula_id: a.matricula_id,
          beneficiario_id: a.beneficiario_id,
          status: a.status_presenca,
          justificativa: a.justificativa || undefined,
        })),
      };

      const res = await concluirSessao(payload);

      if (res.success && res.data) {
        setSessao((prev) => ({
          ...prev,
          status: "concluida",
          hora_fim: res.data.hora_fim,
          fotos_urls: (Array.isArray(res.data.fotos_urls) ? (res.data.fotos_urls as string[]) : fotos),
          observacoes: res.data.observacoes || observacoes,
        }));
        setModalConcluirAberto(false);
        router.refresh();
      } else {
        setErroConclusao(res.error || "Erro ao concluir sessão.");
      }
    });
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Barra de Navegação Superior / Mobile Header */}
      <div className="flex items-center justify-between gap-4">
        <Link href="/sessoes">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar para {termoSessao}s
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          {isConcluida ? (
            <Badge
              variant="outline"
              className="gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold px-3 py-1"
            >
              <Lock className="h-3.5 w-3.5" />
              Registro Imutável Concluído
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="gap-1.5 border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400 font-semibold px-3 py-1"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Em Execução
            </Badge>
          )}
        </div>
      </div>

      {/* Banner de Sessão Imutável Concluída */}
      {isConcluida && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-950 dark:text-emerald-200">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="font-semibold text-sm">
                Sessão Homologada e Travada para Auditoria (§3.5)
              </p>
              <p className="text-xs text-emerald-800 dark:text-emerald-300">
                Esta aula foi encerrada às {sessao.hora_fim?.substring(0, 5)}, com ponto eletrônico
                computado e registros de presenças e fotos preservados como snapshot probatório
                inalterável.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cockpit Card Principal */}
      <Card className="border-border/60 shadow-sm overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500" />
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <Badge variant="secondary" className="font-semibold text-xs">
                  {sessao.modalidade?.nome || "Atividade Esportiva"}
                </Badge>
                {grupos.map((g) => (
                  <Badge key={g.id} variant="outline" className="text-xs font-medium">
                    {termoGrupo}: {g.nome}
                  </Badge>
                ))}
              </div>
              <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight">
                {sessao.local?.nome || `${termoLocal} Principal`}
              </CardTitle>
              <CardDescription className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs sm:text-sm mt-1">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 text-blue-500" />
                  {new Date(sessao.data + "T00:00:00").toLocaleDateString("pt-BR", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 text-blue-500" />
                  Início: {sessao.hora_inicio?.substring(0, 5)}
                  {sessao.hora_fim ? ` • Fim: ${sessao.hora_fim.substring(0, 5)}` : ""}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground">
                  <UserCheck className="h-3.5 w-3.5 text-blue-500" />
                  {termoInstrutor}: {sessao.funcionario?.nome_completo || "Instrutor"}
                </span>
              </CardDescription>
            </div>

            {/* Cronômetro ou Duração */}
            <div className="flex flex-col sm:items-end justify-center rounded-lg bg-muted/40 p-3 border border-border/40">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {isConcluida ? "Duração Registrada" : "Tempo Decorrido"}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <Clock className="h-4 w-4 text-blue-600 animate-pulse" />
                <span className="font-mono text-2xl font-bold tracking-tight text-foreground">
                  {isConcluida
                    ? `${sessao.hora_inicio?.substring(0, 5)} - ${sessao.hora_fim?.substring(0, 5)}`
                    : tempoDecorrido || "00:00:00"}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>

        {/* Barra de Estatísticas da Chamada */}
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 border-t border-border/50 pt-4">
            <div className="flex flex-col p-2.5 rounded-md bg-muted/30">
              <span className="text-xs text-muted-foreground">Total de Alunos</span>
              <span className="text-lg font-bold">{totalAlunos}</span>
            </div>
            <div className="flex flex-col p-2.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                Presentes (P)
              </span>
              <span className="text-lg font-bold text-emerald-800 dark:text-emerald-300">
                {presentesCount}
              </span>
            </div>
            <div className="flex flex-col p-2.5 rounded-md bg-rose-500/10 border border-rose-500/20">
              <span className="text-xs text-rose-700 dark:text-rose-400 font-medium">
                Faltas (F)
              </span>
              <span className="text-lg font-bold text-rose-800 dark:text-rose-300">
                {faltasCount}
              </span>
            </div>
            <div className="flex flex-col p-2.5 rounded-md bg-amber-500/10 border border-amber-500/20">
              <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                Justificadas (J)
              </span>
              <span className="text-lg font-bold text-amber-800 dark:text-amber-300">
                {justificadasCount}
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1 flex flex-col p-2.5 rounded-md bg-blue-500/10 border border-blue-500/20">
              <span className="text-xs text-blue-700 dark:text-blue-400 font-medium">
                Taxa Presença
              </span>
              <span className="text-lg font-bold text-blue-800 dark:text-blue-300">
                {taxaPresenca}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seção 1: Chamada Nominal */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Chamada Nominal da Turma
              </CardTitle>
              <CardDescription className="text-xs">
                Classificação tripartite obrigatória: Presente, Falta ou Falta Justificada.
              </CardDescription>
            </div>

            {!isConcluida && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleMarcarTodosPresentes}
                className="gap-1.5 self-start sm:self-auto text-xs"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Marcar Todos Presentes
              </Button>
            )}
          </div>

          {/* Filtros rápidos da lista de chamada */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar beneficiário por nome ou CPF..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>
            {grupos.length > 1 && (
              <select
                value={filtroGrupo}
                onChange={(e) => setFiltroGrupo(e.target.value)}
                className="h-9 px-3 rounded-md border border-input bg-background text-xs"
              >
                <option value="todos">Todas as turmas ({totalAlunos})</option>
                {grupos.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nome}
                  </option>
                ))}
              </select>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {alunosFiltrados.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Nenhum aluno encontrado para os filtros selecionados.
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {alunosFiltrados.map((aluno, index) => {
                const isPresente = aluno.status_presenca === "presente";
                const isFalta = aluno.status_presenca === "falta";
                const isJustificada = aluno.status_presenca === "justificada";

                return (
                  <div
                    key={aluno.matricula_id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/20 transition-colors px-2 rounded-lg"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-mono w-5">
                          {index + 1}.
                        </span>
                        <span className="font-semibold text-sm">{aluno.nome_completo}</span>
                        {aluno.vulneravel && (
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-300/50 py-0 h-4"
                          >
                            Cota Social
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground pl-7">
                        {aluno.cpf && <span>CPF: {aluno.cpf}</span>}
                        {aluno.data_nascimento && (
                          <span>
                            Nasc:{" "}
                            {new Date(aluno.data_nascimento + "T00:00:00").toLocaleDateString("pt-BR")}
                          </span>
                        )}
                        <span>{aluno.grupo_nome}</span>
                      </div>
                      {isJustificada && aluno.justificativa && (
                        <div className="pl-7 pt-1 text-xs text-amber-700 dark:text-amber-400 italic">
                          Justificativa: &ldquo;{aluno.justificativa}&rdquo;
                        </div>
                      )}
                    </div>

                    {/* Botões de Ação Tripartite (P / F / J) */}
                    <div className="flex items-center gap-1.5 self-end sm:self-auto pl-7 sm:pl-0">
                      {isConcluida ? (
                        <Badge
                          variant="outline"
                          className={
                            isPresente
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                              : isFalta
                              ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30"
                              : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
                          }
                        >
                          {isPresente
                            ? "Presente"
                            : isFalta
                            ? "Falta"
                            : `Justificada (${aluno.justificativa || "Informada"})`}
                        </Badge>
                      ) : (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            variant={isPresente ? "default" : "outline"}
                            className={`h-8 px-3 text-xs font-semibold ${
                              isPresente
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white border-transparent"
                                : "hover:border-emerald-500 hover:text-emerald-600"
                            }`}
                            onClick={() => handleAlterarStatus(aluno.matricula_id, "presente")}
                          >
                            P
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={isFalta ? "default" : "outline"}
                            className={`h-8 px-3 text-xs font-semibold ${
                              isFalta
                                ? "bg-rose-600 hover:bg-rose-700 text-white border-transparent"
                                : "hover:border-rose-500 hover:text-rose-600"
                            }`}
                            onClick={() => handleAlterarStatus(aluno.matricula_id, "falta")}
                          >
                            F
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={isJustificada ? "default" : "outline"}
                            className={`h-8 px-3 text-xs font-semibold ${
                              isJustificada
                                ? "bg-amber-600 hover:bg-amber-700 text-white border-transparent"
                                : "hover:border-amber-500 hover:text-amber-600"
                            }`}
                            onClick={() => handleAlterarStatus(aluno.matricula_id, "justificada")}
                          >
                            J
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seção: Entrega Nominal de Kits & Uniformes (§3.10.B - Fé Pública do Professor) */}
      <Card className="border-border/60 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Shirt className="h-5 w-5 text-indigo-600" />
                Entrega de Kits & Uniformes (Fé Pública do {termoInstrutor})
              </CardTitle>
              <CardDescription className="text-xs">
                Confirmação nominal soberana (§3.10.B) • Alimenta o Anexo VII do MROSC. Baixa rápida em 1 toque.
              </CardDescription>
            </div>

            <Badge
              variant="outline"
              className="border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 gap-1 text-xs self-start sm:self-auto"
            >
              <Sparkles className="h-3 w-3" />
              Fé Pública Docente
            </Badge>
          </div>

          {feedbackEntrega && (
            <div
              className={`p-3 rounded-lg text-xs font-medium mt-2 flex items-center justify-between ${
                feedbackEntrega.tipo === "sucesso"
                  ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200"
                  : "bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200"
              }`}
            >
              <span>{feedbackEntrega.texto}</span>
              <button
                type="button"
                onClick={() => setFeedbackEntrega(null)}
                className="text-xs underline opacity-70 hover:opacity-100"
              >
                fechar
              </button>
            </div>
          )}

          {materiaisIndividuais.length === 0 ? (
            <div className="p-4 rounded-lg bg-muted/40 border border-dashed border-border/80 text-xs text-muted-foreground mt-2">
              Nenhum item individual (uniforme/kit) cadastrado no catálogo deste projeto social ainda.
              Administradores podem cadastrar materiais individuais no menu{" "}
              <Link href="/materiais" className="underline font-medium text-foreground">
                Logística de Materiais
              </Link>
              .
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              {/* Barra de Seleção de Material e Ações em Lote */}
              <div className="flex flex-col md:flex-row gap-3 md:items-end justify-between bg-muted/20 p-3 rounded-lg border border-border/40">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs font-medium">Item a Entregar:</Label>
                  <select
                    value={materialSelecionadoId}
                    onChange={(e) => {
                      setMaterialSelecionadoId(e.target.value);
                      setSelecionadosEntrega([]);
                    }}
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-xs font-medium"
                  >
                    {materiaisIndividuais.map((mat) => (
                      <option key={mat.id} value={mat.id}>
                        {mat.nome_item} ({mat.quantidade_adquirida} adquiridos)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSelecionarPresentesPendentes}
                    className="h-9 text-xs gap-1.5"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                    Selecionar Presentes Pendentes
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    onClick={handleEntregarKitsLote}
                    disabled={selecionadosEntrega.length === 0 || isPending}
                    className="h-9 text-xs gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    Entregar para {selecionadosEntrega.length} Aluno(s) (Fé Pública)
                  </Button>

                  {/* Input Opcional de Foto da Folha Física */}
                  <input
                    ref={comprovanteInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={handleUploadComprovanteEntrega}
                    disabled={uploadingComprovante}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => comprovanteInputRef.current?.click()}
                    disabled={uploadingComprovante}
                    className="h-9 text-xs gap-1.5 border border-dashed border-border"
                    title="Upload facultativo para comprovação em papel"
                  >
                    {uploadingComprovante ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Camera className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    {comprovanteEntregaUrl ? "Recibo Anexado ✓" : "Foto Lista Física (Opcional)"}
                  </Button>
                </div>
              </div>

              {/* Nota Explicativa Canônica */}
              <p className="text-[11px] text-muted-foreground">
                <span className="font-semibold text-foreground">Regra Canônica §3.10.B:</span> A baixa
                eletrônica feita pelo professor possui fé pública soberana. O upload de lista física é
                100% facultativo.
              </p>
            </div>
          )}
        </CardHeader>

        {materiaisIndividuais.length > 0 && (
          <CardContent className="pt-0">
            <div className="divide-y divide-border/40">
              {alunosFiltrados.map((aluno) => {
                const entregaRealizada = aluno.entregas.find(
                  (e) => e.objeto_material_id === materialSelecionadoId
                );
                const isJaEntregue = Boolean(entregaRealizada);
                const isSelecionado = selecionadosEntrega.includes(aluno.matricula_id);

                return (
                  <div
                    key={aluno.matricula_id}
                    className={`py-2.5 px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors rounded-lg ${
                      isJaEntregue
                        ? "bg-emerald-500/5 hover:bg-emerald-500/10"
                        : isSelecionado
                        ? "bg-indigo-500/10 hover:bg-indigo-500/15"
                        : "hover:bg-muted/20"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {!isJaEntregue && (
                        <input
                          type="checkbox"
                          checked={isSelecionado}
                          onChange={() => handleToggleSelecionadoEntrega(aluno.matricula_id)}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      )}

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{aluno.nome_completo}</span>
                          {aluno.tamanho_uniforme && (
                            <Badge variant="secondary" className="text-[10px] font-mono py-0 h-4">
                              Tam: {aluno.tamanho_uniforme}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                          {aluno.cpf && <span>CPF: {aluno.cpf}</span>}
                          <span>•</span>
                          <span>{aluno.grupo_nome}</span>
                          <span>•</span>
                          <span
                            className={
                              aluno.status_presenca === "presente"
                                ? "text-emerald-600 font-medium"
                                : "text-muted-foreground"
                            }
                          >
                            Presença: {aluno.status_presenca.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {isJaEntregue ? (
                        <Badge
                          variant="outline"
                          className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 gap-1.5 py-1 text-xs"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          Kit Entregue ({new Date(entregaRealizada!.data_entrega + "T00:00:00").toLocaleDateString("pt-BR")})
                        </Badge>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => handleEntregarKitIndividual(aluno)}
                          disabled={isPending}
                          className="h-8 text-xs font-semibold gap-1.5 border-indigo-500/30 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-950/40"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                          Entregar Kit (1 Toque)
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Seção 2: Evidências Fotográficas Probatórias (§3.5) */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Camera className="h-5 w-5 text-blue-600" />
                Evidências Fotográficas Probatórias
              </CardTitle>
              <CardDescription className="text-xs">
                Exigência rigorosa de prestação de contas governamental: mínimo de 2 fotos da aula
                em campo.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={
                  fotos.length >= 2
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold"
                    : "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-semibold"
                }
              >
                {fotos.length >= 2 ? (
                  <CheckCircle2 className="h-3 w-3 mr-1 inline text-emerald-600" />
                ) : (
                  <AlertCircle className="h-3 w-3 mr-1 inline text-amber-600" />
                )}
                {fotos.length} de 2 fotos mínimas
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {fotoError && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300 rounded-md border border-rose-200">
              {fotoError}
            </div>
          )}

          {/* Botões de Ação para Upload / Câmera */}
          {!isConcluida && (
            <div className="flex flex-wrap gap-3">
              {/* Input escondido para Câmera Mobile Traseira */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleUploadFoto}
                disabled={uploadingFoto}
              />
              <Button
                type="button"
                variant="outline"
                className="gap-2 text-xs"
                onClick={() => cameraInputRef.current?.click()}
                disabled={uploadingFoto}
              >
                {uploadingFoto ? (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                ) : (
                  <Camera className="h-4 w-4 text-blue-600" />
                )}
                Tirar Foto (Câmera)
              </Button>

              {/* Input escondido para Upload de Galeria/Arquivo */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleUploadFoto}
                disabled={uploadingFoto}
              />
              <Button
                type="button"
                variant="secondary"
                className="gap-2 text-xs"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFoto}
              >
                {uploadingFoto ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <UploadCloud className="h-4 w-4 text-muted-foreground" />
                )}
                Carregar Imagem da Galeria
              </Button>
            </div>
          )}

          {/* Grid de Galeria das Fotos Anexadas */}
          {fotos.length === 0 ? (
            <div className="border border-dashed border-border/80 rounded-lg p-8 text-center space-y-2 bg-muted/20">
              <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground/60" />
              <p className="text-sm font-medium text-muted-foreground">
                Nenhuma evidência fotográfica anexada ainda.
              </p>
              <p className="text-xs text-muted-foreground/80 max-w-sm mx-auto">
                Tire fotos da turma em atividade, exercícios práticos ou momento da chamada com a
                câmera do celular.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {fotos.map((url, idx) => (
                <div
                  key={idx}
                  className="group relative aspect-video rounded-lg overflow-hidden border border-border/60 bg-black/5"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Evidência probatória ${idx + 1}`}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
                    Foto #{idx + 1}
                  </div>
                  {!isConcluida && (
                    <button
                      type="button"
                      onClick={() => handleRemoverFoto(idx)}
                      className="absolute top-1.5 right-1.5 p-1 bg-rose-600/90 text-white rounded hover:bg-rose-700 opacity-90 group-hover:opacity-100 transition-opacity"
                      title="Remover foto"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seção 3: Observações da Sessão */}
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            Observações Pedagógicas e de Campo
          </CardTitle>
          <CardDescription className="text-xs">
            Registro de ocorrências, condições climáticas, avarias de material ou recados para o
            supervisor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isConcluida ? (
            <p className="text-xs text-muted-foreground italic bg-muted/20 p-3 rounded-md">
              {observacoes || "Nenhuma observação registrada para esta sessão."}
            </p>
          ) : (
            <Textarea
              placeholder="Ex: Treino realizado na quadra coberta devido à chuva fraca; 1 bola danificada..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
              className="text-xs"
            />
          )}
        </CardContent>
      </Card>

      {/* Barra Inferior Fixa de Ação para Conclusão de Sessão (Mobile-First) */}
      {!isConcluida && (
        <div className="sticky bottom-4 z-40 bg-background/95 backdrop-blur-md p-4 rounded-xl border border-border shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex flex-col">
              <span className="text-xs font-semibold">
                {presentesCount} de {totalAlunos} presentes ({taxaPresenca}%)
              </span>
              <span className="text-[11px] text-muted-foreground">
                {fotos.length < 2 ? (
                  <span className="text-amber-600 font-medium flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Faltam {2 - fotos.length} fotos para poder
                    finalizar
                  </span>
                ) : (
                  <span className="text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Requisitos de fotos atendidos
                  </span>
                )}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              className="w-full sm:w-auto gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-10 px-6 shadow-sm"
              disabled={fotos.length < 2 || isPending}
              onClick={() => {
                const agora = new Date();
                setHoraFimInput(agora.toTimeString().substring(0, 5));
                setModalConcluirAberto(true);
              }}
            >
              <CheckCircle2 className="h-4 w-4" />
              Finalizar Aula e Gravar Ponto
            </Button>
          </div>
        </div>
      )}

      {/* Modal de Justificativa de Falta */}
      <Dialog
        open={Boolean(justificandoMatriculaId)}
        onOpenChange={(aberto) => !aberto && setJustificandoMatriculaId(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Falta Justificada</DialogTitle>
            <DialogDescription className="text-xs">
              Informe a justificativa fornecida pelo beneficiário ou responsável (ex.: atestado
              médico, prova escolar).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="justificativa-text" className="text-xs">
              Motivo da Justificativa
            </Label>
            <Input
              id="justificativa-text"
              placeholder="Ex: Atestado médico de 2 dias / Prova escolar"
              value={textoJustificativa}
              onChange={(e) => setTextoJustificativa(e.target.value)}
              className="text-xs"
              autoFocus
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setJustificandoMatriculaId(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={handleSalvarJustificativa}
            >
              Confirmar Falta Justificada
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Conclusão e Gravação de Ponto Probatório */}
      <Dialog open={modalConcluirAberto} onOpenChange={setModalConcluirAberto}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              Encerrar Sessão e Gravar Ponto
            </DialogTitle>
            <DialogDescription className="text-xs">
              Atenção: Ao concluir a sessão, os registros de presença e fotos serão gravados como um
              snapshot probatório imutável perante a auditoria governamental (§3.5).
            </DialogDescription>
          </DialogHeader>

          {erroConclusao && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300 rounded-md border border-rose-200">
              {erroConclusao}
            </div>
          )}

          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-muted/40 p-3 border border-border/60 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Início da Aula:</span>
                <span className="font-semibold">{sessao.hora_inicio?.substring(0, 5)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Presenças Registradas:</span>
                <span className="font-semibold text-emerald-600">
                  {presentesCount} de {totalAlunos} ({taxaPresenca}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Faltas / Justificadas:</span>
                <span className="font-semibold">
                  {faltasCount} faltas • {justificadasCount} justificadas
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Evidências Fotográficas:</span>
                <span className="font-semibold text-blue-600">{fotos.length} fotos anexadas</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="hora-fim" className="text-xs font-semibold">
                Horário Real de Saída / Encerramento da Aula
              </Label>
              <Input
                id="hora-fim"
                type="time"
                value={horaFimInput}
                onChange={(e) => setHoraFimInput(e.target.value)}
                className="text-xs"
              />
              <p className="text-[11px] text-muted-foreground">
                Este horário será carimbado no ponto eletrônico do RH para cômputo de horas
                trabalhadas.
              </p>
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
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-2"
              disabled={isPending}
              onClick={handleConfirmarConclusao}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Confirmar e Homologar Aula
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
