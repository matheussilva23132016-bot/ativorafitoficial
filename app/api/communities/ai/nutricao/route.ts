import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { estimarBF } from "@/lib/communities/bf-estimator";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const { foco, peso_kg, altura_cm, cintura_cm, quadril_cm, sexo, objetivo, obs } = await req.json();

  // Estimativa corporal como contexto para a IA
  let bfContext = "";
  if (peso_kg && altura_cm && cintura_cm) {
    const bf = estimarBF({ sexo: sexo ?? "M", cintura_cm, quadril_cm: quadril_cm ?? cintura_cm, altura_cm, peso_kg });
    bfContext = `BF estimado: ${bf.bf_estimado}% (${bf.classificacao}). ${bf.aviso}`;
  }

  const prompt = `
Você é uma nutricionista esportiva especialista.
Crie um cardápio semanal com base nos dados abaixo.
Retorne SOMENTE JSON válido, sem markdown.

Dados do aluno:
- Foco: ${foco}
- Objetivo: ${objetivo ?? foco}
- Peso: ${peso_kg ?? "não informado"}kg
- Altura: ${altura_cm ?? "não informada"}cm
- ${bfContext}
- Observações: ${obs ?? "nenhuma"}

Formato esperado:
{
  "titulo": "string",
  "calorias_meta": 2400,
  "proteina_meta": 180,
  "carbo_meta": 260,
  "gordura_meta": 70,
  "dias": [
    {
      "dia": "Segunda",
      "refeicoes": [
        {
          "nome": "Café da Manhã",
          "horario": "07:00",
          "alimentos": ["Ovos mexidos (3 unidades)", "Aveia (50g)", "Banana (1 unidade)"],
          "calorias": 450,
          "proteina": 30,
          "carbo": 55,
          "gordura": 12,
          "obs": "string"
        }
      ]
    }
  ]
}

IMPORTANTE: Este cardápio é uma SUGESTÃO BASE para revisão da nutricionista.
Não publique automaticamente. Sempre indicar revisão profissional.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
      max_tokens: 3000,
    });

    const raw = completion.choices[0].message.content ?? "{}";
    const data = JSON.parse(raw);
    return NextResponse.json({ success: true, data, revisao_necessaria: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
