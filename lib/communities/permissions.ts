/**
 * Verifica se uma tag de permissão está presente nas tags do usuário.
 *
 * Tags reais do banco: "Dono", "ADM", "Nutri", "Nutricionista", "Instrutor", "Personal", "Participante"
 *
 * Mapeamento de permissões:
 *  - desafio:create   → Dono, ADM
 *  - desafio:evaluate → Dono, ADM
 *  - nutri:create     → Dono, ADM, Nutri, Nutricionista, Personal, Instrutor
 *  - treino:create    → Dono, ADM, Instrutor, Personal
 *  - aviso:create     → Dono, ADM, Nutri, Nutricionista, Instrutor, Personal
 *  - post:pin         → Dono, ADM
 *  - post:delete      → Dono, ADM
 *  - member:remove    → Dono, ADM
 *  - member:promote   → Dono
 *  - member:approve   → Dono, ADM
 *  - tag:assign       → Dono, ADM
 *  - community:edit   → Dono
 *  - community:delete → Dono
 */

const PERMISSION_MAP: Record<string, string[]> = {
  "desafio:create":   ["Dono", "ADM"],
  "desafio:evaluate": ["Dono", "ADM"],
  "desafio:submit":   ["Dono", "ADM", "Nutri", "Nutricionista", "Instrutor", "Personal", "Participante"],
  "nutri:create":     ["Dono", "ADM", "Nutri", "Nutricionista", "Personal", "Instrutor"],
  "nutri:manage":     ["Dono", "ADM", "Nutri", "Nutricionista"],
  "treino:create":    ["Dono", "ADM", "Instrutor", "Personal"],
  "treino:manage":    ["Dono", "ADM", "Instrutor", "Personal"],
  "aviso:create":     ["Dono", "ADM", "Nutri", "Nutricionista", "Instrutor", "Personal"],
  "document:import":  ["Dono", "ADM", "Nutri", "Nutricionista", "Instrutor", "Personal"],
  "post:pin":         ["Dono", "ADM"],
  "post:delete":      ["Dono", "ADM"],
  "member:remove":    ["Dono", "ADM"],
  "member:promote":   ["Dono"],
  "member:approve":   ["Dono", "ADM"],
  "tag:assign":       ["Dono", "ADM"],
  "community:edit":   ["Dono"],
  "community:delete": ["Dono"],
};

// Hierarquia de tags — quanto menor o índice, maior a autoridade
const TAG_HIERARCHY = [
  "Dono",
  "ADM",
  "Personal",
  "Nutri",
  "Nutricionista",
  "Instrutor",
  "Participante",
];

export function canDo(userTags: string[], permission: string): boolean {
  const allowed = PERMISSION_MAP[permission];
  if (!allowed) return false;
  return userTags.some(tag => allowed.includes(tag));
}

/**
 * Retorna a tag de maior autoridade do usuário.
 * Ex: ["Participante", "ADM"] → "ADM"
 */
export function getHighestTag(userTags: string[]): string {
  for (const tag of TAG_HIERARCHY) {
    if (userTags.includes(tag)) return tag;
  }
  return userTags[0] ?? "Participante";
}
