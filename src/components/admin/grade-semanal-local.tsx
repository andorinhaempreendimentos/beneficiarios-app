"use client";

import React, { useState, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  createBloco,
  updateBloco,
  deleteBloco,
} from "@/lib/actions/blocos";
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
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import {
  Plus,
  Trash2,
  AlertTriangle,
  Clock,
  User,
  Calendar,
  Pencil,
  Info,
} from "lucide-react";

// Tipos
export interface BlocoLocalItem {
  id: string;
  nome: string | null; // Espaço físico ou nome da aula
  objeto_id: string;
  local_id: string;
  tipo_recorrencia?: string;
  dia_semana: number | null; // 0=Dom, 1=Seg ... 6=Sáb
  dia_mes?: number | null;
  ordem_semana_mes?: number | null;
  ajuste_fim_de_semana?: string | null;
  data_especifica: string | null;
  hora_inicio: string; // HH:MM
  hora_fim: string; // HH:MM
  instrutor_id: string | null;
  ativo: boolean;
  instrutor?: { id: string; nome_completo: string } | null;
  turmas?: { id: string; nome: string }[];
}

export interface GrupoOption {
  id: string;
  nome: string;
  capacidade_maxima?: number;
  ativo?: boolean;
}

export interface InstrutorOption {
  id: string;
  nome_completo: string;
  cargo?: string;
}

interface GradeSemanalLocalProps {
  localId: string;
  objetoId: string;
  initialBlocos: BlocoLocalItem[];
  grupos: GrupoOption[];
  instrutores: InstrutorOption[];
  termoLocal?: string;
  termoInstrutor?: string;
  termoGrupo?: string;
}

// Configurações da Grade
const HORA_INICIO = 7; // 07:00
const HORA_FIM = 21; // 21:00
const TOTAL_HORAS = HORA_FIM - HORA_INICIO;
const PX_HORA = 52; // Altura em pixels de 1 hora
const TOTAL_ALTURA = TOTAL_HORAS * PX_HORA;
const SNAP_MINUTOS = 30; // Snapping para criação e arraste (30 min)

const DIAS_SEMANA = [
  { dia: 1, label: "Segunda-feira", short: "Seg" },
  { dia: 2, label: "Terça-feira", short: "Ter" },
  { dia: 3, label: "Quarta-feira", short: "Qua" },
  { dia: 4, label: "Quinta-feira", short: "Qui" },
  { dia: 5, label: "Sexta-feira", short: "Sex" },
  { dia: 6, label: "Sábado", short: "Sáb" },
  { dia: 0, label: "Domingo", short: "Dom" },
];

function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function minutesToTime(totalMin: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, totalMin));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function snapMinutes(min: number, snap = SNAP_MINUTOS): number {
  return Math.round(min / snap) * snap;
}

export function GradeSemanalLocal({
  localId,
  objetoId,
  initialBlocos,
  grupos,
  instrutores,
  termoInstrutor = "Professor",
  termoGrupo = "Turma",
}: GradeSemanalLocalProps) {
  const router = useRouter();
  const [blocos, setBlocos] = useState<BlocoLocalItem[]>(initialBlocos);
  const [filtroDia, setFiltroDia] = useState<string>("todos");
  const [filtroInstrutor, setFiltroInstrutor] = useState<string>("todos");

  // Estado do Modal de Edição/Criação
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBloco, setEditingBloco] = useState<BlocoLocalItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Exclusão
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    nome: "",
    tipo_recorrencia: "semanal",
    dia_semana: 1,
    dia_mes: 1,
    ordem_semana_mes: 1,
    ajuste_fim_de_semana: "exato",
    hora_inicio: "08:00",
    hora_fim: "09:30",
    instrutor_id: "",
    grupos_ids: [] as string[],
    ativo: true,
  });

  // Estado de Arraste de Criação
  const [draggingCreation, setDraggingCreation] = useState<{
    dia_semana: number;
    startMin: number;
    currentMin: number;
  } | null>(null);

  // Estado de Arraste / Redimensionamento de Bloco Existente
  const [dragState, setDragState] = useState<{
    blocoId: string;
    type: "move" | "resize-top" | "resize-bottom";
    initialDia: number;
    currentDia: number;
    initialStartMin: number;
    initialEndMin: number;
    currentStartMin: number;
    currentEndMin: number;
    startY: number;
    startX: number;
  } | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);

  // Mapeamentos rápidos
  const instrutoresMap = useMemo(() => {
    return new Map(instrutores.map((i) => [i.id, i.nome_completo]));
  }, [instrutores]);

  const gruposMap = useMemo(() => {
    return new Map(grupos.map((g) => [g.id, g.nome]));
  }, [grupos]);

  // Detector de Conflitos e Choques de Horário (§3.4)
  const getConflitos = useCallback(
    (target: BlocoLocalItem, todos: BlocoLocalItem[]) => {
      const w: string[] = [];
      const inicio = timeToMinutes(target.hora_inicio);
      const fim = timeToMinutes(target.hora_fim);

      if (fim <= inicio) {
        w.push("O horário de término precisa ser posterior ao início.");
        return w;
      }

      // Conflitos no mesmo dia da semana
      const outrosNoDia = todos.filter(
        (b) =>
          b.id !== target.id &&
          b.dia_semana === target.dia_semana &&
          b.ativo &&
          (target.tipo_recorrencia ?? "semanal") === "semanal" &&
          (b.tipo_recorrencia ?? "semanal") === "semanal"
      );

      for (const outro of outrosNoDia) {
        const oIni = timeToMinutes(outro.hora_inicio);
        const oFim = timeToMinutes(outro.hora_fim);

        // Se houver sobreposição de horários
        if (inicio < oFim && fim > oIni) {
          const intervalo = `${outro.hora_inicio} às ${outro.hora_fim}`;

          // Choque 1: Mesmo Professor no mesmo horário
          if (
            target.instrutor_id &&
            outro.instrutor_id &&
            target.instrutor_id === outro.instrutor_id
          ) {
            const nomeProf = instrutoresMap.get(target.instrutor_id) ?? termoInstrutor;
            w.push(`${nomeProf} já está alocado(a) no horário das ${intervalo}.`);
          }

          // Choque 2: Mesmo Espaço Físico ocupado
          if (
            target.nome &&
            outro.nome &&
            target.nome.trim().toLowerCase() === outro.nome.trim().toLowerCase()
          ) {
            w.push(`O espaço "${target.nome}" já está ocupado no horário das ${intervalo}.`);
          }

          // Choque 3: Mesma Turma/Grupo com aula concorrente
          const targetGruposIds =
            target.turmas?.map((t) => t.id) ?? [];
          const outroGruposIds =
            outro.turmas?.map((t) => t.id) ?? [];

          for (const gid of targetGruposIds) {
            if (outroGruposIds.includes(gid)) {
              const nomeGrupo = gruposMap.get(gid) ?? termoGrupo;
              w.push(`A turma "${nomeGrupo}" já tem aula alocada das ${intervalo}.`);
            }
          }
        }
      }

      return w;
    },
    [instrutoresMap, gruposMap, termoInstrutor, termoGrupo]
  );

  // Blocos filtrados para exibição
  const filteredBlocos = useMemo(() => {
    return blocos.filter((b) => {
      if (filtroDia !== "todos" && String(b.dia_semana) !== filtroDia) {
        return false;
      }
      if (filtroInstrutor !== "todos" && b.instrutor_id !== filtroInstrutor) {
        return false;
      }
      return true;
    });
  }, [blocos, filtroDia, filtroInstrutor]);

  // Abertura do Modal de Edição
  function handleOpenEdit(bloco: BlocoLocalItem) {
    setEditingBloco(bloco);
    setFormData({
      nome: bloco.nome ?? "",
      tipo_recorrencia: bloco.tipo_recorrencia ?? "semanal",
      dia_semana: bloco.dia_semana ?? 1,
      dia_mes: bloco.dia_mes ?? 1,
      ordem_semana_mes: bloco.ordem_semana_mes ?? 1,
      ajuste_fim_de_semana: bloco.ajuste_fim_de_semana ?? "exato",
      hora_inicio: bloco.hora_inicio,
      hora_fim: bloco.hora_fim,
      instrutor_id: bloco.instrutor_id ?? "",
      grupos_ids: bloco.turmas?.map((t) => t.id) ?? [],
      ativo: bloco.ativo,
    });
    setErrorMsg(null);
    setModalOpen(true);
  }

  // Abertura do Modal para Novo Bloco Manual
  function handleOpenNewManual(dia = 1, horaIni = "08:00", horaFim = "09:30") {
    setEditingBloco(null);
    setFormData({
      nome: "Quadra 1",
      tipo_recorrencia: "semanal",
      dia_semana: dia,
      dia_mes: 1,
      ordem_semana_mes: 1,
      ajuste_fim_de_semana: "exato",
      hora_inicio: horaIni,
      hora_fim: horaFim,
      instrutor_id: instrutores.length > 0 ? instrutores[0].id : "",
      grupos_ids: [],
      ativo: true,
    });
    setErrorMsg(null);
    setModalOpen(true);
  }

  // Toggle Grupo selecionado no Form
  function toggleGrupoNoForm(grupoId: string) {
    setFormData((prev) => {
      const exists = prev.grupos_ids.includes(grupoId);
      return {
        ...prev,
        grupos_ids: exists
          ? prev.grupos_ids.filter((id) => id !== grupoId)
          : [...prev.grupos_ids, grupoId],
      };
    });
  }

  // Salvar Formulário de Bloco
  async function handleSaveBloco(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const payload = {
      objeto_id: objetoId,
      local_id: localId,
      nome: formData.nome?.trim() || null,
      tipo_recorrencia: formData.tipo_recorrencia as
        | "semanal"
        | "mensal_dia_fixo"
        | "mensal_dia_semana"
        | "pontual",
      dia_semana: Number(formData.dia_semana),
      dia_mes:
        formData.tipo_recorrencia === "mensal_dia_fixo" ? Number(formData.dia_mes) : null,
      ordem_semana_mes:
        formData.tipo_recorrencia === "mensal_dia_semana"
          ? Number(formData.ordem_semana_mes)
          : null,
      ajuste_fim_de_semana: (formData.tipo_recorrencia === "mensal_dia_fixo"
        ? formData.ajuste_fim_de_semana
        : "exato") as "exato" | "proximo_dia_util" | "dia_util_anterior",
      data_especifica: null,
      hora_inicio: formData.hora_inicio,
      hora_fim: formData.hora_fim,
      instrutor_id: formData.instrutor_id || null,
      grupos_ids: formData.grupos_ids,
      ativo: formData.ativo,
    };

    try {
      if (editingBloco) {
        const res = await updateBloco(editingBloco.id, payload);
        if (res.success && res.data) {
          // Atualiza estado local
          const updated: BlocoLocalItem = {
            ...editingBloco,
            ...res.data,
            instrutor: formData.instrutor_id
              ? {
                  id: formData.instrutor_id,
                  nome_completo:
                    instrutoresMap.get(formData.instrutor_id) ?? termoInstrutor,
                }
              : null,
            turmas: formData.grupos_ids.map((id) => ({
              id,
              nome: gruposMap.get(id) ?? termoGrupo,
            })),
          };
          setBlocos((prev) => prev.map((b) => (b.id === editingBloco.id ? updated : b)));
          setModalOpen(false);
          router.refresh();
        } else {
          setErrorMsg(res.error ?? "Erro ao atualizar bloco de horário.");
        }
      } else {
        const res = await createBloco(payload);
        if (res.success && res.data) {
          const novo: BlocoLocalItem = {
            ...res.data,
            instrutor: formData.instrutor_id
              ? {
                  id: formData.instrutor_id,
                  nome_completo:
                    instrutoresMap.get(formData.instrutor_id) ?? termoInstrutor,
                }
              : null,
            turmas: formData.grupos_ids.map((id) => ({
              id,
              nome: gruposMap.get(id) ?? termoGrupo,
            })),
          };
          setBlocos((prev) => [...prev, novo]);
          setModalOpen(false);
          router.refresh();
        } else {
          setErrorMsg(res.error ?? "Erro ao criar bloco de horário.");
        }
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  // Exclusão de Bloco
  async function handleConfirmDelete() {
    if (!deleteTargetId) return;
    const res = await deleteBloco(deleteTargetId);
    if (res.success) {
      setBlocos((prev) => prev.filter((b) => b.id !== deleteTargetId));
      setDeleteOpen(false);
      setDeleteTargetId(null);
      if (editingBloco?.id === deleteTargetId) {
        setModalOpen(false);
      }
      router.refresh();
    } else {
      setErrorMsg(res.error ?? "Erro ao excluir bloco.");
    }
  }

  // ==========================================
  // INTERAÇÕES INTERATIVAS (POINTER DRAG/DROP)
  // ==========================================

  // Início de criação de slot por clique e arraste
  function handleColumnPointerDown(e: React.PointerEvent, diaSemana: number) {
    if (e.button !== 0) return; // Apenas botão principal
    // Evita iniciar criação se clicou diretamente num slot existente
    if ((e.target as HTMLElement).closest(".bloco-slot")) return;

    const colRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const offsetY = e.clientY - colRect.top;
    const rawMinutes = HORA_INICIO * 60 + (offsetY / PX_HORA) * 60;
    const snapped = snapMinutes(rawMinutes, SNAP_MINUTOS);

    setDraggingCreation({
      dia_semana: diaSemana,
      startMin: snapped,
      currentMin: Math.min(HORA_FIM * 60, snapped + 60),
    });

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handleColumnPointerMove(e: React.PointerEvent) {
    if (!draggingCreation) return;
    const colRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const offsetY = e.clientY - colRect.top;
    const rawMinutes = HORA_INICIO * 60 + (offsetY / PX_HORA) * 60;
    const snapped = Math.max(
      draggingCreation.startMin + SNAP_MINUTOS,
      Math.min(HORA_FIM * 60, snapMinutes(rawMinutes, SNAP_MINUTOS))
    );

    setDraggingCreation((prev) => (prev ? { ...prev, currentMin: snapped } : null));
  }

  async function handleColumnPointerUp() {
    if (!draggingCreation) return;
    const { dia_semana, startMin, currentMin } = draggingCreation;
    setDraggingCreation(null);

    const duracao = currentMin - startMin;
    if (duracao < SNAP_MINUTOS) return; // Clique rápido sem arraste significativo

    const hIni = minutesToTime(startMin);
    const hFim = minutesToTime(currentMin);

    // Abre o modal pré-preenchido para criar com precisão
    handleOpenNewManual(dia_semana, hIni, hFim);
  }

  // ==========================================
  // ARRASTE E REDIMENSIONAMENTO DE BLOCO EXISTENTE
  // ==========================================

  function handleSlotPointerDown(
    e: React.PointerEvent,
    bloco: BlocoLocalItem,
    type: "move" | "resize-top" | "resize-bottom"
  ) {
    e.stopPropagation();
    if (e.button !== 0) return;

    const startMin = timeToMinutes(bloco.hora_inicio);
    const endMin = timeToMinutes(bloco.hora_fim);

    setDragState({
      blocoId: bloco.id,
      type,
      initialDia: bloco.dia_semana ?? 1,
      currentDia: bloco.dia_semana ?? 1,
      initialStartMin: startMin,
      initialEndMin: endMin,
      currentStartMin: startMin,
      currentEndMin: endMin,
      startY: e.clientY,
      startX: e.clientX,
    });

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handleSlotPointerMove(e: React.PointerEvent) {
    if (!dragState) return;

    const deltaY = e.clientY - dragState.startY;
    const deltaMinutes = snapMinutes((deltaY / PX_HORA) * 60, SNAP_MINUTOS);

    if (dragState.type === "resize-bottom") {
      const newEnd = Math.min(
        HORA_FIM * 60,
        Math.max(dragState.initialStartMin + SNAP_MINUTOS, dragState.initialEndMin + deltaMinutes)
      );
      setDragState((prev) => (prev ? { ...prev, currentEndMin: newEnd } : null));
    } else if (dragState.type === "resize-top") {
      const newStart = Math.max(
        HORA_INICIO * 60,
        Math.min(dragState.initialEndMin - SNAP_MINUTOS, dragState.initialStartMin + deltaMinutes)
      );
      setDragState((prev) => (prev ? { ...prev, currentStartMin: newStart } : null));
    } else if (dragState.type === "move") {
      const duration = dragState.initialEndMin - dragState.initialStartMin;
      let newStart = snapMinutes(dragState.initialStartMin + deltaMinutes, SNAP_MINUTOS);
      newStart = Math.max(HORA_INICIO * 60, Math.min(HORA_FIM * 60 - duration, newStart));
      const newEnd = newStart + duration;

      // Calcular dia baseado no deltaX e na largura da coluna
      let targetDia = dragState.initialDia;
      if (gridRef.current) {
        const gridRect = gridRef.current.getBoundingClientRect();
        const colWidth = (gridRect.width - 56) / 7; // subtrai timeline lateral
        const relX = e.clientX - (gridRect.left + 56);
        const colIndex = Math.max(0, Math.min(6, Math.floor(relX / colWidth)));
        targetDia = DIAS_SEMANA[colIndex].dia;
      }

      setDragState((prev) =>
        prev
          ? {
              ...prev,
              currentStartMin: newStart,
              currentEndMin: newEnd,
              currentDia: targetDia,
            }
          : null
      );
    }
  }

  async function handleSlotPointerUp() {
    if (!dragState) return;
    const { blocoId, currentDia, currentStartMin, currentEndMin } = dragState;
    setDragState(null);

    const bloco = blocos.find((b) => b.id === blocoId);
    if (!bloco) return;

    const newIni = minutesToTime(currentStartMin);
    const newFim = minutesToTime(currentEndMin);

    // Se não houve alteração, apenas sai
    if (
      bloco.dia_semana === currentDia &&
      bloco.hora_inicio === newIni &&
      bloco.hora_fim === newFim
    ) {
      return;
    }

    // Atualização otimista imediata na interface
    const updatedBloco: BlocoLocalItem = {
      ...bloco,
      dia_semana: currentDia,
      hora_inicio: newIni,
      hora_fim: newFim,
    };

    setBlocos((prev) => prev.map((b) => (b.id === blocoId ? updatedBloco : b)));

    // Persistência no servidor
    const res = await updateBloco(blocoId, {
      objeto_id: objetoId,
      local_id: localId,
      nome: bloco.nome,
      dia_semana: currentDia,
      hora_inicio: newIni,
      hora_fim: newFim,
      instrutor_id: bloco.instrutor_id,
      grupos_ids: bloco.turmas?.map((t) => t.id) ?? [],
      ativo: bloco.ativo,
      tipo_recorrencia: (bloco.tipo_recorrencia ?? "semanal") as
        | "semanal"
        | "mensal_dia_fixo"
        | "mensal_dia_semana"
        | "pontual",
      dia_mes: bloco.dia_mes,
      ordem_semana_mes: bloco.ordem_semana_mes,
      ajuste_fim_de_semana: (bloco.ajuste_fim_de_semana ?? "exato") as
        | "exato"
        | "proximo_dia_util"
        | "dia_util_anterior",
      data_especifica: bloco.data_especifica,
    });

    if (!res.success) {
      // Reverter em caso de erro
      setBlocos((prev) => prev.map((b) => (b.id === blocoId ? bloco : b)));
      setErrorMsg(res.error ?? "Erro ao mover bloco na grade.");
    } else {
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      {/* Barra de Filtros e Ações */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between bg-card p-4 rounded-xl border border-border shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Clock className="h-4 w-4 text-primary" />
            <span>Horário: 07:00 às 21:00</span>
          </div>

          <div className="h-4 w-px bg-border hidden sm:block" />

          {/* Filtro por Professor */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{termoInstrutor}:</span>
            <select
              value={filtroInstrutor}
              onChange={(e) => setFiltroInstrutor(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="todos">Todos os Professores</option>
              {instrutores.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nome_completo}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Dia */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Dia:</span>
            <select
              value={filtroDia}
              onChange={(e) => setFiltroDia(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2.5 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="todos">Todos os Dias</option>
              {DIAS_SEMANA.map((d) => (
                <option key={d.dia} value={String(d.dia)}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Button onClick={() => handleOpenNewManual(1)} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          <span>Criar Bloco de Horário</span>
        </Button>
      </div>

      {/* Dica de Uso Interativo */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/60 text-xs text-muted-foreground border border-border">
        <Info className="h-4 w-4 text-primary shrink-0" />
        <span>
          <strong>Dica Interativa:</strong> Clique e arraste para baixo numa área vazia de qualquer dia
          para criar um horário. Puxe a borda superior ou inferior de um bloco para redimensionar, ou
          arraste o corpo dele para movê-lo de dia e horário.
        </span>
      </div>

      {/* Grid Visual Semanal */}
      <div
        ref={gridRef}
        className="rounded-xl border border-border bg-card overflow-x-auto select-none shadow-xs"
        style={{ minWidth: "820px" }}
      >
        {/* Cabeçalho dos Dias */}
        <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-border bg-muted/30">
          <div className="h-10 flex items-center justify-center text-xs font-semibold text-muted-foreground border-r border-border">
            Horário
          </div>
          {DIAS_SEMANA.map((d) => {
            const countNoDia = blocos.filter((b) => b.dia_semana === d.dia && b.ativo).length;
            return (
              <div
                key={d.dia}
                className="h-10 flex items-center justify-center gap-1.5 text-xs font-semibold border-r border-border last:border-r-0 px-2"
              >
                <span>{d.short}</span>
                {countNoDia > 0 && (
                  <Badge variant="secondary" className="h-4 px-1.5 text-[10px] rounded-full">
                    {countNoDia}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>

        {/* Corpo da Grade com Linhas de Horário e Colunas */}
        <div
          className="relative grid grid-cols-[56px_repeat(7,1fr)]"
          style={{ height: `${TOTAL_ALTURA}px` }}
        >
          {/* Coluna Lateral da Timeline (07:00 a 21:00) */}
          <div className="border-r border-border bg-muted/10 relative">
            {Array.from({ length: TOTAL_HORAS }).map((_, i) => {
              const h = HORA_INICIO + i;
              return (
                <div
                  key={h}
                  className="absolute left-0 right-0 border-t border-border/60 text-[10px] text-muted-foreground px-1.5 pt-0.5 font-mono"
                  style={{ top: `${i * PX_HORA}px`, height: `${PX_HORA}px` }}
                >
                  {String(h).padStart(2, "0")}:00
                </div>
              );
            })}
          </div>

          {/* 7 Colunas Interativas para Cada Dia da Semana */}
          {DIAS_SEMANA.map((d) => {
            const blocosDoDia = filteredBlocos.filter((b) => b.dia_semana === d.dia);

            return (
              <div
                key={d.dia}
                onPointerDown={(e) => handleColumnPointerDown(e, d.dia)}
                onPointerMove={handleColumnPointerMove}
                onPointerUp={handleColumnPointerUp}
                className="relative border-r border-border last:border-r-0 cursor-cell hover:bg-muted/15 transition-colors"
                style={{
                  backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${PX_HORA - 1}px, var(--border) ${PX_HORA - 1}px, var(--border) ${PX_HORA}px)`,
                }}
              >
                {/* Linha de Meia Hora Suave */}
                {Array.from({ length: TOTAL_HORAS }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute left-0 right-0 border-t border-border/30 pointer-events-none"
                    style={{ top: `${i * PX_HORA + PX_HORA / 2}px` }}
                  />
                ))}

                {/* Preview de Criação em Andamento */}
                {draggingCreation && draggingCreation.dia_semana === d.dia && (
                  <div
                    className="absolute left-1 right-1 rounded-lg bg-primary/20 border-2 border-dashed border-primary z-20 pointer-events-none p-1.5 flex flex-col justify-between"
                    style={{
                      top: `${((draggingCreation.startMin - HORA_INICIO * 60) / 60) * PX_HORA}px`,
                      height: `${((draggingCreation.currentMin - draggingCreation.startMin) / 60) * PX_HORA}px`,
                    }}
                  >
                    <span className="text-[10px] font-bold text-primary">
                      {minutesToTime(draggingCreation.startMin)} -{" "}
                      {minutesToTime(draggingCreation.currentMin)}
                    </span>
                    <span className="text-[9px] text-primary/80">Solte para configurar</span>
                  </div>
                )}

                {/* Blocos Cadastrados no Dia */}
                {blocosDoDia.map((bloco) => {
                  const isBeingDragged = dragState?.blocoId === bloco.id;

                  const startMin =
                    isBeingDragged && dragState
                      ? dragState.currentStartMin
                      : timeToMinutes(bloco.hora_inicio);
                  const endMin =
                    isBeingDragged && dragState
                      ? dragState.currentEndMin
                      : timeToMinutes(bloco.hora_fim);

                  const topPx = ((startMin - HORA_INICIO * 60) / 60) * PX_HORA;
                  const heightPx = Math.max(26, ((endMin - startMin) / 60) * PX_HORA);

                  // Verificar conflitos deste bloco com o conjunto
                  const conflitos = getConflitos(bloco, blocos);
                  const temConflito = conflitos.length > 0;

                  return (
                    <div
                      key={bloco.id}
                      className={`bloco-slot absolute left-1 right-1 rounded-lg p-2 border transition-shadow cursor-grab active:cursor-grabbing group ${
                        temConflito
                          ? "bg-amber-500/10 border-amber-500 text-foreground dark:bg-amber-950/30"
                          : "bg-card border-primary/40 hover:border-primary shadow-xs hover:shadow-md"
                      } ${isBeingDragged ? "z-30 ring-2 ring-primary shadow-lg opacity-90" : "z-10"}`}
                      style={{
                        top: `${topPx}px`,
                        height: `${heightPx}px`,
                      }}
                      onPointerDown={(e) => handleSlotPointerDown(e, bloco, "move")}
                      onPointerMove={handleSlotPointerMove}
                      onPointerUp={handleSlotPointerUp}
                    >
                      {/* Handle de Redimensionamento Topo */}
                      <div
                        className="absolute top-0 left-0 right-0 h-2.5 cursor-ns-resize hover:bg-primary/30 rounded-t-lg z-20"
                        onPointerDown={(e) => handleSlotPointerDown(e, bloco, "resize-top")}
                        onPointerMove={handleSlotPointerMove}
                        onPointerUp={handleSlotPointerUp}
                      />

                      {/* Conteúdo do Bloco */}
                      <div className="flex flex-col h-full justify-between pointer-events-none overflow-hidden">
                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-xs truncate flex items-center gap-1">
                              {bloco.nome || "Espaço"}
                              {temConflito && (
                                <span title={conflitos.join(" | ")} className="inline-flex shrink-0">
                                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                </span>
                              )}
                            </span>

                            <div className="flex items-center gap-1 pointer-events-auto">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEdit(bloco);
                                }}
                                className="h-5 w-5 rounded bg-muted/80 hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-colors"
                                title="Editar bloco de horário"
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 text-[11px] font-mono font-medium text-primary mt-0.5">
                            <Clock className="h-3 w-3" />
                            <span>
                              {bloco.hora_inicio} - {bloco.hora_fim}
                            </span>
                          </div>
                        </div>

                        {heightPx >= 48 && (
                          <div className="text-[10px] text-muted-foreground truncate flex items-center gap-1 mt-1">
                            <User className="h-3 w-3 shrink-0" />
                            <span className="truncate">
                              {bloco.instrutor?.nome_completo ?? `Sem ${termoInstrutor.toLowerCase()}`}
                            </span>
                          </div>
                        )}

                        {heightPx >= 70 && bloco.turmas && bloco.turmas.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {bloco.turmas.map((t) => (
                              <Badge
                                key={t.id}
                                variant="outline"
                                className="text-[9px] px-1 py-0 h-3.5 font-normal bg-background"
                              >
                                {t.nome}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Handle de Redimensionamento Base */}
                      <div
                        className="absolute bottom-0 left-0 right-0 h-2.5 cursor-ns-resize hover:bg-primary/30 rounded-b-lg z-20"
                        onPointerDown={(e) => handleSlotPointerDown(e, bloco, "resize-bottom")}
                        onPointerMove={handleSlotPointerMove}
                        onPointerUp={handleSlotPointerUp}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de Criação / Edição do Bloco */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSaveBloco} className="space-y-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <span>
                  {editingBloco
                    ? "Editar Bloco de Horário da Grade"
                    : "Novo Bloco de Horário na Grade"}
                </span>
              </DialogTitle>
              <DialogDescription>
                Configure o espaço, dia, horário, instrutor responsável e turmas atendidas no polo.
              </DialogDescription>
            </DialogHeader>

            {errorMsg && (
              <div className="flex items-center gap-2 p-3 rounded-lg text-sm bg-destructive/10 text-destructive border border-destructive/20">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Espaço / Ambiente */}
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="bloco_espaco">Espaço Físico / Ambiente *</Label>
                <Input
                  id="bloco_espaco"
                  value={formData.nome}
                  onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: Quadra 1, Campo Society, Sala de Ginástica, Tatame A..."
                  required
                />
              </div>

              {/* Tipo de Recorrência */}
              <div className="space-y-2">
                <Label htmlFor="bloco_recorrencia">Tipo de Recorrência Temporal</Label>
                <select
                  id="bloco_recorrencia"
                  value={formData.tipo_recorrencia}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, tipo_recorrencia: e.target.value }))
                  }
                  className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="semanal">Semanal (Dia Fixo da Semana)</option>
                  <option value="mensal_dia_fixo">Mensal por Dia Fixo (ex: todo dia 1º, 10)</option>
                  <option value="mensal_dia_semana">
                    Mensal por Dia da Semana (ex: 1º Sábado do mês)
                  </option>
                  <option value="pontual">Evento Pontual (Data Específica)</option>
                </select>
              </div>

              {/* Seção Condicional de Recorrência */}
              {formData.tipo_recorrencia === "semanal" && (
                <div className="space-y-2">
                  <Label htmlFor="bloco_dia">Dia da Semana *</Label>
                  <select
                    id="bloco_dia"
                    value={formData.dia_semana}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, dia_semana: Number(e.target.value) }))
                    }
                    className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    {DIAS_SEMANA.map((d) => (
                      <option key={d.dia} value={d.dia}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.tipo_recorrencia === "mensal_dia_fixo" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="bloco_dia_mes">Dia do Mês (1 a 31) *</Label>
                    <Input
                      id="bloco_dia_mes"
                      type="number"
                      min={1}
                      max={31}
                      value={formData.dia_mes}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, dia_mes: Number(e.target.value) }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="bloco_ajuste">Se cair em fim de semana ou feriado:</Label>
                    <select
                      id="bloco_ajuste"
                      value={formData.ajuste_fim_de_semana}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          ajuste_fim_de_semana: e.target.value,
                        }))
                      }
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="exato">Manter na data exata</option>
                      <option value="proximo_dia_util">Adiantar para o próximo dia útil</option>
                      <option value="dia_util_anterior">Antecipar para o dia útil anterior</option>
                    </select>
                  </div>
                </>
              )}

              {formData.tipo_recorrencia === "mensal_dia_semana" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="bloco_ordem">Ocorrência no Mês *</Label>
                    <select
                      id="bloco_ordem"
                      value={formData.ordem_semana_mes}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          ordem_semana_mes: Number(e.target.value),
                        }))
                      }
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value={1}>1ª semana do mês</option>
                      <option value={2}>2ª semana do mês</option>
                      <option value={3}>3ª semana do mês</option>
                      <option value={4}>4ª semana do mês</option>
                      <option value={-1}>Última semana do mês</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bloco_dia_mes_sem">Dia da Semana *</Label>
                    <select
                      id="bloco_dia_mes_sem"
                      value={formData.dia_semana}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, dia_semana: Number(e.target.value) }))
                      }
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {DIAS_SEMANA.map((d) => (
                        <option key={d.dia} value={d.dia}>
                          {d.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* Horário Início e Término */}
              <div className="space-y-2">
                <Label htmlFor="bloco_inicio">Horário de Início *</Label>
                <Input
                  id="bloco_inicio"
                  type="time"
                  value={formData.hora_inicio}
                  onChange={(e) => setFormData((prev) => ({ ...prev, hora_inicio: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bloco_fim">Horário de Término *</Label>
                <Input
                  id="bloco_fim"
                  type="time"
                  value={formData.hora_fim}
                  onChange={(e) => setFormData((prev) => ({ ...prev, hora_fim: e.target.value }))}
                  required
                />
              </div>

              {/* Professor Responsável */}
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="bloco_prof">{termoInstrutor} Responsável</Label>
                <select
                  id="bloco_prof"
                  value={formData.instrutor_id}
                  onChange={(e) => setFormData((prev) => ({ ...prev, instrutor_id: e.target.value }))}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Nenhum (Horário livre / a definir)</option>
                  {instrutores.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.nome_completo} {i.cargo ? `(${i.cargo})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Turmas / Grupos Vinculados */}
              <div className="space-y-2 sm:col-span-2 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <Label>{termoGrupo}s Atendidas neste Horário</Label>
                  <span className="text-xs text-muted-foreground">
                    {formData.grupos_ids.length} selecionada(s)
                  </span>
                </div>

                {grupos.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-3 border border-dashed rounded-lg text-center">
                    Nenhuma turma cadastrada neste polo ainda. Você pode associar turmas depois.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 border rounded-lg bg-muted/20">
                    {grupos.map((g) => {
                      const checked = formData.grupos_ids.includes(g.id);
                      return (
                        <label
                          key={g.id}
                          className={`flex items-center gap-2 p-2 rounded-md border text-xs cursor-pointer transition-colors ${
                            checked
                              ? "bg-primary/10 border-primary text-foreground font-medium"
                              : "border-border hover:bg-muted"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleGrupoNoForm(g.id)}
                            className="h-3.5 w-3.5 rounded border-input text-primary"
                          />
                          <span className="truncate">{g.nome}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between items-center gap-2 pt-4 border-t border-border">
              {editingBloco ? (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setDeleteTargetId(editingBloco.id);
                    setDeleteOpen(true);
                  }}
                  className="w-full sm:w-auto gap-1.5"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Excluir Horário</span>
                </Button>
              ) : (
                <div />
              )}

              <div className="flex gap-2 w-full sm:w-auto justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Salvando..." : editingBloco ? "Salvar Horário" : "Criar na Grade"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmação de Exclusão de Bloco */}
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir Bloco de Horário"
        description="Tem certeza que deseja remover este horário da grade? Se houver sessões passadas já realizadas associadas a este bloco, ele não poderá ser excluído."
        confirmLabel="Sim, Excluir Bloco"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
