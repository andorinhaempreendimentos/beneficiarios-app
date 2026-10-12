"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Objeto, Vocabulario } from "./types";

interface ObjetoContextValue {
  objeto: Objeto | null;
  setObjeto: (objeto: Objeto) => void;
  /**
   * Retorna o valor de um termo dinâmico do objeto ativo.
   * Lança erro explicitamente se não houver objeto ativo ou se o termo for nulo —
   * nunca usa fallback hardcoded (regra AGENTS.md §2.1).
   */
  getTermo: (chave: keyof Vocabulario) => string;
}

const ObjetoContext = createContext<ObjetoContextValue | null>(null);

export function ObjetoProvider({
  children,
  initialObjeto,
}: {
  children: ReactNode;
  initialObjeto?: Objeto | null;
}) {
  const [objeto, setObjetoState] = useState<Objeto | null>(
    initialObjeto ?? null
  );

  const setObjeto = useCallback((o: Objeto) => {
    setObjetoState(o);
  }, []);

  const getTermo = useCallback(
    (chave: keyof Vocabulario): string => {
      if (!objeto) {
        throw new Error(
          `[ObjetoContext] getTermo("${chave}") chamado sem objeto ativo.`
        );
      }
      const valor = objeto[chave];
      if (!valor) {
        throw new Error(
          `[ObjetoContext] termo "${chave}" está vazio/nulo no objeto "${objeto.id}". Verifique os dados no banco.`
        );
      }
      return valor;
    },
    [objeto]
  );

  return (
    <ObjetoContext.Provider value={{ objeto, setObjeto, getTermo }}>
      {children}
    </ObjetoContext.Provider>
  );
}

/**
 * Hook para consumir o contexto do objeto ativo e seu vocabulário dinâmico.
 * Deve ser usado apenas dentro de <ObjetoProvider>.
 */
export function useObjeto(): ObjetoContextValue {
  const ctx = useContext(ObjetoContext);
  if (!ctx) {
    throw new Error(
      "[useObjeto] Hook usado fora de <ObjetoProvider>. Envolva o layout do dashboard com o provider."
    );
  }
  return ctx;
}
