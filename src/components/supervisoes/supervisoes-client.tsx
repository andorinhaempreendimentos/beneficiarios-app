"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type PainelSupervisorData,
  type VisitaResumoItem,
  iniciarSupervisao,
} from "@/lib/actions/supervisoes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Plus,
  Play,
  ArrowRight,
  Eye,
  Filter,
  Search,
  Camera,
  Star,
  Loader2,
  FileText,
  Building,
} from "lucide-react";

interface SupervisoesClientProps {
  initialData: PainelSupervisorData;
  objetoId: string;
  termoLocal?: string;
  termoInstrutor?: string;
  termoGrupo?: string;
  termoSessao?: string;
}

export function SupervisoesClient({
  initialData,
  objetoId,
  termoLocal = "Polo",
  termoInstrutor = "Professor",
  termoGrupo = "Turma",
  termoSessao = "Sessão",
}: SupervisoesClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [data] = useState<PainelSupervisorData>(initialData);
  const { indicadores, visitas, locaisDisponiveis, instrutoresDisponiveis } = data;

  // Filtros da listagem
  const [filtroLocal, setFiltroLocal] = useState<string>("todos");
  const [filtroSituacao, setFiltroSituacao] = useState<string>("todos");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [buscaTexto, setBuscaTexto] = useState("");

  // Estado do Modal de Nova Supervisão / Check-in
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [novoLocalId, setNovoLocalId] = useState<string>("");
  const [novoInstrutorId, setNovoInstrutorId] = useState<string>("");
  const [erroInicio, setErroInicio] = useState<string | null>(null);

  // Filtragem das visitas
  const visitasFiltradas = visitas.filter((v) => {
    const matchLocal = filtroLocal === "todos" || v.local_id === filtroLocal;
    const matchSituacao = filtroSituacao === "todos" || v.situacao === filtroSituacao;
    const matchStatus = filtroStatus === "todos" || v.status === filtroStatus;
    const matchBusca =
      !buscaTexto.trim() ||
      v.local_nome.toLowerCase().includes(buscaTexto.toLowerCase()) ||
      v.instrutor_nome.toLowerCase().includes(buscaTexto.toLowerCase()) ||
      v.supervisor_nome.toLowerCase().includes(buscaTexto.toLowerCase());

    return matchLocal && matchSituacao && matchStatus && matchBusca;
  });

  // Filtro de instrutores ao selecionar polo no modal
  const instrutoresFiltradosPorLocal = novoLocalId
    ? instrutoresDisponiveis.filter((i) => !i.local_id || i.local_id === novoLocalId)
    : instrutoresDisponiveis;

  const handleIniciarSupervisao = () => {
    if (!novoLocalId) {
      setErroInicio(`Selecione o ${termoLocal} a ser auditado.`);
      return;
    }
    if (!novoInstrutorId) {
      setErroInicio(`Selecione ou confirme o ${termoInstrutor} presente no polo.`);
      return;
    }

    setErroInicio(null);
    startTransition(async () => {
      const res = await iniciarSupervisao({
        objeto_id: objetoId,
        local_id: novoLocalId,
        instrutor_funcionario_id: novoInstrutorId,
      });

      if (res.success && res.data) {
        setModalNovoAberto(false);
        router.push(`/supervisoes/${res.data.id}`);
      } else {
        setErroInicio(res.error || "Erro ao iniciar supervisão.");
      }
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* 1. Header do Painel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Painel de Supervisão e Auditoria</h1>
            <Badge
              variant="outline"
              className="border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400 font-medium text-xs"
            >
              Auditoria Presencial (§3.6)
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Gestão de vistorias em campo, fiscalização estrutural, verificação de atendimento e
            emissão de relatórios governamentais.
          </p>
        </div>

        {/* Botão Primário: Iniciar Vistoria */}
        <Button
          onClick={() => {
            setNovoLocalId(locaisDisponiveis[0]?.id || "");
            setNovoInstrutorId(instrutoresDisponiveis[0]?.id || "");
            setErroInicio(null);
            setModalNovoAberto(true);
          }}
          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-10 px-5 shadow-sm self-start md:self-auto"
        >
          <Plus className="h-4 w-4" />
          Iniciar Nova Supervisão
        </Button>
      </div>

      {/* 2. Mini-Dashboard de Auditoria */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-border/60 shadow-xs">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardDescription className="text-xs font-medium text-muted-foreground">
              Vistorias no Mês
            </CardDescription>
            <CardTitle className="text-2xl font-bold tracking-tight">
              {indicadores.totalVisitasMes}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3 text-blue-500" />
              Ciclo Mensal Corrente
            </span>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardDescription className="text-xs font-medium text-muted-foreground">
              Cobertura de {termoLocal}s
            </CardDescription>
            <CardTitle className="text-2xl font-bold tracking-tight text-blue-600">
              {indicadores.polosCobertos} / {indicadores.totalPolos}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Building className="h-3 w-3 text-blue-500" />
              {indicadores.totalPolos > 0
                ? `${Math.round((indicadores.polosCobertos / indicadores.totalPolos) * 100)}% dos polos visitados`
                : "Sem polos cadastrados"}
            </span>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardDescription className="text-xs font-medium text-muted-foreground">
              Inconformidades Abertas
            </CardDescription>
            <CardTitle
              className={`text-2xl font-bold tracking-tight ${
                indicadores.inconformidadesAbertas > 0 ? "text-amber-600" : "text-emerald-600"
              }`}
            >
              {indicadores.inconformidadesAbertas}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              {indicadores.inconformidadesAbertas > 0 ? (
                <>
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                  Exigem regularização no polo
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  Nenhuma pendência crítica
                </>
              )}
            </span>
          </CardContent>
        </Card>

        <Card className="border-border/60 shadow-xs">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardDescription className="text-xs font-medium text-muted-foreground">
              Taxa de Regularidade
            </CardDescription>
            <CardTitle className="text-2xl font-bold tracking-tight text-emerald-600">
              {indicadores.taxaConformidade}%
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-emerald-500" />
              Vistorias em conformidade
            </span>
          </CardContent>
        </Card>
      </div>

      {/* 3. Filtros e Pesquisa */}
      <Card className="border-border/60 shadow-xs">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Buscar por ${termoLocal}, ${termoInstrutor} ou supervisor...`}
                value={buscaTexto}
                onChange={(e) => setBuscaTexto(e.target.value)}
                className="pl-8 h-9 text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Filtro de Local */}
              <select
                value={filtroLocal}
                onChange={(e) => setFiltroLocal(e.target.value)}
                className="h-9 px-3 rounded-md border border-input bg-background text-xs"
              >
                <option value="todos">Todos os {termoLocal}s</option>
                {locaisDisponiveis.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nome}
                  </option>
                ))}
              </select>

              {/* Filtro de Situação */}
              <select
                value={filtroSituacao}
                onChange={(e) => setFiltroSituacao(e.target.value)}
                className="h-9 px-3 rounded-md border border-input bg-background text-xs"
              >
                <option value="todos">Todas as Situações</option>
                <option value="Regular">Regular</option>
                <option value="Requer Atenção">Requer Atenção</option>
                <option value="Crítica">Crítica</option>
              </select>

              {/* Filtro de Status */}
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="h-9 px-3 rounded-md border border-input bg-background text-xs"
              >
                <option value="todos">Todos os Status</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="concluida">Concluída (Imutável)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Lista de Vistorias */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight">
            Registros de Vistoria ({visitasFiltradas.length})
          </h2>
          <span className="text-xs text-muted-foreground">
            Ordenado pelas mais recentes
          </span>
        </div>

        {visitasFiltradas.length === 0 ? (
          <Card className="border-dashed border-border/80">
            <CardContent className="py-12 text-center space-y-2">
              <ShieldCheck className="h-10 w-10 mx-auto text-muted-foreground/60" />
              <p className="text-sm font-semibold">Nenhuma visita de supervisão localizada.</p>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Utilize o botão acima para abrir a primeira vistoria presencial ou ajuste os filtros
                de busca.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {visitasFiltradas.map((visita) => {
              const isConcluida = visita.status === "concluida";
              const isRegular = visita.situacao === "Regular";
              const isAtencao = visita.situacao === "Requer Atenção";
              const isCritica = visita.situacao === "Crítica";

              return (
                <Card
                  key={visita.id}
                  className="border-border/60 shadow-xs hover:border-border transition-all flex flex-col justify-between"
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-base">{visita.local_nome}</span>
                          {isConcluida ? (
                            <Badge
                              variant="outline"
                              className={
                                isRegular
                                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px]"
                                  : isAtencao
                                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px]"
                                  : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30 text-[10px]"
                              }
                            >
                              {visita.situacao}
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400 text-[10px] animate-pulse"
                            >
                              Em Andamento
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                          {termoInstrutor} auditado:{" "}
                          <span className="font-medium text-foreground">
                            {visita.instrutor_nome}
                          </span>
                        </p>
                      </div>

                      {visita.nota_media !== null && (
                        <div className="flex items-center gap-1 rounded-md bg-muted/60 px-2 py-1 text-xs font-bold text-foreground">
                          <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                          {visita.nota_media}
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 pt-1 pb-3 space-y-2 text-xs">
                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(visita.data + "T00:00:00").toLocaleDateString("pt-BR")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {visita.hora_inicio}
                        {visita.hora_fim ? ` às ${visita.hora_fim}` : " (ativo)"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Camera className="h-3 w-3" />
                        {visita.total_fotos} fotos
                      </span>
                    </div>

                    <div className="rounded-md bg-muted/30 p-2 flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">
                        Alunos no Polo:{" "}
                        <strong className="text-foreground">
                          {visita.qtd_beneficiarios_presentes}
                        </strong>
                      </span>
                      <span className="text-muted-foreground">
                        Supervisor:{" "}
                        <strong className="text-foreground">{visita.supervisor_nome}</strong>
                      </span>
                    </div>
                  </CardContent>

                  <div className="p-4 pt-0 border-t border-border/40 mt-1 flex items-center justify-between pt-3">
                    <span className="text-[11px] text-muted-foreground font-mono">
                      #{visita.id.substring(0, 8)}
                    </span>
                    <Link href={`/supervisoes/${visita.id}`}>
                      <Button
                        size="sm"
                        variant={isConcluida ? "outline" : "default"}
                        className={`gap-1.5 text-xs h-8 ${
                          !isConcluida ? "bg-blue-600 hover:bg-blue-700 text-white" : ""
                        }`}
                      >
                        {isConcluida ? (
                          <>
                            <Eye className="h-3.5 w-3.5" />
                            Ver Vistoria
                          </>
                        ) : (
                          <>
                            <Play className="h-3.5 w-3.5" />
                            Continuar Vistoria
                          </>
                        )}
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Modal de Abertura / Check-in de Supervisão */}
      <Dialog open={modalNovoAberto} onOpenChange={setModalNovoAberto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              Check-in de Nova Supervisão
            </DialogTitle>
            <DialogDescription className="text-xs">
              O sistema registrará seu carimbo automático de início e data corrente perante a
              auditoria governamental (§3.6).
            </DialogDescription>
          </DialogHeader>

          {erroInicio && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300 rounded-md border border-rose-200">
              {erroInicio}
            </div>
          )}

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="local-select" className="text-xs font-semibold">
                {termoLocal} Auditado *
              </Label>
              <select
                id="local-select"
                value={novoLocalId}
                onChange={(e) => setNovoLocalId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
              >
                {locaisDisponiveis.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="instrutor-select" className="text-xs font-semibold">
                {termoInstrutor} Responsável Presente *
              </Label>
              <select
                id="instrutor-select"
                value={novoInstrutorId}
                onChange={(e) => setNovoInstrutorId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs"
              >
                {instrutoresFiltradosPorLocal.length === 0 ? (
                  <option value="">Nenhum instrutor alocado</option>
                ) : (
                  instrutoresFiltradosPorLocal.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.nome_completo} ({inst.cargo})
                    </option>
                  ))
                )}
              </select>
              <p className="text-[11px] text-muted-foreground">
                Caso outro profissional esteja substituindo no dia, selecione-o na lista.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => setModalNovoAberto(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-1.5"
              disabled={isPending}
              onClick={handleIniciarSupervisao}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Confirmar Check-in e Iniciar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
