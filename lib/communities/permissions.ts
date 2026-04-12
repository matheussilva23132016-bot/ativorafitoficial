/**
 * Verifica se uma tag de permissão está presente nas tags do usuário.
 *
 * Tags esperadas: "Dono", "Admin", "Moderador", "Personal", "Nutricionista", "Membro", "Participante"
 *
 * Mapeamento de permissões:
 *  - desafio:create   → Dono, Admin
 *  - desafio:evaluate → Dono, Admin, Moderador
 *  - nutri:create     → Dono, Admin, Nutricionista
 *  - treino:create    → Dono, Admin, Personal
 *  - post:pin         → Dono, Admin, Moderador
 *  - post:delete      → Dono, Admin, Moderador
 *  - member:kick      → Dono, Admin
 *  - member:promote   → Dono
 *  - member:approve   → Dono, Admin, Moderador
 *  - community:edit   → Dono
 */

const PERMISSION_MAP: Record<string, string[]> = {
  "desafio:create":   ["Dono", "Admin"],
  "desafio:evaluate": ["Dono", "Admin", "Moderador"],
  "nutri:create":     ["Dono", "Admin", "Nutricionista"],
  "treino:create":    ["Dono", "Admin", "Personal"],
  "post:pin":         ["Dono", "Admin", "Moderador"],
  "post:delete":      ["Dono", "Admin", "Moderador"],
  "member:kick":      ["Dono", "Admin"],
  "member:promote":   ["Dono"],
  "member:approve":   ["Dono", "Admin", "Moderador"],
  "community:edit":   ["Dono"],
};

// Hierarquia de tags — quanto menor o índice, maior a autoridade
const TAG_HIERARCHY = [
  "Dono",
  "Admin",
  "Moderador",
  "Personal",
  "Nutricionista",
  "Membro",
  "Participante",
];

export function canDo(userTags: string[], permission: string): boolean {
  const allowed = PERMISSION_MAP[permission];
  if (!allowed) return false;
  return userTags.some(tag => allowed.includes(tag));
}

/**
 * Retorna a tag de maior autoridade do usuário.
 * Ex: ["Membro", "Moderador"] → "Moderador"
 */
export function getHighestTag(userTags: string[]): string {
  for (const tag of TAG_HIERARCHY) {
    if (userTags.includes(tag)) return tag;
  }
  return userTags[0] ?? "Participante";
}
