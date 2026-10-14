import React from "react";
import { getPesquisas, getAuxiliaresPesquisa } from "@/lib/actions/pesquisas";
import { getWhatsappInstancia, getWhatsappTemplates } from "@/lib/actions/whatsapp";
import { PesquisasClient } from "@/components/pesquisas/pesquisas-client";
import { WhatsappModuloClient } from "@/components/pesquisas/whatsapp-modulo-client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, MessageSquare } from "lucide-react";

export const metadata = {
  title: "Pesquisas de Satisfação & Avaliação de Impacto | Gestão de Beneficiários",
  description:
    "Aferição qualitativa da comunidade e beneficiários para prestação de contas governamental (§3.14).",
};

interface PesquisasPageProps {
  searchParams: Promise<{
    objeto_id?: string;
  }>;
}

export default async function PesquisasPage({ searchParams }: PesquisasPageProps) {
  const resolvedParams = await searchParams;
  const objetoIdFiltro = resolvedParams.objeto_id;

  const data = await getPesquisas(objetoIdFiltro);
  const objetoId = data.objeto?.id || objetoIdFiltro || "";

  const [auxiliares, instanciaWpp, templatesWpp] = await Promise.all([
    objetoId
      ? getAuxiliaresPesquisa(objetoId)
      : Promise.resolve({ locais: [], grupos: [], totalAlunos: 0 }),
    objetoId ? getWhatsappInstancia(objetoId) : Promise.resolve(null),
    objetoId ? getWhatsappTemplates(objetoId) : Promise.resolve([]),
  ]);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Pesquisas & Avaliação de Impacto
          </h2>
          <p className="text-muted-foreground text-sm">
            Aferição de satisfação dos participantes, NPS e comprovação probatória de metas perante o Concedente (§3.14).
          </p>
        </div>
      </div>

      <Tabs defaultValue="pesquisas" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="pesquisas" className="gap-2">
            <ClipboardList className="w-4 h-4" />
            <span>Questionários ({data.pesquisas.length})</span>
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>Central WhatsApp</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pesquisas" className="pt-4">
          <PesquisasClient
            initialPesquisas={data.pesquisas}
            objeto={data.objeto}
            auxiliares={auxiliares}
          />
        </TabsContent>

        <TabsContent value="whatsapp" className="pt-4">
          {data.objeto ? (
            <WhatsappModuloClient
              objeto={data.objeto}
              instanciaInicial={instanciaWpp}
              templatesIniciais={templatesWpp}
              pesquisas={data.pesquisas}
              auxiliares={{ locais: auxiliares.locais, grupos: auxiliares.grupos }}
            />
          ) : (
            <div className="p-8 text-center text-sm text-slate-500">
              Selecione um projeto social ativo para configurar o gateway de WhatsApp.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
