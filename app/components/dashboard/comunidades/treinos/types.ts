// app/components/dashboard/comunidades/treinos/types.ts

export type FocoTreino =
  | "emagrecimento"
  | "hipertrofia"
  | "resistencia"
  | "definicao"
  | "condicionamento"
  | "mobilidade";

export type StatusTreino = "draft" | "published" | "archived";

export type DiaSemana =
  | "Segunda"
  | "Terça"
  | "Quarta"
  | "Quinta"
  | "Sexta"
  | "Sábado"
  | "Domingo"
  | "Livre"
  | (string & {});

// ── Exercício ────────────────────────────────────────────────
export interface Exercicio {
  id: string;
  nome: string;
  series: number;
  repeticoes: string;   // "12", "12-15", "até falhar"
  descanso: string;     // "60s", "90s"
  obs?: string;
  videoUrl?: string;    // upload do profissional
  linkExterno?: string; // youtube, etc.
  concluido?: boolean;
}

// ── Grupo de exercícios ───────────────────────────────────────
export interface GrupoExercicios {
  id: string;
  nome: string;         // "Peito", "Costas + Bíceps", etc.
  exercicios: Exercicio[];
}

// ── Cardio ────────────────────────────────────────────────────
export interface Cardio {
  tipo: string;         // "Esteira", "Bike", "Corda"
  duracao: string;      // "20min"
  intensidade: string;  // "Moderada", "Alta"
  obs?: string;
}

// ── Treino ────────────────────────────────────────────────────
export interface Treino {
  id: string;
  titulo: string;
  dia: DiaSemana;
  letra?: string;       // "A", "B", "C"
  foco: FocoTreino;
  status: StatusTreino;
  grupos: GrupoExercicios[];
  cardio?: Cardio;
  obs?: string;
  criadoEm: string;
  atualizadoEm: string;
  // Destinatários
  paraAluno?: string;   // userId — treino individual
  paraGrupo?: string;   // groupId — treino para grupo
  paraTodos?: boolean;  // treino para toda a comunidade
  solicitacaoId?: string;
}

// ── Solicitação de treino (aluno → profissional) ──────────────
export interface SolicitacaoTreino {
  id: string;
  alunoId: string;
  alunoNome: string;
  foco: FocoTreino;
  obs?: string;
  criadoEm: string;
  status: "pendente" | "em_andamento" | "concluida";
}

// ── Histórico de execução ─────────────────────────────────────
export interface HistoricoTreino {
  id: string;
  treinoId: string;
  treinoTitulo: string;
  alunoId: string;
  concluidoEm: string;
  exerciciosConcluidos: string[]; // ids
}

// ── Props do componente principal ────────────────────────────
export interface CommunityTreinosProps {
  communityId: string;
  userId: string;
  userRole: "owner" | "admin" | "instructor" | "member";
  userName: string;
}
