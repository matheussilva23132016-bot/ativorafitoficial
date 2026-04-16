"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Beef,
  BookOpen,
  ChevronLeft,
  Droplets,
  Flame,
  Lock,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  UtensilsCrossed,
  Wheat,
} from "lucide-react";
import {
  filterManualFoods,
  FOOD_MANUAL,
  goalLabel,
  MANUAL_CATEGORIES,
  MANUAL_GOALS,
  type ManualFood,
  type ManualGoal,
} from "../foodManualData";

interface FoodManualViewProps {
  allowAccess: boolean;
  onBack?: () => void;
  onAddFood?: (food: ManualFood) => void;
  embedded?: boolean;
  title?: string;
  addLabel?: string;
}

const macroCards = [
  { key: "calorias", label: "Kcal", unit: "", icon: Flame, color: "text-orange-400" },
  { key: "proteinas", label: "Proteínas", unit: "g", icon: Beef, color: "text-rose-400" },
  { key: "carbos", label: "Carbos", unit: "g", icon: Wheat, color: "text-amber-400" },
  { key: "gorduras", label: "Gorduras", unit: "g", icon: Droplets, color: "text-sky-400" },
] as const;

const compactMacros = [
  { key: "calorias", label: "kcal" },
  { key: "proteinas", label: "prot" },
  { key: "carbos", label: "carb" },
  { key: "gorduras", label: "gord" },
] as const;

export function FoodManualView({
  allowAccess,
  onBack,
  onAddFood,
  embedded = false,
  title = "Manual de alimentos",
  addLabel = "Adicionar ao cardápio",
}: FoodManualViewProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");
  const [goal, setGoal] = useState<ManualGoal | "todos">("todos");
  const [letter, setLetter] = useState("Todos");
  const [selectedId, setSelectedId] = useState(FOOD_MANUAL[0]?.id ?? "");

  const letters = useMemo(
    () => ["Todos", ...Array.from(new Set(FOOD_MANUAL.map(food => food.letra))).sort()],
    [],
  );

  const foods = useMemo(
    () => filterManualFoods({ search, category, goal, letter }),
    [search, category, goal, letter],
  );

  const selected = useMemo(
    () => foods.find(food => food.id === selectedId) ?? foods[0] ?? FOOD_MANUAL[0],
    [foods, selectedId],
  );

  if (!allowAccess) {
    return (
      <motion.div
        key="food-manual-locked"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[28px] border border-amber-500/15 bg-amber-500/8 p-5 sm:p-7"
      >
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="mb-5 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/35 hover:text-white"
          >
            <ChevronLeft size={16} />
            Voltar
          </button>
        )}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/15">
            <Lock size={24} className="text-amber-300" />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-amber-300">
              Acesso restrito
            </p>
            <h2 className="mt-1 text-2xl font-black italic text-white">
              Apenas nutricionistas podem abrir o manual pelo dashboard principal.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/45">
              Dentro das comunidades, o manual aparece no painel nutricional para quem tem permissão profissional de cardápio.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="food-manual"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`w-full text-left ${embedded ? "space-y-4" : "mx-auto max-w-7xl space-y-5"}`}
    >
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex min-h-10 items-center gap-2 rounded-xl px-1 text-[10px] font-black uppercase tracking-widest text-white/35 transition-colors hover:text-white"
        >
          <ChevronLeft size={16} />
          Voltar
        </button>
      )}

      <section className="rounded-[24px] border border-emerald-500/12 bg-[#06101D] p-5 sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-black">
              <BookOpen size={12} />
              Biblioteca profissional
            </div>
            <h1 className="mt-5 text-3xl font-black italic leading-none tracking-tighter text-white sm:text-5xl">
              {title}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/48">
              Consulta A-Z com macros por porção, filtros por objetivo e aplicação direta em cardápios.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-4">
            <p className="text-3xl font-black italic text-white">{FOOD_MANUAL.length}</p>
            <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-white/30">
              alimentos catalogados
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(300px,0.88fr)_minmax(0,1.12fr)]">
        <div className="space-y-3 rounded-[24px] border border-white/10 bg-[#050B14] p-4">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Buscar alimento, macro ou objetivo..."
              className="w-full rounded-2xl border border-white/10 bg-black/20 py-3 pl-9 pr-4 text-sm text-white outline-none placeholder:text-white/18 focus:border-emerald-500/40"
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <select
              value={category}
              onChange={event => setCategory(event.target.value)}
              className="rounded-xl border border-white/10 bg-[#07111D] px-3 py-3 text-xs font-bold text-white/55 outline-none"
            >
              {MANUAL_CATEGORIES.map(item => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <select
              value={goal}
              onChange={event => setGoal(event.target.value as ManualGoal | "todos")}
              className="rounded-xl border border-white/10 bg-[#07111D] px-3 py-3 text-xs font-bold text-white/55 outline-none"
            >
              <option value="todos">Todos os objetivos</option>
              {MANUAL_GOALS.map(item => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-1 overflow-x-auto pb-1">
            {letters.map(item => (
              <button
                key={item}
                type="button"
                onClick={() => setLetter(item)}
                className={`min-h-9 min-w-9 rounded-xl px-2 text-[9px] font-black uppercase tracking-widest transition-all ${
                  letter === item
                    ? "bg-emerald-500 text-black"
                    : "border border-white/10 bg-white/5 text-white/30 hover:text-white"
                }`}
              >
                {item === "Todos" ? "A-Z" : item}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3 px-1">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/25">
              {foods.length} resultado{foods.length === 1 ? "" : "s"}
            </p>
            <p className="text-[9px] font-bold text-white/25">
              Base TACO/USDA
            </p>
          </div>

          <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
            {foods.length ? foods.map(food => (
              <button
                key={food.id}
                type="button"
                onClick={() => setSelectedId(food.id)}
                className={`w-full rounded-2xl border p-4 text-left transition-all ${
                  selected?.id === food.id
                    ? "border-emerald-500/35 bg-emerald-500/12"
                    : "border-white/8 bg-white/[0.03] hover:border-white/18 hover:bg-white/[0.06]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-white">{food.nome}</p>
                    <p className="mt-1 text-[10px] font-bold text-white/35">{food.porcaoBase} • {food.categoria}</p>
                  </div>
                  <span className="hidden shrink-0 rounded-full bg-white/8 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-emerald-300 sm:inline-flex">
                    {food.perfil}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {compactMacros.map(item => {
                    const value = food[item.key];
                    const suffix = item.key === "calorias" ? "" : "g";
                    return (
                      <span
                        key={item.key}
                        className="rounded-lg bg-black/24 px-2.5 py-1 text-[10px] font-black text-white/48"
                      >
                        {value}{suffix} {item.label}
                      </span>
                    );
                  })}
                </div>
              </button>
            )) : (
              <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center">
                <UtensilsCrossed size={24} className="mx-auto text-white/10" />
                <p className="mt-3 text-sm font-black italic text-white/25">Nenhum alimento encontrado</p>
                <p className="mt-1 text-xs text-white/25">Ajuste busca, filtro ou letra.</p>
              </div>
            )}
          </div>
        </div>

        <aside className="rounded-[24px] border border-white/10 bg-[#050B14] p-4 sm:p-5">
          {selected && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-500/12 bg-emerald-500/7 p-5">
                <p className="text-[9px] font-black uppercase tracking-widest text-emerald-300">
                  {selected.categoria} • Fonte {selected.fonte}
                </p>
                <h2 className="mt-3 text-3xl font-black italic leading-none text-white">{selected.nome}</h2>
                <p className="mt-3 text-sm font-bold text-white/45">Porção base: {selected.porcaoBase}</p>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {macroCards.map(item => {
                  const Icon = item.icon;
                  const value = selected[item.key];
                  return (
                    <div key={item.key} className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/28">{item.label}</p>
                        <Icon size={16} className={item.color} />
                      </div>
                      <p className="mt-3 text-2xl font-black leading-none text-white">
                        {value}<span className="text-sm text-white/35">{item.unit}</span>
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2">
                  <Sparkles size={15} className="text-emerald-300" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/30">
                    Serve melhor para
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selected.objetivos.map(obj => (
                    <span
                      key={obj}
                      className="rounded-xl border border-emerald-500/12 bg-emerald-500/7 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-emerald-300"
                    >
                      {goalLabel(obj)}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={15} className="text-sky-300" />
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/30">
                    Observação profissional
                  </p>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-white/45">{selected.observacao}</p>
                <p className="mt-3 text-[10px] leading-relaxed text-white/28">
                  Macros podem variar por preparo, marca e método de medição. Em prescrição real, confirme rótulo, tabela usada e gramagem final.
                </p>
              </div>

              {onAddFood && (
                <button
                  type="button"
                  onClick={() => onAddFood(selected)}
                  className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 text-[10px] font-black uppercase tracking-widest text-black transition-all active:scale-[0.99]"
                >
                  <Plus size={14} />
                  {addLabel}
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          )}
        </aside>
      </section>
    </motion.div>
  );
}
