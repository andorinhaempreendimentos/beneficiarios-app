"use client";

import React, { useState } from "react";
import type {
  DadosPublicosLocal,
  GrupoPublico,
  ResultadoAutoinscricao,
} from "@/lib/actions/autoinscricao";
import {
  buscarBeneficiarioPublicoCpf,
  submeterAutoinscricao,
} from "@/lib/actions/autoinscricao";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  MapPin,
  Trophy,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
  RotateCcw,
} from "lucide-react";
import { maskCpf, maskPhone, unmask } from "@/lib/utils/masks";

interface FormularioInscricaoPublicaProps {
  local: DadosPublicosLocal["local"];
  objeto: DadosPublicosLocal["objeto"];
  grupos: GrupoPublico[];
  perguntas: DadosPublicosLocal["perguntas"];
  grupoInicialId?: string;
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

function calcularIdade(dataNasc: string) {
  if (!dataNasc) return null;
  const hoje = new Date();
  const nasc = new Date(dataNasc);
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
    idade--;
  }
  return idade;
}

export function FormularioInscricaoPublica({
  local,
  objeto,
  grupos,
  perguntas,
  grupoInicialId,
}: FormularioInscricaoPublicaProps) {
  const termoBeneficiario = objeto.termo_beneficiario;
  const termoGrupo = objeto.termo_grupo;
  const termoLocal = objeto.termo_local;

  // Grupo selecionado
  const [selectedGrupoId, setSelectedGrupoId] = useState<string>(
    grupoInicialId || (grupos.length === 1 ? grupos[0].id : "")
  );

  const selectedGrupo = grupos.find((g) => g.id === selectedGrupoId) || null;

  // Estado do formulário civil
  const [cpf, setCpf] = useState("");
  const [cpfBuscado, setCpfBuscado] = useState(false);
  const [beneficiarioEncontrado, setBeneficiarioEncontrado] = useState(false);

  const [nomeCompleto, setNomeCompleto] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [genero, setGenero] = useState<"M" | "F" | "Outro" | "Nao_informado">("M");
  const [telefone, setTelefone] = useState("");
  const [nomeResponsavel, setNomeResponsavel] = useState("");
  const [telefoneResponsavel, setTelefoneResponsavel] = useState("");

  // Vulnerabilidade & Perguntas customizadas
  const [vulneravel, setVulneravel] = useState(false);
  const [respostasCustomizadas, setRespostasCustomizadas] = useState<
    Record<string, unknown>
  >({});

  // Submissão e resultado
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [erroMensagem, setErroMensagem] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoAutoinscricao | null>(null);

  // Verificação de idade em tempo real
  const idadeAtual = calcularIdade(dataNascimento);
  const isMenorDeIdade = idadeAtual !== null && idadeAtual < 18;

  let idadeIncompativel = false;
  if (selectedGrupo && idadeAtual !== null) {
    if (
      idadeAtual < selectedGrupo.faixa_etaria_min ||
      idadeAtual > selectedGrupo.faixa_etaria_max
    ) {
      idadeIncompativel = true;
    }
  }

  // Busca automática por CPF
  const handleCpfChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const formatted = maskCpf(rawVal);
    setCpf(formatted);

    const pureDigits = unmask(formatted);
    if (pureDigits.length === 11) {
      const achado = await buscarBeneficiarioPublicoCpf(pureDigits);
      setCpfBuscado(true);
      if (achado) {
        setBeneficiarioEncontrado(true);
        setNomeCompleto(achado.nome_completo || "");
        setDataNascimento(achado.data_nascimento || "");
        setGenero(achado.genero || "M");
        setTelefone(achado.telefone ? maskPhone(achado.telefone) : "");
        setNomeResponsavel(achado.nome_responsavel || "");
        setTelefoneResponsavel(
          achado.telefone_responsavel
            ? maskPhone(achado.telefone_responsavel)
            : ""
        );
      } else {
        setBeneficiarioEncontrado(false);
      }
    } else {
      setCpfBuscado(false);
      setBeneficiarioEncontrado(false);
    }
  };

  const handleCustomAnswerChange = (perguntaId: string, val: unknown) => {
    setRespostasCustomizadas((prev) => ({
      ...prev,
      [perguntaId]: val,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroMensagem(null);

    if (!selectedGrupoId) {
      setErroMensagem(`Por favor, selecione um ${termoGrupo} para se inscrever.`);
      return;
    }

    if (idadeIncompativel) {
      setErroMensagem(
        `A idade informada (${idadeAtual} anos) não atende aos requisitos deste ${termoGrupo} (${selectedGrupo?.faixa_etaria_min} a ${selectedGrupo?.faixa_etaria_max} anos).`
      );
      return;
    }

    if (isMenorDeIdade && !nomeResponsavel.trim()) {
      setErroMensagem(
        "Para menores de 18 anos, o nome do responsável legal é obrigatório."
      );
      return;
    }

    // Validar perguntas obrigatórias
    for (const p of perguntas) {
      if (p.obrigatorio) {
        const resp = respostasCustomizadas[p.id];
        if (resp === undefined || resp === null || resp === "") {
          setErroMensagem(
            `A pergunta "${p.titulo}" é de resposta obrigatória.`
          );
          return;
        }
      }
    }

    setIsSubmitting(true);

    try {
      const res = await submeterAutoinscricao({
        objeto_id: objeto.id,
        grupo_id: selectedGrupoId,
        nome_completo: nomeCompleto.trim(),
        cpf: cpf.replace(/\D/g, ""),
        data_nascimento: dataNascimento,
        genero,
        telefone: telefone.replace(/\D/g, "") || null,
        nome_responsavel: isMenorDeIdade ? nomeResponsavel.trim() : null,
        telefone_responsavel:
          isMenorDeIdade && telefoneResponsavel
            ? telefoneResponsavel.replace(/\D/g, "")
            : null,
        vulneravel,
        dados_adicionais: respostasCustomizadas,
      });

      if (!res.success) {
        setErroMensagem(res.error || "Ocorreu um erro ao processar a inscrição.");
      } else {
        setResultado(res);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Erro ao enviar formulário.";
      setErroMensagem(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestart = () => {
    setResultado(null);
    setCpf("");
    setNomeCompleto("");
    setDataNascimento("");
    setTelefone("");
    setNomeResponsavel("");
    setTelefoneResponsavel("");
    setVulneravel(false);
    setRespostasCustomizadas({});
    setCpfBuscado(false);
    setBeneficiarioEncontrado(false);
  };

  // Se já tiver submetido com sucesso: tela de confirmação
  if (resultado && resultado.success) {
    const isAtiva = resultado.status === "ativa";

    return (
      <div className="min-h-screen bg-muted/20 py-8 px-4 flex items-center justify-center">
        <Card className="w-full max-w-lg border-2 shadow-xl bg-card">
          <CardContent className="pt-8 pb-8 px-6 text-center space-y-6">
            {isAtiva ? (
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
            ) : (
              <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Clock className="w-10 h-10" />
              </div>
            )}

            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {isAtiva
                  ? "Inscrição Confirmada com Sucesso!"
                  : "Inscrição Registrada na Fila de Espera!"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isAtiva
                  ? `Parabéns! Sua vaga no ${termoGrupo} está garantida.`
                  : `As vagas imediatas deste ${termoGrupo} foram preenchidas. Você está garantido na fila oficial.`}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-border bg-muted/40 text-left space-y-2.5 text-xs">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">{termoBeneficiario}:</span>
                <span className="font-bold text-foreground">{nomeCompleto}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">{termoGrupo}:</span>
                <span className="font-bold text-primary">
                  {resultado.grupo_nome}
                </span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">{termoLocal}:</span>
                <span className="font-semibold text-foreground">{local.nome}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Situação:</span>
                {isAtiva ? (
                  <Badge className="bg-emerald-600 text-white">Vaga Ativa</Badge>
                ) : (
                  <Badge variant="outline" className="text-amber-600 border-amber-400 font-bold">
                    Posição #{resultado.posicao_fila} na Fila
                  </Badge>
                )}
              </div>
            </div>

            <div className="text-xs text-muted-foreground bg-primary/5 border border-primary/20 rounded-lg p-3">
              {isAtiva ? (
                <span>
                  Compareça no polo no primeiro dia e horário previsto munido de
                  documento com foto. Em caso de dúvidas, a coordenação entrará em
                  contato pelo telefone cadastrado.
                </span>
              ) : (
                <span>
                  Assim que surgir uma vaga disponível, entraremos em contato
                  diretamente pelo telefone ou WhatsApp informado. Guarde esta
                  confirmação.
                </span>
              )}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => window.print()}
              >
                Imprimir / Salvar
              </Button>
              <Button className="flex-1" onClick={handleRestart}>
                <RotateCcw className="mr-2 h-4 w-4" /> Nova Inscrição
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 py-8 px-4 flex flex-col items-center">
      <div className="w-full max-w-2xl space-y-6">
        {/* Top Header Institucional */}
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs px-3 py-1 font-medium bg-background">
            {objeto.nome}
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Formulário de Inscrição Oficial
          </h1>
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <span>
              {local.nome}
              {local.endereco_bairro ? ` — ${local.endereco_bairro}` : ""}
              {local.endereco_cidade ? `, ${local.endereco_cidade}` : ""}
            </span>
          </p>
        </div>

        {/* Escolha do Grupo / Turma */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                Selecione o {termoGrupo} Desejado
              </h2>
              <p className="text-xs text-muted-foreground">
                Escolha o horário e modalidade correspondente à sua faixa etária.
              </p>
            </div>
            <Badge variant="secondary" className="text-xs">
              {grupos.length} opções
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {grupos.map((g) => {
              const isSelected = g.id === selectedGrupoId;
              const hasVacancies = g.vagas_disponiveis > 0;

              return (
                <div
                  key={g.id}
                  onClick={() => setSelectedGrupoId(g.id)}
                  className={`p-3.5 rounded-lg border-2 cursor-pointer transition-all space-y-2 ${
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border/80 bg-background hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold text-sm text-foreground block">
                        {g.nome}
                      </span>
                      {g.modalidade_nome && (
                        <span className="text-xs text-muted-foreground">
                          {g.modalidade_nome}
                        </span>
                      )}
                    </div>

                    {hasVacancies ? (
                      <Badge className="text-[10px] bg-emerald-600 text-white shrink-0">
                        {g.vagas_disponiveis} vagas
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-400 shrink-0">
                        Fila de Espera
                      </Badge>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1 pt-1 border-t border-border/50">
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      <span>
                        Faixa Etária: {g.faixa_etaria_min} a {g.faixa_etaria_max} anos
                      </span>
                    </div>

                    {g.blocos.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          {g.blocos.map((b, idx) => (
                            <span key={b.id}>
                              {idx > 0 && ", "}
                              {b.dia_semana !== null
                                ? DIAS_SEMANA[b.dia_semana].slice(0, 3)
                                : "Data"}
                              {" "}
                              {b.hora_inicio.slice(0, 5)}
                            </span>
                          ))}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {selectedGrupo && (
            <div className="p-3 rounded-lg bg-muted/40 border border-border flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Opção Selecionada:</span>
              <span className="font-bold text-primary">
                {selectedGrupo.nome} ({selectedGrupo.faixa_etaria_min} a {selectedGrupo.faixa_etaria_max} anos)
              </span>
            </div>
          )}
        </div>

        {/* Formulário de Inscrição */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {erroMensagem && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2.5">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{erroMensagem}</span>
            </div>
          )}

          {/* Seção 1: Dados Civis Universais (§3.3) */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
            <div className="border-b pb-3">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                1. Dados Civis do {termoBeneficiario}
              </h2>
              <p className="text-xs text-muted-foreground">
                Informe o CPF para validação automática ou reaproveitamento inteligente do cadastro.
              </p>
            </div>

            {/* CPF com Busca Automática */}
            <div className="space-y-1.5">
              <Label htmlFor="cpf">
                CPF do {termoBeneficiario} <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="cpf"
                  required
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={handleCpfChange}
                  maxLength={14}
                  className="font-mono text-sm pr-10"
                />
                {beneficiarioEncontrado && (
                  <Check className="h-4 w-4 text-emerald-600 absolute right-3 top-3" />
                )}
              </div>

              {cpfBuscado && beneficiarioEncontrado && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 pt-1">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>
                    Cadastro localizado na base pública! Dados civis sincronizados automaticamente.
                  </span>
                </div>
              )}
            </div>

            {/* Nome Completo */}
            <div className="space-y-1.5">
              <Label htmlFor="nome_completo">
                Nome Completo do {termoBeneficiario} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nome_completo"
                required
                placeholder="Ex: Gabriel Souza Santos"
                value={nomeCompleto}
                onChange={(e) => setNomeCompleto(e.target.value)}
              />
            </div>

            {/* Data de Nascimento & Gênero */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="data_nascimento">
                  Data de Nascimento <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="data_nascimento"
                  type="date"
                  required
                  value={dataNascimento}
                  onChange={(e) => setDataNascimento(e.target.value)}
                />
                {idadeAtual !== null && (
                  <p className={`text-xs ${idadeIncompativel ? "text-destructive font-bold" : "text-muted-foreground"}`}>
                    Idade calculada: {idadeAtual} anos
                    {idadeIncompativel && ` (Incompatível com o ${termoGrupo}: ${selectedGrupo?.faixa_etaria_min} a ${selectedGrupo?.faixa_etaria_max} anos)`}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="genero">
                  Gênero <span className="text-destructive">*</span>
                </Label>
                <select
                  id="genero"
                  value={genero}
                  onChange={(e) =>
                    setGenero(
                      e.target.value as "M" | "F" | "Outro" | "Nao_informado"
                    )
                  }
                  className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                  <option value="Outro">Outro</option>
                  <option value="Nao_informado">Prefiro não informar</option>
                </select>
              </div>
            </div>

            {/* Telefone / WhatsApp */}
            <div className="space-y-1.5">
              <Label htmlFor="telefone">Telefone / WhatsApp para Contato</Label>
              <Input
                id="telefone"
                placeholder="(00) 00000-0000"
                value={telefone}
                onChange={(e) => setTelefone(maskPhone(e.target.value))}
                maxLength={15}
              />
              <p className="text-[11px] text-muted-foreground">
                Importante para avisos de início das aulas e confirmação de vaga.
              </p>
            </div>

            {/* Responsável Legal (Obrigatório se < 18 anos) */}
            {isMenorDeIdade && (
              <div className="p-4 rounded-lg border border-amber-300/80 bg-amber-500/10 space-y-3">
                <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold text-xs">
                  <AlertCircle className="h-4 w-4" />
                  <span>
                    Participante menor de 18 anos — Identificação do Responsável Obrigatória
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="nome_responsavel" className="text-xs">
                      Nome do Responsável Legal <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="nome_responsavel"
                      required={isMenorDeIdade}
                      placeholder="Nome completo do pai, mãe ou tutor"
                      value={nomeResponsavel}
                      onChange={(e) => setNomeResponsavel(e.target.value)}
                      className="bg-background"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="telefone_responsavel" className="text-xs">
                      Telefone do Responsável
                    </Label>
                    <Input
                      id="telefone_responsavel"
                      placeholder="(00) 00000-0000"
                      value={telefoneResponsavel}
                      onChange={(e) =>
                        setTelefoneResponsavel(maskPhone(e.target.value))
                      }
                      maxLength={15}
                      className="bg-background"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Seção 2: Perguntas Customizadas do Convênio (§3.3.2) */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-sm">
            <div className="border-b pb-3">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                2. Informações Complementares do Projeto
              </h2>
              <p className="text-xs text-muted-foreground">
                Perguntas específicas requeridas para este convênio ({objeto.nome}).
              </p>
            </div>

            {/* Cota de Vulnerabilidade Social */}
            <div className="p-3.5 rounded-lg border border-border bg-muted/20 space-y-1">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={vulneravel}
                  onChange={(e) => setVulneravel(e.target.checked)}
                  className="h-4 w-4 mt-0.5 rounded border-input text-primary focus:ring-ring"
                />
                <div>
                  <span className="text-xs font-semibold text-foreground block">
                    Família em situação de vulnerabilidade social / CadÚnico
                  </span>
                  <span className="text-[11px] text-muted-foreground block">
                    Marque caso o participante pertença a família beneficiária do
                    Bolsa Família, inscrita no CadÚnico ou encaminhada por CRAS/escola pública.
                  </span>
                </div>
              </label>
            </div>

            {/* Perguntas Customizadas */}
            {perguntas.map((p) => {
              const respostaAtual = respostasCustomizadas[p.id] as string | undefined;

              return (
                <div key={p.id} className="space-y-1.5 pt-1">
                  <Label htmlFor={`pergunta_${p.id}`}>
                    {p.titulo}{" "}
                    {p.obrigatorio && <span className="text-destructive">*</span>}
                  </Label>

                  {p.tipo === "texto_curto" && (
                    <Input
                      id={`pergunta_${p.id}`}
                      required={p.obrigatorio}
                      value={respostaAtual || ""}
                      onChange={(e) =>
                        handleCustomAnswerChange(p.id, e.target.value)
                      }
                      placeholder="Digite sua resposta..."
                    />
                  )}

                  {p.tipo === "opcoes" && (
                    <select
                      id={`pergunta_${p.id}`}
                      required={p.obrigatorio}
                      value={respostaAtual || ""}
                      onChange={(e) =>
                        handleCustomAnswerChange(p.id, e.target.value)
                      }
                      className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="">Selecione uma opção...</option>
                      {p.opcoes.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  )}

                  {p.tipo === "sim_nao" && (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={respostaAtual === "Sim" ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => handleCustomAnswerChange(p.id, "Sim")}
                      >
                        Sim
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={respostaAtual === "Não" ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => handleCustomAnswerChange(p.id, "Não")}
                      >
                        Não
                      </Button>
                    </div>
                  )}

                  {p.tipo === "numero" && (
                    <Input
                      id={`pergunta_${p.id}`}
                      type="number"
                      required={p.obrigatorio}
                      value={respostaAtual || ""}
                      onChange={(e) =>
                        handleCustomAnswerChange(p.id, e.target.value)
                      }
                      placeholder="0"
                    />
                  )}

                  {p.tipo === "data" && (
                    <Input
                      id={`pergunta_${p.id}`}
                      type="date"
                      required={p.obrigatorio}
                      value={respostaAtual || ""}
                      onChange={(e) =>
                        handleCustomAnswerChange(p.id, e.target.value)
                      }
                    />
                  )}

                  {p.tipo === "arquivo" && (
                    <Input
                      id={`pergunta_${p.id}`}
                      type="text"
                      placeholder="Nome do arquivo ou link do documento"
                      value={respostaAtual || ""}
                      onChange={(e) =>
                        handleCustomAnswerChange(p.id, e.target.value)
                      }
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Botão de Envio */}
          <Button
            type="submit"
            disabled={isSubmitting || idadeIncompativel || !selectedGrupoId}
            className="w-full h-11 text-base font-semibold shadow-md"
          >
            {isSubmitting ? (
              "Processando Inscrição..."
            ) : (
              <span className="flex items-center gap-2">
                <span>Confirmar Inscrição</span>
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>

          <p className="text-center text-[11px] text-muted-foreground">
            Ao confirmar, declaro que as informações prestadas são verdadeiras e
            estou ciente do regulamento do projeto.
          </p>
        </form>
      </div>
    </div>
  );
}
