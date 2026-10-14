"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createLocal, updateLocal } from "@/lib/actions/locais";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ArrowLeft, Check, Loader2, MapPin } from "lucide-react";
import Link from "next/link";

interface ObjetoOption {
  id: string;
  nome: string;
  termo_local?: string;
}

interface RegiaoOption {
  id: string;
  nome: string;
  objeto_id: string;
}

interface LocalFormProps {
  initialData?: {
    id: string;
    nome: string;
    objeto_id: string;
    regiao_id?: string | null;
    descricao?: string | null;
    endereco_logradouro?: string | null;
    endereco_numero?: string | null;
    endereco_bairro?: string | null;
    endereco_cidade?: string | null;
    endereco_uf?: string | null;
    endereco_cep?: string | null;
    slug?: string | null;
    ativo: boolean;
  };
  objetos: ObjetoOption[];
  regioes: RegiaoOption[];
  isEditing?: boolean;
  onSuccess?: (local: { id: string; nome: string; objeto_id: string }) => void;
  onCancel?: () => void;
  redirectOnCreate?: boolean;
  fixedObjetoId?: string;
}

export function LocalForm({
  initialData,
  objetos,
  regioes,
  isEditing = false,
  onSuccess,
  onCancel,
  redirectOnCreate = true,
  fixedObjetoId,
}: LocalFormProps) {
  const router = useRouter();

  const defaultObjId =
    fixedObjetoId ||
    initialData?.objeto_id ||
    (objetos.length > 0 ? objetos[0].id : "");
  const defaultRegs = regioes.filter((r) => r.objeto_id === defaultObjId);
  const defaultRegId = initialData?.regiao_id ?? "";

  const [formData, setFormData] = useState({
    nome: initialData?.nome ?? "",
    objeto_id: defaultObjId,
    regiao_id: defaultRegId,
    descricao: initialData?.descricao ?? "",
    endereco_logradouro: initialData?.endereco_logradouro ?? "",
    endereco_numero: initialData?.endereco_numero ?? "",
    endereco_bairro: initialData?.endereco_bairro ?? "",
    endereco_cidade: initialData?.endereco_cidade ?? "",
    endereco_uf: initialData?.endereco_uf ?? "",
    endereco_cep: initialData?.endereco_cep ?? "",
    slug: initialData?.slug ?? "",
    ativo: initialData?.ativo ?? true,
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Regiões filtradas pelo objeto selecionado
  const availableRegioes = useMemo(() => {
    if (!formData.objeto_id) return [];
    return regioes.filter((r) => r.objeto_id === formData.objeto_id);
  }, [formData.objeto_id, regioes]);

  function handleObjetoChange(newObjetoId: string) {
    setFormData((prev) => ({
      ...prev,
      objeto_id: newObjetoId,
      regiao_id: "",
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const payload = {
      nome: formData.nome.trim(),
      objeto_id: formData.objeto_id,
      regiao_id: formData.regiao_id ? formData.regiao_id : null,
      descricao: formData.descricao?.trim() || null,
      endereco_logradouro: formData.endereco_logradouro?.trim() || null,
      endereco_numero: formData.endereco_numero?.trim() || null,
      endereco_bairro: formData.endereco_bairro?.trim() || null,
      endereco_cidade: formData.endereco_cidade?.trim() || null,
      endereco_uf: formData.endereco_uf?.trim() || null,
      endereco_cep: formData.endereco_cep?.trim() || null,
      slug: formData.slug?.trim() || null,
      ativo: formData.ativo,
    };

    try {
      if (isEditing && initialData?.id) {
        const result = await updateLocal(initialData.id, payload);
        if (result.success && result.data) {
          setSuccessMsg("Dados do polo atualizados com sucesso!");
          if (onSuccess) {
            onSuccess(result.data);
          } else {
            router.refresh();
          }
        } else {
          setErrorMsg(result.error ?? "Erro ao atualizar dados do polo.");
        }
      } else {
        const result = await createLocal(payload);
        if (result.success && result.data) {
          if (onSuccess) {
            onSuccess(result.data);
          } else if (redirectOnCreate) {
            // Redireciona imediatamente para a página do local já com a aba da grade aberta
            router.push(`/admin/locais/${result.data.id}?tab=grade&created=true`);
          } else {
            router.refresh();
          }
        } else {
          setErrorMsg(result.error ?? "Erro ao criar novo polo.");
        }
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Erro inesperado ao salvar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <CardTitle className="text-xl">
            {isEditing ? `Editar Polo: ${formData.nome}` : "Dados Cadastrais do Novo Polo"}
          </CardTitle>
        </div>
        <CardDescription>
          Regra Canônica §3.2: O Polo Físico é o espaço onde ocorrem as atividades práticas. Ele
          pertence obrigatoriamente a uma Região Territorial vinculada ao Projeto e detém a Grade de
          Horários.
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-lg text-sm bg-destructive/10 text-destructive border border-destructive/20">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-3 rounded-lg text-sm bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Check className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Seção 1: Identificação Institucional */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              1. Identificação & Vinculação Territorial
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="local_nome">Nome do Polo / Local *</Label>
                <Input
                  id="local_nome"
                  value={formData.nome}
                  onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: Polo Esportivo Vila Olímpica, Arena Central, Praça da Juventude..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="local_objeto">Projeto / Objeto Social *</Label>
                <select
                  id="local_objeto"
                  value={formData.objeto_id}
                  onChange={(e) => handleObjetoChange(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  required
                >
                  <option value="" disabled>
                    Selecione o Projeto
                  </option>
                  {objetos.map((obj) => (
                    <option key={obj.id} value={obj.id}>
                      {obj.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="local_regiao">
                  Região Territorial (Opcional)
                </Label>
                <select
                  id="local_regiao"
                  value={formData.regiao_id}
                  onChange={(e) => setFormData((prev) => ({ ...prev, regiao_id: e.target.value }))}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">
                    Nenhuma região vinculada (atribuir na tela de Regiões)
                  </option>
                  {availableRegioes.map((reg) => (
                    <option key={reg.id} value={reg.id}>
                      {reg.nome}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Opcional. Você pode associar polos a regiões na gestão territorial de cada projeto.
                </p>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="local_descricao">Descrição das Instalações & Espaços</Label>
                <Textarea
                  id="local_descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData((prev) => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Ex: Espaço composto por 1 quadra poliesportiva coberta, 1 campo de futebol society e vestiários."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Seção 2: Localização Física */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              2. Endereço e Localização
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="local_logradouro">Logradouro (Rua / Av / Praça)</Label>
                <Input
                  id="local_logradouro"
                  value={formData.endereco_logradouro}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, endereco_logradouro: e.target.value }))
                  }
                  placeholder="Ex: Rua das Palmeiras"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="local_numero">Número</Label>
                <Input
                  id="local_numero"
                  value={formData.endereco_numero}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, endereco_numero: e.target.value }))
                  }
                  placeholder="Ex: 100 ou S/N"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="local_bairro">Bairro</Label>
                <Input
                  id="local_bairro"
                  value={formData.endereco_bairro}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, endereco_bairro: e.target.value }))
                  }
                  placeholder="Ex: Centro"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="local_cidade">Cidade</Label>
                <Input
                  id="local_cidade"
                  value={formData.endereco_cidade}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, endereco_cidade: e.target.value }))
                  }
                  placeholder="Ex: São Paulo"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="local_uf">UF</Label>
                  <Input
                    id="local_uf"
                    value={formData.endereco_uf}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        endereco_uf: e.target.value.toUpperCase().slice(0, 2),
                      }))
                    }
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="local_cep">CEP</Label>
                  <Input
                    id="local_cep"
                    value={formData.endereco_cep}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, endereco_cep: e.target.value }))
                    }
                    placeholder="00000-000"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Seção 3: Autoinscrição & Status */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              3. Parâmetros de Autoinscrição Pública e Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="local_slug">Identificador na URL Pública (Slug)</Label>
                <Input
                  id="local_slug"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                    }))
                  }
                  placeholder="ex: polo-olimpico-norte"
                />
                <p className="text-xs text-muted-foreground">
                  Se deixado em branco, será gerado automaticamente a partir do nome.
                </p>
              </div>

              <div className="space-y-2 flex flex-col justify-end">
                <label className="flex items-center gap-2 cursor-pointer h-10">
                  <input
                    type="checkbox"
                    checked={formData.ativo}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, ativo: e.target.checked }))
                    }
                    className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium">Polo ativo para atividades e matrículas</span>
                </label>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between items-center border-t border-border pt-4">
          {onCancel ? (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Cancelar</span>
            </Button>
          ) : (
            <Link
              href="/admin/locais"
              className={buttonVariants({ variant: "outline", className: "gap-2" })}
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar para Lista de Polos</span>
            </Link>
          )}

          <Button type="submit" disabled={loading} className="gap-2 min-w-36">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : isEditing ? (
              <span>Salvar Alterações</span>
            ) : onSuccess ? (
              <span>Criar Polo</span>
            ) : (
              <span>Salvar e Ir para a Grade</span>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
