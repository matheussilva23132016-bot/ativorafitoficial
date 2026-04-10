import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { foco, obs } = body;

    // SIMULAÇÃO: Tempo de processamento da IA (2 segundos)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // SIMULAÇÃO: Resposta inteligente baseada no foco recebido
    let exercicios = [];
    const isHipertrofia = foco.toLowerCase().includes('hipertrofia');

    if (isHipertrofia) {
      exercicios = [
        { id: Date.now() + 1, nome: "Supino Reto com Barra", series: 4, reps: "8-10", descanso: "90s", obs: "Fase excêntrica controlada (3s)" },
        { id: Date.now() + 2, nome: "Crucifixo Inclinado Halteres", series: 3, reps: "10-12", descanso: "60s", obs: "Alongamento máximo do peitoral" },
        { id: Date.now() + 3, nome: "Tríceps Testa", series: 4, reps: "12", descanso: "60s", obs: "Cotovelos travados" },
      ];
    } else {
      exercicios = [
        { id: Date.now() + 1, nome: "Agachamento Livre", series: 4, reps: "12-15", descanso: "60s", obs: "Postura reta, descer até 90 graus." },
        { id: Date.now() + 2, nome: "Leg Press 45", series: 3, reps: "15", descanso: "60s", obs: "Não travar os joelhos na subida." },
        { id: Date.now() + 3, nome: "Cadeira Extensora", series: 4, reps: "Falha", descanso: "45s", obs: "Pico de contração de 2s no topo." },
      ];
    }

    const rascunhoIA = {
      titulo: `Protocolo IA: ${foco}`,
      foco: foco,
      tempo: "45 min",
      dia: "Seg",
      exercicios: exercicios
    };

    return NextResponse.json({ success: true, draft: rascunhoIA });

  } catch (error) {
    console.error('Erro na IA:', error);
    return NextResponse.json({ error: 'O motor de IA falhou.' }, { status: 500 });
  }
}