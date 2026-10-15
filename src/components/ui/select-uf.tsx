"use client";

import React from "react";
import { ESTADOS_BRASIL } from "@/lib/constants/estados";
import { cn } from "@/lib/utils";

export interface SelectUfProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  placeholder?: string;
  showFullName?: boolean;
  onValueChange?: (value: string) => void;
}

export const SelectUf = React.forwardRef<HTMLSelectElement, SelectUfProps>(
  (
    {
      className,
      placeholder = "Selecione a UF",
      showFullName = true,
      onChange,
      onValueChange,
      ...props
    },
    ref
  ) => {
    function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
      onChange?.(e);
      onValueChange?.(e.target.value);
    }

    return (
      <select
        ref={ref}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        onChange={handleChange}
        {...props}
      >
        <option value="">{placeholder}</option>
        {ESTADOS_BRASIL.map((estado) => (
          <option key={estado.sigla} value={estado.sigla}>
            {showFullName ? `${estado.sigla} — ${estado.nome}` : estado.sigla}
          </option>
        ))}
      </select>
    );
  }
);

SelectUf.displayName = "SelectUf";
