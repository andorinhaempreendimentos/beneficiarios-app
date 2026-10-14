import { redirect } from "next/navigation";

interface PesquisaAliasPageProps {
  params: Promise<{ token: string }>;
}

export default async function PesquisaAliasPage({
  params,
}: PesquisaAliasPageProps) {
  const { token } = await params;
  redirect(`/r/${token}`);
}
