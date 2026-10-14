"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ResultadoSalvaguarda {
  success: boolean;
  totalEncerradas: number;
  sessoesProcessadas: Array<{
    id: string;
    data: string;
    hora_inicio: string;
    hora_fim: string;
    funcionario_id: string;
    motivo: string;
  }>;
  error?: string;
}

/**
 * Rotina de Salvaguarda por Timeout de Sessões em Campo (§3.5 de AGENTS.md)
 * 
 * Se o instrutor abrir uma sessão e esquecer de finalizar no mesmo dia,
 * esta rotina encerra automaticamente a sessão como 'concluida', registra o clock-out
 * no ponto eletrônico (registros_ponto) e anota fé pública de auditoria.
 */
export async function executarSalvaguardaSessoes(): Promise<ResultadoSalvaguarda> {
  const supabase = await createClient();

  // 1. Buscar sessões com status 'em_andamento'
  const { data: sessoesAbertas, error: sError } = await supabase
    .from("sessoes")
    .select(`
      id,
      objeto_id,
      local_id,
      bloco_id,
      funcionario_id,
      data,
      hora_inicio,
      hora_fim,
      observacoes,
      status,
      blocos:bloco_id(hora_fim)
    `)
    .eq("status", "em_andamento");

  if (sError) {
    return {
      success: false,
      totalEncerradas: 0,
      sessoesProcessadas: [],
      error: `Erro ao buscar sessões em andamento: ${sError.message}`,
    };
  }

  if (!sessoesAbertas || sessoesAbertas.length === 0) {
    return {
      success: true,
      totalEncerradas: 0,
      sessoesProcessadas: [],
    };
  }

  const hojeStr = new Date().toISOString().split("T")[0];
  const sessoesEncerradas: ResultadoSalvaguarda["sessoesProcessadas"] = [];

  for (const s of sessoesAbertas) {
    const isDiaAnterior = s.data < hojeStr;

    // Se a sessão é de dia anterior OU se é de hoje mas já passou de 4 horas desde o início
    let deveEncerrar = isDiaAnterior;

    if (!deveEncerrar && s.data === hojeStr && s.hora_inicio) {
      const [hInicio, mInicio] = s.hora_inicio.split(":").map(Number);
      const agora = new Date();
      const horaAtual = agora.getHours();
      const minAtual = agora.getMinutes();
      const diffMinutos = (horaAtual * 60 + minAtual) - (hInicio * 60 + mInicio);
      if (diffMinutos >= 240) {
        // Mais de 4 horas sem fechamento
        deveEncerrar = true;
      }
    }

    if (!deveEncerrar) continue;

    // Determinar hora_fim estimada: usar a do bloco ou hora_inicio + 1h
    let horaFimEstimada = "18:00:00";
    const blocoData = s.blocos as any;
    if (blocoData?.hora_fim) {
      horaFimEstimada = blocoData.hora_fim;
    } else if (s.hora_inicio) {
      const [h, m] = s.hora_inicio.split(":").map(Number);
      const novaHora = Math.min(23, h + 1);
      horaFimEstimada = `${String(novaHora).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`;
    }

    const obsOriginal = s.observacoes || "";
    const obsSalvaguarda = `${obsOriginal ? obsOriginal + "\n" : ""}[Encerrada automaticamente por salvaguarda de timeout do sistema (§3.5 de AGENTS.md)]`;

    // 1. Atualizar sessão para 'concluida'
    const { error: updSessaoError } = await supabase
      .from("sessoes")
      .update({
        status: "concluida",
        hora_fim: horaFimEstimada,
        observacoes: obsSalvaguarda,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", s.id);

    if (updSessaoError) {
      console.error(`Falha ao encerrar sessão ${s.id}:`, updSessaoError);
      continue;
    }

    // 2. Atualizar registro de ponto correspondente (se existir)
    const { data: pontoExistente } = await supabase
      .from("registros_ponto")
      .select("id, hora_entrada")
      .eq("sessao_id", s.id)
      .maybeSingle();

    if (pontoExistente) {
      let totalMin = 60;
      if (pontoExistente.hora_entrada) {
        const [hE, mE] = pontoExistente.hora_entrada.split(":").map(Number);
        const [hS, mS] = horaFimEstimada.split(":").map(Number);
        totalMin = Math.max(15, (hS * 60 + mS) - (hE * 60 + mE));
      }

      await supabase
        .from("registros_ponto")
        .update({
          hora_saida: horaFimEstimada,
          total_minutos: totalMin,
          motivo_ajuste: "Encerramento automático de ponto por salvaguarda de timeout de sessão (§3.5).",
          atualizado_em: new Date().toISOString(),
        })
        .eq("id", pontoExistente.id);
    }

    sessoesEncerradas.push({
      id: s.id,
      data: s.data,
      hora_inicio: s.hora_inicio,
      hora_fim: horaFimEstimada,
      funcionario_id: s.funcionario_id,
      motivo: isDiaAnterior ? "Sessão esquecida de dia anterior" : "Timeout de 4 horas excedido",
    });
  }

  if (sessoesEncerradas.length > 0) {
    revalidatePath("/sessoes");
    revalidatePath("/relatorios");
  }

  return {
    success: true,
    totalEncerradas: sessoesEncerradas.length,
    sessoesProcessadas: sessoesEncerradas,
  };
}
