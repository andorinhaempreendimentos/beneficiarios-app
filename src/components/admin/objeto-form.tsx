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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertCircle,
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
  Sparkles,
  Trash2,
} from "lucide-react";

import type { Database } from "@/lib/database.types";
import type { TipoApuracaoMeta } from "@/lib/validations/fase-8";

export interface FormMetaItem {
  id?: string;
  numero_meta: number;
  descricao: string;
  tipo_apuracao: TipoApuracaoMeta;
  quantidade_prevista: number;
  unidade_medida: string;
  fonte_verificacao: string;
}

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
  initialMetas?: FormMetaItem[];
}

export function ObjetoForm({
  initialData,
  modalidades = [],
  initialModalidadeIds = [],
  initialMetas = [],
}: ObjetoFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Estado das Atividades / Modalidades (Seção 3)
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

  // Estado do Quadro de Metas (Seção 4)
  const [metas, setMetas] = useState<FormMetaItem[]>(initialMetas);
  const [metaModalOpen, setMetaModalOpen] = useState(false);
  const [metaFormError, setMetaFormError] = useState<string | null>(null);
  const [novaMeta, setNovaMeta] = useState({
    numero_meta: 1,
    descricao: "",
    tipo_apuracao: "total_beneficiarios" as TipoApuracaoMeta,
    quantidade_prevista: "",
    unidade_medida: "",
    fonte_verificacao: "",
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

  // Vocabulário dinâmico reativo aos inputs da Aba 2
  const tBen = formData.termo_beneficiario || "Aluno";
  const tLoc = formData.termo_local || "Polo";
  const tSess = formData.termo_sessao || "Aula";
  const tGrp = formData.termo_grupo || "Turma";

  const tipoApuracaoOpcoes: {
    valor: TipoApuracaoMeta;
    label: string;
    unidadeSugerida: string;
    fonteSugerida: string;
  }[] = [
    {
      valor: "total_beneficiarios",
      label: `Total de ${tBen}s Atendidos (Apuração Automática)`,
      unidadeSugerida: `${tBen}s`,
      fonteSugerida: `Sistema de Gestão e Matrículas Ativas de ${tBen}s`,
    },
    {
      valor: "sessoes_realizadas",
      label: `Total de ${tSess}s Realizadas (Apuração Automática)`,
      unidadeSugerida: `${tSess}s`,
      fonteSugerida: `Registro Eletrônico de ${tSess}s e Fotos Comprobatórias`,
    },
    {
      valor: "frequencia_media",
      label: `Frequência Média nas ${tSess}s (Apuração Automática)`,
      unidadeSugerida: "%",
      fonteSugerida: `Listas de Chamada Nominal e Frequência Registrada`,
    },
    {
      valor: "total_locais",
      label: `Total de ${tLoc}s Ativos (Apuração Automática)`,
      unidadeSugerida: `${tLoc}s`,
      fonteSugerida: `Cadastro Estrutural de ${tLoc}s de Atendimento`,
    },
    {
      valor: "supervisoes_realizadas",
      label: `Vistorias de Supervisão Homologadas (Apuração Automática)`,
      unidadeSugerida: "Vistorias",
      fonteSugerida: `Relatórios de Supervisão Presencial e Pareceres Finais`,
    },
    {
      valor: "vulnerabilidade_social",
      label: `${tBen}s em Vulnerabilidade Social (Apuração Automática)`,
      unidadeSugerida: "%",
      fonteSugerida: `Critérios de Vulnerabilidade nos Formulários de Inscrição`,
    },
    {
      valor: "manual",
      label: "Ação Declaratória / Comprovação Documental Externa",
      unidadeSugerida: "Ações",
      fonteSugerida: `Relatórios Periódicos, Atas e Documentos Anexados`,
    },
  ];

  function handleOpenNovaMeta() {
    const nextNum = metas.length + 1;
    const defaultOpcao = tipoApuracaoOpcoes[0];
    setNovaMeta({
      numero_meta: nextNum,
      descricao: "",
      tipo_apuracao: defaultOpcao.valor,
      quantidade_prevista: "",
      unidade_medida: defaultOpcao.unidadeSugerida,
      fonte_verificacao: defaultOpcao.fonteSugerida,
    });
    setMetaFormError(null);
    setMetaModalOpen(true);
  }

  function handleTipoApuracaoChange(tipo: TipoApuracaoMeta) {
    const opcao = tipoApuracaoOpcoes.find((o) => o.valor === tipo);
    setNovaMeta((prev) => ({
      ...prev,
      tipo_apuracao: tipo,
      unidade_medida: opcao?.unidadeSugerida || prev.unidade_medida,
      fonte_verificacao: opcao?.fonteSugerida || prev.fonte_verificacao,
    }));
  }

  function handleAdicionarMeta(e: React.FormEvent) {
    e.preventDefault();
    setMetaFormError(null);

    const qtd = Number(novaMeta.quantidade_prevista);
    if (isNaN(qtd) || qtd <= 0) {
      setMetaFormError("A quantidade prevista deve ser um número maior que zero.");
      return;
    }

    if (!novaMeta.descricao.trim()) {
      setMetaFormError("A descrição da meta é obrigatória.");
      return;
    }

    setMetas((prev) => [
      ...prev,
      {
        numero_meta: Number(novaMeta.numero_meta),
        descricao: novaMeta.descricao.trim(),
        tipo_apuracao: novaMeta.tipo_apuracao,
        quantidade_prevista: qtd,
        unidade_medida: novaMeta.unidade_medida.trim() || "Unidades",
        fonte_verificacao: novaMeta.fonte_verificacao.trim() || "Sistema de Gestão",
      },
    ]);

    setMetaModalOpen(false);
  }

  function handleRemoverMeta(index: number) {
    setMetas((prev) => prev.filter((_, idx) => idx !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const payload = {
      ...formData,
      modalidades_ids: selectedModalidadeIds,
      metas: metas,
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

      {/* Seções em Accordion do Formulário de Projeto */}
      <Accordion
        multiple
        defaultValue={["identificacao", "vocabulario", "atividades", "metas", "juridico"]}
        className="space-y-4"
      >
        {/* Seção 1: Identificação & Vigência */}
        <AccordionItem
          value="identificacao"
          className="border border-border/80 rounded-xl bg-card overflow-hidden shadow-xs"
        >
          <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/40 transition-colors">
            <div className="flex items-center gap-3 text-left">
              <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-base text-foreground">
                  1. Identificação & Vigência
                </div>
                <div className="text-xs text-muted-foreground font-normal">
                  Nome do projeto, vigência e formato operacional (contínuo ou pontual)
                </div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6 pt-1">
            <div className="grid gap-4 sm:grid-cols-2 pt-3 border-t border-border/50">
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
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Seção 2: Vocabulário Dinâmico (§4.3) */}
        <AccordionItem
          value="vocabulario"
          className="border border-primary/30 rounded-xl bg-card overflow-hidden shadow-xs"
        >
          <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/40 transition-colors">
            <div className="flex items-center gap-3 text-left">
              <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                <Languages className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-base text-foreground">
                  2. Vocabulário Dinâmico (§4.3)
                </div>
                <div className="text-xs text-muted-foreground font-normal">
                  Personalize a terminologia da interface para este projeto (zero hardcoded)
                </div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6 pt-1">
            <div className="grid gap-4 sm:grid-cols-2 pt-3 border-t border-border/50">
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
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Seção 3: Atividades & Modalidades */}
        <AccordionItem
          value="atividades"
          className="border border-border/80 rounded-xl bg-card overflow-hidden shadow-xs"
        >
          <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/40 transition-colors">
            <div className="flex items-center gap-3 text-left">
              <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-base text-foreground">
                  3. Atividades & Modalidades do Projeto
                </div>
                <div className="text-xs text-muted-foreground font-normal">
                  Práticas esportivas e modalidades autorizadas ({selectedModalidadeIds.length} selecionadas)
                </div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6 pt-1">
            <div className="space-y-4 pt-3 border-t border-border/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  Selecione quais práticas esportivas do catálogo geral serão executadas neste projeto. Novas turmas só poderão ser criadas para as modalidades autorizadas aqui.
                </p>

                <Button
                  type="button"
                  onClick={() => setSheetModalidadeOpen(true)}
                  className="gap-2 shrink-0 self-start sm:self-auto"
                >
                  <Plus className="h-4 w-4" />
                  <span>+ Nova Modalidade</span>
                </Button>
              </div>

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
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Seção 4: Quadro de Metas */}
        <AccordionItem
          value="metas"
          className="border border-border/80 rounded-xl bg-card overflow-hidden shadow-xs"
        >
          <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/40 transition-colors">
            <div className="flex items-center gap-3 text-left">
              <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-base text-foreground">
                  4. Quadro de Metas do Projeto (MROSC)
                </div>
                <div className="text-xs text-muted-foreground font-normal">
                  Metas pactuadas com apuração automática em tempo real ({metas.length} cadastradas)
                </div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6 pt-1">
            <div className="space-y-4 pt-3 border-t border-border/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  Defina as metas quantitativas pactuadas. Os cálculos adaptam-se aos termos {tBen}s, {tSess}s e {tLoc}s definidos no Vocabulário.
                </p>

                <Button
                  type="button"
                  onClick={handleOpenNovaMeta}
                  className="gap-2 shrink-0 self-start sm:self-auto"
                >
                  <Plus className="h-4 w-4" />
                  <span>+ Adicionar Meta</span>
                </Button>
              </div>

              {metas.length === 0 ? (
                <div className="p-8 text-center rounded-lg border border-dashed border-border text-muted-foreground">
                  <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">Nenhuma meta contratual definida ainda.</p>
                  <p className="text-xs mt-1 max-w-md mx-auto">
                    Adicione metas para acompanhar a execução do projeto. Metas automáticas apuram em tempo real
                    o total de {tBen}s matriculados, {tSess}s realizadas ou {tLoc}s ativos.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleOpenNovaMeta}
                    className="mt-4 gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Adicionar Primeira Meta</span>
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">Nº</TableHead>
                        <TableHead>Descrição da Meta</TableHead>
                        <TableHead>Tipo de Apuração</TableHead>
                        <TableHead className="w-[140px] text-right">Meta Prevista</TableHead>
                        <TableHead className="w-[80px] text-right">Ação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {metas.map((m, idx) => {
                        const opcao = tipoApuracaoOpcoes.find((o) => o.valor === m.tipo_apuracao);
                        return (
                          <TableRow key={idx}>
                            <TableCell className="font-bold text-foreground">
                              Meta {m.numero_meta}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium text-foreground">{m.descricao}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                Fonte: {m.fonte_verificacao}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              <span className="inline-flex items-center gap-1.5">
                                {m.tipo_apuracao !== "manual" && (
                                  <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                                )}
                                <span>{opcao?.label || m.tipo_apuracao}</span>
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-bold text-foreground">
                              {m.quantidade_prevista} {m.unidade_medida}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleRemoverMeta(idx)}
                                title="Remover meta"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Seção 5: Metadados Jurídicos e Contratuais */}
        <AccordionItem
          value="juridico"
          className="border border-border/80 rounded-xl bg-card overflow-hidden shadow-xs"
        >
          <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/40 transition-colors">
            <div className="flex items-center gap-3 text-left">
              <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="font-semibold text-base text-foreground">
                  5. Dados Jurídicos & Prestação de Contas
                </div>
                <div className="text-xs text-muted-foreground font-normal">
                  Informações documentais exigidas nos cabeçalhos oficiais de auditoria e MROSC
                </div>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6 pt-1">
            <div className="grid gap-4 sm:grid-cols-2 pt-3 border-t border-border/50">
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
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Barra de Ações e Submissão */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-border mt-8">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancelar
        </Button>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            type="submit"
            variant="secondary"
            disabled={loading}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            <span>Salvar Rascunho</span>
          </Button>

          <Button type="submit" disabled={loading} className="gap-2">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span>{initialData?.id ? "Salvar Alterações" : "Concluir e Criar Projeto Social"}</span>
              </>
            )}
          </Button>
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

      {/* Modal Dialog para Criação de Nova Meta */}
      <Dialog open={metaModalOpen} onOpenChange={setMetaModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <span>Nova Meta Contratual (MROSC)</span>
            </DialogTitle>
            <DialogDescription>
              Defina os parâmetros da meta pactuada. Os tipos de apuração automática calculam os resultados em tempo real baseados nas informações operacionais do sistema.
            </DialogDescription>
          </DialogHeader>

          {metaFormError && (
            <div className="flex items-center gap-2 p-3 rounded-lg text-sm bg-destructive/10 text-destructive border border-destructive/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{metaFormError}</span>
            </div>
          )}

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1 col-span-1">
                <Label htmlFor="meta_num">Nº da Meta *</Label>
                <Input
                  id="meta_num"
                  type="number"
                  min={1}
                  value={novaMeta.numero_meta}
                  onChange={(e) =>
                    setNovaMeta((prev) => ({ ...prev, numero_meta: Number(e.target.value) }))
                  }
                  required
                />
              </div>

              <div className="space-y-1 col-span-2">
                <Label htmlFor="meta_tipo">Tipo de Apuração *</Label>
                <select
                  id="meta_tipo"
                  value={novaMeta.tipo_apuracao}
                  onChange={(e) => handleTipoApuracaoChange(e.target.value as TipoApuracaoMeta)}
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  required
                >
                  {tipoApuracaoOpcoes.map((opcao) => (
                    <option key={opcao.valor} value={opcao.valor}>
                      {opcao.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="meta_desc">Descrição da Meta *</Label>
              <Textarea
                id="meta_desc"
                value={novaMeta.descricao}
                onChange={(e) =>
                  setNovaMeta((prev) => ({ ...prev, descricao: e.target.value }))
                }
                placeholder={`Ex: Atender e manter ativos no mínimo 200 ${tBen.toLowerCase()}s com frequência regular nas atividades...`}
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="meta_qtd">Quantidade Prevista *</Label>
                <Input
                  id="meta_qtd"
                  type="number"
                  min={0.01}
                  step="any"
                  value={novaMeta.quantidade_prevista}
                  onChange={(e) =>
                    setNovaMeta((prev) => ({ ...prev, quantidade_prevista: e.target.value }))
                  }
                  placeholder="Ex: 200"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="meta_unidade">Unidade de Medida *</Label>
                <Input
                  id="meta_unidade"
                  value={novaMeta.unidade_medida}
                  onChange={(e) =>
                    setNovaMeta((prev) => ({ ...prev, unidade_medida: e.target.value }))
                  }
                  placeholder={`Ex: ${tBen}s, ${tSess}s, %`}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="meta_fonte">Fonte de Verificação *</Label>
              <Input
                id="meta_fonte"
                value={novaMeta.fonte_verificacao}
                onChange={(e) =>
                  setNovaMeta((prev) => ({ ...prev, fonte_verificacao: e.target.value }))
                }
                placeholder="Ex: Sistema de Gestão e Listas de Presença"
                required
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setMetaModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleAdicionarMeta}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Adicionar Meta</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}

