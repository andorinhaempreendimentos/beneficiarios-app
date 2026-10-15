/**
 * Serviço de Integração com o ViaCEP
 * Consulta de código de endereçamento postal com normalização e tratamento de erros.
 */

export interface EnderecoViaCep {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string; // Cidade / Município
  uf: string;
  ibge?: string;
  gia?: string;
  ddd?: string;
  siafi?: string;
  erro?: boolean;
}

export type BuscarCepResultado =
  | {
      success: true;
      data: {
        cep: string;
        logradouro: string;
        bairro: string;
        cidade: string;
        uf: string;
      };
      error?: never;
    }
  | {
      success: false;
      data?: never;
      error: string;
    };

export async function buscarEnderecoPorCep(cep: string): Promise<BuscarCepResultado> {
  const cleanCep = cep.replace(/\D/g, "");

  if (cleanCep.length !== 8) {
    return {
      success: false,
      error: "O CEP deve conter exatamente 8 dígitos numéricos.",
    };
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return {
        success: false,
        error: "Serviço de CEP temporariamente indisponível.",
      };
    }

    const data: EnderecoViaCep = await response.json();

    if (data.erro) {
      return {
        success: false,
        error: "CEP não localizado na base postal.",
      };
    }

    return {
      success: true,
      data: {
        cep: data.cep || cleanCep,
        logradouro: data.logradouro || "",
        bairro: data.bairro || "",
        cidade: data.localidade || "",
        uf: (data.uf || "").toUpperCase(),
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao consultar serviço de CEP.",
    };
  }
}
