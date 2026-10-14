import { redirect } from "next/navigation";

interface InscricaoTurmaRedirectProps {
  params: Promise<{ grupoId: string }>;
}

export default async function InscricaoTurmaRedirect({
  params,
}: InscricaoTurmaRedirectProps) {
  const { grupoId } = await params;
  redirect(`/inscricao/grupo/${grupoId}`);
}
