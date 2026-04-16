export const GENERIC_SOCIAL_NICKNAMES = [
  "fake_legend",
  "cbum",
  "ramondino",
  "gabriel_elite",
  "ana_fitness",
  "marcos_natural",
  "cris_physique",
  "gabriel_treino",
  "ana_fit",
  "mestre_yoga",
];

export const GENERIC_SOCIAL_EMAILS = [
  "fakeuser@ativora.com",
  "cbum@ativora.com",
  "ramon@ativora.com",
];

export const GENERIC_SOCIAL_HASHTAGS = [
  "classicphysique",
  "legday",
  "ativoraelite",
  "powerlifting",
  "supino",
  "natural",
  "forca",
  "força",
  "elite",
];

const normalize = (value: unknown) =>
  String(value || "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();

const normalizeTag = (value: unknown) =>
  normalize(value)
    .replace(/^#/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const genericNicknames = new Set(GENERIC_SOCIAL_NICKNAMES.map(normalize));
const genericEmails = new Set(GENERIC_SOCIAL_EMAILS.map(normalize));
const genericTags = new Set(GENERIC_SOCIAL_HASHTAGS.map(normalizeTag));

export const isGenericSocialNickname = (value: unknown) =>
  genericNicknames.has(normalize(value));

export const isGenericSocialEmail = (value: unknown) =>
  genericEmails.has(normalize(value));

export const isGenericSocialTag = (value: unknown) => {
  const tag = normalizeTag(value);
  return Boolean(tag) && genericTags.has(tag);
};

export const containsGenericSocialHashtag = (value: unknown) => {
  const text = String(value || "").toLowerCase();
  return GENERIC_SOCIAL_HASHTAGS.some((tag) => {
    const normalizedTag = tag.replace("ç", "c");
    return text.includes(`#${tag.toLowerCase()}`) || text.includes(`#${normalizedTag}`);
  });
};

export const isGenericSocialUser = (row: any) =>
  isGenericSocialNickname(row?.nickname || row?.username || row?.user) ||
  isGenericSocialEmail(row?.email);

export const isGenericSocialPost = (row: any) =>
  isGenericSocialNickname(row?.nickname || row?.username || row?.user) ||
  containsGenericSocialHashtag(row?.content || row?.conteudo);
