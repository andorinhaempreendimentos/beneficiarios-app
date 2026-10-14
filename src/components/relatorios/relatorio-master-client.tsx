"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type RelatorioMasterCorpoExecutivo,
  type RelatorioMasterSnapshot,
  fecharRelatorioMaster,
  retificarRelatorioMaster,
} from "@/lib/actions/relatorio-master";
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
  Award,
  FileText,
  Printer,
  ArrowLeft,
  Lock,
  Building,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  User,
  Clock,
  Layers,
  Sparkles,
  Users,
  Camera,
  History,
  FileSpreadsheet,
  Loader2,
  Check,
} from "lucide-react";

interface RelatorioMasterClientProps {
  objetoId: string;
  dataInicio: string;
  dataFim: string;
  rotuloPeriodo: string;
  corpoExecutivo: RelatorioMasterCorpoExecutivo;
  relatoriosAnteriores: {
    id: string;
    rotulo_periodo: string;
    versao: number;
    status: string;
    fechado_em: string | null;
    motivo_retificacao: string | null;
  }[];
  relatorioAtivo?: any;
}

export function RelatorioMasterClient({
  objetoId,
  dataInicio,
  dataFim,
  rotuloPeriodo,
  corpoExecutivo,
  relatoriosAnteriores,
  relatorioAtivo,
}: RelatorioMasterClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [abaAtiva, setAbaAtiva] = useState("corpo");
  const [abaAnexoAtiva, setAbaAnexoAtiva] = useState("anexo1");

  // Pareceres dissertativos
  const [resumoExecucao, setResumoExecucao] = useState(
    relatorioAtivo?.resumo_execucao ||
      "As atividades pactuadas no Plano de Trabalho foram executadas com regularidade em todos os polos credenciados, cumprindo a grade horária e as diretrizes pedagógicas da parceria."
  );
  const [analiseMetas, setAnaliseMetas] = useState(
    relatorioAtivo?.analise_cumprimento_metas ||
      "O projeto atingiu 100% das metas físicas e qualitativas pactuadas para o ciclo, com atendimento integral dos beneficiários matriculados e regularidade atestada nas vistorias de supervisão."
  );
  const [resultadosAlcancados, setResultadosAlcancados] = useState(
    relatorioAtivo?.resultados_alcancados ||
      "Observou-se fortalecimento dos vínculos comunitários, redução do absenteísmo escolar e desenvolvimento motor expressivo dos participantes atendidos nas práticas esportivas."
  );
  const [conclusao, setConclusao] = useState(
    relatorioAtivo?.conclusao ||
      "Atesta-se a boa e regular aplicação dos recursos públicos repassados, em estrita observância à Lei Federal nº 13.019/2014 (MROSC) e às cláusulas do Termo de Colaboração firmado."
  );

  const [coordenadorNome, setCoordenadorNome] = useState(
    relatorioAtivo?.anexos_dados?.triplice_assinatura?.coordenador_nome || "Coordenação Geral do Projeto"
  );
  const [representanteNome, setRepresentanteNome] = useState(
    relatorioAtivo?.anexos_dados?.triplice_assinatura?.representante_legal_nome ||
      corpoExecutivo.identificacao.organizacao_nome
  );

  const [modalFecharAberto, setModalFecharAberto] = useState(false);
  const [modalRetificarAberto, setModalRetificarAberto] = useState(false);
  const [motivoRetificacao, setMotivoRetificacao] = useState("");
  const [feedback, setFeedback] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);

  const isRelatorioFechado = relatorioAtivo?.status === "fechado";
  const versaoAtual = relatorioAtivo?.versao || 1;

  // Fechar oficialmente o ciclo
  const handleFecharOficial = () => {
    setFeedback(null);
    startTransition(async () => {
      const res = await fecharRelatorioMaster({
        objeto_id: objetoId,
        rotulo_periodo: rotuloPeriodo,
        data_inicio: dataInicio,
        data_fim: dataFim,
        resumo_execucao: resumoExecucao,
        analise_metas: analiseMetas,
        resultados_alcancados: resultadosAlcancados,
        conclusao: conclusao,
        coordenador_geral_nome: coordenadorNome,
        representante_legal_nome: representanteNome,
      });

      setModalFecharAberto(false);
      if (res.success) {
        setFeedback({
          tipo: "sucesso",
          texto: "Relatório Master homologado e congelado com fé pública!",
        });
        router.refresh();
      } else {
        setFeedback({ tipo: "erro", texto: res.error || "Erro ao homologar relatório." });
      }
    });
  };

  // Emitir versão retificadora (v2)
  const handleRetificarOficial = () => {
    if (!relatorioAtivo?.id) return;
    setFeedback(null);

    startTransition(async () => {
      const res = await retificarRelatorioMaster({
        relatorio_id: relatorioAtivo.id,
        motivo_retificacao: motivoRetificacao,
        resumo_execucao: resumoExecucao,
        analise_metas: analiseMetas,
        resultados_alcancados: resultadosAlcancados,
        conclusao: conclusao,
      });

      setModalRetificarAberto(false);
      if (res.success) {
        setFeedback({
          tipo: "sucesso",
          texto: `Versão retificadora v${(relatorioAtivo.versao || 1) + 1} emitida com sucesso!`,
        });
        router.refresh();
      } else {
        setFeedback({ tipo: "erro", texto: res.error || "Erro ao retificar relatório." });
      }
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Barra Superior / Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 print:hidden">
        <div>
          <Link href="/relatorios">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs -ml-2 mb-1">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Hub de Relatórios
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Award className="h-6 w-6 text-primary" />
              Relatório Master de Execução do Objeto (MROSC)
            </h1>
            <Badge variant={isRelatorioFechado ? "default" : "outline"} className="text-xs font-mono">
              {isRelatorioFechado ? `Fechado v${versaoAtual}` : "Em Elaboração"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Caderno Institucional Nível 3 (§3.9.4) — 16 Seções Executivas e 8 Cadernos de Anexos Oficiais.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isRelatorioFechado ? (
            <Button
              onClick={() => setModalRetificarAberto(true)}
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              <History className="h-3.5 w-3.5" />
              Emitir Retificação (v{versaoAtual + 1})
            </Button>
          ) : (
            <Button
              onClick={() => setModalFecharAberto(true)}
              size="sm"
              className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-700"
            >
              <Lock className="h-3.5 w-3.5" />
              Homologar e Fechar Oficial
            </Button>
          )}

          <Button onClick={() => window.print()} variant="secondary" size="sm" className="gap-1.5 text-xs">
            <Printer className="h-3.5 w-3.5" />
            Imprimir / PDF
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
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            )}
            <span>{feedback.texto}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setFeedback(null)} className="h-6 text-xs px-1.5">
            Fechar
          </Button>
        </div>
      )}

      {/* Mini-Dashboard de Topo dos Indicadores Master */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3 rounded-lg border bg-muted/20">
          <span className="text-[11px] text-muted-foreground block font-medium">Polos Ativos</span>
          <span className="text-xl font-bold">{corpoExecutivo.indicadores_executivos.polos_ativos}</span>
        </div>
        <div className="p-3 rounded-lg border bg-muted/20">
          <span className="text-[11px] text-muted-foreground block font-medium">Beneficiários</span>
          <span className="text-xl font-bold text-blue-600">{corpoExecutivo.indicadores_executivos.beneficiarios_atendidos}</span>
        </div>
        <div className="p-3 rounded-lg border bg-muted/20">
          <span className="text-[11px] text-muted-foreground block font-medium">Turmas Ativas</span>
          <span className="text-xl font-bold">{corpoExecutivo.indicadores_executivos.turmas_ativas}</span>
        </div>
        <div className="p-3 rounded-lg border bg-muted/20">
          <span className="text-[11px] text-muted-foreground block font-medium">Equipe de Campo</span>
          <span className="text-xl font-bold">{corpoExecutivo.indicadores_executivos.professores_alocados}</span>
        </div>
        <div className="p-3 rounded-lg border bg-muted/20">
          <span className="text-[11px] text-muted-foreground block font-medium">Sessões / Aulas</span>
          <span className="text-xl font-bold text-emerald-600">{corpoExecutivo.indicadores_executivos.sessoes_realizadas}</span>
        </div>
        <div className="p-3 rounded-lg border bg-muted/20">
          <span className="text-[11px] text-muted-foreground block font-medium">Supervisões</span>
          <span className="text-xl font-bold text-indigo-600">{corpoExecutivo.indicadores_executivos.supervisoes_concluidas}</span>
        </div>
      </div>

      {/* Abas do Cockpit Master */}
      <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="w-full space-y-4">
        <TabsList className="grid grid-cols-4 max-w-2xl print:hidden">
          <TabsTrigger value="corpo" className="text-xs">
            16 Seções Executivas
          </TabsTrigger>
          <TabsTrigger value="anexos" className="text-xs">
            8 Anexos Oficiais
          </TabsTrigger>
          <TabsTrigger value="pareceres" className="text-xs">
            Pareceres & Assinatura
          </TabsTrigger>
          <TabsTrigger value="historico" className="text-xs">
            Histórico ({relatoriosAnteriores.length})
          </TabsTrigger>
        </TabsList>

        {/* ABA 1: 16 SEÇÕES DO CORPO EXECUTIVO (§3.9.4) */}
        <TabsContent value="corpo" className="space-y-6">
          <Card className="print:border-none print:shadow-none">
            <CardHeader className="border-b pb-4">
              <div className="text-center space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Governo Municipal / Estadual / Federal • Prestação de Contas MROSC
                </span>
                <CardTitle className="text-xl font-black uppercase tracking-tight">
                  Relatório Periódico de Execução e Prestação de Contas do Objeto
                </CardTitle>
                <CardDescription className="text-xs font-semibold text-foreground">
                  {corpoExecutivo.identificacao.objeto_nome} • Período: {rotuloPeriodo}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-6 text-xs">
              {/* Seção 1: Identificação */}
              <div className="space-y-2">
                <h3 className="font-bold text-sm uppercase tracking-wide border-b pb-1 text-primary">
                  1. Identificação do Projeto e Parceria
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-3 bg-muted/20 rounded-md border">
                  <div>
                    <span className="text-muted-foreground block">Organização Social (OSC):</span>
                    <span className="font-semibold">{corpoExecutivo.identificacao.organizacao_nome}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">CNPJ da Executora:</span>
                    <span className="font-semibold font-mono">{corpoExecutivo.identificacao.organizacao_cnpj}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Órgão Concedente:</span>
                    <span className="font-semibold">{corpoExecutivo.identificacao.concedente_nome}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Termo de Parceria nº:</span>
                    <span className="font-semibold">{corpoExecutivo.identificacao.termo_parceria_numero}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Processo Administrativo nº:</span>
                    <span className="font-semibold">{corpoExecutivo.identificacao.processo_administrativo}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Município / UF:</span>
                    <span className="font-semibold">{corpoExecutivo.identificacao.municipio_uf}</span>
                  </div>
                </div>
              </div>

              {/* Seção 2: Objeto e Finalidade */}
              <div className="space-y-2">
                <h3 className="font-bold text-sm uppercase tracking-wide border-b pb-1 text-primary">
                  2. Objeto e Finalidade do Projeto
                </h3>
                <p className="text-muted-foreground leading-relaxed bg-muted/20 p-3 rounded-md border">
                  Desenvolvimento continuado de atividades esportivas, recreativas e educacionais voltadas a crianças, adolescentes e jovens em situação de vulnerabilidade, promovendo a cidadania, a permanência escolar e a integração comunitária nos polos cadastrados.
                </p>
              </div>

              {/* Seção 3 & 4: Execução por Polo */}
              <div className="space-y-2">
                <h3 className="font-bold text-sm uppercase tracking-wide border-b pb-1 text-primary">
                  3 e 4. Execução Polo a Polo (Quadro Geral)
                </h3>
                <div className="overflow-x-auto border rounded-md">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/60 text-muted-foreground border-b font-semibold">
                      <tr>
                        <th className="py-2 px-2.5">Polo / Núcleo</th>
                        <th className="py-2 px-2.5">Região</th>
                        <th className="py-2 px-2.5">Modalidade</th>
                        <th className="py-2 px-2.5">Professor Titular</th>
                        <th className="py-2 px-2.5 text-center">Turmas</th>
                        <th className="py-2 px-2.5 text-center">Beneficiários</th>
                        <th className="py-2 px-2.5 text-center">Aulas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {corpoExecutivo.polos_execucao.map((polo) => (
                        <tr key={polo.id}>
                          <td className="py-2 px-2.5 font-semibold">{polo.nome}</td>
                          <td className="py-2 px-2.5">{polo.regiao_nome}</td>
                          <td className="py-2 px-2.5">{polo.modalidade_nome}</td>
                          <td className="py-2 px-2.5">{polo.professor_titular}</td>
                          <td className="py-2 px-2.5 text-center font-medium">{polo.total_turmas}</td>
                          <td className="py-2 px-2.5 text-center font-bold text-blue-600">{polo.total_alunos}</td>
                          <td className="py-2 px-2.5 text-center font-medium">{polo.total_sessoes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Seção 5 & 6: Beneficiários & Frequência */}
              <div className="space-y-2">
                <h3 className="font-bold text-sm uppercase tracking-wide border-b pb-1 text-primary">
                  5 e 6. Demonstrativo de Beneficiários & Assiduidade
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-muted/20 border rounded-md">
                    <span className="text-muted-foreground block">Total Ativos:</span>
                    <span className="text-lg font-bold">{corpoExecutivo.beneficiarios_demo.total_ativos}</span>
                  </div>
                  <div className="p-3 bg-muted/20 border rounded-md">
                    <span className="text-muted-foreground block">Público Feminino:</span>
                    <span className="text-lg font-bold">{corpoExecutivo.beneficiarios_demo.total_feminino}</span>
                  </div>
                  <div className="p-3 bg-muted/20 border rounded-md">
                    <span className="text-muted-foreground block">Público Masculino:</span>
                    <span className="text-lg font-bold">{corpoExecutivo.beneficiarios_demo.total_masculino}</span>
                  </div>
                  <div className="p-3 bg-muted/20 border rounded-md">
                    <span className="text-muted-foreground block">Vulnerabilidade Social:</span>
                    <span className="text-lg font-bold text-amber-600">{corpoExecutivo.beneficiarios_demo.total_vulneraveis}</span>
                  </div>
                </div>
              </div>

              {/* Seção 11: Cumprimento de Metas */}
              <div className="space-y-2">
                <h3 className="font-bold text-sm uppercase tracking-wide border-b pb-1 text-primary">
                  11. Cumprimento das Metas do Plano de Trabalho
                </h3>
                <div className="overflow-x-auto border rounded-md">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/60 text-muted-foreground border-b font-semibold">
                      <tr>
                        <th className="py-2 px-2.5">Meta nº</th>
                        <th className="py-2 px-2.5">Descrição</th>
                        <th className="py-2 px-2.5 text-center">Previsto</th>
                        <th className="py-2 px-2.5 text-center">Realizado</th>
                        <th className="py-2 px-2.5 text-center">Situação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {corpoExecutivo.metas_resumo.map((m) => (
                        <tr key={m.numero_meta}>
                          <td className="py-2 px-2.5 font-bold">Meta {m.numero_meta}</td>
                          <td className="py-2 px-2.5">{m.descricao}</td>
                          <td className="py-2 px-2.5 text-center">{m.previsto}</td>
                          <td className="py-2 px-2.5 text-center font-bold text-green-600">{m.realizado}</td>
                          <td className="py-2 px-2.5 text-center">
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px]">
                              {m.situacao}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Seções 14, 15 e 16: Conclusão & Tríplice Assinatura */}
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-1">
                  <h4 className="font-bold text-xs uppercase tracking-wide text-foreground">15. Conclusão & Atesto Governamental:</h4>
                  <p className="text-muted-foreground bg-muted/20 p-3 rounded-md border leading-relaxed">
                    {conclusao}
                  </p>
                </div>

                <div className="pt-6">
                  <h4 className="font-bold text-xs uppercase tracking-wide text-center text-muted-foreground mb-6">
                    16. Documentos Comprobatórios & Tríplice Assinatura com Fé Pública
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                    <div className="space-y-1">
                      <div className="border-b border-foreground/40 pb-1">
                        <span className="font-bold">Responsável Técnico</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground block">Elaboração Documental</span>
                    </div>

                    <div className="space-y-1">
                      <div className="border-b border-foreground/40 pb-1">
                        <span className="font-bold">{coordenadorNome}</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground block">Coordenação Geral do Projeto</span>
                    </div>

                    <div className="space-y-1">
                      <div className="border-b border-foreground/40 pb-1">
                        <span className="font-bold">{representanteNome}</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground block">Representante Legal da OSC</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA 2: OS 8 CADERNOS DE ANEXOS OFICIAIS (§3.9.4) */}
        <TabsContent value="anexos" className="space-y-4">
          <Tabs value={abaAnexoAtiva} onValueChange={setAbaAnexoAtiva}>
            <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
              <TabsTrigger value="anexo1" className="text-xs">Anexo I: Polos</TabsTrigger>
              <TabsTrigger value="anexo2" className="text-xs">Anexo II: Alunos</TabsTrigger>
              <TabsTrigger value="anexo3" className="text-xs">Anexo III: Frequência</TabsTrigger>
              <TabsTrigger value="anexo4" className="text-xs">Anexo IV: Sessões</TabsTrigger>
              <TabsTrigger value="anexo5" className="text-xs">Anexo V: Supervisões</TabsTrigger>
              <TabsTrigger value="anexo6" className="text-xs">Anexo VI: RH</TabsTrigger>
              <TabsTrigger value="anexo7" className="text-xs">Anexo VII: Materiais</TabsTrigger>
              <TabsTrigger value="anexo8" className="text-xs">Anexo VIII: Metas</TabsTrigger>
            </TabsList>

            <Card className="mt-4">
              <CardContent className="pt-4 text-xs">
                {abaAnexoAtiva === "anexo1" && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-sm">Anexo I — Relação dos Polos Esportivos em Funcionamento</h4>
                    <div className="overflow-x-auto border rounded-md">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-muted/50 border-b font-semibold">
                          <tr>
                            <th className="p-2">Nome</th>
                            <th className="p-2">Bairro</th>
                            <th className="p-2">Região</th>
                            <th className="p-2 text-center">Turmas</th>
                            <th className="p-2 text-center">Alunos</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {corpoExecutivo.polos_execucao.map((p) => (
                            <tr key={p.id}>
                              <td className="p-2 font-semibold">{p.nome}</td>
                              <td className="p-2">{p.bairro || "-"}</td>
                              <td className="p-2">{p.regiao_nome}</td>
                              <td className="p-2 text-center">{p.total_turmas}</td>
                              <td className="p-2 text-center font-bold">{p.total_alunos}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {abaAnexoAtiva === "anexo2" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm">Anexo II — Relação Geral e Demografia dos Alunos</h4>
                      <Link href="/relatorios/assiduidade">
                        <Button variant="outline" size="sm" className="h-7 text-xs">
                          Abrir Espelho Completo de Alunos
                        </Button>
                      </Link>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/20 p-3 rounded-md border">
                      <div>
                        <span className="text-muted-foreground block">Total Ativos:</span>
                        <span className="font-bold text-base">{corpoExecutivo.beneficiarios_demo.total_ativos}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Feminino:</span>
                        <span className="font-bold text-base">{corpoExecutivo.beneficiarios_demo.total_feminino}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Masculino:</span>
                        <span className="font-bold text-base">{corpoExecutivo.beneficiarios_demo.total_masculino}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Vulnerabilidade:</span>
                        <span className="font-bold text-base text-amber-600">{corpoExecutivo.beneficiarios_demo.total_vulneraveis}</span>
                      </div>
                    </div>
                  </div>
                )}

                {abaAnexoAtiva === "anexo4" && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-sm">Anexo IV — Extrato de Sessões e Atividades Realizadas</h4>
                    <div className="overflow-x-auto border rounded-md max-h-96">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-muted/50 border-b font-semibold">
                          <tr>
                            <th className="p-2">Data</th>
                            <th className="p-2">Polo</th>
                            <th className="p-2">Horário</th>
                            <th className="p-2 text-center">Presentes</th>
                            <th className="p-2 text-center">Fotos</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {corpoExecutivo.sessoes_resumo.map((s) => (
                            <tr key={s.id}>
                              <td className="p-2 font-medium">{new Date(s.data + "T00:00:00").toLocaleDateString("pt-BR")}</td>
                              <td className="p-2">{s.local_nome}</td>
                              <td className="p-2 font-mono">{s.horario}</td>
                              <td className="p-2 text-center font-bold">{s.presentes}</td>
                              <td className="p-2 text-center">
                                {s.tem_fotos ? (
                                  <Badge variant="outline" className="text-[10px] bg-green-50 text-green-700">Com Fotos</Badge>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {abaAnexoAtiva === "anexo6" && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-sm">Anexo VI — Relação dos Profissionais e Equipe Técnica</h4>
                    <div className="overflow-x-auto border rounded-md">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-muted/50 border-b font-semibold">
                          <tr>
                            <th className="p-2">Nome</th>
                            <th className="p-2">CPF</th>
                            <th className="p-2">Cargo / Função</th>
                            <th className="p-2">Lotação / Polo</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {corpoExecutivo.recursos_humanos.map((rh, idx) => (
                            <tr key={idx}>
                              <td className="p-2 font-semibold">{rh.nome}</td>
                              <td className="p-2 font-mono text-muted-foreground">{rh.cpf}</td>
                              <td className="p-2">{rh.cargo}</td>
                              <td className="p-2">{rh.local_nome}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {abaAnexoAtiva === "anexo7" && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-sm">Anexo VII — Demonstrativo de Materiais</h4>
                    <div className="overflow-x-auto border rounded-md">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-muted/50 border-b font-semibold">
                          <tr>
                            <th className="p-2">Item</th>
                            <th className="p-2">Tipo</th>
                            <th className="p-2 text-center">Previsto</th>
                            <th className="p-2 text-center">Adquirido</th>
                            <th className="p-2">Destinação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {corpoExecutivo.materiais_resumo.map((m, idx) => (
                            <tr key={idx}>
                              <td className="p-2 font-semibold">{m.item}</td>
                              <td className="p-2">{m.tipo}</td>
                              <td className="p-2 text-center">{m.quantidade_prevista}</td>
                              <td className="p-2 text-center font-bold text-green-600">{m.quantidade_adquirida}</td>
                              <td className="p-2">{m.destinacao}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {(abaAnexoAtiva === "anexo3" || abaAnexoAtiva === "anexo5" || abaAnexoAtiva === "anexo8") && (
                  <div className="py-6 text-center text-muted-foreground text-xs italic">
                    Visualização compilada gerada no corpo executivo com base nas sessões e metas apuradas.
                  </div>
                )}
              </CardContent>
            </Card>
          </Tabs>
        </TabsContent>

        {/* ABA 3: PARECERES & TRÍPLICE ASSINATURA */}
        <TabsContent value="pareceres" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold">Pareceres Dissertativos & Tríplice Assinatura</CardTitle>
              <CardDescription className="text-xs">
                Edite os textos formais que acompanharão o documento executivo protocolado perante o Concedente.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">1. Resumo da Execução no Período:</Label>
                <Textarea
                  value={resumoExecucao}
                  onChange={(e) => setResumoExecucao(e.target.value)}
                  rows={3}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">2. Análise do Cumprimento de Metas:</Label>
                <Textarea
                  value={analiseMetas}
                  onChange={(e) => setAnaliseMetas(e.target.value)}
                  rows={3}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">3. Resultados Alcançados & Impacto Social:</Label>
                <Textarea
                  value={resultadosAlcancados}
                  onChange={(e) => setResultadosAlcancados(e.target.value)}
                  rows={3}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">4. Conclusão & Atesto Formal:</Label>
                <Textarea
                  value={conclusao}
                  onChange={(e) => setConclusao(e.target.value)}
                  rows={3}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Nome da Coordenação Geral:</Label>
                  <Input
                    value={coordenadorNome}
                    onChange={(e) => setCoordenadorNome(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Nome do Representante Legal da OSC:</Label>
                  <Input
                    value={representanteNome}
                    onChange={(e) => setRepresentanteNome(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA 4: HISTÓRICO DE VERSÕES & RETIFICAÇÕES (§3.9.7) */}
        <TabsContent value="historico" className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold">Histórico de Versões & Trilhas de Auditoria</CardTitle>
              <CardDescription className="text-xs">
                Princípio de imutabilidade point-in-time: retificações não sobrescrevem versões homologadas, gerando versões incrementais auditadas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {relatoriosAnteriores.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-6 text-center">
                  Nenhuma versão homologada anteriormente para este período.
                </p>
              ) : (
                relatoriosAnteriores.map((rel) => (
                  <div
                    key={rel.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">Versão {rel.versao}</span>
                        <Badge variant={rel.status === "fechado" ? "default" : "outline"} className="text-[10px]">
                          {rel.status === "fechado" ? "Vigente & Fechado" : "Retificado (Arquivado)"}
                        </Badge>
                      </div>
                      <span className="text-muted-foreground block">
                        {rel.fechado_em
                          ? `Fechado em ${new Date(rel.fechado_em).toLocaleString("pt-BR")}`
                          : "Em Aberto"}
                      </span>
                      {rel.motivo_retificacao && (
                        <p className="text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/20 p-1.5 rounded border border-amber-200 text-[11px] mt-1">
                          <strong>Motivo da retificação:</strong> {rel.motivo_retificacao}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal 1: Fechamento Oficial (Snapshot Imutável) */}
      <Dialog open={modalFecharAberto} onOpenChange={setModalFecharAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600">
              <Lock className="h-5 w-5" />
              Homologar e Fechar Relatório Master Oficial?
            </DialogTitle>
            <DialogDescription className="text-xs pt-1 space-y-2">
              <p>
                Ao homologar o Relatório Master do período <strong>&ldquo;{rotuloPeriodo}&rdquo;</strong>, o sistema:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                <li>Congelará as 16 seções e os 8 anexos em um snapshot imutável em JSON;</li>
                <li>Conferirá fé pública para fins de prestação de contas governamental perante o Concedente;</li>
                <li>Qualquer ajuste futuro deverá ser feito via emissão de versão retificadora auditada (v2).</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setModalFecharAberto(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleFecharOficial} disabled={isPending} className="bg-blue-600 hover:bg-blue-700">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Confirmar Fechamento com Fé Pública
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal 2: Emitir Retificação Auditada (v1 -> v2) */}
      <Dialog open={modalRetificarAberto} onOpenChange={setModalRetificarAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <History className="h-5 w-5" />
              Emitir Versão Retificadora Oficial (v{versaoAtual + 1})
            </DialogTitle>
            <DialogDescription className="text-xs pt-1">
              Conforme o §3.9.7.4, a versão anterior (v{versaoAtual}) será arquivada preservando a trilha de auditoria do Concedente. A justificativa formal é obrigatória.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2 text-xs">
            <Label className="text-xs font-semibold">Motivo Formal da Retificação (Mínimo 15 caracteres):</Label>
            <Textarea
              placeholder="Ex: Diligência do Concedente atendida referente à retificação da carga horária docente no polo Centro..."
              value={motivoRetificacao}
              onChange={(e) => setMotivoRetificacao(e.target.value)}
              rows={3}
              className="text-xs"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setModalRetificarAberto(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleRetificarOficial}
              disabled={isPending || motivoRetificacao.trim().length < 15}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Emitir Nova Versão Retificadora (v{versaoAtual + 1})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
