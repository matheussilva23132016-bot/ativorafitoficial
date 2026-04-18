export const DEFAULT_COMMUNITY_COVER =
  "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1000";

export const DEFAULT_COVER_POSITION = {
  x: 50,
  y: 50,
} as const;

export type CommunityCoverSpec = {
  src: string;
  positionX: number;
  positionY: number;
};

function clampPercent(value: unknown, fallback: number) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function normalizeCoverSrc(input: string) {
  const normalized = input.replace(/\\/g, "/");
  if (normalized.startsWith("uploads/")) return `/${normalized}`;
  return normalized;
}

function isSupportedCoverSrc(input: string) {
  return (
    input.startsWith("data:image/") ||
    input.startsWith("/") ||
    input.startsWith("http://") ||
    input.startsWith("https://")
  );
}

function parseCoverPosition(input: string) {
  try {
    const base = "https://ativora.local";
    const url = input.startsWith("http://") || input.startsWith("https://")
      ? new URL(input)
      : new URL(input, base);

    const raw = url.searchParams.get("fp");
    if (!raw) return DEFAULT_COVER_POSITION;

    const [xRaw, yRaw] = raw.split(",");
    return {
      x: clampPercent(xRaw, DEFAULT_COVER_POSITION.x),
      y: clampPercent(yRaw, DEFAULT_COVER_POSITION.y),
    };
  } catch {
    return DEFAULT_COVER_POSITION;
  }
}

export function resolveCommunityCover(input?: string | null): CommunityCoverSpec {
  const raw = String(input ?? "").trim();
  if (!raw) {
    return {
      src: DEFAULT_COMMUNITY_COVER,
      positionX: DEFAULT_COVER_POSITION.x,
      positionY: DEFAULT_COVER_POSITION.y,
    };
  }

  const normalized = normalizeCoverSrc(raw);
  if (!isSupportedCoverSrc(normalized)) {
    return {
      src: DEFAULT_COMMUNITY_COVER,
      positionX: DEFAULT_COVER_POSITION.x,
      positionY: DEFAULT_COVER_POSITION.y,
    };
  }

  const position = parseCoverPosition(normalized);
  return {
    src: normalized,
    positionX: position.x,
    positionY: position.y,
  };
}

export function appendCommunityCoverFocus(input: string, x: number, y: number) {
  const raw = String(input ?? "").trim();
  if (!raw) return "";

  const normalized = normalizeCoverSrc(raw);
  if (normalized.startsWith("data:image/")) return normalized;
  if (!isSupportedCoverSrc(normalized)) return normalized;

  const safeX = clampPercent(x, DEFAULT_COVER_POSITION.x);
  const safeY = clampPercent(y, DEFAULT_COVER_POSITION.y);

  try {
    const base = "https://ativora.local";
    const isAbsolute = normalized.startsWith("http://") || normalized.startsWith("https://");
    const url = isAbsolute ? new URL(normalized) : new URL(normalized, base);
    url.searchParams.set("fp", `${safeX},${safeY}`);

    if (isAbsolute) return url.toString();
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return normalized;
  }
}
