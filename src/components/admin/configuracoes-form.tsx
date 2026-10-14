"use client";

import React, { useState } from "react";
import { saveConfiguracoesSistema } from "@/lib/actions/configuracoes";
import type { Database } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, AlertCircle } from "lucide-react";

type Configuracao = Database["public"]["Tables"]["configuracoes_sistema"]["Row"];

interface ConfiguracoesFormProps {
  initialData: Configuracao | null;
}

export function ConfiguracoesForm({ initialData }: ConfiguracoesFormProps) {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [formData, setFormData] = useState({
    razao_social: initialData?.razao_social ?? "",
    cnpj: initialData?.cnpj ?? "",
    email_suporte: initialData?.email_suporte ?? "",
    telefone_suporte: initialData?.telefone_suporte ?? "",
    logradouro: initialData?.logradouro ?? "",
    numero: initialData?.numero ?? "",
    bairro: initialData?.bairro ?? "",
    cidade: initialData?.cidade ?? "",
    uf: initialData?.uf ?? "",
    cep: initialData?.cep ?? "",
    logotipo_url: initialData?.logotipo_url ?? "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);

    const res = await saveConfiguracoesSistema(formData);
    setLoading(false);

    if (res.success) {
      setFeedback({
        type: "success",
        message: "Configurações institucionais atualizadas com sucesso!",
      });
    } else {
      setFeedback({
        type: "error",
        message: res.error ?? "Ocorreu um erro ao salvar as configurações.",
      });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {feedback && (
        <div
          className={`flex items-center gap-2 p-4 rounded-lg text-sm ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : "bg-destructive/10 text-destructive border border-destructive/20"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Dados Cadastrais */}
      <Card>
        <CardHeader>
          <CardTitle>Dados Cadastrais da Entidade Gestora</CardTitle>
          <CardDescription>
            Identificação jurídica oficial da instituição responsável pela administração do sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="razao_social">Razão Social *</Label>
            <Input
              id="razao_social"
              name="razao_social"
              value={formData.razao_social}
              onChange={handleChange}
              placeholder="Ex: Instituto Andorinha de Desenvolvimento Social"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ *</Label>
            <Input
              id="cnpj"
              name="cnpj"
              value={formData.cnpj}
              onChange={handleChange}
              placeholder="00.000.000/0000-00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email_suporte">E-mail Institucional / Suporte</Label>
            <Input
              id="email_suporte"
              name="email_suporte"
              type="email"
              value={formData.email_suporte}
              onChange={handleChange}
              placeholder="suporte@andorinha.org"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone_suporte">Telefone de Contato</Label>
            <Input
              id="telefone_suporte"
              name="telefone_suporte"
              value={formData.telefone_suporte}
              onChange={handleChange}
              placeholder="(11) 99999-9999"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="logotipo_url">URL do Logotipo</Label>
            <Input
              id="logotipo_url"
              name="logotipo_url"
              value={formData.logotipo_url}
              onChange={handleChange}
              placeholder="https://exemplo.com/logo.png"
            />
          </div>
        </CardContent>
      </Card>

      {/* Endereço Sede */}
      <Card>
        <CardHeader>
          <CardTitle>Endereço da Sede</CardTitle>
          <CardDescription>
            Localização física da sede administrativa da organização gestora.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-6">
          <div className="space-y-2 sm:col-span-4">
            <Label htmlFor="logradouro">Logradouro</Label>
            <Input
              id="logradouro"
              name="logradouro"
              value={formData.logradouro}
              onChange={handleChange}
              placeholder="Av. Paulista"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="numero">Número</Label>
            <Input
              id="numero"
              name="numero"
              value={formData.numero}
              onChange={handleChange}
              placeholder="1000, Bloco A"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="bairro">Bairro</Label>
            <Input
              id="bairro"
              name="bairro"
              value={formData.bairro}
              onChange={handleChange}
              placeholder="Bela Vista"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="cidade">Cidade</Label>
            <Input
              id="cidade"
              name="cidade"
              value={formData.cidade}
              onChange={handleChange}
              placeholder="São Paulo"
            />
          </div>

          <div className="space-y-2 sm:col-span-1">
            <Label htmlFor="uf">UF</Label>
            <Input
              id="uf"
              name="uf"
              value={formData.uf}
              onChange={handleChange}
              placeholder="SP"
              maxLength={2}
            />
          </div>

          <div className="space-y-2 sm:col-span-1">
            <Label htmlFor="cep">CEP</Label>
            <Input
              id="cep"
              name="cep"
              value={formData.cep}
              onChange={handleChange}
              placeholder="01310-100"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>
    </form>
  );
}
