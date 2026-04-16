import { FOOD_DATABASE, type AlimentoCatalogo } from "./foodDatabase";

export type ManualGoal =
  | "emagrecimento"
  | "hipertrofia"
  | "resistencia"
  | "pre_treino"
  | "definicao"
  | "massa_magra"
  | "massa_muscular"
  | "saude_geral";

export interface ManualFood extends AlimentoCatalogo {
  id: string;
  categoria: string;
  letra: string;
  objetivos: ManualGoal[];
  perfil: string;
  fonte: "TACO/USDA" | "Rotulo/USDA";
  tags: string[];
  observacao: string;
}

export const MANUAL_GOALS: { id: ManualGoal; label: string }[] = [
  { id: "emagrecimento", label: "Emagrecimento" },
  { id: "hipertrofia", label: "Hipertrofia" },
  { id: "resistencia", label: "Resistência" },
  { id: "pre_treino", label: "Pré-treino" },
  { id: "definicao", label: "Definição" },
  { id: "massa_magra", label: "Massa magra" },
  { id: "massa_muscular", label: "Massa muscular" },
  { id: "saude_geral", label: "Saúde geral" },
];

export const MANUAL_CATEGORIES = [
  "Todos",
  "Proteínas animais",
  "Carboidratos e cereais",
  "Leguminosas",
  "Frutas",
  "Laticínios e suplementos",
  "Gorduras boas",
  "Verduras e legumes",
];

const EXTRA_FOODS: AlimentoCatalogo[] = [
  { nome: "Abóbora Cabotiá (Cozida)", porcaoBase: "100g", calorias: 48, proteinas: 1.4, carbos: 10.8, gorduras: 0.7 },
  { nome: "Açaí Polpa sem Açúcar", porcaoBase: "100g", calorias: 58, proteinas: 0.8, carbos: 6.2, gorduras: 3.9 },
  { nome: "Acém Bovino (Cozido)", porcaoBase: "100g", calorias: 215, proteinas: 27.3, carbos: 0, gorduras: 10.9 },
  { nome: "Amendoim Torrado", porcaoBase: "100g", calorias: 585, proteinas: 25.8, carbos: 16.1, gorduras: 49.2 },
  { nome: "Bacalhau (Cozido)", porcaoBase: "100g", calorias: 105, proteinas: 22.8, carbos: 0, gorduras: 0.9 },
  { nome: "Beterraba (Cozida)", porcaoBase: "100g", calorias: 32, proteinas: 1.3, carbos: 7.2, gorduras: 0.1 },
  { nome: "Cacau em Pó sem Açúcar", porcaoBase: "100g", calorias: 228, proteinas: 19.6, carbos: 57.9, gorduras: 13.7 },
  { nome: "Camarão (Cozido)", porcaoBase: "100g", calorias: 99, proteinas: 24, carbos: 0.2, gorduras: 0.3 },
  { nome: "Chia", porcaoBase: "100g", calorias: 486, proteinas: 16.5, carbos: 42.1, gorduras: 30.7 },
  { nome: "Chuchu (Cozido)", porcaoBase: "100g", calorias: 19, proteinas: 0.8, carbos: 4.5, gorduras: 0.1 },
  { nome: "Cottage", porcaoBase: "100g", calorias: 98, proteinas: 11.1, carbos: 3.4, gorduras: 4.3 },
  { nome: "Couve Manteiga (Crua)", porcaoBase: "100g", calorias: 27, proteinas: 2.9, carbos: 4.3, gorduras: 0.5 },
  { nome: "Cuscuz de Milho (Cozido)", porcaoBase: "100g", calorias: 112, proteinas: 2.2, carbos: 25.3, gorduras: 0.7 },
  { nome: "Ervilha (Cozida)", porcaoBase: "100g", calorias: 84, proteinas: 5.4, carbos: 15.6, gorduras: 0.4 },
  { nome: "Espinafre (Cozido)", porcaoBase: "100g", calorias: 23, proteinas: 3, carbos: 3.8, gorduras: 0.3 },
  { nome: "Filé Mignon Bovino (Grelhado)", porcaoBase: "100g", calorias: 217, proteinas: 32.8, carbos: 0, gorduras: 8.8 },
  { nome: "Frango Coxa sem Pele (Assada)", porcaoBase: "100g", calorias: 209, proteinas: 26, carbos: 0, gorduras: 10.9 },
  { nome: "Goiaba Vermelha", porcaoBase: "100g", calorias: 68, proteinas: 2.6, carbos: 14.3, gorduras: 1 },
  { nome: "Grão-de-Bico (Cozido)", porcaoBase: "100g", calorias: 164, proteinas: 8.9, carbos: 27.4, gorduras: 2.6 },
  { nome: "Hummus", porcaoBase: "100g", calorias: 166, proteinas: 7.9, carbos: 14.3, gorduras: 9.6 },
  { nome: "Iogurte Grego Natural", porcaoBase: "100g", calorias: 97, proteinas: 9, carbos: 3.6, gorduras: 5 },
  { nome: "Kefir Natural", porcaoBase: "100g", calorias: 60, proteinas: 3.3, carbos: 4.5, gorduras: 3.3 },
  { nome: "Kiwi", porcaoBase: "100g", calorias: 61, proteinas: 1.1, carbos: 14.7, gorduras: 0.5 },
  { nome: "Laranja", porcaoBase: "100g", calorias: 47, proteinas: 0.9, carbos: 11.8, gorduras: 0.1 },
  { nome: "Lentilha (Cozida)", porcaoBase: "100g", calorias: 116, proteinas: 9, carbos: 20, gorduras: 0.4 },
  { nome: "Linhaça", porcaoBase: "100g", calorias: 534, proteinas: 18.3, carbos: 28.9, gorduras: 42.2 },
  { nome: "Mel", porcaoBase: "1 col. sopa (20g)", calorias: 61, proteinas: 0.1, carbos: 16.5, gorduras: 0 },
  { nome: "Merluza (Cozida)", porcaoBase: "100g", calorias: 90, proteinas: 18.9, carbos: 0, gorduras: 1.3 },
  { nome: "Milho Verde (Cozido)", porcaoBase: "100g", calorias: 98, proteinas: 3.2, carbos: 21.8, gorduras: 1.2 },
  { nome: "Pepino", porcaoBase: "100g", calorias: 15, proteinas: 0.7, carbos: 3.6, gorduras: 0.1 },
  { nome: "Pera", porcaoBase: "100g", calorias: 57, proteinas: 0.4, carbos: 15.2, gorduras: 0.1 },
  { nome: "Pernil Suíno (Assado)", porcaoBase: "100g", calorias: 262, proteinas: 32.1, carbos: 0, gorduras: 13.9 },
  { nome: "Pimentão Vermelho", porcaoBase: "100g", calorias: 31, proteinas: 1, carbos: 6, gorduras: 0.3 },
  { nome: "Quinoa (Cozida)", porcaoBase: "100g", calorias: 120, proteinas: 4.4, carbos: 21.3, gorduras: 1.9 },
  { nome: "Repolho", porcaoBase: "100g", calorias: 25, proteinas: 1.3, carbos: 5.8, gorduras: 0.1 },
  { nome: "Ricota", porcaoBase: "100g", calorias: 140, proteinas: 12.6, carbos: 3.8, gorduras: 8.1 },
  { nome: "Sardinha em Óleo (Drenada)", porcaoBase: "100g", calorias: 208, proteinas: 24.6, carbos: 0, gorduras: 11.5 },
  { nome: "Tangerina", porcaoBase: "100g", calorias: 53, proteinas: 0.8, carbos: 13.3, gorduras: 0.3 },
  { nome: "Tofu", porcaoBase: "100g", calorias: 76, proteinas: 8.1, carbos: 1.9, gorduras: 4.8 },
  { nome: "Vagem (Cozida)", porcaoBase: "100g", calorias: 35, proteinas: 1.9, carbos: 7.9, gorduras: 0.3 },
  { nome: "Acerola", porcaoBase: "100g", calorias: 32, proteinas: 0.9, carbos: 7.7, gorduras: 0.2 },
  { nome: "Agrião", porcaoBase: "100g", calorias: 11, proteinas: 2.3, carbos: 1.3, gorduras: 0.1 },
  { nome: "Alcatra Bovina (Grelhada)", porcaoBase: "100g", calorias: 241, proteinas: 31.9, carbos: 0, gorduras: 11.6 },
  { nome: "Ameixa Fresca", porcaoBase: "100g", calorias: 46, proteinas: 0.7, carbos: 11.4, gorduras: 0.3 },
  { nome: "Arroz Parboilizado (Cozido)", porcaoBase: "100g", calorias: 123, proteinas: 2.9, carbos: 26.3, gorduras: 0.4 },
  { nome: "Aspargo (Cozido)", porcaoBase: "100g", calorias: 22, proteinas: 2.4, carbos: 4.1, gorduras: 0.2 },
  { nome: "Bacon Grelhado", porcaoBase: "100g", calorias: 541, proteinas: 37, carbos: 1.4, gorduras: 42 },
  { nome: "Berinjela (Cozida)", porcaoBase: "100g", calorias: 35, proteinas: 0.8, carbos: 8.7, gorduras: 0.2 },
  { nome: "Biscoito de Arroz", porcaoBase: "1 unidade (9g)", calorias: 35, proteinas: 0.7, carbos: 7.3, gorduras: 0.3 },
  { nome: "Caqui", porcaoBase: "100g", calorias: 70, proteinas: 0.6, carbos: 18.6, gorduras: 0.2 },
  { nome: "Carne Seca Dessalgada (Cozida)", porcaoBase: "100g", calorias: 313, proteinas: 26.9, carbos: 0, gorduras: 21.9 },
  { nome: "Castanha de Baru", porcaoBase: "100g", calorias: 560, proteinas: 26, carbos: 28, gorduras: 40 },
  { nome: "Coco Seco", porcaoBase: "100g", calorias: 354, proteinas: 3.3, carbos: 15.2, gorduras: 33.5 },
  { nome: "Couve-Flor (Cozida)", porcaoBase: "100g", calorias: 23, proteinas: 1.8, carbos: 4.1, gorduras: 0.5 },
  { nome: "Cupim Bovino (Assado)", porcaoBase: "100g", calorias: 330, proteinas: 28.6, carbos: 0, gorduras: 23.5 },
  { nome: "Damasco Seco", porcaoBase: "100g", calorias: 241, proteinas: 3.4, carbos: 62.6, gorduras: 0.5 },
  { nome: "Edamame (Cozido)", porcaoBase: "100g", calorias: 121, proteinas: 11.9, carbos: 8.9, gorduras: 5.2 },
  { nome: "Farinha de Aveia", porcaoBase: "100g", calorias: 389, proteinas: 16.9, carbos: 66.3, gorduras: 6.9 },
  { nome: "Farinha de Mandioca", porcaoBase: "100g", calorias: 365, proteinas: 1.6, carbos: 88.7, gorduras: 0.3 },
  { nome: "Fígado Bovino (Grelhado)", porcaoBase: "100g", calorias: 191, proteinas: 29.1, carbos: 5.1, gorduras: 5.3 },
  { nome: "Frango Sobrecoxa sem Pele (Assada)", porcaoBase: "100g", calorias: 210, proteinas: 25.9, carbos: 0, gorduras: 11 },
  { nome: "Granola Tradicional", porcaoBase: "100g", calorias: 471, proteinas: 10, carbos: 64, gorduras: 20 },
  { nome: "Jabuticaba", porcaoBase: "100g", calorias: 58, proteinas: 0.6, carbos: 15.3, gorduras: 0.1 },
  { nome: "Lagarto Bovino (Cozido)", porcaoBase: "100g", calorias: 222, proteinas: 32.9, carbos: 0, gorduras: 9.1 },
  { nome: "Leite de Coco", porcaoBase: "100ml", calorias: 230, proteinas: 2.3, carbos: 5.5, gorduras: 23.8 },
  { nome: "Limão", porcaoBase: "100g", calorias: 29, proteinas: 1.1, carbos: 9.3, gorduras: 0.3 },
  { nome: "Macadâmia", porcaoBase: "100g", calorias: 718, proteinas: 7.9, carbos: 13.8, gorduras: 75.8 },
  { nome: "Maracujá", porcaoBase: "100g", calorias: 97, proteinas: 2.2, carbos: 23.4, gorduras: 0.7 },
  { nome: "Mingau de Aveia com Leite", porcaoBase: "100g", calorias: 92, proteinas: 3.4, carbos: 15.1, gorduras: 2.2 },
  { nome: "Nozes", porcaoBase: "100g", calorias: 654, proteinas: 15.2, carbos: 13.7, gorduras: 65.2 },
  { nome: "Óleo de Coco", porcaoBase: "1 col. sopa (13g)", calorias: 117, proteinas: 0, carbos: 0, gorduras: 13 },
  { nome: "Palmito", porcaoBase: "100g", calorias: 28, proteinas: 2.5, carbos: 4.6, gorduras: 0.6 },
  { nome: "Peito de Frango (Cozido)", porcaoBase: "100g", calorias: 163, proteinas: 31.5, carbos: 0, gorduras: 3.2 },
  { nome: "Peito de Peru Defumado", porcaoBase: "100g", calorias: 110, proteinas: 18, carbos: 2.5, gorduras: 2.2 },
  { nome: "Picanha Bovina sem Gordura (Grelhada)", porcaoBase: "100g", calorias: 238, proteinas: 31.9, carbos: 0, gorduras: 11.3 },
  { nome: "Polvilho Doce", porcaoBase: "100g", calorias: 351, proteinas: 0.4, carbos: 87.8, gorduras: 0 },
  { nome: "Presunto Magro", porcaoBase: "100g", calorias: 145, proteinas: 20.9, carbos: 1.5, gorduras: 5.7 },
  { nome: "Queijo Cottage Light", porcaoBase: "100g", calorias: 72, proteinas: 12.4, carbos: 2.7, gorduras: 1.5 },
  { nome: "Rúcula", porcaoBase: "100g", calorias: 25, proteinas: 2.6, carbos: 3.7, gorduras: 0.7 },
  { nome: "Semente de Abóbora", porcaoBase: "100g", calorias: 559, proteinas: 30.2, carbos: 10.7, gorduras: 49 },
  { nome: "Soja em Grãos (Cozida)", porcaoBase: "100g", calorias: 173, proteinas: 16.6, carbos: 9.9, gorduras: 9 },
  { nome: "Tahine", porcaoBase: "1 col. sopa (15g)", calorias: 89, proteinas: 2.6, carbos: 3.2, gorduras: 8 },
  { nome: "Tâmara Seca", porcaoBase: "100g", calorias: 282, proteinas: 2.5, carbos: 75, gorduras: 0.4 },
  { nome: "Truta (Grelhada)", porcaoBase: "100g", calorias: 190, proteinas: 26.6, carbos: 0, gorduras: 8.5 },
  { nome: "Uva Passa", porcaoBase: "100g", calorias: 299, proteinas: 3.1, carbos: 79.2, gorduras: 0.5 },
  { nome: "Whey Protein Hidrolisado", porcaoBase: "1 scoop (30g)", calorias: 110, proteinas: 26, carbos: 1.5, gorduras: 0.5 },
  { nome: "Xilitol", porcaoBase: "10g", calorias: 24, proteinas: 0, carbos: 10, gorduras: 0 },
  { nome: "Zucchini/Espaguete de Abobrinha", porcaoBase: "100g", calorias: 17, proteinas: 1.2, carbos: 3.1, gorduras: 0.3 },
];

export function normalizeFoodText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function slugFood(value: string) {
  return normalizeFoodText(value).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function inferCategoria(nome: string) {
  const n = normalizeFoodText(nome);
  if (/(frango|bovino|coxao|lombo|ovo|peru|tilapia|salmao|atum|camarao|bacalhau|merluza|sardinha|pernil|file mignon|acem|alcatra|bacon|carne seca|cupim|figado|lagarto|picanha|presunto|truta)/.test(n)) return "Proteínas animais";
  if (/(arroz|batata|mandioca|mandioquinha|inhame|aveia|macarrao|tapioca|pao|cuscuz|milho|quinoa|mel|cacau|biscoito de arroz|farinha|granola|mingau|polvilho|xilitol)/.test(n)) return "Carboidratos e cereais";
  if (/(feijao|lentilha|grao de bico|ervilha|hummus|edamame|soja)/.test(n)) return "Leguminosas";
  if (/(banana|maca|mamao|morango|uva|manga|abacate|melancia|melao|abacaxi|acai|goiaba|kiwi|laranja|pera|tangerina|acerola|ameixa|caqui|coco|damasco|jabuticaba|limao|maracuja|tamara)/.test(n)) return "Frutas";
  if (/(leite|iogurte|queijo|whey|creatina|cottage|ricota|kefir|tofu)/.test(n)) return "Laticínios e suplementos";
  if (/(azeite|oleo|manteiga|pasta de amendoim|castanha|amendoa|amendoim|chia|linhaca|baru|macadamia|nozes|semente|tahine)/.test(n)) return "Gorduras boas";
  return "Verduras e legumes";
}

function inferObjetivos(food: AlimentoCatalogo): ManualGoal[] {
  const objetivos = new Set<ManualGoal>();
  const n = normalizeFoodText(food.nome);
  const altaProteina = food.proteinas >= 18;
  const altoCarbo = food.carbos >= 18;
  const baixaCaloria = food.calorias <= 90;
  const baixaGordura = food.gorduras <= 3;
  const gorduraBoa = food.gorduras >= 6 && /(azeite|castanha|amendoa|abacate|pasta de amendoim|salmao)/.test(n);

  if (baixaCaloria || (altaProteina && baixaGordura)) objetivos.add("emagrecimento");
  if (altaProteina || gorduraBoa || food.calorias >= 180) objetivos.add("hipertrofia");
  if (altoCarbo || /(banana|aveia|arroz|batata|macarrao|mandioca|tapioca|pao|cuscuz|granola|mel|tamara|uva passa|biscoito de arroz)/.test(n)) objetivos.add("pre_treino");
  if (altoCarbo || altaProteina) objetivos.add("resistencia");
  if (altaProteina && baixaGordura) objetivos.add("definicao");
  if (altaProteina) objetivos.add("massa_magra");
  if (altaProteina || food.calorias >= 180) objetivos.add("massa_muscular");
  objetivos.add("saude_geral");

  if (n.includes("creatina")) {
    return ["hipertrofia", "resistencia", "massa_magra", "massa_muscular", "saude_geral"];
  }

  return Array.from(objetivos);
}

function inferPerfil(food: AlimentoCatalogo) {
  if (food.proteinas >= 25) return "Proteína alta";
  if (food.carbos >= 30) return "Carboidrato alto";
  if (food.gorduras >= 12) return "Gordura alta";
  if (food.calorias <= 60) return "Baixa caloria";
  if (food.proteinas >= 10 && food.carbos >= 10) return "Misto equilibrado";
  return "Base alimentar";
}

function inferTags(food: AlimentoCatalogo, categoria: string, objetivos: ManualGoal[]) {
  return [
    categoria,
    inferPerfil(food),
    ...objetivos.map(obj => MANUAL_GOALS.find(goal => goal.id === obj)?.label ?? obj),
  ];
}

function inferObservacao(food: AlimentoCatalogo) {
  const n = normalizeFoodText(food.nome);
  if (n.includes("whey")) return "Suplemento: confirme marca, rótulo e composição antes de prescrever.";
  if (n.includes("creatina")) return "Sem macros energéticos relevantes; uso depende de estratégia profissional.";
  if (/(azeite|oleo|manteiga|castanha|amendoa|pasta de amendoim|nozes|macadamia|semente|tahine|chia|linhaca)/.test(n)) return "Alta densidade calórica; pese a porção com cuidado.";
  if (/(arroz|batata|mandioca|macarrao|tapioca|pao|aveia|banana|cuscuz|granola|mel|tamara|uva passa|biscoito de arroz)/.test(n)) return "Boa opção energética; ajuste quantidade ao treino e meta calórica.";
  if (/(frango|bovino|tilapia|atum|ovo|peru|salmao|camarao|bacalhau|merluza|sardinha|truta|figado|picanha|alcatra)/.test(n)) return "Fonte proteica útil para preservar ou construir massa magra.";
  return "Use a porção indicada como base e ajuste conforme preparo, marca e necessidade do aluno.";
}

const BASE_FOODS = [...FOOD_DATABASE, ...EXTRA_FOODS];

export const FOOD_MANUAL: ManualFood[] = BASE_FOODS.map((food) => {
  const categoria = inferCategoria(food.nome);
  const objetivos = inferObjetivos(food);

  return {
    ...food,
    id: slugFood(food.nome),
    categoria,
    objetivos,
    perfil: inferPerfil(food),
    fonte: normalizeFoodText(food.nome).includes("whey") ? "Rotulo/USDA" as const : "TACO/USDA" as const,
    letra: normalizeFoodText(food.nome).charAt(0).toUpperCase(),
    tags: inferTags(food, categoria, objetivos),
    observacao: inferObservacao(food),
  };
}).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

export function filterManualFoods(params: {
  search: string;
  category: string;
  goal: ManualGoal | "todos";
  letter: string;
}) {
  const q = normalizeFoodText(params.search.trim());

  return FOOD_MANUAL.filter((food) => {
    const searchable = normalizeFoodText(`${food.nome} ${food.categoria} ${food.tags.join(" ")}`);
    const matchSearch = !q || searchable.includes(q);
    const matchCategory = params.category === "Todos" || food.categoria === params.category;
    const matchGoal = params.goal === "todos" || food.objetivos.includes(params.goal);
    const matchLetter = params.letter === "Todos" || food.letra === params.letter;
    return matchSearch && matchCategory && matchGoal && matchLetter;
  });
}

export function goalLabel(goal: ManualGoal) {
  return MANUAL_GOALS.find(item => item.id === goal)?.label ?? goal;
}
