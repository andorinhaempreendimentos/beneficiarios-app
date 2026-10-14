"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { EmptyState } from "@/components/admin/empty-state";
import { toggleObjetoAtivo } from "@/lib/actions/objetos";
import { Plus, Search, FolderKanban, Power, Eye, Calendar } from "lucide-react";

interface ObjetoItem {
  id: string;
  nome: string;
  tipo: string;
  data_inicio: string;
  data_fim: string;
  ativo: boolean;
  municipio: string | null;
  uf: string | null;
  termo_parceria_numero: string | null;
  organizacao: { id: string; razao_social: string; nome_fantasia: string | null } | null;
  concedente: { id: string; nome: string; sigla: string | null; esfera: string } | null;
  modalidade_principal: { id: string; nome: string } | null;
}

interface ObjetosClientProps {
  initialObjetos: ObjetoItem[];
}

export function ObjetosClient({ initialObjetos }: ObjetosClientProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<ObjetoItem | null>(null);

  async function handleToggleAtivo() {
    if (!toggleTarget) return;
    await toggleObjetoAtivo(toggleTarget.id, !toggleTarget.ativo);
    setToggleTarget(null);
  }

  function formatDate(d: string) {
    if (!d) return "—";
    const [ano, mes, dia] = d.split("-");
    if (!ano || !mes || !dia) return d;
    return `${dia}/${mes}/${ano}`;
  }

  const filtered = initialObjetos.filter((obj) => {
    const term = searchTerm.toLowerCase();
    return (
      obj.nome.toLowerCase().includes(term) ||
      (obj.organizacao?.razao_social &&
        obj.organizacao.razao_social.toLowerCase().includes(term)) ||
      (obj.concedente?.nome &&
        obj.concedente.nome.toLowerCase().includes(term)) ||
      (obj.termo_parceria_numero &&
        obj.termo_parceria_numero.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-4">
      {/* Barra de ações superiores */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, OSC, concedente ou número de termo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button render={<Link href="/admin/objetos/novo" />} className="gap-2">
          <Plus className="h-4 w-4" />
          <span>Novo Projeto</span>
        </Button>
      </div>

      {/* Tabela ou estado vazio */}
      {initialObjetos.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="Nenhum projeto (objeto) cadastrado"
          description="Crie o primeiro projeto formalizando a parceria entre Concedente e Organização Social."
          actionLabel="Criar Primeiro Projeto"
          onAction={() => {
            router.push("/admin/objetos/novo");
          }}
        />
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          Nenhum projeto encontrado com o termo &quot;{searchTerm}&quot;.
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Projeto / Objeto</TableHead>
                <TableHead>Formato</TableHead>
                <TableHead>Organização Social</TableHead>
                <TableHead>Concedente</TableHead>
                <TableHead>Vigência</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((obj) => (
                <TableRow key={obj.id}>
                  <TableCell>
                    <Link
                      href={`/admin/objetos/${obj.id}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {obj.nome}
                    </Link>
                    {obj.termo_parceria_numero && (
                      <div className="text-xs text-muted-foreground font-mono">
                        Termo: {obj.termo_parceria_numero}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={obj.tipo === "continuo" ? "default" : "outline"}>
                      {obj.tipo === "continuo" ? "Contínuo" : "Pontual"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {obj.organizacao?.nome_fantasia ||
                      obj.organizacao?.razao_social ||
                      "—"}
                  </TableCell>
                  <TableCell className="text-xs">
                    <div>{obj.concedente?.sigla || obj.concedente?.nome || "—"}</div>
                    {obj.concedente?.esfera && (
                      <span className="text-[10px] text-muted-foreground capitalize">
                        ({obj.concedente.esfera})
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-3 w-3 shrink-0" />
                      <span>
                        {formatDate(obj.data_inicio)} até {formatDate(obj.data_fim)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={obj.ativo ? "default" : "secondary"}>
                      {obj.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        render={<Link href={`/admin/objetos/${obj.id}`} />}
                        title="Ver detalhes e configurações do projeto"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setToggleTarget(obj);
                          setConfirmOpen(true);
                        }}
                        title={obj.ativo ? "Desativar projeto" : "Ativar projeto"}
                        className={
                          obj.ativo
                            ? "text-muted-foreground hover:text-destructive"
                            : "text-emerald-600"
                        }
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Confirmação de Ativação / Desativação */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={toggleTarget?.ativo ? "Desativar Projeto" : "Ativar Projeto"}
        description={
          toggleTarget?.ativo
            ? `Tem certeza que deseja desativar o projeto "${toggleTarget.nome}"? As atividades e acessos a este projeto serão congelados.`
            : `Deseja reativar o projeto "${toggleTarget?.nome}"?`
        }
        confirmLabel={toggleTarget?.ativo ? "Desativar" : "Ativar"}
        variant={toggleTarget?.ativo ? "destructive" : "default"}
        onConfirm={handleToggleAtivo}
      />
    </div>
  );
}
