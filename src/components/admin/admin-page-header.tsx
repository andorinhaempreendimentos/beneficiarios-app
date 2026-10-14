import React from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  children?: React.ReactNode;
}

export function AdminPageHeader({
  title,
  description,
  backHref,
  backLabel = "Voltar",
  children,
}: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 pb-6 border-b border-border mb-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        {backHref && (
          <Button
            variant="ghost"
            size="sm"
            className="mb-1 -ml-2 text-muted-foreground hover:text-foreground h-7 gap-1"
            render={<Link href={backHref} />}
          >
            <ChevronLeft className="h-4 w-4" />
            <span>{backLabel}</span>
          </Button>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {children}
        </div>
      )}
    </div>
  );
}
