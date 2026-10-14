"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Calendar,
  MapPin,
  Trophy,
  Clock,
  QrCode,
  Copy,
  Check,
  UserPlus,
  ArrowLeft,
  Share2,
  ShieldCheck,
} from "lucide-react";

export interface MatriculaItem {
  id: string;
  status: string;
  vulneravel: boolean;
  data_matricula: string;
  beneficiario: {
    id: string;
    nome_completo: string;
    cpf: string;
    data_nascimento: string;
    telefone: string | null;
    nome_responsavel: string | null;
  };
}

export interface BlocoItem {
  id: string;
  nome: string | null;
  dia_semana: number | null;
  data_especifica: string | null;
  hora_inicio: string;
  hora_fim: string;
  ativo: boolean;
  instrutor?: {
    id: string;
    nome: string;
  } | null;
}

export interface GrupoDetalhes {
  id: string;
  nome: string;
  objeto_id: string;
  local_id: string;
  modalidade_id: string | null;
  capacidade_maxima: number;
  idade_minima: number | null;
  idade_maxima: number | null;
  ativo: boolean;
  criado_em: string;
  objeto?: {
    id: string;
    nome: string;
    tipo: "continuo" | "pontual";
    termo_grupo?: string;
    termo_beneficiario?: string;
    termo_local?: string;
  } | null;
  local?: {
    id: string;
    nome: string;
    slug: string;
  } | null;
  modalidade?: {
    id: string;
    nome: string;
  } | null;
  matriculas?: MatriculaItem[];
  blocos?: BlocoItem[];
}

interface GrupoDetalhesClientProps {
  grupo: GrupoDetalhes;
}

const DIAS_SEMANA = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

function formatarCpf(cpf: string) {
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11) return cpf;
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function calcularIdade(dataNasc: string) {
  if (!dataNasc) return null;
  const parts = dataNasc.split("-").map(Number);
  if (parts.length < 3) return null;
  const [ano, mes, dia] = parts;
  const nasc = new Date(ano, mes - 1, dia);
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
    idade--;
  }
  return idade;
}

export function GrupoDetalhesClient({ grupo }: GrupoDetalhesClientProps) {
  const [activeTab, setActiveTab] = useState<
    "matriculados" | "espera" | "blocos" | "divulgacao"
  >("matriculados");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedLocal, setCopiedLocal] = useState(false);

  const matriculasAtivas = (grupo.matriculas || []).filter(
    (m) => m.status === "ativo"
  );
  const listaEspera = (grupo.matriculas || []).filter(
    (m) => m.status === "lista_espera"
  );
  const preInscritos = (grupo.matriculas || []).filter(
    (m) => m.status === "pre_inscrito"
  );

  const ocupacaoPct = Math.min(
    100,
    Math.round((matriculasAtivas.length / grupo.capacidade_maxima) * 100)
  );

  const termoGrupo = grupo.objeto?.termo_grupo || "";
  const termoBeneficiario = grupo.objeto?.termo_beneficiario || "";
  const termoLocal = grupo.objeto?.termo_local || "";

  // URL pública de inscrição direta no grupo
  const host =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://beneficiarios-app.vercel.app";
  const publicGrupoUrl = `${host}/inscricao/grupo/${grupo.id}`;
  const publicLocalUrl = `${host}/inscricao/${grupo.local?.slug || grupo.local_id}`;

  function handleCopyGrupoLink() {
    navigator.clipboard.writeText(publicGrupoUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  function handleCopyLocalLink() {
    navigator.clipboard.writeText(publicLocalUrl);
    setCopiedLocal(true);
    setTimeout(() => setCopiedLocal(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/grupos">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {grupo.nome}
              </h1>
              <Badge
                variant={grupo.ativo ? "default" : "secondary"}
                className={
                  grupo.ativo
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    : ""
                }
              >
                {grupo.ativo ? "Ativo" : "Inativo"}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
              <span>{grupo.objeto?.nome}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {grupo.local?.nome}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Trophy className="h-3 w-3" />
                {grupo.modalidade?.nome || "Livre / Multimodal"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveTab("divulgacao")}
          >
            <Share2 className="mr-2 h-4 w-4" /> Link de Inscrição
          </Button>
          <Link href="/matriculas">
            <Button size="sm">
              <UserPlus className="mr-2 h-4 w-4" /> Matricular {termoBeneficiario}
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards do Grupo */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">
            Lotação & Vagas
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl font-bold text-foreground">
              {matriculasAtivas.length} / {grupo.capacidade_maxima}
            </h3>
            <span className="text-xs text-muted-foreground">
              ({ocupacaoPct}%)
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className={`h-full ${
                ocupacaoPct >= 100 ? "bg-destructive" : "bg-primary"
              }`}
              style={{ width: `${ocupacaoPct}%` }}
            />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">
            Fila de Espera
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {listaEspera.length}
            </h3>
            <span className="text-xs text-muted-foreground">aguardando vaga</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Pré-inscritos para aprovação: {preInscritos.length}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">
            Faixa Etária Permitida
          </p>
          <div className="mt-1">
            <h3 className="text-lg font-bold text-foreground">
              {grupo.idade_minima !== null && grupo.idade_maxima !== null
                ? `${grupo.idade_minima} a ${grupo.idade_maxima} anos`
                : grupo.idade_minima !== null
                ? `A partir de ${grupo.idade_minima} anos`
                : grupo.idade_maxima !== null
                ? `Até ${grupo.idade_maxima} anos`
                : "Sem restrição de idade"}
            </h3>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Regra rígida para autorização de matrícula
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">
            Horários & Blocos
          </p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl font-bold text-foreground">
              {grupo.blocos?.length || 0}
            </h3>
            <span className="text-xs text-muted-foreground">
              bloco(s) cadastrado(s)
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Grade de atendimento vinculada
          </p>
        </div>
      </div>

      {/* Tabs de Conteúdo */}
      <div className="border-b border-border">
        <nav className="flex space-x-6">
          <button
            onClick={() => setActiveTab("matriculados")}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "matriculados"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Matriculados ({matriculasAtivas.length})
          </button>
          <button
            onClick={() => setActiveTab("espera")}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "espera"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Fila de Espera & Pré-Inscrições ({listaEspera.length + preInscritos.length})
          </button>
          <button
            onClick={() => setActiveTab("blocos")}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "blocos"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Horários & Blocos ({grupo.blocos?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("divulgacao")}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "divulgacao"
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Divulgação & QR Code
          </button>
        </nav>
      </div>

      {/* Aba 1: Matriculados Ativos */}
      {activeTab === "matriculados" && (
        <div className="rounded-lg border border-border bg-card">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              {termoBeneficiario}s Matriculados neste {termoGrupo}
            </h3>
            <span className="text-xs text-muted-foreground">
              Total ativo: {matriculasAtivas.length} de {grupo.capacidade_maxima} vagas
            </span>
          </div>

          {matriculasAtivas.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
              Nenhum participante matriculado ativamente neste grupo ainda.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome Completo</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Idade</TableHead>
                  <TableHead>Contato / Responsável</TableHead>
                  <TableHead>Data Matrícula</TableHead>
                  <TableHead>Cota MROSC</TableHead>
                  <TableHead className="text-right">Ficha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matriculasAtivas.map((m) => {
                  const b = m.beneficiario;
                  const idade = calcularIdade(b.data_nascimento);

                  return (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium text-foreground">
                        {b.nome_completo}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {formatarCpf(b.cpf)}
                      </TableCell>
                      <TableCell>
                        {idade !== null ? `${idade} anos` : "—"}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div>{b.telefone || "Sem telefone"}</div>
                        {b.nome_responsavel && (
                          <div className="text-muted-foreground">
                            Resp: {b.nome_responsavel}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {m.data_matricula.split("-").reverse().join("/")}
                      </TableCell>
                      <TableCell>
                        {m.vulneravel ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-300 dark:border-amber-700 py-0"
                          >
                            Vulnerável
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Regular
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/beneficiarios/${b.id}`}>
                          <Button variant="ghost" size="sm" className="h-7 text-xs">
                            Ver Ficha
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {/* Aba 2: Fila de Espera & Pré-Inscrições */}
      {activeTab === "espera" && (
        <div className="rounded-lg border border-border bg-card">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">
              Participantes Aguardando Convocação ou Homologação
            </h3>
            <p className="text-xs text-muted-foreground">
              A fila respeita a ordem cronológica de inscrição pública para chamamento quando houver vagas.
            </p>
          </div>

          {listaEspera.length === 0 && preInscritos.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              Nenhum participante na fila de espera no momento.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Posição / Status</TableHead>
                  <TableHead>Nome Completo</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Idade</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Data Inscrição</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...preInscritos, ...listaEspera].map((m, index) => {
                  const b = m.beneficiario;
                  const idade = calcularIdade(b.data_nascimento);

                  return (
                    <TableRow key={m.id}>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            m.status === "lista_espera"
                              ? "border-amber-500 text-amber-600 dark:text-amber-400"
                              : "border-blue-500 text-blue-600 dark:text-blue-400"
                          }
                        >
                          {m.status === "lista_espera"
                            ? `${index + 1}º da Fila`
                            : "Pré-Inscrição"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-foreground">
                        {b.nome_completo}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {formatarCpf(b.cpf)}
                      </TableCell>
                      <TableCell>{idade !== null ? `${idade} anos` : "—"}</TableCell>
                      <TableCell className="text-xs">{b.telefone || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {m.data_matricula.split("-").reverse().join("/")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href="/matriculas">
                          <Button size="sm" variant="outline" className="h-7 text-xs">
                            Gerenciar Matrícula
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {/* Aba 3: Blocos de Horário */}
      {activeTab === "blocos" && (
        <div className="rounded-lg border border-border bg-card">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Grade de Horários Vinculada
              </h3>
              <p className="text-xs text-muted-foreground">
                Horários oficiais de condução prática deste grupo (§3.4).
              </p>
            </div>
            <Link href="/planejamento">
              <Button size="sm" variant="outline">
                <Clock className="mr-2 h-4 w-4" /> Grade Geral
              </Button>
            </Link>
          </div>

          {(!grupo.blocos || grupo.blocos.length === 0) ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-40" />
              Nenhum bloco de horário vinculado a este grupo ainda. Acesse o
              Planejamento Temporal para criar blocos.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {grupo.blocos.map((b) => (
                <div
                  key={b.id}
                  className="rounded-lg border border-border p-4 bg-background space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-foreground">
                      {b.nome || "Bloco de Atendimento"}
                    </span>
                    <Badge
                      variant={b.ativo ? "default" : "secondary"}
                      className="text-[10px]"
                    >
                      {b.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {b.dia_semana !== null
                          ? DIAS_SEMANA[b.dia_semana]
                          : b.data_especifica
                          ? `Data: ${b.data_especifica.split("-").reverse().join("/")}`
                          : "Dia não definido"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      <span>
                        {b.hora_inicio.slice(0, 5)} às {b.hora_fim.slice(0, 5)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1 text-foreground">
                      <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                      <span>
                        Instrutor: {b.instrutor?.nome || "Não atribuído"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Aba 4: Divulgação & QR Code */}
      {activeTab === "divulgacao" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Inscrição Direta no Grupo */}
          <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <div>
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <QrCode className="h-5 w-5 text-primary" />
                Link Direto para este {termoGrupo}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Abre o formulário de autoinscrição pública diretamente neste grupo,
                com a restrição de idade já validada.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  value={publicGrupoUrl}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button size="icon" onClick={handleCopyGrupoLink}>
                  {copiedLink ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-muted/40 border border-border/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  publicGrupoUrl
                )}`}
                alt={`QR Code do ${termoGrupo}`}
                className="w-44 h-44 rounded bg-white p-2 border"
              />
              <p className="text-[11px] text-muted-foreground mt-2 text-center">
                Aponte a câmera do celular para testar a autoinscrição pública.
              </p>
            </div>
          </div>

          {/* Card 2: Inscrição Geral do Local */}
          <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <div>
              <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Link Geral do {termoLocal} ({grupo.local?.nome})
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Permite à comunidade visualizar todas as modalidades e grupos abertos neste local de atendimento.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  value={publicLocalUrl}
                  readOnly
                  className="font-mono text-xs"
                />
                <Button size="icon" onClick={handleCopyLocalLink}>
                  {copiedLocal ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-4 rounded-lg bg-muted/40 border border-border/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  publicLocalUrl
                )}`}
                alt={`QR Code do ${termoLocal}`}
                className="w-44 h-44 rounded bg-white p-2 border"
              />
              <p className="text-[11px] text-muted-foreground mt-2 text-center">
                QR Code geral do local para divulgação e cartazes institucionais.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
