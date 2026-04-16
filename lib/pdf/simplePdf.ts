export type PdfLine = {
  text: string;
  size?: number;
  gap?: number;
  indent?: number;
  weight?: "regular" | "bold";
  color?: PdfColor;
};

type PdfColor =
  | "dark"
  | "muted"
  | "soft"
  | "white"
  | "sky"
  | "emerald"
  | "amber"
  | "rose"
  | "navy";

type PdfOptions = {
  subtitle?: string;
  documentLabel?: string;
  generatedAt?: Date;
};

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN_X = 48;
const MARGIN_TOP = 112;
const MARGIN_BOTTOM = 72;

const COLORS: Record<PdfColor, [number, number, number]> = {
  dark: [0.03, 0.06, 0.11],
  muted: [0.36, 0.42, 0.5],
  soft: [0.64, 0.7, 0.78],
  white: [1, 1, 1],
  sky: [0.05, 0.61, 0.91],
  emerald: [0.06, 0.72, 0.51],
  amber: [0.96, 0.62, 0.04],
  rose: [0.96, 0.25, 0.39],
  navy: [0.02, 0.05, 0.1],
};

function sanitizeText(value: unknown) {
  return String(value ?? "")
    .replace(/\r/g, "")
    .replace(/[^\S\n]+/g, " ")
    .trim();
}

function wrapText(text: string, maxChars: number) {
  const clean = sanitizeText(text);
  if (!clean) return [""];

  const words = clean.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    if (!current) {
      current = word;
      continue;
    }

    if (`${current} ${word}`.length <= maxChars) {
      current = `${current} ${word}`;
    } else {
      lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines;
}

function toWinAnsiHex(text: string) {
  const normalized = text
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/[^\x20-\x7e\xa0-\xff]/g, "?");

  const bytes = Array.from(normalized, char => char.charCodeAt(0) & 0xff);
  return `<${bytes.map(byte => byte.toString(16).padStart(2, "0")).join("")}>`;
}

function colorOp(color: PdfColor, mode: "fill" | "stroke" = "fill") {
  const [r, g, b] = COLORS[color];
  return `${r} ${g} ${b} ${mode === "fill" ? "rg" : "RG"}`;
}

function rect(x: number, y: number, w: number, h: number, color: PdfColor) {
  return `q ${colorOp(color)} ${x} ${y} ${w} ${h} re f Q`;
}

function strokedRect(x: number, y: number, w: number, h: number, color: PdfColor, width = 1) {
  return `q ${colorOp(color, "stroke")} ${width} w ${x} ${y} ${w} ${h} re S Q`;
}

function line(x1: number, y1: number, x2: number, y2: number, color: PdfColor, width = 1) {
  return `q ${colorOp(color, "stroke")} ${width} w ${x1} ${y1} m ${x2} ${y2} l S Q`;
}

function textAt(
  text: string,
  x: number,
  y: number,
  size = 10,
  font: "F1" | "F2" = "F1",
  color: PdfColor = "dark",
) {
  return `${colorOp(color)} BT /${font} ${size} Tf ${x} ${y} Td ${toWinAnsiHex(text)} Tj ET`;
}

function escapePdfContent(lineValue: PdfLine, y: number) {
  const size = lineValue.size ?? 10;
  const font = lineValue.weight === "bold" ? "F2" : "F1";
  const x = MARGIN_X + (lineValue.indent ?? 0);
  return textAt(lineValue.text, x, y, size, font, lineValue.color ?? "dark");
}

function paginate(lines: PdfLine[]) {
  const pages: PdfLine[][] = [[]];
  let y = PAGE_HEIGHT - MARGIN_TOP;

  for (const lineValue of lines) {
    const gap = lineValue.gap ?? Math.max(12, (lineValue.size ?? 10) + 4);
    if (y - gap < MARGIN_BOTTOM && pages[pages.length - 1].length > 0) {
      pages.push([]);
      y = PAGE_HEIGHT - MARGIN_TOP;
    }

    pages[pages.length - 1].push(lineValue);
    y -= gap;
  }

  return pages;
}

function drawChrome(
  title: string,
  options: PdfOptions,
  pageNumber: number,
  totalPages: number,
) {
  const generatedAt = options.generatedAt ?? new Date();
  const generatedText = generatedAt.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return [
    rect(0, 778, PAGE_WIDTH, 64, "navy"),
    rect(0, 776, PAGE_WIDTH, 2, "sky"),
    textAt("ATIVORAFIT", MARGIN_X, 816, 18, "F2", "white"),
    textAt(options.subtitle ?? "Ativora Comunidades", MARGIN_X, 798, 8, "F1", "soft"),
    textAt(options.documentLabel ?? title, 190, 812, 12, "F2", "white"),
    textAt(`Gerado em ${generatedText}`, 190, 798, 8, "F1", "soft"),
    strokedRect(438, 794, 110, 30, "sky", 1.2),
    textAt("SELO OFICIAL", 455, 812, 8, "F2", "sky"),
    textAt("ATIVORAFIT", 464, 801, 7, "F1", "white"),
    line(MARGIN_X, 54, PAGE_WIDTH - MARGIN_X, 54, "soft", 0.35),
    textAt("Documento oficial para uso offline. Siga o plano validado pelo profissional responsável.", MARGIN_X, 36, 7.5, "F1", "muted"),
    textAt(`Página ${pageNumber}/${totalPages}`, PAGE_WIDTH - 102, 36, 7.5, "F1", "muted"),
  ].join("\n");
}

export function buildPdf(title: string, rawLines: PdfLine[], options: PdfOptions = {}) {
  const lines: PdfLine[] = [
    { text: title, size: 22, gap: 28, weight: "bold", color: "dark" },
    ...rawLines,
  ];

  const pages = paginate(lines);
  const objects: string[] = [
    "",
    "<< /Type /Catalog /Pages 2 0 R >>",
    "",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>",
  ];
  const pageIds: number[] = [];

  pages.forEach((page, index) => {
    let y = PAGE_HEIGHT - MARGIN_TOP;
    const body = page.map(lineValue => {
      const rendered = escapePdfContent(lineValue, y);
      y -= lineValue.gap ?? Math.max(12, (lineValue.size ?? 10) + 4);
      return rendered;
    }).join("\n");
    const content = `${drawChrome(title, options, index + 1, pages.length)}\n${body}`;

    const contentId = objects.length;
    objects.push(`<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`);

    const pageId = objects.length;
    pageIds.push(pageId);
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`,
    );
  });

  objects[2] = `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (let i = 1; i < objects.length; i++) {
    offsets[i] = Buffer.byteLength(pdf);
    pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i < objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "utf8");
}

export function addSection(lines: PdfLine[], title: string, content: string[]) {
  lines.push({ text: title, size: 14, gap: 20, weight: "bold", color: "sky" });
  for (const item of content.filter(Boolean)) {
    const wrapped = wrapText(item, 88);
    wrapped.forEach((wrappedLine, index) => {
      lines.push({
        text: index === 0 ? wrappedLine : wrappedLine,
        size: 10,
        gap: 14,
        indent: index === 0 ? 8 : 18,
        color: "dark",
      });
    });
  }
  lines.push({ text: "", size: 8, gap: 10 });
}

export function addParagraph(
  lines: PdfLine[],
  text: string,
  options: Pick<PdfLine, "size" | "gap" | "indent" | "weight" | "color"> = {},
) {
  for (const wrappedLine of wrapText(text, 90 - Math.floor((options.indent ?? 0) / 4))) {
    lines.push({
      text: wrappedLine,
      size: options.size ?? 10,
      gap: options.gap ?? 14,
      indent: options.indent,
      weight: options.weight,
      color: options.color ?? "dark",
    });
  }
}
