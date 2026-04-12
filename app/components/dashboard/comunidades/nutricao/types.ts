// app/components/dashboard/comunidades/nutricao/types.ts

// ── Primitivos ────────────────────────────────────────────────────
export type SexoBio = "masculino" | "feminino";

export type FocoNutricional =
  | "emagrecimento"
  | "hipertrofia"
  | "manutencao"
  | "saude_geral"
  | "performance"
  | "recomposicao";

export type StatusSolicitacao =
  | "pendente"
  | "em_andamento"
  | "concluida"
  | "rejeitada";

export type StatusCardapio = "draft" | "published" | "archived";

export type DiaSemana =
  | "Segunda"
  | "Terça"
  | "Quarta"
  | "Quinta"
  | "Sexta"
  | "Sábado"
  | "Domingo";

// ── Medidas corporais ─────────────────────────────────────────────
export interface MedidasCorporais {
  id:              string;
  alunoId:         string;
  data:            string;           // ISO date
  sexo:            SexoBio;
  peso:            number;           // kg
  altura:          number;           // cm
  cintura:         number;           // cm — obrigatório
  quadril:         number;           // cm — obrigatório
  pescoco?:        number;           // cm — opcional, melhora precisão Navy
  // ── Calculados ──────────────────────────────────────────────────
  imc?:            number;
  rcq?:            number;           // razão cintura / quadril
  gorduraEst?:     number;           // % estimado
  classificacaoRCQ?: string;         // "Ótimo" | "Bom" | "Regular" | "Alto"
  metodoCalculo?:  "navy" | "rcq";   // qual método foi usado
}

// ── Alimento ──────────────────────────────────────────────────────
export interface Alimento {
  id:         string;
  nome:       string;
  quantidade: string;    // "100g", "1 unidade", "2 col. sopa"
  calorias?:  number;
  proteinas?: number;    // g
  carbos?:    number;    // g
  gorduras?:  number;    // g
}

// ── Refeição ──────────────────────────────────────────────────────
export interface Refeicao {
  id:         string;
  nome:       string;    // "Café da manhã", "Almoço", "Lanche", "Jantar"
  horario:    string;    // "07:00"
  alimentos:  Alimento[];
  calorias?:  number;    // soma automática ou manual
  obs?:       string;
  concluida?: boolean;   // marcada pelo aluno
}

// ── Dia do cardápio ───────────────────────────────────────────────
export interface DiaCardapio {
  dia:       DiaSemana;
  refeicoes: Refeicao[];
}

// ── Cardápio completo ─────────────────────────────────────────────
export interface Cardapio {
  id:              string;
  communityId:     string;
  alunoId:         string;
  alunoNome:       string;
  titulo:          string;
  foco:            FocoNutricional;
  semana:          string;           // "2026-W15"
  dias:            DiaCardapio[];
  calorias_dia?:   number;           // meta calórica diária
  proteinas_dia?:  number;           // meta proteica diária (g)
  obs:             string;
  status:          StatusCardapio;
  geradoPorIA:     boolean;
  criadoEm:        string;
  atualizadoEm:    string;
  solicitacaoId?:  string;
}

// ── Solicitação de cardápio ───────────────────────────────────────
export interface SolicitacaoCardapio {
  id:            string;
  communityId:   string;
  alunoId:       string;
  alunoNome:     string;
  foco:          FocoNutricional;
  objetivo:      string;             // texto livre do aluno
  restricoes:    string[];           // "glúten", "lactose", "vegano"...
  medidas?:      MedidasCorporais;
  status:        StatusSolicitacao;
  criadoEm:      string;
  respondidoEm?: string;
  cardapioId?:   string;
  obs?:          string;             // obs da nutri ao rejeitar/responder
}

// ── Histórico de medidas ──────────────────────────────────────────
export interface HistoricoMedidas {
  alunoId:  string;
  registros: MedidasCorporais[];
}

// ── Props do entry point ──────────────────────────────────────────
export interface CommunityNutricaoProps {
  currentUser: any;
  userTags:    string[];
}
