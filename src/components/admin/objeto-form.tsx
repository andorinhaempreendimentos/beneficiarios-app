"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createObjeto, updateObjeto } from "@/lib/actions/objetos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowRight } from "lucide-react";

import type { Database } from "@/lib/database.types";

interface OptionItem {
  id: string;
  nome?: string;
  razao_social?: string;
  nome_fantasia?: string | null;
  sigla?: string | null;
}

interface ObjetoFormProps {
  initialData?: Partial<Database["public"]["Tables"]["objetos"]["Row"]>;
  organizacoes?: OptionItem[];
  concedentes?: OptionItem[];
  modalidades?: OptionItem[];
}

export function ObjetoForm({
  initialData,
}: ObjetoFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    let res;
    if (initialData?.id) {
      res = await updateObjeto(initialData.id, formData);
    } else {
      res = await createObjeto(formData);
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

      {/* 1. Estrutura e Formato (Agnosticidade) */}
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

      {/* 2. Vocabulário Dinâmico (§4.3) */}
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

      {/* 3. Metadados Jurídicos e Contratuais */}
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

          <div className="space-y-2">
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

      <div className="flex items-center justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} className="gap-2">
          <span>{loading ? "Salvando..." : initialData?.id ? "Salvar Alterações" : "Salvar e Continuar"}</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
