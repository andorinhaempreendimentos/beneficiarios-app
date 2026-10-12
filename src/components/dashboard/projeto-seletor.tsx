"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Database } from "@/lib/database.types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, FolderOpen } from "lucide-react";
import { useObjeto } from "@/lib/objeto";

type Objeto = Database["public"]["Tables"]["objetos"]["Row"];

interface ProjetorSeletorProps {
  objetos: Objeto[];
}

export function ProjetoSeletor({ objetos }: ProjetorSeletorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { objeto, setObjeto } = useObjeto();

  function handleSelect(o: Objeto) {
    setObjeto(o);
    // Persiste o objeto ativo na URL
    const params = new URLSearchParams(searchParams.toString());
    params.set("objeto_id", o.id);
    router.push(`?${params.toString()}`);
  }

  if (objetos.length === 0) {
    return (
      <span className="text-sm text-muted-foreground">Nenhum projeto</span>
    );
  }

  // Admin com acesso a apenas 1 objeto: seletor oculto
  if (objetos.length === 1 && objeto) {
    return (
      <span className="text-sm font-medium truncate max-w-[200px]">
        {objeto.nome}
      </span>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm" className="gap-2 max-w-[240px]">
            <FolderOpen className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {objeto ? objeto.nome : "Selecionar projeto"}
            </span>
            <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
          </Button>
        }
      />
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel>Projetos</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {objetos.map((o) => (
          <DropdownMenuItem
            key={o.id}
            onClick={() => handleSelect(o)}
            className="flex items-center justify-between"
          >
            <span className="truncate">{o.nome}</span>
            <Badge variant={o.tipo === "continuo" ? "default" : "secondary"} className="ml-2 shrink-0 text-xs">
              {o.tipo === "continuo" ? "Contínuo" : "Pontual"}
            </Badge>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
