export type PerfilRole = "aluno" | "personal" | "instrutor" | "nutri" | "nutricionista" | "influencer" | "adm" | "admin";

export type PerfilAvaliacaoTipo = "anamnese" | "rapida" | "completa" | "laudo";

export type PerfilAvaliacaoStatus = "rascunho" | "salvo";

export type PerfilPrivacidade = "privado" | "profissionais" | "comunidade";

export type PerfilCampo = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "select";
  placeholder?: string;
  options?: string[];
};

export type RoleProfileConfig = {
  role: PerfilRole | "default";
  label: string;
  headline: string;
  accent: string;
  fields: PerfilCampo[];
};

export type PerfilComplementar = {
  id?: string;
  userId: string;
  role: string;
  objetivoPrincipal: string;
  nivel: string;
  frequencia: string;
  restricoes: string;
  disponibilidade: string;
  preferenciasTreino: string;
  preferenciasNutricao: string;
  privacidadeDados: PerfilPrivacidade;
  dadosCargo: Record<string, string>;
  progresso: number;
  updatedAt?: string;
};

export type PerfilAvaliacaoMedida = {
  id?: string;
  categoria: string;
  slug: string;
  nome: string;
  unidade: string;
  rodada1?: number | null;
  rodada2?: number | null;
  rodada3?: number | null;
  mediana?: number | null;
  erroPercentual?: number | null;
  consistencia?: string | null;
};

export type PerfilAvaliacaoResultado = {
  id?: string;
  metodo: string;
  valor: number;
  unidade: string;
  classificacao?: string | null;
  observacao?: string | null;
  origem: "calculado" | "manual";
};

export type PerfilAvaliacao = {
  id?: string;
  userId?: string;
  tipo: PerfilAvaliacaoTipo;
  titulo: string;
  status: PerfilAvaliacaoStatus;
  dataAvaliacao: string;
  dataReavaliacao?: string;
  objetivo: string;
  sexo?: "masculino" | "feminino";
  dataNascimento?: string;
  parq: Record<string, string>;
  protocolo: string;
  percentualGorduraInformado?: number | null;
  parecerFinal: string;
  observacoes: string;
  medidas: PerfilAvaliacaoMedida[];
  resultados: PerfilAvaliacaoResultado[];
  createdAt?: string;
  updatedAt?: string;
};

export type PerfilUserSummary = {
  id: string;
  fullName: string;
  nickname: string;
  email?: string;
  avatarUrl?: string | null;
  role: string;
  genero?: string | null;
  dataNascimento?: string | null;
};
