"use client";

import { logoutAction } from "@/app/(auth)/login/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import type { Database } from "@/lib/database.types";
import { ProjetoSeletor } from "./projeto-seletor";
import { SidebarTrigger } from "@/components/ui/sidebar";

type Usuario = Database["public"]["Tables"]["usuarios"]["Row"];
type Objeto = Database["public"]["Tables"]["objetos"]["Row"];

interface HeaderProps {
  usuario: Usuario;
  objetos: Objeto[];
}

function getInitials(nome: string | null): string {
  if (!nome) return "U";
  return nome
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function AppHeader({ usuario, objetos }: HeaderProps) {
  return (
    <header className="h-14 border-b border-border flex items-center gap-3 px-4 bg-background">
      <SidebarTrigger className="-ml-1" />

      <div className="flex-1 flex items-center gap-3">
        <ProjetoSeletor objetos={objetos} />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {getInitials(usuario.nome_completo)}
                </AvatarFallback>
              </Avatar>
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="font-normal">
            <p className="font-medium text-sm truncate">
              {usuario.nome_completo ?? "Usuário"}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {usuario.papel?.replace("_", " ")}
            </p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={async () => {
              await logoutAction();
            }}
          >
            <LogOut className="h-4 w-4" />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
