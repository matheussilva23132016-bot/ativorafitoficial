import { NextResponse } from "next/server";
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { foco, nivel, alunoNome, obs, dias, sessoesPorDia } = body;

    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Você é o HEAD COACH do Ativora Protocol. Sua expertise é baseada em Biomecânica Avançada, Fisiologia do Exercício e Metodologias de Elite (Bodybuilding e Performance).

          DIRETRIZES TÉCNICAS RIGOROSAS:
          1. TERMINOLOGIA MÉTRICA: Proibido nomes genéricos como "Supino" ou "Agachamento". Use variações precisas (Ex: "Supino Inclinado com Halteres - Pegada Neutra e Alongamento Máximo", "Agachamento Pendulum - Ênfase em Encurtamento de Quadríceps").
          2. INTELIGÊNCIA HÍBRIDA: Se o foco incluir Cardio, prescreva protocolos baseados em zonas (Z2, HIIT, LISS) e especifique a máquina (Escada, Esteira Inclinada, AirBike). Gerencie o efeito de interferência: força sempre precede o cardio intenso.
          3. VARIÁVEIS DE INTENSIDADE: Utilize métodos avançados de forma estratégica: Myo-reps, Cluster Sets, Rest-Pause, Back-off Sets e Top Sets.
          4. BIOMECÂNICA DE ACADEMIA: Especifique ângulos de polias, posições de pés em prensas e ajustes de máquinas para otimizar o braço de momento.
          5. CADÊNCIA E TENSÃO: Toda prescrição deve ter cadência (Ex: 4010 - 4s excêntrica, 0s transição, 1s concêntrica, 0s pico).
          6. ANÁLISE DE OBJETIVOS: 
             - Emagrecimento/Definição: Foco em densidade de treino e controle glicogênico.
             - Hipertrofia/Recomposição: Foco em volume tensional e estresse metabólico.
             - Força/Performance: Foco em vias neurais e economia de movimento.
          7. SEM MOTIVAÇÃO: Entregue apenas dados técnicos, prescrições biomecânicas e instruções objetivas.`
        },
        {
          role: "user",
          content: `PRESCREVER MICRO-CICLO TÉCNICO:
          - Atleta: ${alunoNome}
          - Nível: ${nivel || 'Avançado'}
          - Objetivos Combinados: ${foco}
          - Volume: ${dias || 5} dias de treinamento.
          - Contexto Adicional: ${obs || 'Nenhuma restrição informada.'}
          
          Gere um plano de treinamento que maximize a resposta fisiológica baseada nos objetivos selecionados.`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "prescricao_elite_ativora",
          strict: true,
          schema: {
            type: "object",
            properties: {
              workouts: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    dia: { type: "string" },
                    sessao_numero: { type: "integer" },
                    titulo: { type: "string" },
                    foco: { type: "string" },
                    objetivo_fisiologico: { type: "string" },
                    intensidade_geral: { type: "string" },
                    tempo: { type: "string" },
                    exercicios: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          nome: { type: "string" },
                          series: { type: "integer" },
                          reps: { type: "string" },
                          descanso: { type: "string" },
                          cadencia: { type: "string" },
                          rpe: { type: "number" },
                          observacao: { type: "string" }
                        },
                        required: ["nome", "series", "reps", "descanso", "cadencia", "rpe", "observacao"],
                        additionalProperties: false
                      }
                    }
                  },
                  required: ["dia", "sessao_numero", "titulo", "foco", "objetivo_fisiologico", "intensidade_geral", "tempo", "exercicios"],
                  additionalProperties: false
                }
              }
            },
            required: ["workouts"],
            additionalProperties: false
          }
        }
      },
      temperature: 0.4, // Baixa variação para garantir rigor técnico e consistência
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Falha na geração do protocolo.");

    return NextResponse.json({ success: true, plan: JSON.parse(content) });

  } catch (error: any) {
    console.error("ERRO NA API DE PRESCRIÇÃO:", error);
    return NextResponse.json({ success: false, error: "Falha na conexão com o núcleo de inteligência." }, { status: 500 });
  }
}
