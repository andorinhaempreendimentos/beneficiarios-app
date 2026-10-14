import { NextResponse, type NextRequest } from "next/server";
import { executarSalvaguardaSessoes } from "@/lib/actions/salvaguardas";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const resultado = await executarSalvaguardaSessoes();
  return NextResponse.json(resultado);
}

export async function POST(request: NextRequest) {
  return GET(request);
}
