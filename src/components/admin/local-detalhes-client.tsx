"use client";

import React, { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { GradeSemanalLocal, type BlocoLocalItem } from "@/components/admin/grade-semanal-local";
import { LocalForm } from "@/components/admin/local-form";
import {
  MapPin,
  Calendar,
  Building2,
  Users,
  Compass,
  ArrowLeft,
  ExternalLink,
  Sparkles,
} from "lucide-react";

interface ObjetoSimple {
  id: string;
  nome: string;
  termo_local?: string;
  termo_bloco?: string;
  termo_grupo?: string;
  termo_instrutor?: string;
  tipo?: string;
}

interface RegiaoSimple {
  id: string;
  nome: string;
  objeto_id: string;
}

interface GrupoItem {
  id: string;
  nome: string;
  capacidade_maxima?: number;
  ativo?: boolean;
  idade_minima?: number | null;
  idade_maxima?: number | null;
}

interface InstrutorItem {
  id: string;
  nome_completo: string;
  cargo?: string;
}

interface LocalDetalhesClientProps {
  local: {
    id: string;
    nome: string;
    objeto_id: string;
    regiao_id: string;
    descricao?: string | null;
    endereco_logradouro?: string | null;
    endereco_numero?: string | null;
    endereco_bairro?: string | null;
    endereco_cidade?: string | null;
    endereco_uf?: string | null;
    endereco_cep?: string | null;
    slug?: string | null;
    ativo: boolean;
    objeto?: ObjetoSimple | null;
    regiao?: { id: string; nome: string } | null;
    blocos?: BlocoLocalItem[];
    grupos?: GrupoItem[];
  };
  objetos: ObjetoSimple[];
  regioes: RegiaoSimple[];
  instrutores: InstrutorItem[];
}

export function LocalDetalhesClient({
  local,
  objetos,
  regioes,
  instrutores,
}: LocalDetalhesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: "grade" | "dados" | "turmas" =
    tabParam === "dados" || tabParam === "turmas" || tabParam === "grade"
      ? tabParam
      : "grade";

  const justCreated = searchParams.get("created") === "true";
  const [showCreatedBanner, setShowCreatedBanner] = useState(justCreated);

  function setActiveTab(tab: "grade" | "dados" | "turmas") {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`?${params.toString()}`);
  }

  const termoLocal = local.objeto?.termo_local || "Polo";
  const termoInstrutor = local.objeto?.termo_instrutor || "Professor";
  const termoGrupo = local.objeto?.termo_grupo || "Turma";

  const totalBlocos = local.blocos?.length ?? 0;
  const totalTurmas = local.grupos?.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Banner de Sucesso pós-criação */}
      {showCreatedBanner && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 shadow-xs">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Polo cadastrado com sucesso!</p>
              <p className="text-xs opacity-90">
                Agora você pode montar a grade de horários interativamente arrastando nos dias
                abaixo.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setShowCreatedBanner(false)}
            className="text-xs"
          >
            Dispensar
          </Button>
        </div>
      )}

      {/* Cabeçalho do Polo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-xl border border-border shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/admin/locais"
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Todos os {termoLocal}s</span>
            </Link>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{local.nome}</h1>
                <Badge variant={local.ativo ? "default" : "secondary"}>
                  {local.ativo ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" />
                  <span>{local.objeto?.nome ?? "Projeto não informado"}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Compass className="h-3.5 w-3.5" />
                  <span>Região: {local.regiao?.nome ?? "Região Única"}</span>
                </span>
                {local.endereco_cidade && (
                  <>
                    <span>•</span>
                    <span>
                      {local.endereco_bairro ? `${local.endereco_bairro}, ` : ""}
                      {local.endereco_cidade}/{local.endereco_uf ?? ""}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {local.slug && (
            <Link
              href={`/inscricao/${local.slug}`}
              target="_blank"
              className={buttonVariants({ variant: "outline", size: "sm", className: "gap-1.5" })}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Página Pública</span>
            </Link>
          )}
        </div>
      </div>

      {/* Navegação por Abas */}
      <div className="flex border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab("grade")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "grade"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Grade Semanal & Horários</span>
          <Badge variant="secondary" className="h-5 px-1.5 text-xs rounded-full">
            {totalBlocos}
          </Badge>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("dados")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "dados"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Dados Cadastrais</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("turmas")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "turmas"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>{termoGrupo}s do Polo</span>
          <Badge variant="secondary" className="h-5 px-1.5 text-xs rounded-full">
            {totalTurmas}
          </Badge>
        </button>
      </div>

      {/* Conteúdo da Aba 1: Grade Interativa */}
      {activeTab === "grade" && (
        <GradeSemanalLocal
          localId={local.id}
          objetoId={local.objeto_id}
          initialBlocos={local.blocos ?? []}
          grupos={local.grupos ?? []}
          instrutores={instrutores}
          termoLocal={termoLocal}
          termoInstrutor={termoInstrutor}
          termoGrupo={termoGrupo}
        />
      )}

      {/* Conteúdo da Aba 2: Dados Cadastrais */}
      {activeTab === "dados" && (
        <div className="max-w-4xl">
          <LocalForm
            initialData={local}
            objetos={objetos}
            regioes={regioes}
            isEditing={true}
          />
        </div>
      )}

      {/* Conteúdo da Aba 3: Turmas Atendidas */}
      {activeTab === "turmas" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">{termoGrupo}s Alocadas neste {termoLocal}</h2>
              <p className="text-xs text-muted-foreground">
                Relação dos grupos cadastrados com atividades programadas neste espaço físico.
              </p>
            </div>
            <Link
              href="/grupos"
              className={buttonVariants({ variant: "outline", size: "sm", className: "gap-1.5" })}
            >
              <span>Gerenciar Todas as Turmas</span>
            </Link>
          </div>

          {!local.grupos || local.grupos.length === 0 ? (
            <div className="p-8 text-center border border-dashed rounded-xl bg-card space-y-3">
              <Users className="h-8 w-8 text-muted-foreground mx-auto" />
              <p className="text-sm font-medium">Nenhuma turma cadastrada neste polo ainda.</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Ao criar uma turma em /grupos, selecione este polo para associá-la à grade de horários.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {local.grupos.map((g) => (
                <div
                  key={g.id}
                  className="p-4 rounded-xl border border-border bg-card space-y-3 shadow-xs hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm">{g.nome}</h3>
                    <Badge variant={g.ativo ? "default" : "secondary"}>
                      {g.ativo ? "Ativa" : "Inativa"}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>Capacidade:</span>
                      <span className="font-medium text-foreground">
                        {g.capacidade_maxima ?? 0} vagas
                      </span>
                    </div>
                    {(g.idade_minima !== null || g.idade_maxima !== null) && (
                      <div className="flex items-center justify-between">
                        <span>Faixa Etária:</span>
                        <span className="font-medium text-foreground">
                          {g.idade_minima ?? 0} a {g.idade_maxima ?? 99} anos
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-border flex justify-end">
                    <Link
                      href={`/grupos/${g.id}`}
                      className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
                    >
                      <span>Ver Detalhes</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
