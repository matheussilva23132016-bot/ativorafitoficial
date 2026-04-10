import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type RequestBody = {
  foco?: string;
  nivel?: string;
  dias?: number;
  sessoesPorDia?: number;
  alunoNome?: string;
  obs?: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;

    const foco = (body.foco || "").trim();
    const nivel = (body.nivel || "").trim();
    const alunoNome = (body.alunoNome || "Atleta").trim();
    const obs = (body.obs || "Sem observações adicionais.").trim();

    const dias = clamp(Number(body.dias || 0), 1, 7);
    const sessoesPorDia = clamp(Number(body.sessoesPorDia || 0), 1, 4);

    if (!foco || !nivel || !dias || !sessoesPorDia) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Dados inválidos. Envie foco, nível, dias e sessoesPorDia corretamente.",
        },
        { status: 400 }
      );
    }

    const developerPrompt = `
Você é um Head Coach de Performance Humana, Preparador Físico de Alta Performance e Especialista em Periodização, Progressão de Carga, Prescrição de Treino e Organização de Microciclos.

Sua função é montar um microciclo técnico, inteligente, aplicável e profissional para o atleta "${alunoNome}".

OBJETIVO CENTRAL
Criar um plano semanal de treino altamente coerente com o objetivo principal do aluno, respeitando:
- foco principal: ${foco}
- nível do aluno: ${nivel}
- observações adicionais: ${obs}
- número de dias de treino: ${dias}
- número de sessões por dia: ${sessoesPorDia}

REGRAS DE QUALIDADE DO PLANO
- O plano precisa parecer criado por um coach experiente, e não por uma IA genérica.
- A distribuição semanal deve ser lógica, equilibrada e com boa recuperação.
- Evite repetir exatamente os mesmos exercícios sem necessidade.
- A ordem dos exercícios deve fazer sentido: primeiro os mais neurais/técnicos/complexos, depois acessórios, depois complementares.
- Se houver mais de uma sessão no mesmo dia:
  - Sessão 1 = prioridade neural, força, potência, técnica ou exercício principal do objetivo.
  - Sessão 2 em diante = complementar, metabólica, cardio, core, mobilidade, recuperação ativa ou trabalho acessório.
- O treino deve ser adequado ao nível informado:
  - iniciante: menos complexidade, mais estabilidade, menos volume excessivo, execução segura.
  - intermediário: progressão moderada, mais variedade, intensidade controlada.
  - avançado: maior refinamento técnico, maior exigência neural, maior densidade estratégica.
- O plano deve evitar exageros, incoerências e combinações ruins.
- Não escrever explicações longas fora da estrutura.
- Não usar linguagem motivacional.
- Não escrever introdução, conclusão ou observações soltas fora do JSON.
- Entregar SOMENTE JSON válido.

REGRAS TÉCNICAS DE PRESCRIÇÃO
Para cada sessão:
- definir título específico da sessão;
- definir foco da sessão;
- definir duração estimada;
- definir objetivo fisiológico da sessão;
- definir nível de intensidade geral da sessão;
- definir lista de exercícios.

Para cada exercício:
- nome
- séries
- reps
- descanso
- cadencia
- rpe
- observacao técnica curta

REGRAS DOS EXERCÍCIOS
- "cadencia" deve seguir padrão numérico como "3010", "2011", "20X1".
- "rpe" deve estar em escala de 1 a 10.
- "descanso" deve estar em formato curto como "45s", "60s", "90s", "120s".
- "series" deve ser número inteiro.
- "reps" pode ser texto para permitir faixas como "8-10", "30s", "10/10", "12 cada lado".
- "observacao" deve ser curta, objetiva e útil.

LÓGICA DE DISTRIBUIÇÃO SEMANAL
Monte o microciclo respeitando o foco principal do aluno e criando uma sequência inteligente ao longo dos dias.
Exemplos de boa lógica:
- hipertrofia: alternância por grupamentos, volume coerente, distribuição de fadiga;
- emagrecimento: combinação de força + gasto energético + cardio inteligente;
- força: priorização de levantamentos principais, controle de volume, acessórios estratégicos;
- condicionamento: blocos metabólicos, resistência, cardio e recuperação;
- recomposição corporal: força + hipertrofia + trabalho metabólico;
- mobilidade/retorno: menor agressividade, estabilidade, controle motor e progressão gradual.

IMPORTANTE
- Não use "manhã", "tarde" ou "noite".
- Use apenas "sessao_numero": 1, 2, 3...
- Dias devem estar nomeados em português.
- Gere exatamente ${dias} dias.
- Cada dia deve conter exatamente ${sessoesPorDia} sessões.
- Não deixar campos vazios.
- Não inventar campos fora do schema.
- O JSON precisa ser consistente e pronto para uso no app.

SCHEMA CONCEITUAL DO CONTEÚDO
Cada item em "workouts" representa uma sessão individual, não um dia inteiro.
Então, se forem 5 dias com 2 sessões por dia, o array final terá 10 objetos.

EXEMPLO DE RACIOCÍNIO ESPERADO
- Dia 1 / Sessão 1: sessão principal e mais importante da semana ou do bloco.
- Dia 1 / Sessão 2: complemento estratégico.
- Dias seguintes: progressão lógica sem bagunça, sem redundância excessiva e sem conflito entre estímulos.

RETORNO OBRIGATÓRIO
Retorne apenas JSON válido no formato exigido.
`;

    const userPrompt = `
Gere agora o microciclo completo para:
- Aluno: ${alunoNome}
- Foco: ${foco}
- Nível: ${nivel}
- Dias: ${dias}
- Sessões por dia: ${sessoesPorDia}
- Observações: ${obs}

Lembre:
- exatamente ${dias * sessoesPorDia} sessões no total;
- saída somente em JSON;
- conteúdo técnico, organizado e utilizável no app.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.5,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "microciclo_elite",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              workouts: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    dia: {
                      type: "string",
                    },
                    sessao_numero: {
                      type: "integer",
                    },
                    titulo: {
                      type: "string",
                    },
                    foco: {
                      type: "string",
                    },
                    objetivo_fisiologico: {
                      type: "string",
                    },
                    intensidade_geral: {
                      type: "string",
                    },
                    tempo: {
                      type: "string",
                    },
                    exercicios: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: false,
                        properties: {
                          nome: {
                            type: "string",
                          },
                          series: {
                            type: "integer",
                          },
                          reps: {
                            type: "string",
                          },
                          descanso: {
                            type: "string",
                          },
                          cadencia: {
                            type: "string",
                          },
                          rpe: {
                            type: "number",
                          },
                          observacao: {
                            type: "string",
                          },
                        },
                        required: [
                          "nome",
                          "series",
                          "reps",
                          "descanso",
                          "cadencia",
                          "rpe",
                          "observacao",
                        ],
                      },
                    },
                  },
                  required: [
                    "dia",
                    "sessao_numero",
                    "titulo",
                    "foco",
                    "objetivo_fisiologico",
                    "intensidade_geral",
                    "tempo",
                    "exercicios",
                  ],
                },
              },
            },
            required: ["workouts"],
          },
        },
      },
      messages: [
        {
          role: "developer",
          content: developerPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        {
          success: false,
          error: "A IA não retornou conteúdo.",
        },
        { status: 500 }
      );
    }

    const plan = JSON.parse(content);

    return NextResponse.json({
      success: true,
      plan,
    });
  } catch (error) {
    console.error("Erro na Matriz AI:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erro na Matriz AI",
      },
      { status: 500 }
    );
  }
}