// app/components/dashboard/comunidades/nutricao/foodDatabase.ts

export interface AlimentoCatalogo {
  nome: string;
  porcaoBase: string; // ex: "100g", "1 unidade (50g)"
  calorias: number;
  proteinas: number;
  carbos: number;
  gorduras: number;
}

// Valores de macronutrientes aproximados (por 100g ou medida padrão indicada)
// Focados em referências TACO e tabelas de composição USDA.
export const FOOD_DATABASE: AlimentoCatalogo[] = [
  // ── Carnes, Aves e Ovos ──────────────────────────────────────────────
  { nome: "Peito de Frango (Grelhado)", porcaoBase: "100g", calorias: 159, proteinas: 32, carbos: 0, gorduras: 2.5 },
  { nome: "Patinho Bovino (Moído/Grelhado)", porcaoBase: "100g", calorias: 219, proteinas: 35.9, carbos: 0, gorduras: 7.3 },
  { nome: "Coxão Duro (Cozido)", porcaoBase: "100g", calorias: 217, proteinas: 31, carbos: 0, gorduras: 9 },
  { nome: "Lombo Suíno (Assado)", porcaoBase: "100g", calorias: 210, proteinas: 35, carbos: 0, gorduras: 6 },
  { nome: "Ovo de Galinha (Cozido)", porcaoBase: "1 unidade (50g)", calorias: 77, proteinas: 6.3, carbos: 0.6, gorduras: 5.3 },
  { nome: "Clara de Ovo (Cozida)", porcaoBase: "1 unidade (33g)", calorias: 17, proteinas: 3.6, carbos: 0.2, gorduras: 0.1 },
  { nome: "Peito de Peru (Fatiado)", porcaoBase: "100g", calorias: 104, proteinas: 17, carbos: 2, gorduras: 2 },
  { nome: "Filé de Tilápia (Grelhado)", porcaoBase: "100g", calorias: 128, proteinas: 26, carbos: 0, gorduras: 2.7 },
  { nome: "Salmão (Grelhado)", porcaoBase: "100g", calorias: 206, proteinas: 22, carbos: 0, gorduras: 13 },
  { nome: "Atum (Conservado em água)", porcaoBase: "100g", calorias: 116, proteinas: 26, carbos: 0, gorduras: 1 },

  // ── Carboidratos (Arroz, Raízes, Cereais) ────────────────────────────
  { nome: "Arroz Branco (Cozido)", porcaoBase: "100g", calorias: 130, proteinas: 2.7, carbos: 28, gorduras: 0.3 },
  { nome: "Arroz Integral (Cozido)", porcaoBase: "100g", calorias: 112, proteinas: 2.6, carbos: 24, gorduras: 0.9 },
  { nome: "Feijão Carioca (Cozido)", porcaoBase: "100g", calorias: 76, proteinas: 4.8, carbos: 13.6, gorduras: 0.5 },
  { nome: "Feijão Preto (Cozido)", porcaoBase: "100g", calorias: 77, proteinas: 4.5, carbos: 14, gorduras: 0.5 },
  { nome: "Batata Doce (Cozida)", porcaoBase: "100g", calorias: 86, proteinas: 1.6, carbos: 20, gorduras: 0.1 },
  { nome: "Batata Inglesa (Cozida)", porcaoBase: "100g", calorias: 87, proteinas: 1.9, carbos: 20, gorduras: 0.1 },
  { nome: "Mandioca/Macaxeira (Cozida)", porcaoBase: "100g", calorias: 112, proteinas: 1.4, carbos: 27, gorduras: 0.2 },
  { nome: "Mandioquinha/Batata Baroa (Cozida)", porcaoBase: "100g", calorias: 80, proteinas: 0.9, carbos: 19, gorduras: 0.2 },
  { nome: "Inhame (Cozido)", porcaoBase: "100g", calorias: 118, proteinas: 1.5, carbos: 28, gorduras: 0.2 },
  { nome: "Aveia em Flocos", porcaoBase: "100g", calorias: 389, proteinas: 16.9, carbos: 66, gorduras: 6.9 },
  { nome: "Macarrão de Trigo (Cozido)", porcaoBase: "100g", calorias: 158, proteinas: 5.8, carbos: 31, gorduras: 0.9 },
  { nome: "Macarrão Integral (Cozido)", porcaoBase: "100g", calorias: 124, proteinas: 5.3, carbos: 26, gorduras: 0.5 },
  { nome: "Tapioca (Goma Pronta)", porcaoBase: "100g", calorias: 240, proteinas: 0, carbos: 60, gorduras: 0 },
  { nome: "Pão de Forma Tradicional", porcaoBase: "1 fatia (25g)", calorias: 60, proteinas: 2, carbos: 12, gorduras: 0.5 },
  { nome: "Pão de Forma Integral", porcaoBase: "1 fatia (25g)", calorias: 62, proteinas: 2.5, carbos: 11, gorduras: 1 },
  { nome: "Pão Francês", porcaoBase: "1 unidade (50g)", calorias: 150, proteinas: 4.8, carbos: 29, gorduras: 1.6 },

  // ── Frutas ─────────────────────────────────────────────────────────────
  { nome: "Banana Prata", porcaoBase: "1 unidade média (70g)", calorias: 69, proteinas: 0.9, carbos: 18, gorduras: 0.1 },
  { nome: "Banana Nanica", porcaoBase: "1 unidade média (85g)", calorias: 78, proteinas: 1, carbos: 20, gorduras: 0.1 },
  { nome: "Maçã (Fuji/Gala)", porcaoBase: "1 unidade média (130g)", calorias: 68, proteinas: 0.3, carbos: 18, gorduras: 0.2 },
  { nome: "Mamão Papaia", porcaoBase: "100g", calorias: 43, proteinas: 0.5, carbos: 11, gorduras: 0.1 },
  { nome: "Morangos", porcaoBase: "100g", calorias: 32, proteinas: 0.7, carbos: 8, gorduras: 0.3 },
  { nome: "Uva (Itália/Rubi)", porcaoBase: "100g", calorias: 69, proteinas: 0.7, carbos: 18, gorduras: 0.2 },
  { nome: "Manga (Tommy/Palmer)", porcaoBase: "100g", calorias: 60, proteinas: 0.8, carbos: 15, gorduras: 0.4 },
  { nome: "Abacate", porcaoBase: "100g", calorias: 160, proteinas: 2, carbos: 8.5, gorduras: 14.7 },
  { nome: "Melancia", porcaoBase: "100g", calorias: 30, proteinas: 0.6, carbos: 8, gorduras: 0.2 },
  { nome: "Melão", porcaoBase: "100g", calorias: 34, proteinas: 0.8, carbos: 8, gorduras: 0.2 },
  { nome: "Abacaxi", porcaoBase: "100g", calorias: 50, proteinas: 0.5, carbos: 13, gorduras: 0.1 },

  // ── Laticínios e Suplementos ───────────────────────────────────────────
  { nome: "Leite Integral", porcaoBase: "200ml", calorias: 120, proteinas: 6, carbos: 10, gorduras: 6 },
  { nome: "Leite Desnatado", porcaoBase: "200ml", calorias: 66, proteinas: 6, carbos: 10, gorduras: 0 },
  { nome: "Iogurte Natural Integral", porcaoBase: "1 pote (170g)", calorias: 104, proteinas: 6, carbos: 8, gorduras: 5 },
  { nome: "Iogurte Natural Desnatado", porcaoBase: "1 pote (170g)", calorias: 73, proteinas: 7, carbos: 11, gorduras: 0 },
  { nome: "Queijo Minas Frescal", porcaoBase: "100g", calorias: 264, proteinas: 17.5, carbos: 3.2, gorduras: 20 },
  { nome: "Queijo Mussarela", porcaoBase: "100g", calorias: 300, proteinas: 22.6, carbos: 3, gorduras: 22 },
  { nome: "Whey Protein Concentrado (80%)", porcaoBase: "1 scoop (30g)", calorias: 120, proteinas: 24, carbos: 3, gorduras: 2 },
  { nome: "Whey Protein Isolado (90%)", porcaoBase: "1 scoop (30g)", calorias: 110, proteinas: 27, carbos: 1, gorduras: 0.5 },
  { nome: "Creatina", porcaoBase: "1 dosador (3g a 5g)", calorias: 0, proteinas: 0, carbos: 0, gorduras: 0 },

  // ── Gorduras Culinárias e Castanhas ────────────────────────────────────
  { nome: "Azeite de Oliva Extra Virgem", porcaoBase: "1 col. sopa (13ml)", calorias: 119, proteinas: 0, carbos: 0, gorduras: 13.5 },
  { nome: "Manteiga com/sem sal", porcaoBase: "1 col. sopa (10g)", calorias: 74, proteinas: 0.1, carbos: 0, gorduras: 8.2 },
  { nome: "Pasta de Amendoim Integral", porcaoBase: "1 col. sopa (15g)", calorias: 90, proteinas: 4, carbos: 3, gorduras: 7 },
  { nome: "Castanha de Caju", porcaoBase: "100g", calorias: 553, proteinas: 18, carbos: 30, gorduras: 44 },
  { nome: "Castanha do Pará", porcaoBase: "100g", calorias: 656, proteinas: 14, carbos: 12, gorduras: 66 },
  { nome: "Amêndoa Torrada", porcaoBase: "100g", calorias: 598, proteinas: 21, carbos: 21, gorduras: 52 },

  // ── Legumes e Verduras ─────────────────────────────────────────────────
  { nome: "Brócolis (Cozido)", porcaoBase: "100g", calorias: 35, proteinas: 2.4, carbos: 7, gorduras: 0.4 },
  { nome: "Cenoura (Crua/Cozida)", porcaoBase: "100g", calorias: 41, proteinas: 0.9, carbos: 10, gorduras: 0.2 },
  { nome: "Tomate", porcaoBase: "100g", calorias: 21, proteinas: 0.9, carbos: 4, gorduras: 0.2 },
  { nome: "Cebola", porcaoBase: "100g", calorias: 40, proteinas: 1.1, carbos: 9, gorduras: 0.1 },
  { nome: "Abobrinha (Cozida)", porcaoBase: "100g", calorias: 15, proteinas: 1.1, carbos: 3, gorduras: 0.4 },
  { nome: "Alface", porcaoBase: "100g", calorias: 14, proteinas: 1.3, carbos: 2.8, gorduras: 0.2 },
];
