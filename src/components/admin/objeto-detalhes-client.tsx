"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ObjetoForm } from "@/components/admin/objeto-form";
import { ObjetoModalidadesTab } from "@/components/admin/objeto-modalidades-tab";
import { ObjetoMetasTab } from "@/components/admin/objeto-metas-tab";
import type { ModalidadeVinculada } from "@/lib/actions/objeto-modalidades";
import type { PainelMetasMroscData } from "@/lib/actions/metas";
import {
  FileText,
  Languages,
  MapPin,
  Compass,
  Building,
  Landmark,
  Calendar,
  Plus,
  HelpCircle,
  ExternalLink,
  Activity,
  Target,
  ShieldCheck,
} from "lucide-react";
import type { Database } from "@/lib/database.types";

type ObjetoRow = Database["public"]["Tables"]["objetos"]["Row"];
type RegiaoRow = Database["public"]["Tables"]["regioes"]["Row"];
type LocalRow = Database["public"]["Tables"]["locais"]["Row"];
type OrganizacaoRow = Database["public"]["Tables"]["organizacoes"]["Row"];
type ConcedenteRow = Database["public"]["Tables"]["concedentes"]["Row"];
type ModalidadeRow = Database["public"]["Tables"]["modalidades"]["Row"];

export type ObjetoDetalhado = ObjetoRow & {
  organizacao: Pick<OrganizacaoRow, "id" | "razao_social" | "nome_fantasia" | "cnpj"> | null;
  concedente: Pick<ConcedenteRow, "id" | "nome" | "sigla" | "esfera"> | null;
  modalidade_principal: Pick<ModalidadeRow, "id" | "nome"> | null;
  regioes: RegiaoRow[];
  locais: LocalRow[];
};

interface ObjetoDetalhesClientProps {
  objeto: ObjetoDetalhado;
  organizacoes: OrganizacaoRow[];
  concedentes: ConcedenteRow[];
  modalidades: ModalidadeRow[];
  modalidadesVinculadas?: ModalidadeVinculada[];
  metasData?: PainelMetasMroscData;
}

export function ObjetoDetalhesClient({
  objeto,
  organizacoes,
  concedentes,
  modalidades,
  modalidadesVinculadas = [],
  metasData,
}: ObjetoDetalhesClientProps) {
  const [activeTab, setActiveTab] = useState("geral");

  function formatDate(d: string) {
    if (!d) return "—";
    const [ano, mes, dia] = d.split("-");
    if (!ano || !mes || !dia) return d;
    return `${dia}/${mes}/${ano}`;
  }

  return (
    <div className="space-y-6">
      {/* Resumo Rápido no Topo */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Card 1: Formato Operacional & Atividades */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Formato Operacional
            </CardTitle>
            <Badge variant={objeto.tipo === "continuo" ? "default" : "outline"}>
              {objeto.tipo === "continuo" ? "Contínuo" : "Pontual"}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-base font-bold truncate">
              {objeto.tipo === "continuo" ? "Rotinas Periódicas" : "Evento Pontual"}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>
                {modalidadesVinculadas.length === 1
                  ? "1 atividade autorizada"
                  : `${modalidadesVinculadas.length} atividades autorizadas`}
              </span>
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Vigência Contratual & Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Vigência Contratual
            </CardTitle>
            {(() => {
              const hoje = new Date().toISOString().split("T")[0];
              if (hoje > objeto.data_fim) {
                return <Badge variant="destructive">Encerrado</Badge>;
              }
              if (hoje >= objeto.data_inicio) {
                return (
                  <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700">
                    Vigente
                  </Badge>
                );
              }
              return <Badge variant="secondary">A Iniciar</Badge>;
            })()}
          </CardHeader>
          <CardContent>
            <div className="text-xs font-bold">
              {formatDate(objeto.data_inicio)} até {formatDate(objeto.data_fim)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {objeto.processo_administrativo
                ? `Proc: ${objeto.processo_administrativo}`
                : `Convênio registrado`}
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Rede Territorial e Polos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Rede de {objeto.termo_local || "Polo"}s
            </CardTitle>
            <Badge variant="outline">
              {(objeto.regioes?.length ?? 1) === 1
                ? "Região Única"
                : `${objeto.regioes?.length} Regiões`}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-base font-bold truncate">
              {objeto.locais?.length ?? 0}{" "}
              {(objeto.locais?.length ?? 0) === 1
                ? objeto.termo_local || "Polo"
                : `${objeto.termo_local || "Polo"}s`}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Espaços físicos vinculados
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Governança, Parceria & MROSC */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Parceria & Governança
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {objeto.organizacao ? (
              <>
                <div className="text-base font-bold truncate">
                  {objeto.organizacao.nome_fantasia || objeto.organizacao.razao_social}
                </div>
                <p className="text-xs text-muted-foreground mt-1 font-mono">
                  CNPJ: {objeto.organizacao.cnpj}
                </p>
              </>
            ) : objeto.termo_parceria_numero ? (
              <>
                <div className="text-base font-bold truncate">
                  {objeto.termo_parceria_numero}
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {objeto.representante_legal_nome
                    ? `Resp: ${objeto.representante_legal_nome}`
                    : "Termo de Parceria"}
                </p>
              </>
            ) : (
              <>
                <div className="text-base font-bold truncate text-muted-foreground">
                  A Vincular OSC
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {metasData ? `${metasData.metas.length} metas pactuadas` : "Auditoria MROSC"}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Abas de Navegação e Gestão Operacional */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex flex-wrap w-full lg:w-fit gap-1 bg-muted/60 p-1 rounded-lg">
          <TabsTrigger value="geral" className="gap-2">
            <FileText className="h-4 w-4" />
            <span>Configurações do Projeto</span>
          </TabsTrigger>
          <TabsTrigger value="metas" className="gap-2">
            <Target className="h-4 w-4" />
            <span>Execução de Metas ({metasData?.metas?.length ?? 0})</span>
          </TabsTrigger>
          <TabsTrigger value="locais" className="gap-2">
            <MapPin className="h-4 w-4" />
            <span>{objeto.termo_local || "Polo"}s & Regiões ({objeto.locais?.length ?? 0})</span>
          </TabsTrigger>
          <TabsTrigger value="perguntas" className="gap-2">
            <HelpCircle className="h-4 w-4" />
            <span>Formulário de Inscrição</span>
          </TabsTrigger>
        </TabsList>

        {/* Aba 1: Configurações do Projeto (Formulário Completo em 5 Abas) */}
        <TabsContent value="geral">
          <ObjetoForm
            initialData={objeto}
            organizacoes={organizacoes}
            concedentes={concedentes}
            modalidades={modalidades}
            initialModalidadeIds={modalidadesVinculadas.map((v) => v.modalidade_id)}
            initialMetas={metasData?.metas?.map((m) => ({
              id: m.id,
              numero_meta: m.numero_meta,
              descricao: m.descricao,
              tipo_apuracao: m.tipo_apuracao,
              quantidade_prevista: m.quantidade_prevista,
              unidade_medida: m.unidade_medida,
              fonte_verificacao: m.fonte_verificacao,
            }))}
          />
        </TabsContent>

        {/* Aba 2: Execução de Metas MROSC (Painel de Auditoria & Acompanhamento) */}
        <TabsContent value="metas">
          {metasData ? (
            <ObjetoMetasTab
              objetoId={objeto.id}
              initialData={metasData}
              vocabulario={objeto}
            />
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">Nenhuma meta configurada ainda.</p>
                <p className="text-xs mt-1">
                  Acesse a aba <strong>Configurações do Projeto</strong> e adicione metas no Quadro de Metas.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Aba 3: Polos e Regiões Territoriais */}
        <TabsContent value="locais" className="space-y-6">
          {/* Seção de Polos Físicos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold">
                  {objeto.termo_local || "Polo"}s de Atendimento
                </h3>
                <p className="text-xs text-muted-foreground">
                  Espaços físicos onde ocorrem as atividades práticas e vistorias de supervisão.
                </p>
              </div>
              <Button size="sm" render={<Link href="/admin/locais/novo" />} className="gap-1.5">
                <Plus className="h-4 w-4" />
                <span>+ Novo {objeto.termo_local || "Polo"}</span>
              </Button>
            </div>

            {!objeto.locais || objeto.locais.length === 0 ? (
              <div className="p-8 text-center border border-dashed rounded-lg bg-card/40 text-sm text-muted-foreground">
                Nenhum {objeto.termo_local || "polo"} cadastrado para este projeto ainda.
              </div>
            ) : (
              <div className="rounded-lg border border-border bg-card overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome do {objeto.termo_local || "Polo"}</TableHead>
                      <TableHead>Região Obrigatória</TableHead>
                      <TableHead>Endereço</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {objeto.locais.map((loc: LocalRow) => {
                      const regiaoDoPolo = objeto.regioes?.find((r: RegiaoRow) => r.id === loc.regiao_id);
                      return (
                        <TableRow key={loc.id}>
                          <TableCell className="font-medium">{loc.nome}</TableCell>
                          <TableCell className="text-xs">
                            <Badge variant="outline">{regiaoDoPolo?.nome ?? "Região Única"}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {loc.endereco_cidade ? `${loc.endereco_cidade}/${loc.endereco_uf}` : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={loc.ativo ? "default" : "secondary"}>
                              {loc.ativo ? "Ativo" : "Inativo"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Seção de Regiões Territoriais */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold">Regiões Territoriais</h3>
                <p className="text-xs text-muted-foreground">
                  Todo projeto possui obrigatoriamente a Região Única ou subdivisões para vinculação de coordenadores.
                </p>
              </div>
              <Button size="sm" variant="outline" render={<Link href="/admin/regioes" />} className="gap-1.5">
                <Compass className="h-4 w-4" />
                <span>Gerenciar Regiões</span>
              </Button>
            </div>

            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome da Região</TableHead>
                    <TableHead>Coordenador Titular</TableHead>
                    <TableHead>Polos Vinculados</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {objeto.regioes?.map((reg: RegiaoRow) => {
                    const locaisDaRegiao = objeto.locais?.filter((l: LocalRow) => l.regiao_id === reg.id) ?? [];
                    return (
                      <TableRow key={reg.id}>
                        <TableCell className="font-medium">{reg.nome}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {reg.coordenador_id ? "Coordenador vinculado" : "Sem coordenador atribuído"}
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge variant="outline">
                            {locaisDaRegiao.length}{" "}
                            {locaisDaRegiao.length === 1
                              ? objeto.termo_local || "polo"
                              : `${objeto.termo_local || "polo"}s`}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* Aba 4: Formulário de Inscrição & Perguntas */}
        <TabsContent value="perguntas" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  Formulário Híbrido de Inscrição (§3.3.2)
                </CardTitle>
                <CardDescription>
                  Configure perguntas customizadas para este convênio, visualizadas tanto na autoinscrição pública da comunidade quanto na triagem da equipe.
                </CardDescription>
              </div>
              <Button size="sm" render={<Link href={`/admin/objetos/${objeto.id}/perguntas`} />} className="gap-1.5 shrink-0">
                <span>Abrir Construtor de Perguntas</span>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-2">
                <h4 className="text-sm font-semibold text-foreground">Como funciona o Formulário Híbrido:</h4>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                  <li><strong>Campos Civis Padrão:</strong> Nome, CPF único, Data de Nascimento, Telefone e Responsável são fixos e imutáveis por lei federal.</li>
                  <li><strong>Campos Específicos:</strong> Adicione perguntas como tamanho do uniforme, turno escolar, atestado médico ou documentos com upload.</li>
                  <li><strong>Simulador Mobile:</strong> Visualize em tempo real exatamente como a tela aparecerá no smartphone do cidadão.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
