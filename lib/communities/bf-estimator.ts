/**
 * Estimativa de Percentual de Gordura Corporal
 * Método: Fórmula de Deurenberg (1991) via IMC
 *
 * Referência: Deurenberg P, Weststrate JA, Seidell JC.
 * "Body mass index as a measure of body fatness."
 * Br J Nutr. 1991;65(2):105-14.
 */

interface EstimarBFParams {
  peso?:       number; // kg
  altura?:     number; // cm
  peso_kg?:    number; // kg
  altura_cm?:  number; // cm
  cintura_cm?: number; // cm
  quadril_cm?: number; // cm
  idade?:      number; // anos (default: 30)
  sexo?:       "M" | "F"; // default: "M"
}

interface EstimarBFResult {
  imc:           number; // kg/m²
  bf_estimado:   number; // % gordura corporal
  classificacao: string; // Ex: "Normal", "Sobrepeso", etc.
  massa_gorda:   number; // kg
  massa_magra:   number; // kg
  aviso:         string;
}

/**
 * Estima o percentual de gordura corporal via IMC (Deurenberg 1991).
 * %BF = (1.20 × IMC) + (0.23 × idade) − (10.8 × sexo) − 5.4
 * onde sexo: Masculino = 1, Feminino = 0
 */
export function estimarBF({
  peso,
  altura,
  peso_kg,
  altura_cm,
  cintura_cm,
  quadril_cm,
  idade = 30,
  sexo  = "M",
}: EstimarBFParams): EstimarBFResult {
  const pesoFinal = peso ?? peso_kg;
  const alturaFinal = altura ?? altura_cm;

  if (!pesoFinal || !alturaFinal) {
    throw new Error("Peso e altura são obrigatórios para estimar BF.");
  }

  const alturaM = alturaFinal / 100;
  const imc     = pesoFinal / (alturaM * alturaM);
  const sexoNum = sexo === "M" ? 1 : 0;

  let bf = (1.2 * imc) + (0.23 * idade) - (10.8 * sexoNum) - 5.4;
  if (cintura_cm && alturaFinal) {
    bf = sexo === "M"
      ? 495 / (1.0324 - 0.19077 * Math.log10(cintura_cm) + 0.15456 * Math.log10(alturaFinal)) - 450
      : 495 / (1.29579 - 0.35004 * Math.log10(cintura_cm + (quadril_cm ?? cintura_cm)) + 0.221 * Math.log10(alturaFinal)) - 450;
  }

  const bf_estimado = Math.max(3, Math.min(60, parseFloat(bf.toFixed(1))));

  const massa_gorda = parseFloat(((bf_estimado / 100) * pesoFinal).toFixed(1));
  const massa_magra = parseFloat((pesoFinal - massa_gorda).toFixed(1));

  const classificacao = classificarBF(bf_estimado, sexo);

  return {
    imc:           parseFloat(imc.toFixed(1)),
    bf_estimado,
    classificacao,
    massa_gorda,
    massa_magra,
    aviso: "Estimativa matemática de apoio para acompanhamento remoto. Não substitui bioimpedância ou avaliação presencial.",
  };
}

function classificarBF(bf: number, sexo: "M" | "F"): string {
  if (sexo === "M") {
    if (bf < 6)  return "Atlético Extremo";
    if (bf < 14) return "Atlético";
    if (bf < 18) return "Fitness";
    if (bf < 25) return "Normal";
    if (bf < 30) return "Sobrepeso";
    return "Obesidade";
  } else {
    if (bf < 14) return "Atlético Extremo";
    if (bf < 21) return "Atlético";
    if (bf < 25) return "Fitness";
    if (bf < 32) return "Normal";
    if (bf < 38) return "Sobrepeso";
    return "Obesidade";
  }
}
