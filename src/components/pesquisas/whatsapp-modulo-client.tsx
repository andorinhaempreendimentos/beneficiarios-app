"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Smartphone,
  QrCode,
  ShieldAlert,
  Clock,
  Send,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Users,
  Eye,
  Radio,
  Flame,
  Battery,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  salvarWhatsappInstancia,
  gerarQrCodeOuTestarConexao,
  salvarWhatsappNumero,
  excluirWhatsappNumero,
  salvarWhatsappTemplate,
  excluirWhatsappTemplate,
  calcularPublicoAlvoCampanha,
  iniciarDisparoCampanha,
  type WhatsappInstanciaCompleta,
  type PublicoAlvoCalculado,
} from "@/lib/actions/whatsapp";
import type { PesquisaResumoItem } from "@/lib/actions/pesquisas";

interface WhatsappModuloClientProps {
  objeto: {
    id: string;
    nome: string;
    termo_beneficiario: string;
    termo_local: string;
    termo_grupo: string;
  };
  instanciaInicial: WhatsappInstanciaCompleta | null;
  templatesIniciais: Array<{ id: string; nome: string; corpo: string; criado_em: string }>;
  pesquisas: PesquisaResumoItem[];
  auxiliares: {
    locais: Array<{ id: string; nome: string }>;
    grupos: Array<{ id: string; nome: string; local_id: string }>;
  };
}

export function WhatsappModuloClient({
  objeto,
  instanciaInicial,
  templatesIniciais,
  pesquisas,
  auxiliares,
}: WhatsappModuloClientProps) {
  const [instancia, setInstancia] = useState<WhatsappInstanciaCompleta | null>(instanciaInicial);
  const [templates, setTemplates] = useState(templatesIniciais);

  // Estados Form 1: Instância
  const [provedor, setProvedor] = useState<"z-api" | "evolution">(instancia?.provedor || "z-api");
  const [endpointUrl, setEndpointUrl] = useState(instancia?.endpoint_url || "https://api.z-api.io/instances/YOUR_INSTANCE/token/YOUR_TOKEN");
  const [instanceId, setInstanceId] = useState(instancia?.instance_id || "");
  const [tokenApi, setTokenApi] = useState(instancia?.token_api || "");
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [statusConexao, setStatusConexao] = useState<string>(instancia?.status || "desconectado");
  const [salvandoInstancia, setSalvandoInstancia] = useState(false);

  // Estados Form 2: Números Emissores (Anti-Ban)
  const [novoNumero, setNovoNumero] = useState("");
  const [novoTeto, setNovoTeto] = useState(300);
  const [novoDelayMin, setNovoDelayMin] = useState(20);
  const [novoDelayMax, setNovoDelayMax] = useState(45);
  const [salvandoNumero, setSalvandoNumero] = useState(false);

  // Estados Form 3: Templates
  const [novoTemplateNome, setNovoTemplateNome] = useState("");
  const [novoTemplateCorpo, setNovoTemplateCorpo] = useState(
    "Olá {{nome_beneficiario}}, gostaríamos de saber sua opinião sobre as atividades do projeto {{nome_projeto}} no {{nome_polo}}! Acesse o link oficial para avaliar: {{link_pesquisa}}"
  );
  const [salvandoTemplate, setSalvandoTemplate] = useState(false);

  // Estados Form 4: Disparo em Massa
  const [etapaDisparo, setEtapaDisparo] = useState<1 | 2 | 3>(1);
  const [campanhaPesquisaId, setCampanhaPesquisaId] = useState<string>(pesquisas[0]?.id || "");
  const [campanhaTemplateId, setCampanhaTemplateId] = useState<string>(templates[0]?.id || "livre");
  const [campanhaTextoLivre, setCampanhaTextoLivre] = useState<string>("");
  const [campanhaLocalId, setCampanhaLocalId] = useState<string>("todos");
  const [campanhaGrupoId, setCampanhaGrupoId] = useState<string>("todas");
  const [campanhaGenero, setCampanhaGenero] = useState<string>("todos");
  const [campanhaDestinatario, setCampanhaDestinatario] = useState<"beneficiario" | "responsavel">("beneficiario");
  const [campanhaFiltroNaoRespondeu, setCampanhaFiltroNaoRespondeu] = useState<boolean>(true);
  const [campanhaFiltroAbaixoMeta, setCampanhaFiltroAbaixoMeta] = useState<boolean>(false);

  const [publicoCalculado, setPublicoCalculado] = useState<PublicoAlvoCalculado | null>(null);
  const [calculandoPublico, setCalculandoPublico] = useState<boolean>(false);
  const [disparando, setDisparando] = useState<boolean>(false);
  const [disparoConcluido, setDisparoConcluido] = useState<boolean>(false);
  const [erroDisparo, setErroDisparo] = useState<string | null>(null);

  // Salvar Instância
  const handleSalvarInstancia = async () => {
    setSalvandoInstancia(true);
    try {
      const res = await salvarWhatsappInstancia({
        id: instancia?.id,
        objeto_id: objeto.id,
        provedor,
        endpoint_url: endpointUrl,
        instance_id: instanceId,
        token_api: tokenApi,
        status: statusConexao as any,
      });
      if (res.success && res.id) {
        setInstancia((prev) => ({
          id: res.id!,
          objeto_id: objeto.id,
          provedor,
          endpoint_url: endpointUrl,
          instance_id: instanceId,
          token_api: tokenApi,
          status: statusConexao as any,
          numero_pareado: prev?.numero_pareado || null,
          numeros: prev?.numeros || [],
        }));
        alert("Configurações do Gateway salvas com sucesso!");
      } else {
        alert("Erro: " + res.error);
      }
    } catch (e: any) {
      alert("Erro ao salvar: " + e.message);
    } finally {
      setSalvandoInstancia(false);
    }
  };

  // Gerar QR Code
  const handleGerarQrCode = async () => {
    if (!instancia?.id) {
      alert("Salve as credenciais da instância antes de gerar o QR Code.");
      return;
    }
    try {
      const res = await gerarQrCodeOuTestarConexao(instancia.id);
      if (res.success) {
        setStatusConexao(res.status);
        if (res.qrCodeUrl) setQrCodeUrl(res.qrCodeUrl);
      }
    } catch (e: any) {
      alert("Erro: " + e.message);
    }
  };

  // Salvar Número Anti-Ban
  const handleSalvarNumero = async () => {
    if (!instancia?.id) {
      alert("Cadastre a instância primeiro.");
      return;
    }
    if (!novoNumero.trim()) return;
    setSalvandoNumero(true);

    try {
      const res = await salvarWhatsappNumero({
        instancia_id: instancia.id,
        numero: novoNumero,
        teto_diario: novoTeto,
        delay_min_segundos: novoDelayMin,
        delay_max_segundos: novoDelayMax,
        ativo: true,
      });

      if (res.success && res.id) {
        setInstancia((prev) =>
          prev
            ? {
                ...prev,
                numeros: [
                  ...prev.numeros,
                  {
                    id: res.id!,
                    numero: novoNumero.replace(/\D/g, ""),
                    ativo: true,
                    teto_diario: novoTeto,
                    delay_min_segundos: novoDelayMin,
                    delay_max_segundos: novoDelayMax,
                  },
                ],
              }
            : null
        );
        setNovoNumero("");
      }
    } catch (e: any) {
      alert("Erro: " + e.message);
    } finally {
      setSalvandoNumero(false);
    }
  };

  const handleExcluirNumero = async (id: string) => {
    try {
      await excluirWhatsappNumero(id);
      setInstancia((prev) =>
        prev ? { ...prev, numeros: prev.numeros.filter((n) => n.id !== id) } : null
      );
    } catch (e: any) {
      alert("Erro: " + e.message);
    }
  };

  // Salvar Template
  const handleSalvarTemplate = async () => {
    if (!novoTemplateNome.trim() || !novoTemplateCorpo.trim()) return;
    setSalvandoTemplate(true);
    try {
      const res = await salvarWhatsappTemplate({
        objeto_id: objeto.id,
        nome: novoTemplateNome,
        corpo: novoTemplateCorpo,
      });
      if (res.success && res.id) {
        setTemplates((prev) => [
          ...prev,
          { id: res.id!, nome: novoTemplateNome, corpo: novoTemplateCorpo, criado_em: new Date().toISOString() },
        ]);
        setNovoTemplateNome("");
      }
    } catch (e: any) {
      alert("Erro: " + e.message);
    } finally {
      setSalvandoTemplate(false);
    }
  };

  const handleExcluirTemplate = async (id: string) => {
    try {
      await excluirWhatsappTemplate(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
    } catch (e: any) {
      alert("Erro: " + e.message);
    }
  };

  const inserirTagNoTemplate = (tag: string) => {
    setNovoTemplateCorpo((prev) => prev + " " + tag);
  };

  // Prévia Mobile do Template
  const gerarPreviaTexto = (textoBase: string) => {
    const pesquisaSelecionada = pesquisas.find((p) => p.id === campanhaPesquisaId) || pesquisas[0];
    const linkPesquisa = pesquisaSelecionada ? `https://beneficiarios-app.vercel.app/r/${pesquisaSelecionada.token}` : "https://beneficiarios-app.vercel.app/r/TOKEN";

    return textoBase
      .replace(/{{nome_beneficiario}}/g, "Lucas Gabriel")
      .replace(/{{nome_responsavel}}/g, "Maria Silva")
      .replace(/{{nome_projeto}}/g, objeto.nome)
      .replace(/{{nome_polo}}/g, auxiliares.locais[0]?.nome || "Polo Central")
      .replace(/{{turma}}/g, auxiliares.grupos[0]?.nome || "Turma A")
      .replace(/{{horario_aula}}/g, "Terça e Quinta, 09h00")
      .replace(/{{link_pesquisa}}/g, linkPesquisa);
  };

  // Calcular público alvo quando entrar na etapa 2 ou 3
  const atualizarCalculoPublico = async () => {
    setCalculandoPublico(true);
    try {
      const res = await calcularPublicoAlvoCampanha(
        objeto.id,
        campanhaLocalId === "todos" ? null : campanhaLocalId,
        campanhaGrupoId === "todas" ? null : campanhaGrupoId,
        campanhaGenero === "todos" ? null : campanhaGenero,
        campanhaFiltroNaoRespondeu,
        campanhaFiltroAbaixoMeta,
        campanhaDestinatario,
        campanhaPesquisaId || null
      );
      setPublicoCalculado(res);
    } catch (e: any) {
      console.error(e);
    } finally {
      setCalculandoPublico(false);
    }
  };

  // Disparar Campanha
  const handleExecutarDisparo = async () => {
    const templateEscolhido = templates.find((t) => t.id === campanhaTemplateId);
    const textoMensagem = templateEscolhido ? templateEscolhido.corpo : campanhaTextoLivre;

    if (!textoMensagem) {
      setErroDisparo("Defina o texto da mensagem a ser disparada.");
      return;
    }

    setDisparando(true);
    setErroDisparo(null);

    try {
      const res = await iniciarDisparoCampanha({
        objeto_id: objeto.id,
        pesquisa_id: campanhaPesquisaId || null,
        template_id: templateEscolhido ? templateEscolhido.id : null,
        mensagem_avulsa: templateEscolhido ? null : campanhaTextoLivre,
        mensagemFinal: textoMensagem,
        filtro_local_id: campanhaLocalId === "todos" ? null : campanhaLocalId,
        filtro_grupo_id: campanhaGrupoId === "todas" ? null : campanhaGrupoId,
        filtro_genero: campanhaGenero === "todos" ? null : campanhaGenero,
        filtro_nao_respondeu: campanhaFiltroNaoRespondeu,
        filtro_abaixo_meta: campanhaFiltroAbaixoMeta,
        destinatario: campanhaDestinatario,
      });

      if (!res.success) {
        setErroDisparo(res.error || "Erro ao processar disparo.");
      } else {
        setDisparoConcluido(true);
      }
    } catch (e: any) {
      setErroDisparo(e.message || "Erro inesperado.");
    } finally {
      setDisparando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 4 Interfaces Operacionais em Tabs (§3.14 item 3) */}
      <Tabs defaultValue="disparo" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="disparo">1. Disparo em Massa</TabsTrigger>
          <TabsTrigger value="templates">2. Templates com Tags</TabsTrigger>
          <TabsTrigger value="numeros">3. Chips Anti-Ban</TabsTrigger>
          <TabsTrigger value="gateway">4. Conexão Gateway</TabsTrigger>
        </TabsList>

        {/* 1. ASSISTENTE DE DISPARO EM MASSA (§3.14 item 3.4) */}
        <TabsContent value="disparo" className="space-y-6 pt-4">
          <Card className="shadow-sm border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Send className="w-5 h-5 text-primary" />
                    <span>Assistente de Disparo em 3 Etapas</span>
                  </CardTitle>
                  <CardDescription className="text-xs mt-1">
                    Campanha de convite e busca ativa com delays humanizados e segmentação inteligente.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={etapaDisparo === 1 ? "default" : "outline"}>Etapa 1: Mensagem</Badge>
                  <Badge variant={etapaDisparo === 2 ? "default" : "outline"}>Etapa 2: Audiência</Badge>
                  <Badge variant={etapaDisparo === 3 ? "default" : "outline"}>Etapa 3: Fila</Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {erroDisparo && (
                <div className="p-3 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {erroDisparo}
                </div>
              )}

              {disparoConcluido ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-full mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Campanha Disparada com Sucesso!
                  </h3>
                  <p className="text-sm text-slate-500 max-w-md mx-auto">
                    Os envios foram colocados na fila assíncrona respeitando as regras anti-ban e delays randômicos
                    configurados.
                  </p>
                  <Button onClick={() => { setDisparoConcluido(false); setEtapaDisparo(1); }} variant="outline">
                    Iniciar Nova Campanha
                  </Button>
                </div>
              ) : (
                <>
                  {/* ETAPA 1: Composição da Mensagem */}
                  {etapaDisparo === 1 && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs">Vincular a uma Pesquisa de Satisfação</Label>
                          <Select value={campanhaPesquisaId} onValueChange={(val) => { if (val) setCampanhaPesquisaId(val); }}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Selecione a pesquisa..." />
                            </SelectTrigger>
                            <SelectContent>
                              {pesquisas.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.titulo}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-xs">Modelo Reutilizável (Template)</Label>
                          <Select
                            value={campanhaTemplateId}
                            onValueChange={(val) => {
                              if (val) {
                                setCampanhaTemplateId(val);
                                const t = templates.find((item) => item.id === val);
                                if (t) setCampanhaTextoLivre(t.corpo);
                              }
                            }}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Escolha um modelo..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="livre">Texto Livre Personalizado</SelectItem>
                              {templates.map((t) => (
                                <SelectItem key={t.id} value={t.id}>
                                  {t.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs">Corpo da Mensagem com Variáveis</Label>
                        <Textarea
                          value={campanhaTextoLivre}
                          onChange={(e) => setCampanhaTextoLivre(e.target.value)}
                          placeholder="Digite o texto da mensagem..."
                          rows={4}
                          className="mt-1 font-sans text-sm"
                        />
                      </div>

                      {/* Simulador Balão WhatsApp */}
                      <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 border space-y-2">
                        <span className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1.5">
                          <Smartphone className="w-3.5 h-3.5" />
                          <span>Prévia Mobile no WhatsApp do Participante</span>
                        </span>
                        <div className="max-w-md bg-[#dcf8c6] dark:bg-emerald-950/70 p-3.5 rounded-lg rounded-tl-none shadow-sm text-xs text-slate-800 dark:text-slate-100 whitespace-pre-line border border-emerald-500/20">
                          {gerarPreviaTexto(campanhaTextoLivre || "Digite a mensagem para visualizar a prévia...")}
                          <div className="text-[10px] text-slate-400 text-right mt-1">10:42 ✓✓</div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <Button
                          onClick={() => {
                            atualizarCalculoPublico();
                            setEtapaDisparo(2);
                          }}
                        >
                          Avançar para Segmentação da Audiência
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* ETAPA 2: Segmentação Cirúrgica */}
                  {etapaDisparo === 2 && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-xs">{objeto.termo_local}</Label>
                          <Select
                            value={campanhaLocalId}
                            onValueChange={(val) => {
                              if (val) {
                                setCampanhaLocalId(val);
                                setTimeout(atualizarCalculoPublico, 50);
                              }
                            }}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="todos">Todos os {objeto.termo_local}s</SelectItem>
                              {auxiliares.locais.map((l) => (
                                <SelectItem key={l.id} value={l.id}>
                                  {l.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-xs">{objeto.termo_grupo}</Label>
                          <Select
                            value={campanhaGrupoId}
                            onValueChange={(val) => {
                              if (val) {
                                setCampanhaGrupoId(val);
                                setTimeout(atualizarCalculoPublico, 50);
                              }
                            }}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="todas">Todas as {objeto.termo_grupo}s</SelectItem>
                              {auxiliares.grupos.map((g) => (
                                <SelectItem key={g.id} value={g.id}>
                                  {g.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-xs">Destinatário</Label>
                          <Select
                            value={campanhaDestinatario}
                            onValueChange={(val) => {
                              if (val) {
                                setCampanhaDestinatario(val as any);
                                setTimeout(atualizarCalculoPublico, 50);
                              }
                            }}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="beneficiario">O Próprio {objeto.termo_beneficiario}</SelectItem>
                              <SelectItem value="responsavel">Responsável Legal (Pai/Mãe)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Filtros Inteligentes de Busca Ativa (§3.14 item 3.4) */}
                      <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-900 space-y-3">
                        <h4 className="text-xs font-bold uppercase text-slate-500">
                          Filtros Inteligentes de Engajamento
                        </h4>

                        <label className="flex items-center gap-2 cursor-pointer text-xs">
                          <input
                            type="checkbox"
                            checked={campanhaFiltroNaoRespondeu}
                            onChange={(e) => {
                              setCampanhaFiltroNaoRespondeu(e.target.checked);
                              setTimeout(atualizarCalculoPublico, 50);
                            }}
                            className="rounded text-primary focus:ring-primary w-4 h-4"
                          />
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-200">
                              Apenas quem AINDA NÃO RESPONDEU à pesquisa
                            </p>
                            <p className="text-slate-500">Evita incomodar famílias que já registraram sua avaliação</p>
                          </div>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-xs">
                          <input
                            type="checkbox"
                            checked={campanhaFiltroAbaixoMeta}
                            onChange={(e) => {
                              setCampanhaFiltroAbaixoMeta(e.target.checked);
                              setTimeout(atualizarCalculoPublico, 50);
                            }}
                            className="rounded text-primary focus:ring-primary w-4 h-4"
                          />
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-200">
                              Busca Ativa de Evasão (Assiduidade abaixo de 75%)
                            </p>
                            <p className="text-slate-500">Foca em resgatar alunos em risco de abandono</p>
                          </div>
                        </label>
                      </div>

                      {/* Resumo Dinâmico da Audiência */}
                      <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold text-primary">Audiência Estimada</span>
                          <div className="text-2xl font-bold">
                            {calculandoPublico ? "Calculando..." : `${publicoCalculado?.total || 0} destinatários`}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Tempo estimado de disparo anti-ban: ~{publicoCalculado?.tempoEstimadoMinutos || 0} minutos
                          </p>
                        </div>
                        <Users className="w-8 h-8 text-primary/40" />
                      </div>

                      <div className="flex justify-between pt-2">
                        <Button variant="outline" onClick={() => setEtapaDisparo(1)}>
                          Voltar
                        </Button>
                        <Button onClick={() => setEtapaDisparo(3)} disabled={!publicoCalculado || publicoCalculado.total === 0}>
                          Avançar para Fila de Disparo
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* ETAPA 3: Fila de Execução e Disparo */}
                  {etapaDisparo === 3 && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-900 space-y-3">
                        <h4 className="text-xs font-bold uppercase text-slate-500">
                          Resumo Geral do Disparo
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                          <div>
                            <span className="text-slate-500">Total de Destinatários:</span>
                            <p className="font-bold text-slate-900 dark:text-white">
                              {publicoCalculado?.total || 0} participantes
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-500">Estimativa de Tempo:</span>
                            <p className="font-bold text-slate-900 dark:text-white">
                              ~{publicoCalculado?.tempoEstimadoMinutos || 0} minutos
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-500">Modo de Envio:</span>
                            <p className="font-bold text-emerald-600">Fila Assíncrona Anti-Ban</p>
                          </div>
                        </div>
                      </div>

                      {/* Amostra dos Contatos */}
                      <div className="space-y-2">
                        <Label className="text-xs">Amostra dos Primeiros Destinatários da Fila</Label>
                        <div className="border rounded-lg overflow-hidden text-xs">
                          <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500">
                              <tr>
                                <th className="p-2">Nome</th>
                                <th className="p-2">Telefone</th>
                                <th className="p-2">Frequência</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {publicoCalculado?.amostra.map((dest) => (
                                <tr key={dest.id}>
                                  <td className="p-2 font-medium">{dest.nome}</td>
                                  <td className="p-2 font-mono text-slate-600 dark:text-slate-300">{dest.telefone}</td>
                                  <td className="p-2">{dest.frequenciaPercentual}%</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="flex justify-between pt-4 border-t">
                        <Button variant="outline" onClick={() => setEtapaDisparo(2)}>
                          Voltar
                        </Button>
                        <Button
                          onClick={handleExecutarDisparo}
                          disabled={disparando || !publicoCalculado || publicoCalculado.total === 0}
                          className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                        >
                          <Send className="w-4 h-4" />
                          <span>{disparando ? "Iniciando Fila..." : "Iniciar Disparo em Massa"}</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. TEMPLATES DE MENSAGENS COM TAGS DINÂMICAS (§3.14 item 3.3) */}
        <TabsContent value="templates" className="space-y-6 pt-4">
          <Card className="shadow-sm border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold">Templates de Mensagens (Modelos)</CardTitle>
              <CardDescription className="text-xs">
                Crie mensagens reutilizáveis e insira tags dinâmicas que são substituídas em tempo de envio.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border">
                <div>
                  <Label className="text-xs">Nome do Modelo</Label>
                  <Input
                    placeholder="Ex: Convite Pesquisa Semestral"
                    value={novoTemplateNome}
                    onChange={(e) => setNovoTemplateNome(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-xs">Corpo do Texto</Label>
                    <span className="text-[10px] text-slate-500">Clique nas tags abaixo para inserir:</span>
                  </div>
                  {/* Botões de 1 clique para inserção de tags dinâmicas (§3.14 item 3.3) */}
                  <div className="flex flex-wrap gap-1.5 pb-2">
                    {[
                      "{{nome_beneficiario}}",
                      "{{nome_responsavel}}",
                      "{{nome_projeto}}",
                      "{{nome_polo}}",
                      "{{turma}}",
                      "{{horario_aula}}",
                      "{{link_pesquisa}}",
                    ].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => inserirTagNoTemplate(tag)}
                        className="px-2 py-0.5 rounded text-[11px] font-mono bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>

                  <Textarea
                    value={novoTemplateCorpo}
                    onChange={(e) => setNovoTemplateCorpo(e.target.value)}
                    rows={4}
                    className="font-sans text-xs"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <Button size="sm" onClick={handleSalvarTemplate} disabled={salvandoTemplate}>
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    <span>Salvar Modelo</span>
                  </Button>
                </div>
              </div>

              {/* Lista de Modelos */}
              <div className="space-y-2">
                {templates.length === 0 ? (
                  <p className="text-center py-6 text-xs text-slate-500">Nenhum modelo cadastrado.</p>
                ) : (
                  templates.map((t) => (
                    <div
                      key={t.id}
                      className="p-3.5 rounded-lg border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4 text-xs"
                    >
                      <div className="space-y-1">
                        <span className="font-bold text-slate-900 dark:text-white">{t.nome}</span>
                        <p className="text-slate-600 dark:text-slate-300 font-mono text-[11px] whitespace-pre-line">
                          {t.corpo}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-rose-500 hover:text-rose-700 shrink-0"
                        onClick={() => handleExcluirTemplate(t.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. NÚMEROS EMISSORES / POLÍTICAS ANTI-BAN (§3.14 item 3.2) */}
        <TabsContent value="numeros" className="space-y-6 pt-4">
          <Card className="shadow-sm border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
                <span>Gestão de Números Emissores (Anti-Ban)</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Mitigue riscos de bloqueio distribuindo envios entre múltiplos chips com delays humanizados e round-robin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border space-y-3">
                <h4 className="text-xs font-bold uppercase text-slate-500">Cadastrar Chip Emissor</h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <Label className="text-xs">Número (com DDD)</Label>
                    <Input
                      placeholder="11999998888"
                      value={novoNumero}
                      onChange={(e) => setNovoNumero(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Teto Diário (Disparos)</Label>
                    <Input
                      type="number"
                      value={novoTeto}
                      onChange={(e) => setNovoTeto(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Delay Mínimo (segundos)</Label>
                    <Input
                      type="number"
                      value={novoDelayMin}
                      onChange={(e) => setNovoDelayMin(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Delay Máximo (segundos)</Label>
                    <Input
                      type="number"
                      value={novoDelayMax}
                      onChange={(e) => setNovoDelayMax(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <Button size="sm" onClick={handleSalvarNumero} disabled={salvandoNumero}>
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    <span>Adicionar Chip</span>
                  </Button>
                </div>
              </div>

              {/* Lista de Chips */}
              <div className="space-y-2">
                {instancia?.numeros.length === 0 ? (
                  <p className="text-center py-6 text-xs text-slate-500">Nenhum número cadastrado na instância.</p>
                ) : (
                  instancia?.numeros.map((n) => (
                    <div
                      key={n.id}
                      className="p-3.5 rounded-lg border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold">
                          WA
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white font-mono">{n.numero}</span>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                            <span>Teto: {n.teto_diario}/dia</span>
                            <span>•</span>
                            <span>Delay: {n.delay_min_segundos}s a {n.delay_max_segundos}s</span>
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-rose-500 hover:text-rose-700"
                        onClick={() => handleExcluirNumero(n.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. CONEXÃO DE INSTÂNCIA / GATEWAY (§3.14 item 3.1) */}
        <TabsContent value="gateway" className="space-y-6 pt-4">
          <Card className="shadow-sm border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold">Configuração do Provedor de WhatsApp</CardTitle>
                  <CardDescription className="text-xs">
                    Conexão direta com Z-API ou Evolution API para disparo e telemetria.
                  </CardDescription>
                </div>
                {/* Badge visual em tempo real (§3.14 item 3.1) */}
                <Badge
                  variant={statusConexao === "conectado" ? "default" : "secondary"}
                  className={`text-xs capitalize ${
                    statusConexao === "conectado" ? "bg-emerald-600 text-white" : ""
                  }`}
                >
                  {statusConexao.replace("_", " ")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Seletor de Provedor</Label>
                  <Select
                    value={provedor}
                    onValueChange={(val) => { if (val) setProvedor(val as any); }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="z-api">Z-API (Oficial Parceiro)</SelectItem>
                      <SelectItem value="evolution">Evolution API (Open Source)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Instance ID</Label>
                  <Input
                    placeholder="Ex: 3B49E7C81F..."
                    value={instanceId}
                    onChange={(e) => setInstanceId(e.target.value)}
                    className="mt-1 font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Endpoint Base da API</Label>
                <Input
                  placeholder="https://api.z-api.io/instances/..."
                  value={endpointUrl}
                  onChange={(e) => setEndpointUrl(e.target.value)}
                  className="mt-1 font-mono text-xs"
                />
              </div>

              <div>
                <Label className="text-xs">Client Token / API Key</Label>
                <Input
                  type="password"
                  placeholder="Token secreto de autenticação..."
                  value={tokenApi}
                  onChange={(e) => setTokenApi(e.target.value)}
                  className="mt-1 font-mono text-xs"
                />
              </div>

              {/* Botões de Ação */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <Button variant="outline" onClick={handleGerarQrCode}>
                  <QrCode className="w-4 h-4 mr-1.5 text-primary" />
                  <span>Gerar QR Code de Pareamento</span>
                </Button>

                <Button onClick={handleSalvarInstancia} disabled={salvandoInstancia}>
                  {salvandoInstancia ? "Salvando..." : "Salvar Credenciais do Gateway"}
                </Button>
              </div>

              {/* Exibição Dinâmica do QR Code na Tela (§3.14 item 3.1) */}
              {qrCodeUrl && (
                <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center max-w-xs mx-auto mt-4 space-y-3">
                  <img src={qrCodeUrl} alt="QR Code WhatsApp" className="w-48 h-48 mx-auto rounded-lg" />
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Aguardando Leitura pelo WhatsApp
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Abra o WhatsApp no celular da Organização Social &gt; Dispositivos Conectados &gt; Conectar Aparelho.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
