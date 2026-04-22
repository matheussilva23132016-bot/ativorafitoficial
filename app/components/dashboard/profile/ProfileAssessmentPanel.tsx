"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileText,
  Loader2,
  Ruler,
  Save,
} from "lucide-react";
import { ADVANCED_PROTOCOLS, calculateAssessmentResults } from "@/lib/profile/assessment";
import type {
  PerfilAvaliacao,
  PerfilAvaliacaoMedida,
  PerfilAvaliacaoResultado,
  PerfilAvaliacaoTipo,
} from "@/lib/profile/types";
import { emptyAssessment, PARQ_QUESTIONS, typeLabels } from "./profileHelpers";
import { Field, inputClass, labelClass } from "./profileUi";

type Props = {
  draft: PerfilAvaliacao;
  setDraft: React.Dispatch<React.SetStateAction<PerfilAvaliacao>>;
  onSave: (status: "rascunho" | "salvo") => void;
  saving: boolean;
  user: any;
};

const typeIcons: Record<PerfilAvaliacaoTipo, any> = {
  anamnese: ClipboardCheck,
  rapida: Activity,
  completa: Ruler,
  laudo: FileText,
};

const PDF_LINES_PER_PAGE = 48;
const PDF_LINE_LIMIT = 92;
const CORE_MEASURE_FIELDS = [
  { slug: "peso", categoria: "base", nome: "Massa corporal", unidade: "kg", placeholder: "kg" },
  { slug: "altura", categoria: "base", nome: "Estatura", unidade: "cm", placeholder: "cm" },
  { slug: "pescoco", categoria: "perimetros", nome: "Pescoço", unidade: "cm", placeholder: "cm" },
  { slug: "cintura", categoria: "perimetros", nome: "Cintura", unidade: "cm", placeholder: "cm" },
  { slug: "quadril", categoria: "perimetros", nome: "Quadril", unidade: "cm", placeholder: "cm" },
] as const;

const CORE_MEASURE_SLUGS = CORE_MEASURE_FIELDS.map(item => item.slug);

function isFilled(value: unknown, minLength = 1) {
  return String(value ?? "").trim().length >= minLength;
}

function toAsciiPdfSafe(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/\s+/g, " ")
    .trim();
}

function splitPdfLine(value: string, max = PDF_LINE_LIMIT) {
  const text = String(value || "").trim();
  if (!text) return [""];
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= max) {
      current = candidate;
      continue;
    }
    if (current) lines.push(current);
    if (word.length <= max) {
      current = word;
    } else {
      for (let i = 0; i < word.length; i += max) {
        lines.push(word.slice(i, i + max));
      }
      current = "";
    }
  }

  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function byteLength(text: string) {
  return new TextEncoder().encode(text).length;
}

function normalizeNumericInput(value: string) {
  const cleaned = String(value || "").replace(",", ".").trim();
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function ensureCoreMeasures(measures: PerfilAvaliacaoMedida[]) {
  const next = [...measures];
  for (const item of CORE_MEASURE_FIELDS) {
    const alreadyExists = next.some(measure => measure.slug === item.slug);
    if (alreadyExists) continue;
    next.push({
      categoria: item.categoria,
      slug: item.slug,
      nome: item.nome,
      unidade: item.unidade,
      rodada1: null,
      rodada2: null,
      rodada3: null,
      mediana: null,
      erroPercentual: null,
      consistencia: null,
    });
  }
  return next;
}

function readCoreMeasureValue(measures: PerfilAvaliacaoMedida[], slug: string) {
  const found = measures.find(item => item.slug === slug);
  if (!found) return "";
  const value = found.rodada1 ?? found.mediana ?? null;
  return value == null ? "" : String(value);
}

function buildSimplePdf(lines: string[]) {
  const normalized = lines.flatMap(line => splitPdfLine(toAsciiPdfSafe(line)));
  const pages: string[][] = [];

  for (let i = 0; i < normalized.length; i += PDF_LINES_PER_PAGE) {
    pages.push(normalized.slice(i, i + PDF_LINES_PER_PAGE));
  }
  if (pages.length === 0) pages.push(["Relatorio vazio"]);

  const objects: Record<number, string> = {};
  const pageCount = pages.length;
  const firstPageObject = 3;
  const fontObject = firstPageObject + pageCount * 2;

  const pageRefs: string[] = [];
  pages.forEach((pageLines, pageIndex) => {
    const pageObject = firstPageObject + pageIndex * 2;
    const contentObject = pageObject + 1;
    pageRefs.push(`${pageObject} 0 R`);

    const streamLines: string[] = [];
    let y = 800;
    for (const line of pageLines) {
      if (!line) {
        y -= 14;
        continue;
      }
      streamLines.push(`BT /F1 10 Tf 42 ${y} Td (${line}) Tj ET`);
      y -= 14;
    }
    const stream = streamLines.join("\n");

    objects[pageObject] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontObject} 0 R >> >> /Contents ${contentObject} 0 R >>`;
    objects[contentObject] = `<< /Length ${byteLength(stream)} >>\nstream\n${stream}\nendstream`;
  });

  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = `<< /Type /Pages /Count ${pageCount} /Kids [${pageRefs.join(" ")}] >>`;
  objects[fontObject] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";

  const maxObject = fontObject;
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = Array(maxObject + 1).fill(0);

  for (let i = 1; i <= maxObject; i += 1) {
    offsets[i] = byteLength(pdf);
    pdf += `${i} 0 obj\n${objects[i] || "<< >>"}\nendobj\n`;
  }

  const startXref = byteLength(pdf);
  pdf += `xref\n0 ${maxObject + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let i = 1; i <= maxObject; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${maxObject + 1} /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF`;

  return new Blob([new TextEncoder().encode(pdf)], { type: "application/pdf" });
}

function isAssessmentComplete(
  draft: PerfilAvaliacao,
  medidas: PerfilAvaliacaoMedida[],
  resultados: PerfilAvaliacaoResultado[],
) {
  const pending: string[] = [];
  if (!isFilled(draft.titulo, 3)) pending.push("titulo");
  if (!isFilled(draft.dataAvaliacao)) pending.push("data da avaliação");
  if (!isFilled(draft.objetivo, 6)) pending.push("objetivo");
  if (!isFilled(draft.dataNascimento)) pending.push("nascimento");

  if (draft.tipo === "anamnese") {
    const parqComplete = PARQ_QUESTIONS.every((_, index) =>
      isFilled(draft.parq?.[`q${index + 1}`]),
    );
    if (!parqComplete) pending.push("respostas do PAR-Q");
  } else {
    const requiredCoreSlugs =
      draft.sexo === "feminino"
        ? ["peso", "altura", "pescoco", "cintura", "quadril"]
        : ["peso", "altura", "pescoco", "cintura"];
    const coreReady = requiredCoreSlugs.every(slug =>
      medidas.some(item => item.slug === slug && item.mediana != null),
    );
    if (!coreReady) {
      pending.push(
        draft.sexo === "feminino"
          ? "medidas essenciais (peso, altura, pescoço, cintura e quadril)"
          : "medidas essenciais (peso, altura, pescoço e cintura)",
      );
    }
    if (resultados.length === 0) pending.push("resultados calculados");
  }

  if (draft.tipo === "laudo") {
    if (!isFilled(draft.protocolo, 3)) pending.push("protocolo");
    if (!isFilled(draft.parecerFinal, 16)) pending.push("parecer final");
  }

  return { ready: pending.length === 0, pending };
}

function buildAnamneseRadarItems(draft: PerfilAvaliacao) {
  const answers = PARQ_QUESTIONS.map((_, index) =>
    String(draft.parq?.[`q${index + 1}`] || "").toLowerCase(),
  );
  const total = PARQ_QUESTIONS.length || 1;
  const answered = answers.filter(Boolean).length;
  const positive = answers.filter(item => item.includes("sim")).length;
  const negative = answers.filter(item => item.includes("nao")).length;
  const review = answers.filter(item => item.includes("revis")).length;
  const objectiveScore = Math.min(100, Math.round((String(draft.objetivo || "").trim().length / 120) * 100));

  return [
    { label: "PAR-Q respondido", value: Math.round((answered / total) * 100), raw: `${answered}/${total}`, classification: "questionario" },
    { label: "Respostas de risco", value: Math.max(25, 100 - Math.round((positive / total) * 100)), raw: `${positive}`, classification: "sim" },
    { label: "Respostas negativas", value: Math.round((negative / total) * 100), raw: `${negative}`, classification: "nao" },
    { label: "Itens para revisar", value: Math.max(25, 100 - Math.round((review / total) * 100)), raw: `${review}`, classification: "revisar" },
    { label: "Objetivo descrito", value: Math.max(25, objectiveScore), raw: `${Math.round(objectiveScore)}%`, classification: "texto" },
  ];
}

function scoreResult(result: PerfilAvaliacaoResultado, sexo: "masculino" | "feminino") {
  const method = String(result.metodo || "").toLowerCase();
  const classification = String(result.classificacao || "").toLowerCase();
  const value = Number(result.valor || 0);

  if (method.includes("imc")) {
    const distance = Math.abs(value - 22);
    return Math.max(28, Math.min(100, Math.round(100 - distance * 11)));
  }

  if (method.includes("rcq")) {
    if (classification.includes("reduzido")) return 95;
    if (classification.includes("aumentado")) return 62;
    return 36;
  }

  if (method.includes("rcest")) {
    if (classification.includes("adequado")) return 92;
    if (classification.includes("baixo")) return 84;
    if (classification.includes("alto")) return 56;
    return 35;
  }

  if (method.includes("cintura")) {
    if (classification.includes("reduzido")) return 92;
    if (classification.includes("aumentado")) return 60;
    return 38;
  }

  if (method.includes("rfm") || method.includes("us navy") || method.includes("gordura informado")) {
    const targetMin = sexo === "feminino" ? 18 : 10;
    const targetMax = sexo === "feminino" ? 30 : 22;
    const center = (targetMin + targetMax) / 2;
    const distance = Math.abs(value - center);
    return Math.max(25, Math.min(100, Math.round(100 - distance * 4)));
  }

  if (method.includes("massa magra")) return Math.max(30, Math.min(100, Math.round(value * 1.8)));
  if (method.includes("massa gorda")) return Math.max(25, Math.min(100, Math.round(100 - value * 2)));
  return 70;
}

function buildInstructions(
  draft: PerfilAvaliacao,
  resultados: PerfilAvaliacaoResultado[],
  medidas: PerfilAvaliacaoMedida[],
) {
  const instructions: string[] = [
    "Repita as mesmas técnicas de medição na reavaliação para comparar evolução real.",
    "Priorize rotina de treino, sono e hidratação para manter consistência semanal.",
    "Use este relatório como apoio de conversa com profissional habilitado.",
  ];

  const imc = resultados.find(item => item.metodo.toLowerCase().includes("imc"));
  const rcq = resultados.find(item => item.metodo.toLowerCase().includes("rcq"));
  const rce = resultados.find(item => item.metodo.toLowerCase().includes("rcest"));
  const rfm = resultados.find(item => item.metodo.toLowerCase().includes("rfm"));
  const gasto = resultados.find(item => item.metodo.toLowerCase().includes("gasto diario"));
  const consistencyIssues = medidas.filter(item => (item.erroPercentual || 0) > 5).length;

  if (imc?.classificacao?.toLowerCase().includes("sobrepeso") || imc?.classificacao?.toLowerCase().includes("obesidade")) {
    instructions.push("Ajuste volume alimentar e frequência aeróbica para reduzir risco cardiometabólico.");
  }
  if (rcq?.classificacao?.toLowerCase().includes("aumentado")) {
    instructions.push("Monitore cintura e quadril semanalmente e combine força com cardio progressivo.");
  }
  if (rce?.classificacao?.toLowerCase().includes("alto") || rce?.classificacao?.toLowerCase().includes("muito")) {
    instructions.push("Inclua meta de cintura semanal e mantenha treino combinado com cardio leve a moderado.");
  }
  if (rfm && Number(rfm.valor) >= (draft.sexo === "feminino" ? 32 : 24)) {
    instructions.push("Considere manter déficit calórico leve com proteína adequada para preservar massa magra.");
  }
  if (gasto && Number(gasto.valor) > 0) {
    instructions.push(`Use ${Math.round(Number(gasto.valor))} kcal/dia como referência inicial e ajuste por evolução semanal.`);
  }
  if (consistencyIssues > 0) {
    instructions.push(`Revise técnica de coleta: ${consistencyIssues} medida(s) com variação alta entre rodadas.`);
  }

  return instructions;
}

function downloadAssessmentPdf(draft: PerfilAvaliacao, user: any, preview: { medidas: PerfilAvaliacaoMedida[]; resultados: PerfilAvaliacaoResultado[] }) {
  const owner = String(user?.fullName || user?.nickname || "Atleta");
  const generatedAt = new Date().toLocaleString("pt-BR");
  const instructions = buildInstructions(draft, preview.resultados, preview.medidas);
  const measureLines = preview.medidas
    .filter(item => item.mediana != null)
    .map(item => `- ${item.nome} (${item.categoria}): ${item.mediana}${item.unidade}${item.erroPercentual != null ? ` | erro ${item.erroPercentual}%` : ""}`);
  const resultLines = preview.resultados.map(
    item => `- ${item.metodo}: ${item.valor}${item.unidade}${item.classificacao ? ` | ${item.classificacao}` : ""}`,
  );

  const lines = [
    "ATIVORAFIT - RELATÓRIO COMPLETO DE AVALIAÇÃO",
    "",
    `Gerado em: ${generatedAt}`,
    `Usuário: ${owner}`,
    `Tipo: ${draft.tipo}`,
    `Título: ${draft.titulo || "Avaliação sem título"}`,
    `Data da avaliação: ${draft.dataAvaliacao || "-"}`,
    `Data de reavaliação: ${draft.dataReavaliacao || "-"}`,
    `Objetivo: ${draft.objetivo || "-"}`,
    `Observações: ${draft.observacoes || "-"}`,
    ...(draft.tipo === "anamnese"
      ? [
          "",
          "PAR-Q",
          ...PARQ_QUESTIONS.map((question, index) => `- ${question}: ${draft.parq?.[`q${index + 1}`] || "sem resposta"}`),
        ]
      : []),
    "",
    "RESULTADOS CALCULADOS",
    ...(resultLines.length ? resultLines : ["- Sem resultados calculados"]),
    "",
    "MEDIDAS REGISTRADAS",
    ...(measureLines.length ? measureLines : ["- Sem medidas concluídas"]),
    "",
    "INSTRUÇÕES DE ACOMPANHAMENTO",
    ...instructions.map((item, index) => `${index + 1}. ${item}`),
    "",
    "Aviso: este relatório é um apoio informativo e não substitui avaliação clínica presencial.",
  ];

  const blob = buildSimplePdf(lines);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `avaliacao-${(draft.dataAvaliacao || "perfil").replaceAll("/", "-")}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ProfileAssessmentPanel({ draft, setDraft, onSave, saving, user }: Props) {
  const [showAdvancedMeasures, setShowAdvancedMeasures] = useState(false);

  const preview = useMemo(
    () => calculateAssessmentResults({
      medidas: draft.medidas,
      sexo: draft.sexo,
      dataNascimento: draft.dataNascimento,
      percentualGorduraInformado: draft.percentualGorduraInformado,
    }),
    [draft.medidas, draft.sexo, draft.dataNascimento, draft.percentualGorduraInformado],
  );

  const groupedMeasures = useMemo(() => {
    return preview.medidas.reduce<Record<string, PerfilAvaliacaoMedida[]>>((acc, item) => {
      acc[item.categoria] = [...(acc[item.categoria] ?? []), item];
      return acc;
    }, {});
  }, [preview.medidas]);

  const completionState = useMemo(
    () => isAssessmentComplete(draft, preview.medidas, preview.resultados),
    [draft, preview.medidas, preview.resultados],
  );

  const radarItems = useMemo(() => {
    const sexo = draft.sexo === "feminino" ? "feminino" : "masculino";
    const calculatedItems = preview.resultados.slice(0, 6).map(item => ({
      label: item.metodo,
      value: scoreResult(item, sexo),
      raw: `${item.valor}${item.unidade}`,
      classification: item.classificacao || "calculado",
    }));

    if (calculatedItems.length > 0) return calculatedItems;
    if (draft.tipo === "anamnese") return buildAnamneseRadarItems(draft);
    return [];
  }, [draft, draft.sexo, preview.resultados]);

  const radarPolygon = useMemo(() => {
    if (radarItems.length === 0) return "";
    const cx = 140;
    const cy = 140;
    const radius = 98;
    const points = radarItems.map((item, index) => {
      const angle = (-Math.PI / 2) + (index * (2 * Math.PI / radarItems.length));
      const scaledRadius = radius * (Math.max(20, Math.min(100, item.value)) / 100);
      const x = cx + Math.cos(angle) * scaledRadius;
      const y = cy + Math.sin(angle) * scaledRadius;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return points.join(" ");
  }, [radarItems]);

  const measuredItems = useMemo(
    () => preview.medidas.filter(item => item.mediana != null),
    [preview.medidas],
  );

  const detailedInstructions = useMemo(
    () => buildInstructions(draft, preview.resultados, preview.medidas),
    [draft, preview.resultados, preview.medidas],
  );

  const previewHighlights = useMemo(
    () => preview.resultados.slice(0, 6),
    [preview.resultados],
  );

  const hiddenResultsCount = Math.max(0, preview.resultados.length - previewHighlights.length);

  const coreMeasureValues = useMemo(() => {
    return CORE_MEASURE_FIELDS.reduce<Record<string, string>>((acc, item) => {
      acc[item.slug] = readCoreMeasureValue(draft.medidas, item.slug);
      return acc;
    }, {});
  }, [draft.medidas]);

  const advancedMeasureGroups = useMemo(() => {
    return Object.entries(groupedMeasures)
      .map(([category, items]) => [
        category,
        items.filter(item => !CORE_MEASURE_SLUGS.includes(item.slug as (typeof CORE_MEASURE_SLUGS)[number])),
      ] as const)
      .filter(([, items]) => items.length > 0);
  }, [groupedMeasures]);

  useEffect(() => {
    if (draft.tipo !== "completa") setShowAdvancedMeasures(false);
  }, [draft.tipo]);

  useEffect(() => {
    if (draft.tipo === "anamnese") return;
    const ensured = ensureCoreMeasures(draft.medidas);
    if (ensured.length === draft.medidas.length) return;
    setDraft(prev => ({ ...prev, medidas: ensured }));
  }, [draft.tipo, draft.medidas, setDraft]);

  const changeType = (tipo: PerfilAvaliacaoTipo) => {
    setDraft(prev => ({
      ...emptyAssessment(user, tipo),
      objetivo: prev.objetivo,
      sexo: prev.sexo,
      dataNascimento: prev.dataNascimento,
      dataAvaliacao: prev.dataAvaliacao,
    }));
  };

  const updateMeasure = (slug: string, key: "rodada1" | "rodada2" | "rodada3", value: string) => {
    setDraft(prev => ({
      ...prev,
      medidas: prev.medidas.map(item => item.slug === slug
        ? { ...item, [key]: normalizeNumericInput(value) }
        : item),
    }));
  };

  const updateCoreMeasure = (slug: string, value: string) => {
    setDraft(prev => {
      const parsedValue = normalizeNumericInput(value);
      const measures = ensureCoreMeasures(prev.medidas).map(item => {
        if (item.slug !== slug) return item;
        return {
          ...item,
          rodada1: parsedValue,
          rodada2: null,
          rodada3: null,
        };
      });
      return { ...prev, medidas: measures };
    });
  };

  return (
    <section className="min-w-0 space-y-5 overflow-x-hidden">
      <div className="grid gap-3 md:grid-cols-4">
        {(Object.keys(typeLabels) as PerfilAvaliacaoTipo[]).map(tipo => {
          const meta = typeLabels[tipo];
          const Icon = typeIcons[tipo];
          return (
            <button
              key={tipo}
              type="button"
              onClick={() => changeType(tipo)}
              className={`rounded-lg border p-4 text-left transition ${
                draft.tipo === tipo
                  ? "border-sky-500/40 bg-sky-500/15"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
            >
              <Icon size={18} className={draft.tipo === tipo ? "text-sky-300" : "text-white/35"} />
              <p className="mt-3 text-sm font-black text-white">{meta.label}</p>
              <p className="mt-1 text-[10px] leading-relaxed text-white/35">{meta.desc}</p>
            </button>
          );
        })}
      </div>

      <div className="rounded-lg border border-white/10 bg-white/5 p-5 sm:p-6">
        <div className="grid gap-4 lg:grid-cols-3">
          <Field label="Título">
            <input className={inputClass()} value={draft.titulo} onChange={e => setDraft(p => ({ ...p, titulo: e.target.value }))} />
          </Field>
          <Field label="Data da avaliação">
            <input type="date" className={inputClass()} value={draft.dataAvaliacao} onChange={e => setDraft(p => ({ ...p, dataAvaliacao: e.target.value }))} />
          </Field>
          <Field label="Data de reavaliação">
            <input type="date" className={inputClass()} value={draft.dataReavaliacao ?? ""} onChange={e => setDraft(p => ({ ...p, dataReavaliacao: e.target.value }))} />
          </Field>
          <Field label="Sexo para cálculo">
            <select className={inputClass()} value={draft.sexo ?? "masculino"} onChange={e => setDraft(p => ({ ...p, sexo: e.target.value as any }))}>
              <option value="masculino">Masculino</option>
              <option value="feminino">Feminino</option>
            </select>
          </Field>
          <Field label="Nascimento">
            <input type="date" className={inputClass()} value={draft.dataNascimento ?? ""} onChange={e => setDraft(p => ({ ...p, dataNascimento: e.target.value }))} />
          </Field>
          <Field label="% gordura manual">
            <input type="number" min="0" step="0.1" className={inputClass()} value={draft.percentualGorduraInformado ?? ""} onChange={e => setDraft(p => ({ ...p, percentualGorduraInformado: e.target.value ? Number(e.target.value) : null }))} placeholder="Opcional" />
          </Field>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Field label="Objetivo da avaliação">
            <textarea className={inputClass("min-h-24 resize-none")} value={draft.objetivo} onChange={e => setDraft(p => ({ ...p, objetivo: e.target.value }))} placeholder="O que você quer acompanhar nesta avaliação?" />
          </Field>
          <Field label="Observações">
            <textarea className={inputClass("min-h-24 resize-none")} value={draft.observacoes} onChange={e => setDraft(p => ({ ...p, observacoes: e.target.value }))} placeholder="Informações livres sobre o momento atual." />
          </Field>
        </div>

        {draft.tipo === "anamnese" && (
          <div className="mt-6 space-y-3">
            <p className={labelClass()}>PAR-Q</p>
            <div className="grid gap-3 lg:grid-cols-2">
              {PARQ_QUESTIONS.map((question, index) => (
                <div key={question} className="rounded-lg border border-white/10 bg-black/20 p-4">
                  <p className="text-sm leading-relaxed text-white/70">{index + 1}. {question}</p>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {["Não", "Sim", "Prefiro revisar"].map(option => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setDraft(p => ({ ...p, parq: { ...p.parq, [`q${index + 1}`]: option } }))}
                        className={`rounded-lg border px-3 py-2 text-[9px] font-black uppercase tracking-widest ${
                          draft.parq[`q${index + 1}`] === option
                            ? "border-sky-500/40 bg-sky-500 text-black"
                            : "border-white/10 bg-white/5 text-white/35"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {draft.tipo === "laudo" && (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <Field label="Protocolo usado">
              <select className={inputClass()} value={draft.protocolo} onChange={e => setDraft(p => ({ ...p, protocolo: e.target.value }))}>
                <option value="">Selecionar protocolo</option>
                {ADVANCED_PROTOCOLS.map(protocol => <option key={protocol} value={protocol}>{protocol}</option>)}
              </select>
            </Field>
            <Field label="Parecer final">
              <textarea className={inputClass("min-h-24 resize-none")} value={draft.parecerFinal} onChange={e => setDraft(p => ({ ...p, parecerFinal: e.target.value }))} placeholder="Recomendações, cuidados e próximos passos." />
            </Field>
          </div>
        )}

        {draft.tipo !== "anamnese" && (
          <div className="mt-6 min-w-0 space-y-5">
            <div className="rounded-lg border border-sky-500/20 bg-sky-500/10 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <p className={labelClass()}>Método inteligente</p>
                  <p className="mt-1 text-sm leading-relaxed text-white/75">
                    Avaliação baseada nas fórmulas das imagens: US Navy por sexo e RFM como apoio.
                  </p>
                </div>
                <div className="rounded-lg border border-sky-400/25 bg-sky-400/10 px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-sky-100">
                  homens: 4 | mulheres: 5
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {CORE_MEASURE_FIELDS.map(field => (
                  <label key={field.slug} className="space-y-2 min-w-0">
                    <span className={labelClass()}>{field.nome}</span>
                    <div className="relative min-w-0">
                      <input
                        type="number"
                        step="0.1"
                        value={coreMeasureValues[field.slug] ?? ""}
                        onChange={event => updateCoreMeasure(field.slug, event.target.value)}
                        placeholder={field.placeholder}
                        className={inputClass("pr-12")}
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/35">
                        {field.unidade}
                      </span>
                    </div>
                  </label>
                ))}
              </div>

              <div className="mt-3">
                <label className="space-y-2 min-w-0">
                  <span className={labelClass()}>% gordura (opcional para cálculos extras)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    className={inputClass()}
                    value={draft.percentualGorduraInformado ?? ""}
                    onChange={e => setDraft(p => ({ ...p, percentualGorduraInformado: e.target.value ? Number(e.target.value) : null }))}
                    placeholder="Ex.: 18.5"
                  />
                </label>
              </div>
            </div>
            {draft.tipo !== "completa" && advancedMeasureGroups.length > 0 && (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className={labelClass()}>Ajustes adicionais</p>
                <p className="mt-1 text-xs text-white/35">Use este bloco apenas se quiser refinar mais a precisão.</p>
              </div>
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[9px] font-bold uppercase tracking-widest text-amber-100">
                Estimativa de apoio
              </div>
            </div>
            )}

            {draft.tipo !== "completa" && advancedMeasureGroups.map(([category, items]) => (
              <div key={category} className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-sky-300">{category}</p>
                <div className="grid gap-3">
                  {items.map(measure => (
                    <div key={measure.slug} className="grid gap-2 rounded-lg border border-white/10 bg-black/20 p-3 md:grid-cols-[1.2fr_repeat(3,0.65fr)_0.8fr] md:items-center">
                      <div>
                        <p className="text-sm font-bold text-white">{measure.nome}</p>
                        <p className="text-[10px] text-white/30">{measure.unidade}</p>
                      </div>
                      {(["rodada1", "rodada2", "rodada3"] as const).map((roundKey, index) => (
                        <input
                          key={roundKey}
                          type="number"
                          step="0.1"
                          className={inputClass("py-2")}
                          value={measure[roundKey] ?? ""}
                          onChange={e => updateMeasure(measure.slug, roundKey, e.target.value)}
                          placeholder={`${index + 1}a`}
                        />
                      ))}
                      <div className="rounded-lg bg-white/5 px-3 py-2">
                        <p className="text-[8px] font-black uppercase tracking-widest text-white/25">Mediana</p>
                        <p className="text-sm font-black text-white">{measure.mediana ?? "-"}</p>
                        {measure.erroPercentual != null && (
                          <p className={`text-[9px] ${measure.erroPercentual <= 5 ? "text-emerald-300" : "text-amber-300"}`}>
                            {measure.erroPercentual}% · {measure.consistencia}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {draft.tipo === "completa" && (
              <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className={labelClass()}>Medidas avançadas (opcional)</p>
                    <p className="mt-1 text-xs leading-relaxed text-white/45">
                      Para ganhar mais precisão. No smartphone essa área fica recolhida por padrão.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAdvancedMeasures(value => !value)}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-white/60 hover:text-white"
                  >
                    {showAdvancedMeasures ? "Ocultar extras" : "Abrir extras"}
                  </button>
                </div>

                {showAdvancedMeasures && (
                  <div className="mt-3 space-y-3">
                    {advancedMeasureGroups.map(([category, items]) => (
                      <div key={category} className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-sky-300">{category}</p>
                        <div className="grid gap-3">
                          {items.map(measure => (
                            <div key={measure.slug} className="grid gap-2 rounded-lg border border-white/10 bg-black/20 p-3 md:grid-cols-[1.2fr_repeat(3,0.65fr)_0.8fr] md:items-center">
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-white">{measure.nome}</p>
                                <p className="text-[10px] text-white/30">{measure.unidade}</p>
                              </div>
                              {(["rodada1", "rodada2", "rodada3"] as const).map((roundKey, index) => (
                                <input
                                  key={roundKey}
                                  type="number"
                                  step="0.1"
                                  className={inputClass("py-2")}
                                  value={measure[roundKey] ?? ""}
                                  onChange={e => updateMeasure(measure.slug, roundKey, e.target.value)}
                                  placeholder={`${index + 1}a`}
                                />
                              ))}
                              <div className="rounded-lg bg-white/5 px-3 py-2">
                                <p className="text-[8px] font-black uppercase tracking-widest text-white/25">Mediana</p>
                                <p className="text-sm font-black text-white">{measure.mediana ?? "-"}</p>
                                {measure.erroPercentual != null && (
                                  <p className={`text-[9px] ${measure.erroPercentual <= 5 ? "text-emerald-300" : "text-amber-300"}`}>
                                    {measure.erroPercentual}% · {measure.consistencia}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {previewHighlights.length > 0 && (
          <div className="mt-6 rounded-lg border border-sky-500/20 bg-sky-500/10 p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-sky-200">Prévia dos cálculos seguros</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {previewHighlights.map(result => (
                <div key={result.metodo} className="rounded-lg bg-black/25 p-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/35">{result.metodo}</p>
                  <p className="mt-1 text-xl font-black text-white">{result.valor}{result.unidade}</p>
                  <p className="mt-1 text-[10px] text-white/40">{result.classificacao}</p>
                </div>
              ))}
            </div>
            {hiddenResultsCount > 0 && (
              <p className="mt-3 text-xs leading-relaxed text-sky-100/70">
                +{hiddenResultsCount} indicador(es) adicionais no gráfico detalhado e no PDF completo.
              </p>
            )}
          </div>
        )}

        {!completionState.ready && (
          <div className="mt-6 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-amber-100">
              Complete a avaliação para liberar gráfico completo e PDF
            </p>
            <p className="mt-2 text-sm leading-relaxed text-amber-50/80">
              Pendências: {completionState.pending.join(", ")}.
            </p>
          </div>
        )}

        {completionState.ready && (
          <div className="mt-6 min-w-0 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-emerald-200">
                  Gráfico detalhado da avaliação completa
                </p>
                <p className="mt-1 text-sm text-emerald-100/70">
                  Painel completo com indicadores, medidas consolidadas e recomendações.
                </p>
              </div>
              <span className="rounded-lg border border-emerald-300/25 bg-emerald-400/10 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-200">
                pronto para PDF
              </span>
            </div>

            <div className="mt-4 grid min-w-0 gap-4 xl:grid-cols-[290px_1fr]">
              <div className="min-w-0 rounded-lg border border-white/10 bg-black/25 p-3">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/45">
                  <BarChart3 size={13} />
                  Índice visual
                </div>
                <svg viewBox="0 0 280 280" className="mt-3 h-[240px] w-full">
                  <circle cx="140" cy="140" r="98" fill="none" stroke="rgba(255,255,255,0.08)" />
                  <circle cx="140" cy="140" r="72" fill="none" stroke="rgba(255,255,255,0.08)" />
                  <circle cx="140" cy="140" r="46" fill="none" stroke="rgba(255,255,255,0.08)" />
                  {radarPolygon && (
                    <polygon
                      points={radarPolygon}
                      fill="rgba(56,189,248,0.25)"
                      stroke="rgba(56,189,248,0.95)"
                      strokeWidth="2"
                    />
                  )}
                  <circle cx="140" cy="140" r="3" fill="rgba(125,211,252,0.9)" />
                </svg>
              </div>

              <div className="min-w-0 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {radarItems.map(item => (
                    <div key={item.label} className="rounded-lg border border-white/10 bg-black/25 p-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/40">{item.label}</p>
                      <p className="mt-1 text-xl font-black text-white">{item.raw}</p>
                      <p className="mt-1 text-[10px] text-white/40">{item.classification}</p>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-sky-400" style={{ width: `${item.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg border border-white/10 bg-black/25 p-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Medidas consolidadas</p>
                  <div className="mt-3 grid max-h-[320px] gap-2 overflow-y-auto pr-1 md:grid-cols-2">
                    {measuredItems.map(item => (
                      <div key={item.slug} className="rounded-lg border border-white/10 bg-black/20 p-2.5">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate text-xs font-bold text-white">{item.nome}</p>
                          <p className="shrink-0 text-xs font-black text-sky-200">{item.mediana}{item.unidade}</p>
                        </div>
                        {item.erroPercentual != null && (
                          <p className={`mt-1 text-[10px] ${item.erroPercentual <= 5 ? "text-emerald-300" : "text-amber-300"}`}>
                            Erro: {item.erroPercentual}% · {item.consistencia}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Instruções inteligentes</p>
              <ul className="mt-2 grid gap-1.5 text-sm text-white/75">
                {detailedInstructions.map(item => (
                  <li key={item} className="leading-relaxed">- {item}</li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              onClick={() => downloadAssessmentPdf(draft, user, preview)}
              className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 text-[10px] font-black uppercase tracking-widest text-black sm:w-auto"
            >
              <Download size={14} />
              Baixar PDF completo com informações e instruções
            </button>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => onSave("rascunho")}
            disabled={saving}
            className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-5 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Salvar rascunho
          </button>
          <button
            type="button"
            onClick={() => onSave("salvo")}
            disabled={saving}
            className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-sky-500 px-5 text-[10px] font-black uppercase tracking-widest text-black disabled:opacity-50"
          >
            <CheckCircle2 size={14} />
            Salvar avaliação
          </button>
        </div>
      </div>
    </section>
  );
}
