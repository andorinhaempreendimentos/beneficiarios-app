"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type RelatorioRHData,
  type FuncionarioPontoItem,
  retificarRegistroPonto,
  abonarFaltaPonto,
} from "@/lib/actions/relatorios";
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
  UserCheck,
  Search,
  Filter,
  ArrowLeft,
  Printer,
  Edit3,
  Plus,
  AlertCircle,
  CheckCircle2,
  Building,
  Shield,
  Loader2,
  Calendar,
} from "lucide-react";

interface RelatorioPontoClientProps {
  initialData: RelatorioRHData;
  objetoId: string;
}

export function RelatorioPontoClient({
  initialData,
  objetoId,
}: RelatorioPontoClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [data] = useState<RelatorioRHData>(initialData);
  const { objeto, indicadores, registros, locais, funcionarios } = data;

  const termoLocal = objeto?.termo_local || "";
  const termoInstrutor = objeto?.termo_instrutor || "";

  // Filtros
  const [filtroLocal, setFiltroLocal] = useState<string>("todos");
  const [busca, setBusca] = useState<string>("");

  // Estado do Modal de Retificação
  const [modalRetificarAberto, setModalRetificarAberto] = useState(false);
  const [registroSelecionado, setRegistroSelecionado] = useState<FuncionarioPontoItem | null>(null);
  const [novaHoraEntrada, setNovaHoraEntrada] = useState("");
  const [novaHoraSaida, setNovaHoraSaida] = useState("");
  const [motivoAjuste, setMotivoAjuste] = useState("");

  // Estado do Modal de Abono / Inclusão Manual
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [novoFuncionarioId, setNovoFuncionarioId] = useState("");
  const [novaData, setNovaData] = useState(new Date().toISOString().split("T")[0]);
  const [novoTipo, setNovoTipo] = useState<"trabalhado" | "falta_justificada" | "recesso_feriado">("trabalhado");
  const [novoHoraEnt, setNovoHoraEnt] = useState("08:00");
  const [novoHoraSai, setNovoHoraSai] = useState("12:00");
  const [novoMotivo, setNovoMotivo] = useState("");

  const [feedback, setFeedback] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);

  // Filtragem dos registros
  const registrosFiltrados = registros.filter((reg) => {
    const matchLocal = filtroLocal === "todos" || reg.local_nome === filtroLocal;
    const matchBusca =
      !busca.trim() ||
      reg.nome_completo.toLowerCase().includes(busca.toLowerCase()) ||
      reg.cpf.includes(busca) ||
      reg.cargo.toLowerCase().includes(busca.toLowerCase()) ||
      reg.local_nome.toLowerCase().includes(busca.toLowerCase());

    return matchLocal && matchBusca;
  });

  const abrirModalRetificar = (reg: FuncionarioPontoItem) => {
    setRegistroSelecionado(reg);
    setNovaHoraEntrada(reg.hora_entrada.slice(0, 5));
    setNovaHoraSaida(reg.hora_saida ? reg.hora_saida.slice(0, 5) : "12:00");
    setMotivoAjuste(reg.motivo_ajuste || "");
    setFeedback(null);
    setModalRetificarAberto(true);
  };

  const handleSalvarRetificacao = () => {
    if (!registroSelecionado) return;
    setFeedback(null);

    startTransition(async () => {
      const res = await retificarRegistroPonto({
        registro_id: registroSelecionado.registro_id,
        hora_entrada: novaHoraEntrada,
        hora_saida: novaHoraSaida,
        motivo_ajuste: motivoAjuste,
      });

      if (res.success) {
        setFeedback({ tipo: "sucesso", texto: "Registro de ponto retificado e auditado com sucesso!" });
        setModalRetificarAberto(false);
        router.refresh();
      } else {
        setFeedback({ tipo: "erro", texto: res.error || "Erro ao retificar ponto." });
      }
    });
  };

  const handleSalvarAbono = () => {
    if (!novoFuncionarioId) {
      setFeedback({ tipo: "erro", texto: "Selecione o colaborador." });
      return;
    }
    setFeedback(null);

    startTransition(async () => {
      const res = await abonarFaltaPonto({
        funcionario_id: novoFuncionarioId,
        objeto_id: objetoId,
        data: novaData,
        tipo_registro: novoTipo,
        hora_entrada: novoHoraEnt,
        hora_saida: novoHoraSai,
        motivo_ajuste: novoMotivo,
      });

      if (res.success) {
        setFeedback({ tipo: "sucesso", texto: "Lançamento de ponto/abono incluído com sucesso!" });
        setModalNovoAberto(false);
        setNovoMotivo("");
        router.refresh();
      } else {
        setFeedback({ tipo: "erro", texto: res.error || "Erro ao incluir registro." });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Topo / Barra de Retorno */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 print:hidden">
        <div>
          <Link href="/relatorios">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs -ml-2 mb-1">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Hub de Relatórios
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Clock className="h-6 w-6 text-primary" />
            Recursos Humanos & Espelho de Ponto Eletrônico
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Folha de ponto e controle de jornada (§3.9.5.B e §3.9.6) com flexibilidade administrativa e rastreabilidade probatória.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setModalNovoAberto(true)}
            size="sm"
            className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="h-3.5 w-3.5" />
            Inclusão / Abono Manual
          </Button>
          <Button onClick={() => window.print()} variant="secondary" size="sm" className="gap-1.5 text-xs">
            <Printer className="h-3.5 w-3.5" />
            Imprimir Folha
          </Button>
        </div>
      </div>

      {/* Alerta de Feedback */}
      {feedback && (
        <div
          className={`p-3.5 rounded-lg flex items-center justify-between gap-2 text-xs border ${
            feedback.tipo === "sucesso"
              ? "bg-green-50 text-green-800 border-green-200 dark:bg-green-950/30 dark:text-green-300"
              : "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/30 dark:text-red-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.tipo === "sucesso" ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <span>{feedback.texto}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setFeedback(null)} className="h-6 text-xs px-1.5">
            Fechar
          </Button>
        </div>
      )}

      {/* 4 KPIs de RH */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-xs border-l-4 border-l-emerald-600">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Colaboradores Alocados
            </CardTitle>
            <UserCheck className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{indicadores.totalColaboradores}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Profissionais ativos na folha
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-l-4 border-l-blue-600">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Horas Apuradas
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{indicadores.totalHorasApuradas}h</div>
            <p className="text-xs text-muted-foreground mt-1">
              Carga horária acumulada
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Retificações Auditadas
            </CardTitle>
            <Shield className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {indicadores.totalAjustesManuais}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ajustes manuais justificados
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-xs border-l-4 border-l-indigo-600">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Assiduidade da Equipe
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{indicadores.taxaAssiduidadeEquipe}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Cumprimento da escala de campo
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros em Linha */}
      <div className="p-4 bg-muted/30 rounded-lg border flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="w-full sm:w-60">
            <select
              aria-label={`Filtrar por ${termoLocal}`}
              value={filtroLocal}
              onChange={(e) => setFiltroLocal(e.target.value)}
              className="w-full text-xs bg-background border rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="todos">Todos os {termoLocal.toLowerCase()}s</option>
              {locais.map((l) => (
                <option key={l.id} value={l.nome}>
                  {l.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar por colaborador, cargo ou CPF..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-8 text-xs h-8 bg-background"
            />
          </div>
        </div>

        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {registrosFiltrados.length} registros listados
        </span>
      </div>

      {/* Tabela do Espelho de Ponto (§3.9.5.B) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Espelho de Ponto Eletrônico dos Colaboradores
          </CardTitle>
          <CardDescription className="text-xs">
            Registros de frequência com rastreabilidade formal e preservação dos horários originais.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {registrosFiltrados.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-xs italic">
              Nenhum registro de ponto localizado para os filtros informados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/50 text-muted-foreground border-b font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Data</th>
                    <th className="py-2.5 px-3">Colaborador</th>
                    <th className="py-2.5 px-3">Cargo / Função</th>
                    <th className="py-2.5 px-3">{termoLocal}</th>
                    <th className="py-2.5 px-3 text-center">Entrada</th>
                    <th className="py-2.5 px-3 text-center">Saída</th>
                    <th className="py-2.5 px-3 text-center">Horas</th>
                    <th className="py-2.5 px-3">Origem & Auditoria</th>
                    <th className="py-2.5 px-3 text-right print:hidden">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {registrosFiltrados.map((item) => (
                    <tr key={item.registro_id} className="hover:bg-muted/20">
                      <td className="py-2.5 px-3 whitespace-nowrap font-medium">
                        {new Date(item.data + "T00:00:00").toLocaleDateString("pt-BR")}
                      </td>
                      <td className="py-2.5 px-3 font-semibold whitespace-nowrap">
                        {item.nome_completo}
                        <span className="block text-[11px] font-mono font-normal text-muted-foreground">
                          {item.cpf}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-muted-foreground">
                        {item.cargo}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">{item.local_nome}</td>
                      <td className="py-2.5 px-3 text-center font-mono font-medium">
                        {item.hora_entrada.slice(0, 5)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-medium">
                        {item.hora_saida ? item.hora_saida.slice(0, 5) : "--:--"}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold">
                        {item.total_minutos
                          ? `${Math.floor(item.total_minutos / 60)}h ${item.total_minutos % 60}m`
                          : "-"}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {item.editado_manualmente ? (
                          <div className="space-y-0.5">
                            <Badge
                              variant="outline"
                              className="bg-amber-50 text-amber-700 border-amber-300 text-[10px] flex items-center gap-1 w-fit"
                            >
                              <Shield className="h-3 w-3 text-amber-600" />
                              Ajuste Auditado
                            </Badge>
                            {item.motivo_ajuste && (
                              <span className="text-[11px] text-muted-foreground block truncate max-w-xs" title={item.motivo_ajuste}>
                                {item.motivo_ajuste}
                              </span>
                            )}
                          </div>
                        ) : (
                          <Badge variant="outline" className="bg-muted text-muted-foreground text-[10px]">
                            Registro App
                          </Badge>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right print:hidden">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => abrirModalRetificar(item)}
                          className="h-7 text-xs gap-1"
                        >
                          <Edit3 className="h-3 w-3" />
                          Retificar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal 1: Retificar Horário de Ponto */}
      <Dialog open={modalRetificarAberto} onOpenChange={setModalRetificarAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <Edit3 className="h-5 w-5" />
              Retificar Registro de Ponto com Auditoria
            </DialogTitle>
            <DialogDescription className="text-xs pt-1">
              Ajuste formal de horários para {registroSelecionado?.nome_completo} em{" "}
              {registroSelecionado?.data}. Em conformidade com o §3.9.6, a justificativa é obrigatória e será gravada para auditoria do Concedente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Hora de Entrada (HH:MM)</Label>
                <Input
                  type="time"
                  value={novaHoraEntrada}
                  onChange={(e) => setNovaHoraEntrada(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Hora de Saída (HH:MM)</Label>
                <Input
                  type="time"
                  value={novaHoraSaida}
                  onChange={(e) => setNovaHoraSaida(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-amber-800 dark:text-amber-400">
                Motivo Formal do Ajuste (Obrigatório — Mínimo 10 caracteres)
              </Label>
              <Textarea
                placeholder="Ex: Instrutor sem sinal 4G no polo no término da aula. Presença conferida pelo Supervisor..."
                value={motivoAjuste}
                onChange={(e) => setMotivoAjuste(e.target.value)}
                rows={3}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModalRetificarAberto(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSalvarRetificacao}
              disabled={isPending || motivoAjuste.trim().length < 10}
              className="bg-primary hover:bg-primary/90"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Salvar Retificação Auditada
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 2: Inclusão Manual / Abono de Falta */}
      <Dialog open={modalNovoAberto} onOpenChange={setModalNovoAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <Plus className="h-5 w-5" />
              Inclusão Manual ou Abono de Ponto
            </DialogTitle>
            <DialogDescription className="text-xs pt-1">
              Lançamento avulso de dia trabalhado, recesso ou abono por atestado médico (§3.9.6).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs">Colaborador:</Label>
              <select
                aria-label="Selecionar Colaborador"
                value={novoFuncionarioId}
                onChange={(e) => setNovoFuncionarioId(e.target.value)}
                className="w-full text-xs bg-background border rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Selecione o profissional...</option>
                {funcionarios.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nome} — {f.cargo}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Data:</Label>
                <Input
                  type="date"
                  value={novaData}
                  onChange={(e) => setNovaData(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Tipo de Lançamento:</Label>
                <select
                  aria-label="Tipo de Lançamento"
                  value={novoTipo}
                  onChange={(e) => setNovoTipo(e.target.value as any)}
                  className="w-full text-xs bg-background border rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="trabalhado">Dia Trabalhado</option>
                  <option value="falta_justificada">Falta Justificada (Abono)</option>
                  <option value="recesso_feriado">Recesso / Feriado</option>
                </select>
              </div>
            </div>

            {novoTipo === "trabalhado" && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Hora Entrada:</Label>
                  <Input
                    type="time"
                    value={novoHoraEnt}
                    onChange={(e) => setNovoHoraEnt(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Hora Saída:</Label>
                  <Input
                    type="time"
                    value={novoHoraSai}
                    onChange={(e) => setNovoHoraSai(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Justificativa / Motivo do Lançamento (Mínimo 10 caracteres)
              </Label>
              <Textarea
                placeholder="Informe o motivo formal da inclusão manual ou referência ao atestado apresentado..."
                value={novoMotivo}
                onChange={(e) => setNovoMotivo(e.target.value)}
                rows={3}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModalNovoAberto(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSalvarAbono}
              disabled={isPending || novoMotivo.trim().length < 10 || !novoFuncionarioId}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Confirmar Lançamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
