"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type LogisticaMateriaisData,
  type ObjetoMaterialItem,
  type RemessaPoloItem,
  type EntregaAlunoItem,
  criarObjetoMaterial,
  registrarRemessaPolo,
} from "@/lib/actions/materiais";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Package,
  Truck,
  Shirt,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Download,
  Printer,
  Camera,
  Layers,
  Sparkles,
  Loader2,
  Building,
  UserCheck,
  Tag,
  Shield,
  Eye,
} from "lucide-react";

interface MateriaisClientProps {
  initialData: LogisticaMateriaisData;
  objetoId: string;
}

export function MateriaisClient({ initialData, objetoId }: MateriaisClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [data] = useState<LogisticaMateriaisData>(initialData);
  const { objeto, indicadores, materiais, remessas, entregas, demandasTamanhos, locais, instrutores } = data;

  const termoLocal = objeto?.termo_local || "Polo";
  const termoInstrutor = objeto?.termo_instrutor || "Professor";
  const termoGrupo = objeto?.termo_grupo || "Turma";
  const termoBeneficiario = objeto?.termo_beneficiario || "Aluno";
  const termoColetivo = objeto?.termo_materiais_coletivos || "Materiais Coletivos";
  const termoIndividual = objeto?.termo_materiais_concedidos || "Uniformes";

  const [abaAtiva, setAbaAtiva] = useState("catalogo");
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [feedback, setFeedback] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);

  // Modal 1: Novo Material no Catálogo
  const [modalMaterialAberto, setModalMaterialAberto] = useState(false);
  const [novoNomeItem, setNovoNomeItem] = useState("");
  const [novoTipo, setNovoTipo] = useState<"coletivo" | "individual">("coletivo");
  const [novoQtdPrevista, setNovoQtdPrevista] = useState(10);
  const [novoQtdAdquirida, setNovoQtdAdquirida] = useState(10);
  const [novoEspecificacoes, setNovoEspecificacoes] = useState("");
  const [novoDestinacao, setNovoDestinacao] = useState("Em quadra / Polo esportivo");

  // Modal 2: Nova Remessa ao Polo
  const [modalRemessaAberto, setModalRemessaAberto] = useState(false);
  const [remessaMaterialId, setRemessaMaterialId] = useState("");
  const [remessaLocalId, setRemessaLocalId] = useState("");
  const [remessaQtd, setRemessaQtd] = useState(5);
  const [remessaData, setRemessaData] = useState(new Date().toISOString().split("T")[0]);
  const [remessaPatrimonio, setRemessaPatrimonio] = useState("");
  const [remessaResponsavelId, setRemessaResponsavelId] = useState("");
  const [remessaObservacoes, setRemessaObservacoes] = useState("");
  const [remessaFotosUrls, setRemessaFotosUrls] = useState<string[]>([]);
  const [remessaFotoInput, setRemessaFotoInput] = useState("");

  // Filtragem do Catálogo
  const materiaisFiltrados = materiais.filter((m) => {
    const matchTipo = filtroTipo === "todos" || m.tipo === filtroTipo;
    const matchBusca =
      !busca.trim() ||
      m.nome_item.toLowerCase().includes(busca.toLowerCase()) ||
      (m.especificacoes && m.especificacoes.toLowerCase().includes(busca.toLowerCase()));
    return matchTipo && matchBusca;
  });

  // Salvar Novo Material
  const handleSalvarMaterial = () => {
    setFeedback(null);
    startTransition(async () => {
      const res = await criarObjetoMaterial({
        objeto_id: objetoId,
        nome_item: novoNomeItem,
        tipo: novoTipo,
        quantidade_prevista: novoQtdPrevista,
        quantidade_adquirida: novoQtdAdquirida,
        especificacoes: novoEspecificacoes,
        destinacao: novoDestinacao,
      });

      if (res.success) {
        setFeedback({ tipo: "sucesso", texto: "Material adicionado ao catálogo com sucesso!" });
        setModalMaterialAberto(false);
        setNovoNomeItem("");
        router.refresh();
      } else {
        setFeedback({ tipo: "erro", texto: res.error || "Erro ao salvar material." });
      }
    });
  };

  // Salvar Nova Remessa ao Polo
  const handleSalvarRemessa = () => {
    setFeedback(null);
    startTransition(async () => {
      const res = await registrarRemessaPolo({
        objeto_material_id: remessaMaterialId,
        local_id: remessaLocalId,
        quantidade_enviada: remessaQtd,
        data_remessa: remessaData,
        codigo_patrimonio: remessaPatrimonio,
        responsavel_recebimento_id: remessaResponsavelId || undefined,
        fotos_urls: remessaFotosUrls,
        observacoes: remessaObservacoes,
      });

      if (res.success) {
        setFeedback({ tipo: "sucesso", texto: "Remessa ao polo registrada com sucesso!" });
        setModalRemessaAberto(false);
        setRemessaFotosUrls([]);
        router.refresh();
      } else {
        setFeedback({ tipo: "erro", texto: res.error || "Erro ao registrar remessa." });
      }
    });
  };

  // Exportar Entregas para CSV
  const handleExportarEntregasCSV = () => {
    const cabecalho = [
      termoBeneficiario,
      "CPF",
      termoGrupo,
      termoLocal,
      "Material / Kit",
      "Tamanho",
      "Data de Entrega",
      termoInstrutor,
      "Status",
    ].join(";");

    const linhas = entregas.map((e) =>
      [
        `"${e.aluno_nome}"`,
        `"${e.aluno_cpf}"`,
        `"${e.turma_nome}"`,
        `"${e.local_nome}"`,
        `"${e.material_nome}"`,
        `"${e.tamanho_entregue || "Padrão"}"`,
        e.data_entrega,
        `"${e.instrutor_nome}"`,
        e.status,
      ].join(";")
    );

    const csvContent = "\uFEFF" + [cabecalho, ...linhas].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `entregas_materiais_anexo_vii_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Topo / Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs uppercase tracking-wider">
              Anexo VII MROSC
            </Badge>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground font-medium">{objeto?.nome}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mt-1 flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            Gestão Logística de Materiais & Uniformes
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Cadeia de suprimentos do objeto (§3.10): materiais coletivos de quadra e kits individuais com fé pública docente.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setModalMaterialAberto(true)}
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Novo Item no Catálogo
          </Button>

          <Button
            onClick={() => setModalRemessaAberto(true)}
            size="sm"
            className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-700"
          >
            <Truck className="h-3.5 w-3.5" />
            Nova Remessa ao {termoLocal}
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

      {/* 4 KPIs de Logística */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Itens em Catálogo */}
        <Card className="shadow-xs border-l-4 border-l-blue-600">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Itens no Catálogo
            </CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{indicadores.totalItensCatalogo}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Coletivos e Individuais cadastrados
            </p>
          </CardContent>
        </Card>

        {/* KPI 2: Unidades Adquiridas */}
        <Card className="shadow-xs border-l-4 border-l-green-600">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Unidades Adquiridas
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{indicadores.totalUnidadesAdquiridas}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total de insumos e peças
            </p>
          </CardContent>
        </Card>

        {/* KPI 3: Remessas aos Polos */}
        <Card className="shadow-xs border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Remessas aos {termoLocal}s
            </CardTitle>
            <Truck className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {indicadores.totalRemessasPolos}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Lotes de patrimônio transferidos
            </p>
          </CardContent>
        </Card>

        {/* KPI 4: Kits Entregues a Alunos */}
        <Card className="shadow-xs border-l-4 border-l-indigo-600">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Kits Entregues a {termoBeneficiario}s
            </CardTitle>
            <Shirt className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">
              {indicadores.totalKitsEntregues}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Entregas nominais confirmadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Abas Funcionais de Logística */}
      <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="w-full space-y-4">
        <TabsList className="grid grid-cols-4 max-w-2xl print:hidden">
          <TabsTrigger value="catalogo" className="text-xs">
            Catálogo ({materiais.length})
          </TabsTrigger>
          <TabsTrigger value="remessas" className="text-xs">
            Remessas aos {termoLocal}s ({remessas.length})
          </TabsTrigger>
          <TabsTrigger value="demandas" className="text-xs">
            Demanda de Tamanhos
          </TabsTrigger>
          <TabsTrigger value="entregas" className="text-xs">
            Entregas Nominais ({entregas.length})
          </TabsTrigger>
        </TabsList>

        {/* ABA 1: CATÁLOGO DO OBJETO */}
        <TabsContent value="catalogo" className="space-y-4">
          <div className="p-4 bg-muted/30 rounded-lg border flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <div className="w-full sm:w-56">
                <select
                  aria-label="Filtrar por Tipo de Material"
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  className="w-full text-xs bg-background border rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="todos">Todos os Tipos</option>
                  <option value="coletivo">{termoColetivo} (Equipamento do Polo)</option>
                  <option value="individual">{termoIndividual} (Kit do Aluno)</option>
                </select>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar material ou especificação..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-8 text-xs h-8 bg-background"
                />
              </div>
            </div>

            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {materiaisFiltrados.length} itens listados
            </span>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Plano de Suprimentos & Materiais do Objeto
              </CardTitle>
              <CardDescription className="text-xs">
                Itens previstos no Plano de Trabalho e adquiridos para a execução da parceria.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {materiaisFiltrados.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-xs italic">
                  Nenhum material cadastrado no catálogo. Clique em &ldquo;Novo Item no Catálogo&rdquo; para começar.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/50 border-b font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Item / Material</th>
                        <th className="py-2.5 px-3">Eixo Universal</th>
                        <th className="py-2.5 px-3 text-center">Previsto</th>
                        <th className="py-2.5 px-3 text-center">Adquirido</th>
                        <th className="py-2.5 px-3 text-center">Remetido / Entregue</th>
                        <th className="py-2.5 px-3">Destinação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {materiaisFiltrados.map((item) => (
                        <tr key={item.id} className="hover:bg-muted/20">
                          <td className="py-2.5 px-3 font-semibold">
                            {item.nome_item}
                            {item.especificacoes && (
                              <span className="block text-[11px] font-normal text-muted-foreground">
                                {item.especificacoes}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            {item.tipo === "coletivo" ? (
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px]">
                                Coletivo (Polo)
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px]">
                                Individual (Aluno)
                              </Badge>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center font-medium">{item.quantidade_prevista}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-green-600">{item.quantidade_adquirida}</td>
                          <td className="py-2.5 px-3 text-center font-semibold">
                            {item.tipo === "coletivo" ? item.total_remetido : item.total_entregue}
                          </td>
                          <td className="py-2.5 px-3 text-muted-foreground">{item.destinacao}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA 2: REMESSAS AOS POLOS (EIXO COLETIVO / TOMBAMENTO) */}
        <TabsContent value="remessas" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">
                    Remessas de Materiais aos {termoLocal}s
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Comprovações de envio, tombamento de patrimônio e fotos do material desembalado no local.
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setModalRemessaAberto(true)}
                  size="sm"
                  className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-700"
                >
                  <Truck className="h-3.5 w-3.5" />
                  Nova Remessa
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {remessas.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-xs italic">
                  Nenhuma remessa registrada até o momento.
                </div>
              ) : (
                <div className="space-y-3">
                  {remessas.map((rem) => (
                    <div
                      key={rem.id}
                      className="p-3.5 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground">{rem.material_nome}</span>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            Qtd: {rem.quantidade_enviada}
                          </Badge>
                          {rem.codigo_patrimonio && (
                            <Badge variant="secondary" className="text-[10px] flex items-center gap-1 font-mono">
                              <Tag className="h-2.5 w-2.5" />
                              Tombamento: {rem.codigo_patrimonio}
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
                          <span>
                            <strong>{termoLocal}:</strong> {rem.local_nome}
                          </span>
                          <span>•</span>
                          <span>
                            <strong>Data:</strong> {new Date(rem.data_remessa + "T00:00:00").toLocaleDateString("pt-BR")}
                          </span>
                          <span>•</span>
                          <span>
                            <strong>Recebido por:</strong> {rem.responsavel_nome}
                          </span>
                        </div>

                        {rem.observacoes && (
                          <p className="text-muted-foreground italic text-[11px] pt-1">
                            &ldquo;{rem.observacoes}&rdquo;
                          </p>
                        )}
                      </div>

                      {rem.fotos_urls.length > 0 && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          {rem.fotos_urls.slice(0, 3).map((url, idx) => (
                            <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                              <div className="h-10 w-10 rounded border bg-background overflow-hidden hover:opacity-80 transition-opacity">
                                <img src={url} alt="Comprovante" className="h-full w-full object-cover" />
                              </div>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA 3: DEMANDA DE UNIFORMES POR POLO (§3.10.B) */}
        <TabsContent value="demandas" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Levantamento Automatizado de Demanda de {termoIndividual}
              </CardTitle>
              <CardDescription className="text-xs">
                Matriz de tamanhos capturada nas matrículas dos alunos para planejamento de compras e montagem de fardos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {demandasTamanhos.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-xs italic">
                  Nenhuma demanda de tamanho capturada nas matrículas.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {demandasTamanhos.map((dem, idx) => (
                    <div key={idx} className="p-3 rounded-lg border bg-muted/20 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{dem.polo_nome}</span>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          Tamanho {dem.tamanho}
                        </Badge>
                      </div>
                      <div className="pt-1 flex items-baseline justify-between border-t">
                        <span className="text-muted-foreground text-[11px]">Demanda de Alunos:</span>
                        <span className="text-lg font-bold text-indigo-600">{dem.quantidade}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA 4: ENTREGAS NOMINAIS (ANEXO VII DO MROSC) */}
        <TabsContent value="entregas" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-semibold">
                    Extrato Nominal de Entregas aos {termoBeneficiario}s (Anexo VII)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Demonstrativo oficial de repasse individual de kits com fé pública soberana do instrutor.
                  </CardDescription>
                </div>
                <Button onClick={handleExportarEntregasCSV} variant="outline" size="sm" className="gap-1.5 text-xs">
                  <Download className="h-3.5 w-3.5" />
                  Exportar Anexo VII (.csv)
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {entregas.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-xs italic">
                  Nenhuma entrega nominal registrada até o momento.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/50 border-b font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">{termoBeneficiario}</th>
                        <th className="py-2.5 px-3">CPF</th>
                        <th className="py-2.5 px-3">{termoGrupo}</th>
                        <th className="py-2.5 px-3">{termoLocal}</th>
                        <th className="py-2.5 px-3">Kit / Material</th>
                        <th className="py-2.5 px-3 text-center">Tamanho</th>
                        <th className="py-2.5 px-3">Data</th>
                        <th className="py-2.5 px-3">{termoInstrutor}</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {entregas.map((e) => (
                        <tr key={e.id} className="hover:bg-muted/20">
                          <td className="py-2.5 px-3 font-semibold whitespace-nowrap">{e.aluno_nome}</td>
                          <td className="py-2.5 px-3 whitespace-nowrap font-mono text-muted-foreground">{e.aluno_cpf}</td>
                          <td className="py-2.5 px-3 whitespace-nowrap">{e.turma_nome}</td>
                          <td className="py-2.5 px-3 whitespace-nowrap">{e.local_nome}</td>
                          <td className="py-2.5 px-3 whitespace-nowrap font-medium">{e.material_nome}</td>
                          <td className="py-2.5 px-3 text-center font-bold">{e.tamanho_entregue || "-"}</td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {new Date(e.data_entrega + "T00:00:00").toLocaleDateString("pt-BR")}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">{e.instrutor_nome}</td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px]">
                              Entregue
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal 1: Adicionar Item ao Catálogo */}
      <Dialog open={modalMaterialAberto} onOpenChange={setModalMaterialAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <Plus className="h-5 w-5" />
              Adicionar Material ao Plano de Trabalho
            </DialogTitle>
            <DialogDescription className="text-xs pt-1">
              Cadastre itens de uso coletivo (patrimônio do polo) ou individual (kits dos alunos).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs">Nome do Item / Material:</Label>
              <Input
                placeholder="Ex: Bolas de Futebol nº 5, Uniforme Completo, Cones de Treino..."
                value={novoNomeItem}
                onChange={(e) => setNovoNomeItem(e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Eixo Universal:</Label>
                <select
                  aria-label="Eixo Universal do Material"
                  value={novoTipo}
                  onChange={(e) => setNovoTipo(e.target.value as any)}
                  className="w-full text-xs bg-background border rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="coletivo">{termoColetivo} (Polo)</option>
                  <option value="individual">{termoIndividual} (Aluno)</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Destinação:</Label>
                <Input
                  value={novoDestinacao}
                  onChange={(e) => setNovoDestinacao(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Qtd. Prevista no Plano:</Label>
                <Input
                  type="number"
                  value={novoQtdPrevista}
                  onChange={(e) => setNovoQtdPrevista(Number(e.target.value))}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Qtd. Efetivamente Adquirida:</Label>
                <Input
                  type="number"
                  value={novoQtdAdquirida}
                  onChange={(e) => setNovoQtdAdquirida(Number(e.target.value))}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Especificações Técnicas / Marca / Modelo:</Label>
              <Textarea
                placeholder="Ex: Tamanho oficial, peso 410-450g, costurada à mão, marca Penalty..."
                value={novoEspecificacoes}
                onChange={(e) => setNovoEspecificacoes(e.target.value)}
                rows={2}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setModalMaterialAberto(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSalvarMaterial}
              disabled={isPending || novoNomeItem.trim().length < 2}
              className="bg-primary hover:bg-primary/90"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Salvar no Catálogo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 2: Registrar Remessa ao Polo */}
      <Dialog open={modalRemessaAberto} onOpenChange={setModalRemessaAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600">
              <Truck className="h-5 w-5" />
              Registrar Remessa ao {termoLocal}
            </DialogTitle>
            <DialogDescription className="text-xs pt-1">
              Transferência de material coletivo para guarda do instrutor no polo.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Material a Enviar:</Label>
                <select
                  aria-label="Selecionar Material a Enviar"
                  value={remessaMaterialId}
                  onChange={(e) => setRemessaMaterialId(e.target.value)}
                  className="w-full text-xs bg-background border rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Selecione o item...</option>
                  {materiais.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nome_item} ({m.tipo === "coletivo" ? "Coletivo" : "Individual"})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">{termoLocal} de Destino:</Label>
                <select
                  aria-label={`Selecionar ${termoLocal} de Destino`}
                  value={remessaLocalId}
                  onChange={(e) => setRemessaLocalId(e.target.value)}
                  className="w-full text-xs bg-background border rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Selecione o polo...</option>
                  {locais.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Quantidade Enviada:</Label>
                <Input
                  type="number"
                  value={remessaQtd}
                  onChange={(e) => setRemessaQtd(Number(e.target.value))}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Data da Remessa:</Label>
                <Input
                  type="date"
                  value={remessaData}
                  onChange={(e) => setRemessaData(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Código de Patrimônio / Tombamento:</Label>
                <Input
                  placeholder="Ex: PATR-2026-089"
                  value={remessaPatrimonio}
                  onChange={(e) => setRemessaPatrimonio(e.target.value)}
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Responsável pelo Recebimento:</Label>
                <select
                  aria-label="Selecionar Responsável pelo Recebimento"
                  value={remessaResponsavelId}
                  onChange={(e) => setRemessaResponsavelId(e.target.value)}
                  className="w-full text-xs bg-background border rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Selecione o colaborador...</option>
                  {instrutores.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Observações da Remessa / Guia de Transporte:</Label>
              <Textarea
                placeholder="Ex: Entregue lacrado, conferido pelo professor no local..."
                value={remessaObservacoes}
                onChange={(e) => setRemessaObservacoes(e.target.value)}
                rows={2}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setModalRemessaAberto(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSalvarRemessa}
              disabled={isPending || !remessaMaterialId || !remessaLocalId || remessaQtd < 1}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Confirmar Envio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
