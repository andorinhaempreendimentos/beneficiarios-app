"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createObjeto, updateObjeto } from "@/lib/actions/objetos";
import { createModalidade } from "@/lib/actions/modalidades";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Check,
  FileText,
  Languages,
  Activity,
  Target,
  ShieldCheck,
  Save,
  Plus,
  Search,
  Loader2,
  CheckCircle2,
} from "lucide-react";

import type { Database } from "@/lib/database.types";

interface OptionItem {
  id: string;
  nome?: string;
  razao_social?: string;
  nome_fantasia?: string | null;
  sigla?: string | null;
  descricao?: string | null;
  ativo?: boolean;
}

interface ObjetoFormProps {
  initialData?: Partial<Database["public"]["Tables"]["objetos"]["Row"]>;
  organizacoes?: OptionItem[];
  concedentes?: OptionItem[];
  modalidades?: OptionItem[];
  initialModalidadeIds?: string[];
}

const TABS = [
  { id: "identificacao", label: "Identificação & Vigência", icon: FileText },
  { id: "vocabulario", label: "Vocabulário Dinâmico", icon: Languages },
  { id: "atividades", label: "Atividades & Modalidades", icon: Activity },
  { id: "metas", label: "Quadro de Metas", icon: Target },
  { id: "juridico", label: "Dados Jurídicos", icon: ShieldCheck },
] as const;

export function ObjetoForm({
  initialData,
  modalidades = [],
  initialModalidadeIds = [],
}: ObjetoFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("identificacao");

  // Estado das Atividades / Modalidades (Aba 3)
  const [modalidadesCatalogo, setModalidadesCatalogo] = useState<OptionItem[]>(modalidades);
  const [selectedModalidadeIds, setSelectedModalidadeIds] = useState<string[]>(initialModalidadeIds);
  const [buscaModalidade, setBuscaModalidade] = useState("");
  const [sheetModalidadeOpen, setSheetModalidadeOpen] = useState(false);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [novaModalidade, setNovaModalidade] = useState({
    nome: "",
    descricao: "",
    ativo: true,
  });

  const [formData, setFormData] = useState({
    nome: initialData?.nome ?? "",
    tipo: (initialData?.tipo ?? "continuo") as "continuo" | "pontual",
    organizacao_id: initialData?.organizacao_id ?? "",
    concedente_id: initialData?.concedente_id ?? "",
    modalidade_principal_id: initialData?.modalidade_principal_id ?? "",
    data_inicio: initialData?.data_inicio ?? "",
    data_fim: initialData?.data_fim ?? "",
    processo_administrativo: initialData?.processo_administrativo ?? "",
    edital_chamamento: initialData?.edital_chamamento ?? "",
    termo_parceria_numero: initialData?.termo_parceria_numero ?? "",
    representante_legal_nome: initialData?.representante_legal_nome ?? "",
    representante_legal_cargo: initialData?.representante_legal_cargo ?? "",
    habilitar_vulnerabilidade: initialData?.habilitar_vulnerabilidade ?? true,
    descricao: initialData?.descricao ?? "",
    municipio: initialData?.municipio ?? "",
    uf: initialData?.uf ?? "",

    // Vocabulário dinâmico obrigatório (§4.3)
    termo_beneficiario: initialData?.termo_beneficiario ?? "Aluno",
    termo_instrutor: initialData?.termo_instrutor ?? "Professor",
    termo_grupo: initialData?.termo_grupo ?? "Turma",
    termo_sessao: initialData?.termo_sessao ?? "Aula",
    termo_bloco: initialData?.termo_bloco ?? "Horário de Aula",
    termo_local: initialData?.termo_local ?? "Polo",
    termo_materiais_coletivos: initialData?.termo_materiais_coletivos ?? "Materiais Esportivos",
    termo_materiais_concedidos: initialData?.termo_materiais_concedidos ?? "Uniformes e Kits",
    ativo: initialData?.ativo ?? true,
  });

  function handleInputChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  }

  function handleNextTab() {
    const currentIndex = TABS.findIndex((t) => t.id === activeTab);
    if (currentIndex < TABS.length - 1) {
      setActiveTab(TABS[currentIndex + 1].id);
    }
  }

  function handlePrevTab() {
    const currentIndex = TABS.findIndex((t) => t.id === activeTab);
    if (currentIndex > 0) {
      setActiveTab(TABS[currentIndex - 1].id);
    }
  }

  function handleToggleModalidade(id: string) {
    setSelectedModalidadeIds((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]
    );
  }

  async function handleCriarModalidadeInline() {
    if (!novaModalidade.nome.trim()) return;
    setSheetLoading(true);
    setSheetError(null);

    const res = await createModalidade({
      nome: novaModalidade.nome,
      descricao: novaModalidade.descricao || null,
      ativo: novaModalidade.ativo,
    });

    setSheetLoading(false);

    if (res.success && res.data) {
      const criada = res.data;
      setModalidadesCatalogo((prev) => [...prev, criada]);
      setSelectedModalidadeIds((prev) => [...prev, criada.id]);
      setSheetModalidadeOpen(false);
      setNovaModalidade({ nome: "", descricao: "", ativo: true });
    } else {
      setSheetError(res.error ?? "Erro ao cadastrar modalidade.");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const payload = {
      ...formData,
      modalidades_ids: selectedModalidadeIds,
    };

    let res;
    if (initialData?.id) {
      res = await updateObjeto(initialData.id, payload);
    } else {
      res = await createObjeto(payload);
    }

    setLoading(false);

    if (res.success) {
      const createdId = (res as { data?: { id?: string } }).data?.id;
      if (!initialData?.id && createdId) {
        router.push(`/admin/objetos/${createdId}`);
      } else {
        router.push("/admin/objetos");
      }
    } else {
      setErrorMsg(res.error ?? "Ocorreu um erro ao salvar o projeto.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {errorMsg && (
        <div className="flex items-center gap-2 p-4 rounded-lg text-sm bg-destructive/10 text-destructive border border-destructive/20">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Navegação por Abas do Formulário */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex flex-wrap w-full gap-1 bg-muted/60 p-1 rounded-lg">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Aba 1: Identificação & Vigência */}
        <TabsContent value="identificacao">
          <Card>
            <CardHeader>
              <CardTitle>Identificação & Formato Operacional</CardTitle>
              <CardDescription>
                Defina o nome do projeto e seu formato estrutural (contínuo com rotinas periódicas ou pontual para eventos).
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="nome">Nome do Projeto / Objeto *</Label>
                <Input
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  placeholder="Ex: Escolinha de Esportes Comunidade Viva 2026"
                  required
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="tipo">Formato do Projeto (Agnóstico) *</Label>
                <select
                  id="tipo"
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleInputChange}
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  required
                >
                  <option value="continuo">Contínuo (Escolinhas, rotinas periódicas recorrentes)</option>
                  <option value="pontual">Pontual (Festivais, torneios, corridas de rua)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_inicio">Data de Início da Vigência *</Label>
                <Input
                  id="data_inicio"
                  name="data_inicio"
                  type="date"
                  value={formData.data_inicio}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_fim">Data de Término da Vigência *</Label>
                <Input
                  id="data_fim"
                  name="data_fim"
                  type="date"
                  value={formData.data_fim}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="descricao">Descrição / Resumo do Objeto</Label>
                <Textarea
                  id="descricao"
                  name="descricao"
                  value={formData.descricao}
                  onChange={handleInputChange}
                  placeholder="Finalidade das atividades esportivas, público-alvo prioritário e metas pactuadas."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba 2: Vocabulário Dinâmico (§4.3) */}
        <TabsContent value="vocabulario">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Vocabulário Dinâmico do Projeto (§4.3)</CardTitle>
              <CardDescription>
                Personalize a linguagem da interface para este projeto. O sistema adapta os rótulos de tela de acordo com os termos escolhidos abaixo (zero hardcoded).
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="termo_beneficiario">Termo para os Atendidos *</Label>
                <Input
                  id="termo_beneficiario"
                  name="termo_beneficiario"
                  value={formData.termo_beneficiario}
                  onChange={handleInputChange}
                  placeholder="Ex: Aluno, Atleta, Corredor, Participante"
                  required
                />
                <p className="text-[11px] text-muted-foreground">Como o cidadão atendido será chamado nas chamadas e relatórios.</p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="termo_instrutor">Termo para o Instrutor *</Label>
                <Input
                  id="termo_instrutor"
                  name="termo_instrutor"
                  value={formData.termo_instrutor}
                  onChange={handleInputChange}
                  placeholder="Ex: Professor, Educador, Monitor, Treinador"
                  required
                />
                <p className="text-[11px] text-muted-foreground">Profissional de campo que ministra as atividades práticas.</p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="termo_grupo">Termo para Grupo / Turma *</Label>
                <Input
                  id="termo_grupo"
                  name="termo_grupo"
                  value={formData.termo_grupo}
                  onChange={handleInputChange}
                  placeholder="Ex: Turma, Chave, Pelotão, Categoria"
                  required
                />
                <p className="text-[11px] text-muted-foreground">Unidade de reserva de vagas por idade/horário.</p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="termo_sessao">Termo para Sessão de Atendimento *</Label>
                <Input
                  id="termo_sessao"
                  name="termo_sessao"
                  value={formData.termo_sessao}
                  onChange={handleInputChange}
                  placeholder="Ex: Aula, Treino, Largada, Encontro"
                  required
                />
                <p className="text-[11px] text-muted-foreground">Ocorrência individual prática onde ocorre chamada e fotos.</p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="termo_bloco">Termo para Grade / Bloco *</Label>
                <Input
                  id="termo_bloco"
                  name="termo_bloco"
                  value={formData.termo_bloco}
                  onChange={handleInputChange}
                  placeholder="Ex: Horário de Aula, Bateria, Etapa"
                  required
                />
                <p className="text-[11px] text-muted-foreground">Faixa horária semanal ou data avulsa na agenda.</p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="termo_local">Termo para Local / Polo *</Label>
                <Input
                  id="termo_local"
                  name="termo_local"
                  value={formData.termo_local}
                  onChange={handleInputChange}
                  placeholder="Ex: Polo, Núcleo, Arena, Circuito"
                  required
                />
                <p className="text-[11px] text-muted-foreground">Espaço físico onde ocorrem os atendimentos.</p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="termo_materiais_coletivos">Termo para Materiais Coletivos *</Label>
                <Input
                  id="termo_materiais_coletivos"
                  name="termo_materiais_coletivos"
                  value={formData.termo_materiais_coletivos}
                  onChange={handleInputChange}
                  placeholder="Ex: Materiais Esportivos, Equipamentos"
                  required
                />
                <p className="text-[11px] text-muted-foreground">Itens de treino alocados no polo físico.</p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="termo_materiais_concedidos">Termo para Materiais Individuais *</Label>
                <Input
                  id="termo_materiais_concedidos"
                  name="termo_materiais_concedidos"
                  value={formData.termo_materiais_concedidos}
                  onChange={handleInputChange}
                  placeholder="Ex: Uniformes, Kits Individuais, Kits de Corrida"
                  required
                />
                <p className="text-[11px] text-muted-foreground">Itens entregues individualmente ao participante.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba 3: Atividades & Modalidades */}
        <TabsContent value="atividades">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  <span>Atividades & Modalidades do Projeto</span>
                </CardTitle>
                <CardDescription className="mt-1">
                  Selecione quais práticas esportivas e atividades do catálogo geral serão executadas neste projeto.
                  Novas {formData.termo_grupo}s só poderão ser criadas para as atividades autorizadas aqui.
                </CardDescription>
              </div>

              <Button
                type="button"
                onClick={() => setSheetModalidadeOpen(true)}
                className="gap-2 shrink-0"
              >
                <Plus className="h-4 w-4" />
                <span>+ Nova Modalidade</span>
              </Button>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Barra de Filtro e Contador */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar modalidade..."
                    value={buscaModalidade}
                    onChange={(e) => setBuscaModalidade(e.target.value)}
                    className="pl-8 h-9 text-xs"
                  />
                </div>

                <div className="text-xs text-muted-foreground">
                  <span className="font-semibold text-primary">{selectedModalidadeIds.length}</span>{" "}
                  {selectedModalidadeIds.length === 1 ? "atividade selecionada" : "atividades selecionadas"}
                </div>
              </div>

              {/* Grid de Modalidades Selecionáveis */}
              {modalidadesCatalogo.length === 0 ? (
                <div className="p-8 text-center rounded-lg border border-dashed border-border text-muted-foreground">
                  <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">Nenhuma modalidade cadastrada no sistema.</p>
                  <p className="text-xs mt-1">
                    Clique em <strong>+ Nova Modalidade</strong> para cadastrar a primeira prática esportiva no painel lateral.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {modalidadesCatalogo
                    .filter((m) =>
                      m.nome?.toLowerCase().includes(buscaModalidade.toLowerCase())
                    )
                    .map((mod) => {
                      const isSelected = selectedModalidadeIds.includes(mod.id);
                      return (
                        <div
                          key={mod.id}
                          onClick={() => handleToggleModalidade(mod.id)}
                          className={`p-3 rounded-lg border cursor-pointer transition-all flex flex-col justify-between gap-2 ${
                            isSelected
                              ? "border-primary bg-primary/5 shadow-xs"
                              : "border-border hover:border-muted-foreground/30 bg-card"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-medium text-sm text-foreground flex items-center gap-2">
                              <Activity
                                className={`h-4 w-4 shrink-0 ${
                                  isSelected ? "text-primary" : "text-muted-foreground"
                                }`}
                              />
                              <span>{mod.nome}</span>
                            </div>
                            <Badge
                              variant={isSelected ? "default" : "secondary"}
                              className={`text-[10px] ${
                                isSelected
                                  ? "bg-primary text-primary-foreground"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {isSelected ? "Selecionada" : "Opcional"}
                            </Badge>
                          </div>
                          {mod.descricao && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {mod.descricao}
                            </p>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba 4: Quadro de Metas (Estruturada para T03) */}
        <TabsContent value="metas">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <span>Quadro de Metas do Projeto (MROSC)</span>
              </CardTitle>
              <CardDescription>
                Definição de metas quantitativas utilizando os termos definidos: {formData.termo_beneficiario}s,{" "}
                {formData.termo_sessao}s e {formData.termo_local}s.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-6 rounded-lg border border-dashed border-border text-center text-muted-foreground">
                <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">Metas contratuais atreladas às entidades</p>
                <p className="text-xs mt-1">
                  Esta seção permite definir metas atreladas aos {formData.termo_beneficiario}s e {formData.termo_sessao}s do projeto.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba 5: Metadados Jurídicos e Contratuais */}
        <TabsContent value="juridico">
          <Card>
            <CardHeader>
              <CardTitle>Dados Jurídicos & Prestação de Contas</CardTitle>
              <CardDescription>
                Informações documentais exigidas nos cabeçalhos oficiais dos relatórios de auditoria e MROSC.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="termo_parceria_numero">Nº do Termo de Colaboração / Fomento</Label>
                <Input
                  id="termo_parceria_numero"
                  name="termo_parceria_numero"
                  value={formData.termo_parceria_numero}
                  onChange={handleInputChange}
                  placeholder="Ex: Termo de Colaboração nº 042/2026"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="processo_administrativo">Nº do Processo Administrativo</Label>
                <Input
                  id="processo_administrativo"
                  name="processo_administrativo"
                  value={formData.processo_administrativo}
                  onChange={handleInputChange}
                  placeholder="Ex: Processo nº 6019.2025/0001234-5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edital_chamamento">Nº do Edital de Chamamento Público</Label>
                <Input
                  id="edital_chamamento"
                  name="edital_chamamento"
                  value={formData.edital_chamamento}
                  onChange={handleInputChange}
                  placeholder="Ex: Edital nº 008/SEME/2025"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="representante_legal_nome">Representante Legal da OSC</Label>
                <Input
                  id="representante_legal_nome"
                  name="representante_legal_nome"
                  value={formData.representante_legal_nome}
                  onChange={handleInputChange}
                  placeholder="Nome do presidente ou procurador que assina"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="representante_legal_cargo">Cargo do Representante Legal</Label>
                <Input
                  id="representante_legal_cargo"
                  name="representante_legal_cargo"
                  value={formData.representante_legal_cargo}
                  onChange={handleInputChange}
                  placeholder="Ex: Diretor Presidente"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Barra de Navegação e Submissão entre Etapas */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border mt-6">
        <div>
          {activeTab !== "identificacao" && (
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevTab}
              disabled={loading}
              className="gap-2 w-full sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar</span>
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancelar
          </Button>

          {/* Salvar Rápido disponível em qualquer aba */}
          <Button
            type="submit"
            variant="secondary"
            disabled={loading}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            <span>Salvar Rascunho</span>
          </Button>

          {activeTab !== "juridico" ? (
            <Button
              type="button"
              onClick={handleNextTab}
              className="gap-2"
            >
              <span>Próxima Etapa</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" disabled={loading} className="gap-2">
              <Check className="h-4 w-4" />
              <span>{loading ? "Salvando..." : initialData?.id ? "Salvar Alterações" : "Concluir e Criar Projeto"}</span>
            </Button>
          )}
        </div>
      </div>
      {/* Drawer Lateral (Sheet) para Criação Inline de Nova Modalidade */}
      <Sheet open={sheetModalidadeOpen} onOpenChange={setSheetModalidadeOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-6 z-[60]">
          <SheetHeader className="mb-4">
            <SheetTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <span>Nova Modalidade / Atividade</span>
            </SheetTitle>
            <SheetDescription>
              Cadastre uma nova prática esportiva no catálogo geral. Ela será selecionada automaticamente para este projeto.
            </SheetDescription>
          </SheetHeader>

          {sheetError && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive mb-4 border border-destructive/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{sheetError}</span>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inline_mod_nome">Nome da Atividade / Modalidade *</Label>
              <Input
                id="inline_mod_nome"
                value={novaModalidade.nome}
                onChange={(e) =>
                  setNovaModalidade((prev) => ({ ...prev, nome: e.target.value }))
                }
                placeholder="Ex: Basquete 3x3, Atletismo Infantil, Natação..."
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inline_mod_desc">Descrição / Diretrizes</Label>
              <Textarea
                id="inline_mod_desc"
                value={novaModalidade.descricao}
                onChange={(e) =>
                  setNovaModalidade((prev) => ({ ...prev, descricao: e.target.value }))
                }
                placeholder="Regras, espaço necessário, faixa etária sugerida..."
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="inline_mod_ativo"
                checked={novaModalidade.ativo}
                onChange={(e) =>
                  setNovaModalidade((prev) => ({ ...prev, ativo: e.target.checked }))
                }
                className="h-4 w-4 rounded border-input text-primary focus:ring-primary cursor-pointer"
              />
              <Label htmlFor="inline_mod_ativo" className="text-sm font-normal cursor-pointer">
                Modalidade ativa no catálogo geral
              </Label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-border mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSheetModalidadeOpen(false)}
                disabled={sheetLoading}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleCriarModalidadeInline}
                disabled={sheetLoading || !novaModalidade.nome.trim()}
                className="gap-2"
              >
                {sheetLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <span>Cadastrar e Selecionar</span>
                )}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </form>
  );
}
