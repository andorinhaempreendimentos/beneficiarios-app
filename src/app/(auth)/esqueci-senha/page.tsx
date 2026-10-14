"use client";

import { useActionState } from "react";
import Link from "next/link";
import { esqueciSenhaAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, KeyRound } from "lucide-react";

type State = { success?: boolean; error?: string } | null;

export default function EsqueciSenhaPage() {
  const [state, formAction, pending] = useActionState<State, FormData>(
    esqueciSenhaAction,
    null
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <KeyRound className="h-5 w-5" />
          </div>
          <CardTitle className="text-2xl">Recuperar Senha</CardTitle>
          <CardDescription>
            Informe seu e-mail para receber as instruções de redefinição de acesso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {state?.success ? (
            <div className="flex flex-col gap-4 text-center">
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 text-left text-xs">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <p>
                  Link enviado com sucesso! Verifique a sua caixa de entrada (e a pasta de spam) para cadastrar sua nova senha.
                </p>
              </div>
              <Link href="/login" className="w-full">
                <Button variant="outline" className="w-full gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar para o Login
                </Button>
              </Link>
            </div>
          ) : (
            <form action={formAction} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">E-mail Cadastrado</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="voce@exemplo.com"
                  required
                  autoComplete="email"
                />
              </div>

              {state?.error && (
                <p className="text-sm text-destructive">{state.error}</p>
              )}

              <Button type="submit" disabled={pending} className="w-full">
                {pending ? "Enviando link…" : "Enviar link de recuperação"}
              </Button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Voltar para o Login
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
