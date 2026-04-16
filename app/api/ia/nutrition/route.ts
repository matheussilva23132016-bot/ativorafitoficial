// app/api/ia/nutrition/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY não configurada no servidor.");
  }

  return new OpenAI({ apiKey });
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, solicitacaoId } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "prompt obrigatório" }, { status: 400 });
    }

    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: `${prompt}

Responda APENAS com um JSON válido, sem markdown, sem explicações, no formato exato abaixo:
{
  "dias": [
    {
      "dia": "Segunda",
      "refeicoes": [
        {
          "id": "uuid-unico",
          "nome": "Café da manhã",
          "horario": "07:00",
          "alimentos": [
            {
              "id": "uuid-unico-alimento",
              "nome": "Nome do Alimento",
              "quantidade": "100g",
              "calorias": 100,
              "proteinas": 10,
              "carbos": 5,
              "gorduras": 2
            }
          ],
          "calorias": 400,
          "proteinas": 30,
          "carboidratos": 45,
          "gorduras": 10,
          "concluida": false
        }
      ]
    }
  ],
  "calorias_dia": 2200,
  "proteinas_dia": 160,
  "obs": "Observações gerais do cardápio"
}

Inclua todos os 7 dias da semana (Segunda, Terça, Quarta, Quinta, Sexta, Sábado, Domingo).
Cada dia deve ter entre 4 e 6 refeições.
Os IDs devem ser strings únicas (use formato ref-dia-numero, ex: ref-seg-1).`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.6,
      max_tokens: 8000,
    });

    const raw = completion.choices[0].message.content ?? "{}";

    // Remove possível markdown residual
    const clean = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let parsed: any;
    try {
      parsed = JSON.parse(clean);
    } catch {
      console.error("====== IA RETORNOU JSON INVÁLIDO ======");
      console.error(raw);
      console.error("=========================================");
      return NextResponse.json(
        { error: "IA retornou formato inválido. Verifique o console da aplicação para detalhes." },
        { status: 422 }
      );
    }

    return NextResponse.json({
      dias:          parsed.dias          ?? [],
      calorias_dia:  parsed.calorias_dia  ?? 2000,
      proteinas_dia: parsed.proteinas_dia ?? 150,
      obs:           parsed.obs           ?? "",
      solicitacaoId,
    });

  } catch (err: any) {
    console.error("[/api/ia/nutrition]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
