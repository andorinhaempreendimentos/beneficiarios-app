"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ClipboardList,
  Plus,
  Search,
  ExternalLink,
  Copy,
  BarChart3,
  QrCode,
  Settings,
  Trash2,
  Check,
  Star,
  ShieldCheck,
  Users,
  TrendingUp,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  Layers,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  salvarPesquisa,
  excluirPesquisa,
  salvarPerguntaPesquisa,
  excluirPerguntaPesquisa,
  salvarCategoriaCampo,
  excluirCategoriaCampo,
  getPesquisaAnalitica,
  getPerguntasECategoriasPesquisa,
  type PesquisaResumoItem,
  type PesquisaAnaliticaData,
} from "@/lib/actions/pesquisas";
import type { TipoPerguntaPesquisa } from "@/lib/validations/fase-9";

interface PesquisasClientProps {
  initialPesquisas: PesquisaResumoItem[];
  objeto: {
    id: string;
    nome: string;
    termo_beneficiario: string;
    termo_local: string;
    termo_grupo: string;
  } | null;
  auxiliares: {
    locais: Array<{ id: string; nome: string }>;
    grupos: Array<{ id: string; nome: string; local_id: string }>;
    totalAlunos: number;
  };
}

export function PesquisasClient({
  initialPesquisas,
  objeto,
  auxiliares,
}: PesquisasClientProps) {
  const [pesquisas, setPesquisas] = useState<PesquisaResumoItem[]>(initialPesquisas);
  const [busca, setBusca] = useState<string>("");
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  // Estados de Modais
  const [modalPesquisaAberto, setModalPesquisaAberto] = useState<boolean>(false);
  const [pesquisaEdicao, setPesquisaEdicao] = useState<Partial<PesquisaResumoItem> | null>(null);

  const [modalConstrutorAberto, setModalConstrutorAberto] = useState<boolean>(false);
  const [pesquisaConstrutor, setPesquisaConstrutor] = useState<PesquisaResumoItem | null>(null);
  const [perguntasConstrutor, setPerguntasConstrutor] = useState<any[]>([]);
  const [categoriasConstrutor, setCategoriasConstrutor] = useState<any[]>([]);
  const [carregandoConstrutor, setCarregandoConstrutor] = useState<boolean>(false);

  // Formulário de Nova Pergunta
  const [novaPerguntaTexto, setNovaPerguntaTexto] = useState("");
  const [novaPerguntaTipo, setNovaPerguntaTipo] = useState<TipoPerguntaPesquisa>("escala");
  const [novaPerguntaCategoriaId, setNovaPerguntaCategoriaId] = useState<string>("");
  const [novaPerguntaOpcoes, setNovaPerguntaOpcoes] = useState<string>("");
  const [novaPerguntaObrigatoria, setNovaPerguntaObrigatoria] = useState<boolean>(true);

  // Formulário de Nova Categoria
  const [novaCategoriaNome, setNovaCategoriaNome] = useState("");

  // Modal Analítico
  const [modalAnaliticoAberto, setModalAnaliticoAberto] = useState<boolean>(false);
  const [dadosAnaliticos, setDadosAnaliticos] = useState<PesquisaAnaliticaData | null>(null);
  const [carregandoAnalitico, setCarregandoAnalitico] = useState<boolean>(false);

  // Modal QR Code
  const [modalQrAberto, setModalQrAberto] = useState<boolean>(false);
  const [pesquisaQr, setPesquisaQr] = useState<PesquisaResumoItem | null>(null);

  // Loading geral
  const [salvando, setSalvando] = useState<boolean>(false);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);

  if (!objeto) {
    return (
      <Card className="p-8 text-center">
        <CardTitle className="text-lg">Nenhum projeto social ativo encontrado</CardTitle>
        <CardDescription className="mt-2">
          Cadastre ou selecione um projeto social para gerenciar pesquisas de satisfação e avaliação de impacto.
        </CardDescription>
      </Card>
    );
  }

  // KPIs
  const totalPesquisas = pesquisas.length;
  const totalRespostas = pesquisas.reduce((acc, p) => acc + p.total_respostas, 0);
  const pesquisasComNota = pesquisas.filter((p) => p.satisfacao_media > 0);
  const mediaGeralSatisfacao =
    pesquisasComNota.length > 0
      ? Number((pesquisasComNota.reduce((acc, p) => acc + p.satisfacao_media, 0) / pesquisasComNota.length).toFixed(1))
      : 0;

  const taxaAdesaoGeral =
    auxiliares.totalAlunos > 0
      ? Number(((totalRespostas / auxiliares.totalAlunos) * 100).toFixed(1))
      : 0;

  // Filtragem
  const pesquisasFiltradas = pesquisas.filter((p) => {
    const termo = busca.toLowerCase();
    const tituloMatch = p.titulo.toLowerCase().includes(termo);
    const localMatch = p.local_nome?.toLowerCase().includes(termo);
    return tituloMatch || localMatch;
  });

  const handleCopiarLink = (token: string, id: string) => {
    const url = `${window.location.origin}/r/${token}`;
    navigator.clipboard.writeText(url);
    setCopiadoId(id);
    setTimeout(() => setCopiadoId(null), 2500);
  };

  // Abrir Modal de Criação / Edição de Pesquisa
  const abrirModalPesquisa = (pesquisa?: PesquisaResumoItem) => {
    setMensagemErro(null);
    if (pesquisa) {
      setPesquisaEdicao(pesquisa);
    } else {
      setPesquisaEdicao({
        objeto_id: objeto.id,
        titulo: "",
        descricao: "",
        local_id: null,
        grupo_id: null,
        publicada: true,
        exigir_cpf: false,
      });
    }
    setModalPesquisaAberto(true);
  };

  const handleSalvarPesquisa = async () => {
    if (!pesquisaEdicao || !pesquisaEdicao.titulo) {
      setMensagemErro("O título da pesquisa é obrigatório.");
      return;
    }
    setSalvando(true);
    setMensagemErro(null);

    try {
      const res = await salvarPesquisa({
        id: pesquisaEdicao.id,
        objeto_id: objeto.id,
        titulo: pesquisaEdicao.titulo,
        descricao: pesquisaEdicao.descricao || null,
        local_id: pesquisaEdicao.local_id || null,
        grupo_id: pesquisaEdicao.grupo_id || null,
        publicada: Boolean(pesquisaEdicao.publicada),
        exigir_cpf: Boolean(pesquisaEdicao.exigir_cpf),
      });

      if (!res.success) {
        setMensagemErro(res.error || "Erro ao salvar pesquisa.");
      } else {
        setModalPesquisaAberto(false);
        window.location.reload();
      }
    } catch (e: any) {
      setMensagemErro(e.message || "Erro inesperado.");
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluirPesquisa = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta pesquisa e todas as suas perguntas e respostas associadas?")) {
      return;
    }
    try {
      await excluirPesquisa(id);
      setPesquisas((prev) => prev.filter((p) => p.id !== id));
    } catch (e: any) {
      alert("Erro ao excluir: " + e.message);
    }
  };

  // Abrir Construtor de Perguntas & Categorias
  const abrirConstrutor = async (p: PesquisaResumoItem) => {
    setPesquisaConstrutor(p);
    setCarregandoConstrutor(true);
    setModalConstrutorAberto(true);
    setMensagemErro(null);

    try {
      const dados = await getPerguntasECategoriasPesquisa(p.id);
      setCategoriasConstrutor(dados.categorias);
      setPerguntasConstrutor(dados.perguntas);
    } catch (e: any) {
      setMensagemErro("Erro ao carregar perguntas: " + e.message);
    } finally {
      setCarregandoConstrutor(false);
    }
  };

  const handleAdicionarPergunta = async () => {
    if (!pesquisaConstrutor || !novaPerguntaTexto.trim()) return;
    setSalvando(true);

    try {
      const opcoesArray =
        novaPerguntaTipo === "multipla_escolha"
          ? novaPerguntaOpcoes
              .split("\n")
              .map((o) => o.trim())
              .filter(Boolean)
          : [];

      const res = await salvarPerguntaPesquisa({
        pesquisa_id: pesquisaConstrutor.id,
        texto: novaPerguntaTexto.trim(),
        tipo: novaPerguntaTipo,
        categoria_id: novaPerguntaCategoriaId || null,
        opcoes: opcoesArray,
        obrigatoria: novaPerguntaObrigatoria,
        ordem: perguntasConstrutor.length + 1,
      });

      if (res.success && res.id) {
        setPerguntasConstrutor((prev) => [
          ...prev,
          {
            id: res.id,
            pesquisa_id: pesquisaConstrutor.id,
            texto: novaPerguntaTexto.trim(),
            tipo: novaPerguntaTipo,
            categoria_id: novaPerguntaCategoriaId || null,
            opcoes: opcoesArray,
            obrigatoria: novaPerguntaObrigatoria,
            ordem: prev.length + 1,
          },
        ]);
        setNovaPerguntaTexto("");
        setNovaPerguntaOpcoes("");
      }
    } catch (e: any) {
      alert("Erro ao salvar pergunta: " + e.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluirPergunta = async (id: string) => {
    try {
      await excluirPerguntaPesquisa(id);
      setPerguntasConstrutor((prev) => prev.filter((p) => p.id !== id));
    } catch (e: any) {
      alert("Erro ao excluir pergunta: " + e.message);
    }
  };

  const handleAdicionarCategoria = async () => {
    if (!pesquisaConstrutor || !novaCategoriaNome.trim()) return;
    setSalvando(true);

    try {
      const res = await salvarCategoriaCampo({
        pesquisa_id: pesquisaConstrutor.id,
        nome: novaCategoriaNome.trim(),
        ordem: categoriasConstrutor.length + 1,
      });

      if (res.success && res.id) {
        setCategoriasConstrutor((prev) => [
          ...prev,
          { id: res.id, pesquisa_id: pesquisaConstrutor.id, nome: novaCategoriaNome.trim(), ordem: prev.length + 1 },
        ]);
        setNovaCategoriaNome("");
      }
    } catch (e: any) {
      alert("Erro ao criar categoria: " + e.message);
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluirCategoria = async (id: string) => {
    try {
      await excluirCategoriaCampo(id);
      setCategoriasConstrutor((prev) => prev.filter((c) => c.id !== id));
    } catch (e: any) {
      alert("Erro ao excluir categoria: " + e.message);
    }
  };

  // Abrir Modal Analítico
  const abrirModalAnalitico = async (id: string) => {
    setCarregandoAnalitico(true);
    setModalAnaliticoAberto(true);

    try {
      const dados = await getPesquisaAnalitica(id);
      setDadosAnaliticos(dados);
    } catch (e: any) {
      alert("Erro ao carregar dados analíticos: " + e.message);
    } finally {
      setCarregandoAnalitico(false);
    }
  };

  // Exportar CSV
  const handleExportarCsv = () => {
    if (!dadosAnaliticos) return;

    const cabecalho = ["Data/Hora", "Dispositivo", "Beneficiario"];
    for (const p of dadosAnaliticos.perguntas) {
      cabecalho.push(`"${p.texto.replace(/"/g, '""')}"`);
    }

    const linhas = dadosAnaliticos.respostas_recentes.map((r) => {
      const colunas = [
        new Date(r.criado_em).toLocaleString("pt-BR"),
        r.device_fingerprint || "N/A",
        `"${(r.beneficiario_nome || "Anônimo").replace(/"/g, '""')}"`,
      ];
      for (const p of dadosAnaliticos.perguntas) {
        const val = r.itens[p.id];
        if (Array.isArray(val)) {
          colunas.push(`"${val.join("; ").replace(/"/g, '""')}"`);
        } else if (val !== undefined && val !== null) {
          colunas.push(`"${String(val).replace(/"/g, '""')}"`);
        } else {
          colunas.push('""');
        }
      }
      return colunas.join(",");
    });

    const csvContent = "\uFEFF" + [cabecalho.join(","), ...linhas].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `pesquisa_${dadosAnaliticos.pesquisa.titulo.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Mini-Dashboard de Topo: 4 KPIs (§3.14 item 4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase text-slate-500">Campanhas Ativas</CardTitle>
            <ClipboardList className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPesquisas}</div>
            <p className="text-xs text-slate-500 mt-1">
              {pesquisas.filter((p) => p.publicada).length} publicadas no ar
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase text-slate-500">Respostas Computadas</CardTitle>
            <Users className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRespostas}</div>
            <p className="text-xs text-slate-500 mt-1">Avaliações válidas com fé pública</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase text-slate-500">Satisfação Média</CardTitle>
            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1.5">
              <span>{mediaGeralSatisfacao > 0 ? mediaGeralSatisfacao : "—"}</span>
              {mediaGeralSatisfacao > 0 && <span className="text-xs font-normal text-slate-500">/ 5.0</span>}
            </div>
            <p className="text-xs text-slate-500 mt-1">Média ponderada do projeto</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase text-slate-500">Taxa de Adesão</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taxaAdesaoGeral}%</div>
            <p className="text-xs text-slate-500 mt-1">{auxiliares.totalAlunos} alunos matriculados</p>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Filtros e Ações */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder={`Buscar por título ou ${objeto.termo_local.toLowerCase()}...`}
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => abrirModalPesquisa()} className="gap-1.5 h-9">
            <Plus className="h-4 w-4" />
            <span>Nova Pesquisa</span>
          </Button>
        </div>
      </div>

      {/* Lista de Pesquisas */}
      {pesquisasFiltradas.length === 0 ? (
        <Card className="p-8 text-center border-dashed">
          <CardDescription>Nenhuma pesquisa de satisfação encontrada para os filtros aplicados.</CardDescription>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pesquisasFiltradas.map((p) => {
            const urlPublica = typeof window !== "undefined" ? `${window.location.origin}/r/${p.token}` : `/r/${p.token}`;

            return (
              <Card key={p.id} className="shadow-sm border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge variant={p.publicada ? "default" : "secondary"} className="text-xs">
                      {p.publicada ? "Publicada" : "Rascunho"}
                    </Badge>
                    {p.exigir_cpf && (
                      <Badge variant="outline" className="text-xs text-primary border-primary/30">
                        Exige CPF
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg font-bold leading-tight line-clamp-1">{p.titulo}</CardTitle>
                  <CardDescription className="text-xs line-clamp-2 mt-1">
                    {p.descricao || "Sem descrição informada."}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3 pb-3 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center justify-between py-1 border-t border-slate-100 dark:border-slate-800">
                    <span>{objeto.termo_local}:</span>
                    <span className="font-medium text-slate-900 dark:text-slate-200">
                      {p.local_nome || `Todos os ${objeto.termo_local}s`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-t border-slate-100 dark:border-slate-800">
                    <span>Perguntas / Respostas:</span>
                    <span className="font-medium text-slate-900 dark:text-slate-200">
                      {p.total_perguntas} pergs. • {p.total_respostas} resps.
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-t border-slate-100 dark:border-slate-800">
                    <span>Satisfação Média:</span>
                    <div className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{p.satisfacao_media > 0 ? `${p.satisfacao_media} / 5.0` : "Sem notas"}</span>
                    </div>
                  </div>
                </CardContent>

                <div className="p-3 pt-0 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 mt-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs h-8 gap-1.5"
                    onClick={() => handleCopiarLink(p.token, p.id)}
                  >
                    {copiadoId === p.id ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copiar Link</span>
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs h-8 gap-1.5"
                    onClick={() => {
                      setPesquisaQr(p);
                      setModalQrAberto(true);
                    }}
                  >
                    <QrCode className="h-3.5 w-3.5 text-primary" />
                    <span>QR Code</span>
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full text-xs h-8 gap-1.5"
                    onClick={() => abrirConstrutor(p)}
                  >
                    <Settings className="h-3.5 w-3.5" />
                    <span>Perguntas</span>
                  </Button>

                  <Button
                    variant="default"
                    size="sm"
                    className="w-full text-xs h-8 gap-1.5"
                    onClick={() => abrirModalAnalitico(p.id)}
                  >
                    <BarChart3 className="h-3.5 w-3.5" />
                    <span>Resultados</span>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Criação / Edição de Pesquisa */}
      <Dialog open={modalPesquisaAberto} onOpenChange={setModalPesquisaAberto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{pesquisaEdicao?.id ? "Editar Pesquisa" : "Nova Campanha de Pesquisa"}</DialogTitle>
            <DialogDescription>
              Configure o escopo de coleta e as regras de segurança cadastral.
            </DialogDescription>
          </DialogHeader>

          {mensagemErro && (
            <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {mensagemErro}
            </div>
          )}

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs">Título da Pesquisa *</Label>
              <Input
                placeholder="Ex: Avaliação de Satisfação Semestral 2026"
                value={pesquisaEdicao?.titulo || ""}
                onChange={(e) => setPesquisaEdicao((prev) => ({ ...prev, titulo: e.target.value }))}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs">Descrição / Instruções aos Alunos</Label>
              <Textarea
                placeholder="Instruções amigáveis exibidas no cabeçalho..."
                value={pesquisaEdicao?.descricao || ""}
                onChange={(e) => setPesquisaEdicao((prev) => ({ ...prev, descricao: e.target.value }))}
                rows={2}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{objeto.termo_local} Específico</Label>
                <Select
                  value={pesquisaEdicao?.local_id || "todos"}
                  onValueChange={(val) =>
                    setPesquisaEdicao((prev) => ({ ...prev, local_id: val === "todos" ? null : val }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={`Todos os ${objeto.termo_local}s`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos ({objeto.termo_local}s)</SelectItem>
                    {auxiliares.locais.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">{objeto.termo_grupo} Específica</Label>
                <Select
                  value={pesquisaEdicao?.grupo_id || "todas"}
                  onValueChange={(val) =>
                    setPesquisaEdicao((prev) => ({ ...prev, grupo_id: val === "todas" ? null : val }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={`Todas as ${objeto.termo_grupo}s`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas ({objeto.termo_grupo}s)</SelectItem>
                    {auxiliares.grupos.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-2 border-t space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(pesquisaEdicao?.publicada)}
                  onChange={(e) => setPesquisaEdicao((prev) => ({ ...prev, publicada: e.target.checked }))}
                  className="rounded text-primary focus:ring-primary w-4 h-4"
                />
                <div className="text-xs">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Publicar Pesquisa</p>
                  <p className="text-slate-500">Permitir que usuários acessem e respondam via link público</p>
                </div>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(pesquisaEdicao?.exigir_cpf)}
                  onChange={(e) => setPesquisaEdicao((prev) => ({ ...prev, exigir_cpf: e.target.checked }))}
                  className="rounded text-primary focus:ring-primary w-4 h-4"
                />
                <div className="text-xs">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Exigir CPF do {objeto.termo_beneficiario}</p>
                  <p className="text-slate-500">Valida cadastro prévio e restringe a 1 voto nominal por participante</p>
                </div>
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalPesquisaAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvarPesquisa} disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar Campanha"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: Construtor de Perguntas & Categorias (§3.14 item 1) */}
      <Dialog open={modalConstrutorAberto} onOpenChange={setModalConstrutorAberto}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Construtor do Questionário — {pesquisaConstrutor?.titulo}</DialogTitle>
            <DialogDescription>
              Organize os eixos analíticos e cadastre perguntas com suporte a 1-5 estrelas e regras condicionais.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="perguntas" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="perguntas">Perguntas ({perguntasConstrutor.length})</TabsTrigger>
              <TabsTrigger value="categorias">Eixos Analíticos ({categoriasConstrutor.length})</TabsTrigger>
            </TabsList>

            {/* ABA 1: Perguntas */}
            <TabsContent value="perguntas" className="space-y-4 pt-3">
              {/* Formulário de Adicionar Pergunta */}
              <Card className="p-4 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase text-slate-500">Nova Pergunta</h4>
                  <div>
                    <Label className="text-xs">Enunciado da Pergunta *</Label>
                    <Input
                      placeholder="Ex: Como você avalia as instalações e materiais do polo?"
                      value={novaPerguntaTexto}
                      onChange={(e) => setNovaPerguntaTexto(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Tipo de Resposta</Label>
                      <Select
                        value={novaPerguntaTipo}
                        onValueChange={(val) => {
                          if (val) setNovaPerguntaTipo(val as TipoPerguntaPesquisa);
                        }}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="escala">Escala (1 a 5 Estrelas)</SelectItem>
                          <SelectItem value="multipla_escolha">Múltipla Escolha</SelectItem>
                          <SelectItem value="texto_curto">Texto Curto</SelectItem>
                          <SelectItem value="texto_longo">Texto Longo / Parecer</SelectItem>
                          <SelectItem value="numerico">Numérico</SelectItem>
                          <SelectItem value="contato">Telefone / WhatsApp</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs">Eixo Analítico (Categoria)</Label>
                      <Select
                        value={novaPerguntaCategoriaId || "nenhuma"}
                        onValueChange={(val) => setNovaPerguntaCategoriaId(!val || val === "nenhuma" ? "" : val)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Sem categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nenhuma">Geral (Sem categoria)</SelectItem>
                          {categoriasConstrutor.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {novaPerguntaTipo === "multipla_escolha" && (
                    <div>
                      <Label className="text-xs">Opções de Resposta (uma por linha)</Label>
                      <Textarea
                        placeholder="Opção 1&#10;Opção 2&#10;Opção 3"
                        value={novaPerguntaOpcoes}
                        onChange={(e) => setNovaPerguntaOpcoes(e.target.value)}
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={novaPerguntaObrigatoria}
                        onChange={(e) => setNovaPerguntaObrigatoria(e.target.checked)}
                        className="rounded text-primary focus:ring-primary w-4 h-4"
                      />
                      <span>Preenchimento Obrigatório</span>
                    </label>

                    <Button size="sm" onClick={handleAdicionarPergunta} disabled={salvando}>
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      <span>Adicionar Pergunta</span>
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Lista de Perguntas Existentes */}
              <div className="space-y-2">
                {perguntasConstrutor.length === 0 ? (
                  <p className="text-center py-6 text-xs text-slate-500">Nenhuma pergunta cadastrada ainda.</p>
                ) : (
                  perguntasConstrutor.map((p, idx) => {
                    const cat = categoriasConstrutor.find((c) => c.id === p.categoria_id);
                    return (
                      <div
                        key={p.id}
                        className="p-3 rounded-lg border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-400">#{idx + 1}</span>
                            <Badge variant="outline" className="text-[10px]">
                              {p.tipo === "escala" ? "1-5 Estrelas" : p.tipo}
                            </Badge>
                            {cat && (
                              <Badge variant="secondary" className="text-[10px]">
                                {cat.nome}
                              </Badge>
                            )}
                            {p.obrigatoria && <span className="text-rose-500 font-bold">*</span>}
                          </div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{p.texto}</p>
                          {p.opcoes && p.opcoes.length > 0 && (
                            <p className="text-slate-500">Opções: {p.opcoes.join(" • ")}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-rose-500 hover:text-rose-700 shrink-0"
                          onClick={() => handleExcluirPergunta(p.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </TabsContent>

            {/* ABA 2: Categorias */}
            <TabsContent value="categorias" className="space-y-4 pt-3">
              <Card className="p-4 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Label className="text-xs">Nome do Eixo Analítico</Label>
                    <Input
                      placeholder="Ex: Infraestrutura, Qualidade Pedagógica, Atendimento"
                      value={novaCategoriaNome}
                      onChange={(e) => setNovaCategoriaNome(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <Button size="sm" onClick={handleAdicionarCategoria} disabled={salvando}>
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    <span>Adicionar</span>
                  </Button>
                </div>
              </Card>

              <div className="space-y-2">
                {categoriasConstrutor.length === 0 ? (
                  <p className="text-center py-6 text-xs text-slate-500">Nenhum eixo analítico cadastrado.</p>
                ) : (
                  categoriasConstrutor.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 rounded-lg border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{c.nome}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-rose-500 hover:text-rose-700"
                        onClick={() => handleExcluirCategoria(c.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button onClick={() => setModalConstrutorAberto(false)}>Concluir Edição</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: Inteligência Analítica & Resultados (§3.14 item 4) */}
      <Dialog open={modalAnaliticoAberto} onOpenChange={setModalAnaliticoAberto}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <DialogTitle>Inteligência Analítica — {dadosAnaliticos?.pesquisa.titulo}</DialogTitle>
                <DialogDescription>
                  Cruzamento multidimensional e extrato probatório de satisfação social perante o Concedente.
                </DialogDescription>
              </div>
              <Button size="sm" variant="outline" className="gap-1.5 shrink-0" onClick={handleExportarCsv}>
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Exportar CSV</span>
              </Button>
            </div>
          </DialogHeader>

          {carregandoAnalitico || !dadosAnaliticos ? (
            <div className="py-12 text-center text-xs text-slate-500">Carregando métricas da pesquisa...</div>
          ) : (
            <div className="space-y-6 py-2">
              {/* KPIs da Pesquisa */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Card className="p-3 text-center bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-slate-500">Respostas Totais</span>
                  <div className="text-xl font-bold mt-0.5">{dadosAnaliticos.pesquisa.total_respostas}</div>
                </Card>
                <Card className="p-3 text-center bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-slate-500">Média Geral (Estrelas)</span>
                  <div className="text-xl font-bold text-amber-500 mt-0.5">
                    {dadosAnaliticos.pesquisa.satisfacao_media > 0
                      ? `${dadosAnaliticos.pesquisa.satisfacao_media} / 5.0`
                      : "—"}
                  </div>
                </Card>
                <Card className="p-3 text-center bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase text-slate-500">Total de Perguntas</span>
                  <div className="text-xl font-bold mt-0.5">{dadosAnaliticos.pesquisa.total_perguntas}</div>
                </Card>
              </div>

              {/* Médias por Categoria Analítica */}
              {dadosAnaliticos.categorias.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Satisfação por Eixo Analítico
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {dadosAnaliticos.categorias.map((c) => (
                      <div
                        key={c.id}
                        className="p-3 rounded-lg border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex items-center justify-between"
                      >
                        <span className="text-xs font-medium text-slate-800 dark:text-slate-200">{c.nome}</span>
                        <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          <span>{c.media_satisfacao > 0 ? `${c.media_satisfacao} / 5.0` : "—"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Análise Pergunta a Pergunta */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Desempenho por Pergunta
                </h4>
                <div className="space-y-3">
                  {dadosAnaliticos.perguntas.map((perg) => (
                    <div
                      key={perg.id}
                      className="p-3 rounded-lg border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{perg.texto}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {perg.total_respostas} respostas
                        </Badge>
                      </div>

                      {perg.tipo === "escala" && perg.media_nota !== undefined && (
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-slate-500">Nota Média:</span>
                          <span className="font-bold text-amber-600">{perg.media_nota} de 5 estrelas</span>
                          <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden max-w-[200px]">
                            <div
                              className="bg-amber-500 h-full rounded-full"
                              style={{ width: `${(perg.media_nota / 5) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {perg.tipo === "multipla_escolha" && perg.distribuicao_opcoes && (
                        <div className="space-y-1.5 pt-1">
                          {Object.entries(perg.distribuicao_opcoes).map(([op, qtd]) => {
                            const pct =
                              perg.total_respostas > 0 ? Math.round((qtd / perg.total_respostas) * 100) : 0;
                            return (
                              <div key={op} className="flex items-center justify-between text-[11px]">
                                <span className="text-slate-600 dark:text-slate-300">{op}</span>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-slate-900 dark:text-slate-100">
                                    {qtd} ({pct}%)
                                  </span>
                                  <div className="w-16 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-primary h-full rounded-full" style={{ width: `${pct}%` }} />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tabela de Respostas Recentes */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Amostra das Últimas Respostas (Auditoria)
                </h4>
                <div className="border rounded-lg overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-b">
                      <tr>
                        <th className="p-2.5 font-medium">Data/Hora</th>
                        <th className="p-2.5 font-medium">{objeto.termo_beneficiario}</th>
                        <th className="p-2.5 font-medium">Dispositivo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {dadosAnaliticos.respostas_recentes.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="p-4 text-center text-slate-400">
                            Nenhuma submissão registrada.
                          </td>
                        </tr>
                      ) : (
                        dadosAnaliticos.respostas_recentes.map((r) => (
                          <tr key={r.id}>
                            <td className="p-2.5 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                              {new Date(r.criado_em).toLocaleString("pt-BR")}
                            </td>
                            <td className="p-2.5 font-medium text-slate-900 dark:text-slate-100">
                              {r.beneficiario_nome || "Participante Anônimo"}
                            </td>
                            <td className="p-2.5 font-mono text-[10px] text-slate-400">
                              {r.device_fingerprint ? r.device_fingerprint.slice(0, 18) + "..." : "N/A"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setModalAnaliticoAberto(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 4: QR Code Impresso para o Polo (§3.14 item 3) */}
      <Dialog open={modalQrAberto} onOpenChange={setModalQrAberto}>
        <DialogContent className="max-w-md text-center">
          <DialogHeader>
            <DialogTitle>Cartaz de Avaliação — QR Code</DialogTitle>
            <DialogDescription>
              Imprima este cartaz para afixar no {objeto.termo_local.toLowerCase()} e permitir que alunos e familiares
              avaliem pelo celular.
            </DialogDescription>
          </DialogHeader>

          {pesquisaQr && (
            <div className="py-4 space-y-4">
              <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 max-w-[280px] mx-auto">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
                    typeof window !== "undefined"
                      ? `${window.location.origin}/r/${pesquisaQr.token}`
                      : `https://beneficiarios-app.vercel.app/r/${pesquisaQr.token}`
                  )}`}
                  alt="QR Code da Pesquisa"
                  className="w-full h-auto mx-auto rounded-lg"
                />
                <p className="mt-3 text-xs font-bold text-slate-800 dark:text-slate-200">
                  {pesquisaQr.titulo}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Aponte a câmera do seu celular para responder
                </p>
              </div>

              <div className="text-xs text-slate-500 font-mono break-all px-4">
                {typeof window !== "undefined"
                  ? `${window.location.origin}/r/${pesquisaQr.token}`
                  : `/r/${pesquisaQr.token}`}
              </div>
            </div>
          )}

          <DialogFooter className="flex sm:justify-between gap-2">
            <Button variant="outline" onClick={() => setModalQrAberto(false)}>
              Fechar
            </Button>
            <Button
              className="gap-1.5"
              onClick={() => {
                window.print();
              }}
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Cartaz</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
