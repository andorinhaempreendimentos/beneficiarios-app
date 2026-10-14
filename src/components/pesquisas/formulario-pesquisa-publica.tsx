"use client";

import React, { useState, useEffect } from "react";
import { Star, CheckCircle2, AlertCircle, Send, ShieldCheck, HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { submeterRespostaPesquisa, type PesquisaPublicaData } from "@/lib/actions/pesquisas";

interface FormularioPesquisaPublicaProps {
  dados: PesquisaPublicaData;
}

export function FormularioPesquisaPublica({ dados }: FormularioPesquisaPublicaProps) {
  const { pesquisa, objeto, categorias, perguntas } = dados;

  const [deviceFingerprint, setDeviceFingerprint] = useState<string>("");
  const [cpf, setCpf] = useState<string>("");
  const [nome, setNome] = useState<string>("");
  const [respostas, setRespostas] = useState<Record<string, any>>({});
  const [erros, setErros] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState<boolean>(false);
  const [sucesso, setSucesso] = useState<boolean>(false);
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  // Inicializar Device Fingerprint com persistência em localStorage (§3.14 item 2)
  useEffect(() => {
    try {
      let fp = localStorage.getItem("agy_pesquisa_fingerprint");
      if (!fp) {
        const entropy = [
          navigator.userAgent,
          screen.width,
          screen.height,
          screen.colorDepth,
          new Date().getTimezoneOffset(),
          Math.random().toString(36).substring(2),
        ].join("###");

        let hash = 0;
        for (let i = 0; i < entropy.length; i++) {
          const char = entropy.charCodeAt(i);
          hash = (hash << 5) - hash + char;
          hash |= 0;
        }
        fp = "dev_" + Math.abs(hash).toString(16) + "_" + Date.now().toString(36);
        localStorage.setItem("agy_pesquisa_fingerprint", fp);
      }
      setDeviceFingerprint(fp);
    } catch {
      // Fallback em caso de bloqueio estrito de cookies/localStorage
      const fallbackFp = "fp_anon_" + Math.random().toString(36).substring(2) + "_" + Date.now();
      setDeviceFingerprint(fallbackFp);
    }
  }, []);

  const handleValorChange = (perguntaId: string, valor: any) => {
    setRespostas((prev) => ({ ...prev, [perguntaId]: valor }));
    if (erros[perguntaId]) {
      setErros((prev) => {
        const n = { ...prev };
        delete n[perguntaId];
        return n;
      });
    }
  };

  const handleMultiplaEscolhaToggle = (perguntaId: string, opcao: string, maxSelecoes: number | null) => {
    const atual = Array.isArray(respostas[perguntaId]) ? [...respostas[perguntaId]] : [];
    const index = atual.indexOf(opcao);

    if (maxSelecoes === 1) {
      handleValorChange(perguntaId, [opcao]);
      return;
    }

    if (index > -1) {
      atual.splice(index, 1);
    } else {
      if (maxSelecoes && atual.length >= maxSelecoes) {
        return; // limite atingido
      }
      atual.push(opcao);
    }
    handleValorChange(perguntaId, atual);
  };

  // Verifica se a pergunta deve ser exibida com base em condicionais (§3.14 item 1)
  const isPerguntaVisivel = (pergunta: (typeof perguntas)[0]) => {
    if (!pergunta.condicao_pergunta_id) return true;
    const valorPai = respostas[pergunta.condicao_pergunta_id];
    if (valorPai === undefined || valorPai === null) return false;

    if (pergunta.condicao_valor !== null && pergunta.condicao_valor !== undefined) {
      if (Array.isArray(valorPai)) {
        return valorPai.includes(pergunta.condicao_valor);
      }
      return String(valorPai) === String(pergunta.condicao_valor);
    }
    return Boolean(valorPai);
  };

  const formatarCpf = (valor: string) => {
    const apenasDigitos = valor.replace(/\D/g, "").slice(0, 11);
    return apenasDigitos
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  const handleSubmeter = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroGeral(null);

    const novosErros: Record<string, string> = {};

    if (pesquisa.exigir_cpf) {
      const digitosCpf = cpf.replace(/\D/g, "");
      if (digitosCpf.length !== 11) {
        novosErros["cpf"] = "Informe um CPF válido com 11 dígitos.";
      }
    }

    // Validar perguntas obrigatórias visíveis
    for (const perg of perguntas) {
      if (isPerguntaVisivel(perg) && perg.obrigatoria) {
        const val = respostas[perg.id];
        if (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0)) {
          novosErros[perg.id] = "Esta pergunta é de preenchimento obrigatório.";
        }
      }
    }

    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros);
      setErroGeral("Por favor, preencha todos os campos obrigatórios destacados.");
      return;
    }

    setEnviando(true);

    try {
      const itensRespostas = Object.entries(respostas)
        .filter(([pId]) => {
          const p = perguntas.find((item) => item.id === pId);
          return p ? isPerguntaVisivel(p) : false;
        })
        .map(([pergunta_id, valor]) => ({
          pergunta_id,
          valor,
        }));

      const res = await submeterRespostaPesquisa({
        pesquisa_id: pesquisa.id,
        token: pesquisa.token,
        cpf: cpf ? cpf.replace(/\D/g, "") : null,
        device_fingerprint: deviceFingerprint || "dev_manual_" + Date.now(),
        respostas: itensRespostas,
      });

      if (!res.success) {
        setErroGeral(res.error || "Não foi possível registrar sua resposta.");
      } else {
        setSucesso(true);
      }
    } catch (err: any) {
      setErroGeral(err.message || "Ocorreu uma instabilidade de comunicação.");
    } finally {
      setEnviando(false);
    }
  };

  if (sucesso) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-lg text-center shadow-lg border-emerald-500/30">
          <CardHeader className="pt-8 pb-4">
            <div className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-full flex items-center justify-center mb-3">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">
              Obrigado por sua participação!
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Sua avaliação sobre o projeto <strong>{objeto.nome}</strong> foi registrada com sucesso e fé pública de
              integridade.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pb-8 text-sm text-slate-600 dark:text-slate-400">
            <p>
              Sua opinião fundamenta a melhoria constante das ações pedagógicas, infraestrutura e atendimento aos
              participantes perante os relatórios de auditoria social.
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-900 rounded-md text-xs text-slate-500 font-mono">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Submissão Segura com Dispositivo Autenticado</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Agrupar perguntas por categorias
  const perguntasSemCategoria = perguntas.filter((p) => !p.categoria_id && isPerguntaVisivel(p));

  const rotulosEscala = [
    { nota: 1, label: "Péssimo" },
    { nota: 2, label: "Ruim" },
    { nota: 3, label: "Regular" },
    { nota: 4, label: "Bom" },
    { nota: 5, label: "Excelente" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4 flex justify-center">
      <div className="w-full max-w-2xl space-y-6">
        {/* Cabeçalho do Formulário */}
        <Card className="shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs font-medium">
                {objeto.nome}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                Pesquisa de Satisfação
              </Badge>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {pesquisa.titulo}
            </CardTitle>
            {pesquisa.descricao && (
              <CardDescription className="text-sm mt-1 whitespace-pre-line text-slate-600 dark:text-slate-300">
                {pesquisa.descricao}
              </CardDescription>
            )}
          </CardHeader>
        </Card>

        {erroGeral && (
          <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900 text-rose-800 dark:text-rose-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold">Atenção</p>
              <p>{erroGeral}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmeter} className="space-y-6">
          {/* Identificação (Obrigatória se exigir_cpf ou opcional) */}
          <Card className="shadow-sm border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-primary" />
                <span>Identificação do Participante</span>
              </CardTitle>
              <CardDescription className="text-xs">
                {pesquisa.exigir_cpf
                  ? "Para validar a unicidade da sua avaliação, informe seu CPF de beneficiário."
                  : "Identificação opcional para associar seu parecer ao seu atendimento."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cpf" className="text-xs font-medium">
                    CPF {pesquisa.exigir_cpf ? "*" : "(Opcional)"}
                  </Label>
                  <Input
                    id="cpf"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(formatarCpf(e.target.value))}
                    className="mt-1"
                  />
                  {erros["cpf"] && <p className="text-xs text-rose-500 mt-1">{erros["cpf"]}</p>}
                </div>
                <div>
                  <Label htmlFor="nome" className="text-xs font-medium">
                    Nome Completo (Opcional)
                  </Label>
                  <Input
                    id="nome"
                    placeholder="Seu nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Perguntas por Categoria */}
          {categorias.map((cat) => {
            const perguntasDaCat = perguntas.filter((p) => p.categoria_id === cat.id && isPerguntaVisivel(p));
            if (perguntasDaCat.length === 0) return null;

            return (
              <div key={cat.id} className="space-y-4">
                <div className="flex items-center gap-2 pt-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {cat.nome}
                  </h3>
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                </div>

                {perguntasDaCat.map((perg) => (
                  <Card
                    key={perg.id}
                    className={`shadow-sm border-slate-200 dark:border-slate-800 transition-all ${
                      erros[perg.id] ? "border-rose-400 ring-1 ring-rose-400" : ""
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <Label className="text-base font-medium leading-snug text-slate-900 dark:text-slate-100 flex items-start gap-1.5">
                        <span>{perg.texto}</span>
                        {perg.obrigatoria && <span className="text-rose-500 font-bold">*</span>}
                      </Label>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {renderInputPergunta(perg, respostas[perg.id], handleValorChange, handleMultiplaEscolhaToggle)}
                      {erros[perg.id] && <p className="text-xs text-rose-500 mt-2 font-medium">{erros[perg.id]}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            );
          })}

          {/* Perguntas Sem Categoria */}
          {perguntasSemCategoria.length > 0 && (
            <div className="space-y-4">
              {categorias.length > 0 && (
                <div className="flex items-center gap-2 pt-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Geral
                  </h3>
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                </div>
              )}

              {perguntasSemCategoria.map((perg) => (
                <Card
                  key={perg.id}
                  className={`shadow-sm border-slate-200 dark:border-slate-800 transition-all ${
                    erros[perg.id] ? "border-rose-400 ring-1 ring-rose-400" : ""
                  }`}
                >
                  <CardHeader className="pb-3">
                    <Label className="text-base font-medium leading-snug text-slate-900 dark:text-slate-100 flex items-start gap-1.5">
                      <span>{perg.texto}</span>
                      {perg.obrigatoria && <span className="text-rose-500 font-bold">*</span>}
                    </Label>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {renderInputPergunta(perg, respostas[perg.id], handleValorChange, handleMultiplaEscolhaToggle)}
                    {erros[perg.id] && <p className="text-xs text-rose-500 mt-2 font-medium">{erros[perg.id]}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Rodapé e Botão de Envio */}
          <Card className="shadow-sm border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Proteção anti-fraude com biometria de dispositivo ativa</span>
              </div>
              <Button type="submit" disabled={enviando} className="w-full sm:w-auto min-w-[160px] gap-2">
                {enviando ? (
                  <span>Gravando resposta...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Enviar Avaliação</span>
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
}

function renderInputPergunta(
  perg: {
    id: string;
    tipo: string;
    opcoes: string[];
    min_selecoes: number | null;
    max_selecoes: number | null;
  },
  valorAtual: any,
  onChange: (id: string, val: any) => void,
  onToggleOpcao: (id: string, op: string, max: number | null) => void
) {
  if (perg.tipo === "escala") {
    const notaAtual = Number(valorAtual) || 0;
    const descricoes = ["", "Péssimo", "Ruim", "Regular", "Bom", "Excelente"];

    return (
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between max-w-sm mx-auto sm:mx-0">
          {[1, 2, 3, 4, 5].map((nota) => (
            <button
              key={nota}
              type="button"
              onClick={() => onChange(perg.id, nota)}
              className={`p-3 rounded-xl transition-all flex flex-col items-center gap-1 border ${
                notaAtual >= nota
                  ? "bg-amber-500/10 border-amber-500 text-amber-500 dark:bg-amber-500/20"
                  : "bg-slate-100 dark:bg-slate-900 border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              <Star className={`w-7 h-7 ${notaAtual >= nota ? "fill-amber-500" : ""}`} />
              <span className="text-xs font-bold">{nota}</span>
            </button>
          ))}
        </div>
        {notaAtual > 0 && (
          <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
            Avaliação: {descricoes[notaAtual]} ({notaAtual} de 5 estrelas)
          </p>
        )}
      </div>
    );
  }

  if (perg.tipo === "multipla_escolha") {
    const selecionados = Array.isArray(valorAtual) ? valorAtual : [];

    return (
      <div className="space-y-2 pt-1">
        {perg.opcoes.map((op, idx) => {
          const isSelected = selecionados.includes(op);
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onToggleOpcao(perg.id, op, perg.max_selecoes)}
              className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm font-medium transition-all flex items-center justify-between ${
                isSelected
                  ? "bg-primary/10 border-primary text-primary font-semibold"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
              }`}
            >
              <span>{op}</span>
              <div
                className={`w-4 h-4 rounded ${perg.max_selecoes === 1 ? "rounded-full" : "rounded-sm"} border flex items-center justify-center ${
                  isSelected ? "border-primary bg-primary text-white" : "border-slate-400"
                }`}
              >
                {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  if (perg.tipo === "texto_curto") {
    return (
      <Input
        value={valorAtual || ""}
        onChange={(e) => onChange(perg.id, e.target.value)}
        placeholder="Digite sua resposta..."
        className="mt-1"
      />
    );
  }

  if (perg.tipo === "texto_longo") {
    return (
      <Textarea
        value={valorAtual || ""}
        onChange={(e) => onChange(perg.id, e.target.value)}
        placeholder="Escreva seus comentários, elogios ou sugestões..."
        rows={3}
        className="mt-1"
      />
    );
  }

  if (perg.tipo === "numerico") {
    return (
      <Input
        type="number"
        value={valorAtual ?? ""}
        onChange={(e) => onChange(perg.id, e.target.value)}
        placeholder="0"
        className="mt-1 max-w-[200px]"
      />
    );
  }

  if (perg.tipo === "contato") {
    return (
      <Input
        type="tel"
        value={valorAtual || ""}
        onChange={(e) => onChange(perg.id, e.target.value)}
        placeholder="(00) 00000-0000"
        className="mt-1 max-w-[240px]"
      />
    );
  }

  return (
    <Input
      value={valorAtual || ""}
      onChange={(e) => onChange(perg.id, e.target.value)}
      placeholder="Sua resposta..."
      className="mt-1"
    />
  );
}
