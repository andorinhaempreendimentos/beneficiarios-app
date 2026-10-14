"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type PainelInstrutorData,
  type BlocoHojeItem,
  iniciarSessao,
} from "@/lib/actions/sessoes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Play,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Trophy,
  Loader2,
  Eye,
  History,
  Sparkles,
  UserCheck,
} from "lucide-react";

interface InstrutorOpcao {
  id: string;
  nome_completo: string;
  cargo: string;
}

interface SessoesClientProps {
  initialData: PainelInstrutorData;
  instrutoresDisponiveis: InstrutorOpcao[];
  objetoId: string;
  termoLocal?: string;
  termoInstrutor?: string;
  termoSessao?: string;
  termoGrupo?: string;
}

export function SessoesClient({
  initialData,
  instrutoresDisponiveis,
  objetoId,
  termoLocal = "Polo",
  termoInstrutor = "Professor",
  termoSessao = "Sessão",
  termoGrupo = "Turma",
}: SessoesClientProps) {
  const router = useRouter();
  const [data] = useState<PainelInstrutorData>(initialData);
  const [activeTab, setActiveTab] = useState<"hoje" | "semana" | "historico">("hoje");
  const [loadingBlocoId, setLoadingBlocoId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const instrutor = data.instrutor;
  const indicadores = data.indicadores;

  async function handleIniciarSessaoBloco(bloco: BlocoHojeItem) {
    if (!instrutor) return;
    setLoadingBlocoId(bloco.bloco_id);
    setErrorMsg(null);

    const hojeStr = new Date().toISOString().split("T")[0];
    const agoraHora = new Date().toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const payload = {
      objeto_id: instrutor.objeto_id || objetoId,
      local_id: bloco.local_id,
      bloco_id: bloco.bloco_id,
      funcionario_id: instrutor.id,
      modalidade_id: bloco.modalidade_id,
      grupos_ids: bloco.grupos.map((g) => g.id),
      data: hojeStr,
      hora_inicio: agoraHora,
    };

    try {
      const result = await iniciarSessao(payload);
      if (result.success && result.data) {
        router.push(`/sessoes/${result.data.id}`);
      } else {
        setErrorMsg(result.error ?? "Erro ao iniciar sessão.");
        setLoadingBlocoId(null);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Erro inesperado.");
      setLoadingBlocoId(null);
    }
  }

  function handleMudarInstrutor(novoFuncionarioId: string) {
    router.push(`/sessoes?instrutor_id=${novoFuncionarioId}`);
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* 1. Header do Instrutor (Mobile-first) */}
      <div className="bg-card p-5 rounded-2xl border border-border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg shrink-0">
            {instrutor?.nome_completo ? instrutor.nome_completo.charAt(0) : "P"}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">
                {instrutor?.nome_completo ?? `Nenhum ${termoInstrutor} Selecionado`}
              </h1>
              <Badge variant="outline" className="text-xs">
                {instrutor?.cargo ?? termoInstrutor}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Projeto: <span className="font-medium text-foreground">{instrutor?.objeto_nome ?? "Projeto Social"}</span>
            </p>
          </div>
        </div>

        {/* Seletor de Instrutor (para administradores / supervisores) */}
        {instrutoresDisponiveis.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground shrink-0">Visualizar como:</span>
            <select
              value={instrutor?.id ?? ""}
              onChange={(e) => handleMudarInstrutor(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {instrutoresDisponiveis.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.nome_completo} ({inst.cargo})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 2. Mini-Dashboard de Estatísticas (§3.5) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="shadow-xs">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>{termoSessao}s no Mês</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold">{indicadores.totalSessoesMes}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Aulas finalizadas</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Carga Horária</span>
              <Clock className="h-4 w-4 text-primary" />
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold">{indicadores.totalHorasFormatadas}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Ponto eletrônico MROSC</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Frequência Média</span>
              <UserCheck className="h-4 w-4 text-primary" />
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold">{indicadores.taxaPresencaMedia}%</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Assiduidade dos alunos</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardDescription className="text-xs flex items-center justify-between">
              <span>Atendimentos</span>
              <Users className="h-4 w-4 text-primary" />
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="text-2xl font-bold">{indicadores.totalAtendimentos}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Presenças comprovadas</p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Navegação por Abas */}
      <div className="flex border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab("hoje")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "hoje"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Hoje</span>
          <Badge variant={data.blocosHoje.length > 0 ? "default" : "secondary"} className="h-5 px-1.5 text-xs rounded-full">
            {data.blocosHoje.length}
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("semana")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "semana"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Esta Semana</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("historico")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "historico"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <History className="h-4 w-4" />
          <span>Histórico</span>
        </button>
      </div>

      {/* 4. Conteúdo da Aba 1: Sessões de Hoje */}
      {activeTab === "hoje" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Programação de Hoje</h2>
            <span className="text-xs text-muted-foreground font-mono">
              {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
            </span>
          </div>

          {data.blocosHoje.length === 0 ? (
            <div className="p-8 text-center border border-dashed rounded-2xl bg-card space-y-3">
              <Calendar className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-sm font-medium">Nenhum bloco agendado para você hoje.</p>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Acesse a aba &ldquo;Esta Semana&rdquo; para conferir sua escala nos próximos dias ou consulte a coordenação.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.blocosHoje.map((b) => {
                const isLoading = loadingBlocoId === b.bloco_id;
                const statusSessao = b.sessao?.status ?? null;

                return (
                  <div
                    key={b.bloco_id}
                    className="p-5 rounded-2xl border border-border bg-card shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-primary/40"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-base text-foreground">
                          {b.hora_inicio} — {b.hora_fim}
                        </span>

                        {statusSessao === "concluida" ? (
                          <Badge variant="default" className="bg-emerald-600 text-white gap-1 text-xs">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Concluída</span>
                          </Badge>
                        ) : statusSessao === "em_andamento" ? (
                          <Badge variant="default" className="bg-amber-600 text-white gap-1 text-xs animate-pulse">
                            <Clock className="h-3 w-3" />
                            <span>Em Andamento</span>
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            A Iniciar
                          </Badge>
                        )}

                        {b.modalidade_nome && (
                          <Badge variant="secondary" className="gap-1 text-xs">
                            <Trophy className="h-3 w-3 text-primary" />
                            <span>{b.modalidade_nome}</span>
                          </Badge>
                        )}
                      </div>

                      <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                          <span>{b.local_nome}</span>
                        </span>

                        <span>•</span>

                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          <span>
                            {b.grupos.length > 0
                              ? b.grupos.map((g) => g.nome).join(", ")
                              : `Nenhuma ${termoGrupo} vinculada`}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Botões de Ação */}
                    <div className="shrink-0 flex items-center gap-2">
                      {statusSessao === "concluida" && b.sessao ? (
                        <Link href={`/sessoes/${b.sessao.id}`}>
                          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                            <Eye className="h-3.5 w-3.5" />
                            <span>Ver Comprovação</span>
                          </Button>
                        </Link>
                      ) : statusSessao === "em_andamento" && b.sessao ? (
                        <Link href={`/sessoes/${b.sessao.id}`}>
                          <Button size="sm" className="gap-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white">
                            <span>Continuar Aula</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      ) : (
                        <Button
                          size="sm"
                          disabled={isLoading}
                          onClick={() => handleIniciarSessaoBloco(b)}
                          className="gap-2 text-xs min-w-32"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              <span>Iniciando...</span>
                            </>
                          ) : (
                            <>
                              <Play className="h-3.5 w-3.5 fill-current" />
                              <span>Iniciar Aula</span>
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. Conteúdo da Aba 2: Esta Semana */}
      {activeTab === "semana" && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold">Escala Semanal</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.programacaoSemana.map((d) => (
              <Card key={d.dia_semana} className="shadow-xs">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">{d.dia_nome}</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {d.total_blocos} {d.total_blocos === 1 ? "horário" : "horários"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 pt-1 text-xs">
                  {d.blocos.length === 0 ? (
                    <p className="text-muted-foreground italic py-2">Sem aulas programadas</p>
                  ) : (
                    d.blocos.map((b) => (
                      <div key={b.id} className="p-2.5 rounded-lg border border-border/60 bg-muted/20 space-y-1">
                        <div className="font-mono font-semibold text-foreground">
                          {b.hora_inicio} — {b.hora_fim}
                        </div>
                        <div className="text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{b.local_nome}</span>
                        </div>
                        {b.grupos_nomes.length > 0 && (
                          <div className="text-[11px] text-muted-foreground">
                            Turmas: {b.grupos_nomes.join(", ")}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 6. Conteúdo da Aba 3: Histórico de Sessões */}
      {activeTab === "historico" && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold">Histórico de Aulas Realizadas</h2>
          {data.sessoesRecentes.length === 0 ? (
            <div className="p-8 text-center border border-dashed rounded-2xl bg-card space-y-2">
              <History className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-sm font-medium">Nenhuma aula registrada neste ciclo ainda.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {data.sessoesRecentes.map((s) => (
                <div
                  key={s.id}
                  className="p-4 rounded-xl border border-border bg-card flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">
                        {new Date(`${s.data}T12:00:00`).toLocaleDateString("pt-BR")}
                      </span>
                      <span className="font-mono text-muted-foreground">
                        ({s.hora_inicio} {s.hora_fim ? `às ${s.hora_fim}` : ""})
                      </span>
                      <Badge variant={s.status === "concluida" ? "default" : "secondary"} className="text-[10px]">
                        {s.status === "concluida" ? "Concluída" : "Em Aberto"}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground flex items-center gap-2">
                      <span>{s.local_nome}</span>
                      {s.modalidade_nome && (
                        <>
                          <span>•</span>
                          <span>{s.modalidade_nome}</span>
                        </>
                      )}
                      {s.fotos_urls.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            {s.fotos_urls.length} fotos anexadas
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <Link href={`/sessoes/${s.id}`}>
                    <Button variant="ghost" size="sm" className="gap-1 text-xs">
                      <span>Ver Ficha</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
