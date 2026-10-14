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
            <p className="text-xs text-muted-foreground mt-1">
              {objeto.modalidade_principal?.nome ?? "Multimodal"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Organização Social
            </CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-base font-bold truncate">
              {objeto.organizacao?.nome_fantasia || objeto.organizacao?.razao_social}
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-mono">
              CNPJ: {objeto.organizacao?.cnpj}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Concedente Público
            </CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-base font-bold truncate">
              {objeto.concedente?.sigla || objeto.concedente?.nome}
            </div>
            <p className="text-xs text-muted-foreground mt-1 capitalize">
              Esfera {objeto.concedente?.esfera}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Vigência Contratual
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xs font-bold">
              {formatDate(objeto.data_inicio)} até {formatDate(objeto.data_fim)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Meta: {objeto.meta_frequencia_percentual}% freq.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Abas de Navegação e Configuração */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex flex-wrap w-full lg:w-fit gap-1 bg-muted/60 p-1 rounded-lg">
          <TabsTrigger value="geral" className="gap-2">
            <FileText className="h-4 w-4" />
            <span>Dados Gerais</span>
          </TabsTrigger>
          <TabsTrigger value="vocabulario" className="gap-2">
            <Languages className="h-4 w-4" />
            <span>Vocabulário Dinâmico</span>
          </TabsTrigger>
          <TabsTrigger value="modalidades" className="gap-2">
            <Activity className="h-4 w-4" />
            <span>Atividades ({modalidadesVinculadas?.length ?? 0})</span>
          </TabsTrigger>
          <TabsTrigger value="metas" className="gap-2">
            <Target className="h-4 w-4" />
            <span>Metas ({metasData?.metas?.length ?? 0})</span>
          </TabsTrigger>
          <TabsTrigger value="regioes" className="gap-2">
            <Compass className="h-4 w-4" />
            <span>Regiões ({objeto.regioes?.length ?? 0})</span>
          </TabsTrigger>
          <TabsTrigger value="locais" className="gap-2">
            <MapPin className="h-4 w-4" />
            <span>Polos ({objeto.locais?.length ?? 0})</span>
          </TabsTrigger>
          <TabsTrigger value="perguntas" className="gap-2">
            <HelpCircle className="h-4 w-4" />
            <span>Formulário de Inscrição</span>
          </TabsTrigger>
        </TabsList>

        {/* Aba 1: Dados Gerais e Edição */}
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

        {/* Aba Atividades & Modalidades do Projeto */}
        <TabsContent value="modalidades">
          <ObjetoModalidadesTab
            objetoId={objeto.id}
            initialVinculadas={modalidadesVinculadas}
            catalogoModalidades={modalidades}
            termoGrupo={objeto.termo_grupo}
          />
        </TabsContent>

        {/* Aba Metas do Projeto (MROSC com Vocabulário Dinâmico) */}
        {metasData && (
          <TabsContent value="metas">
            <ObjetoMetasTab
              objetoId={objeto.id}
              initialData={metasData}
              vocabulario={objeto}
            />
          </TabsContent>
        )}

        {/* Aba 2: Vocabulário Dinâmico (§4.3) */}
        <TabsContent value="vocabulario">
          <Card>
            <CardHeader>
              <CardTitle>Glossário Personalizado do Projeto (§4.3)</CardTitle>
              <CardDescription>
                Termos linguísticos ativos para este projeto. Todas as telas, chamadas, relatórios e menus adaptam-se dinamicamente a estes vocábulos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">Termo Canônico: Beneficiário</div>
                  <div className="text-lg font-bold text-primary">{objeto.termo_beneficiario}</div>
                  <p className="text-xs text-muted-foreground">Exibido na lista de chamada, autoinscrição e matrículas.</p>
                </div>

                <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">Termo Canônico: Instrutor</div>
                  <div className="text-lg font-bold text-primary">{objeto.termo_instrutor}</div>
                  <p className="text-xs text-muted-foreground">Exibido no painel de campo e na assinatura de presença.</p>
                </div>

                <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">Termo Canônico: Grupo / Turma</div>
                  <div className="text-lg font-bold text-primary">{objeto.termo_grupo}</div>
                  <p className="text-xs text-muted-foreground">Exibido no controle de vagas, faixas etárias e horários.</p>
                </div>

                <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">Termo Canônico: Sessão</div>
                  <div className="text-lg font-bold text-primary">{objeto.termo_sessao}</div>
                  <p className="text-xs text-muted-foreground">Exibido no registro individual de presença e fotos comprobatórias.</p>
                </div>

                <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">Termo Canônico: Bloco de Horário</div>
                  <div className="text-lg font-bold text-primary">{objeto.termo_bloco}</div>
                  <p className="text-xs text-muted-foreground">Exibido na grade de horários semanais e agendas.</p>
                </div>

                <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">Termo Canônico: Local / Polo</div>
                  <div className="text-lg font-bold text-primary">{objeto.termo_local}</div>
                  <p className="text-xs text-muted-foreground">Exibido nos links de autoinscrição pública e supervisão.</p>
                </div>

                <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">Termo Canônico: Materiais Coletivos</div>
                  <div className="text-lg font-bold text-primary">{objeto.termo_materiais_coletivos}</div>
                  <p className="text-xs text-muted-foreground">Exibido no controle patrimonial dos polos esportivos.</p>
                </div>

                <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">Termo Canônico: Materiais Individuais</div>
                  <div className="text-lg font-bold text-primary">{objeto.termo_materiais_concedidos}</div>
                  <p className="text-xs text-muted-foreground">Exibido na entrega individual de kits com foto e assinatura.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba 3: Regiões Vinculadas (§3.2) */}
        <TabsContent value="regioes" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold">Regiões Territoriais do Projeto</h3>
              <p className="text-xs text-muted-foreground">
                Todo projeto possui obrigatoriamente a Região Única ou subdivisões para alocação de polos.
              </p>
            </div>
            <Button size="sm" render={<Link href="/admin/regioes" />} className="gap-1.5">
              <Plus className="h-4 w-4" />
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
                        <Badge variant="outline">{locaisDaRegiao.length} polos</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Aba 4: Polos / Locais Vinculados */}
        <TabsContent value="locais" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold">Polos Físicos de Atendimento</h3>
              <p className="text-xs text-muted-foreground">
                Locais onde os instrutores realizam as atividades e recebem as vistorias de supervisão.
              </p>
            </div>
            <Button size="sm" render={<Link href="/admin/locais" />} className="gap-1.5">
              <Plus className="h-4 w-4" />
              <span>Gerenciar Polos</span>
            </Button>
          </div>

          {!objeto.locais || objeto.locais.length === 0 ? (
            <div className="p-8 text-center border border-dashed rounded-lg bg-card/40 text-sm text-muted-foreground">
              Nenhum polo cadastrado para este projeto ainda.
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome do Polo</TableHead>
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
        </TabsContent>

        {/* Aba 5: Formulário de Inscrição & Perguntas */}
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
