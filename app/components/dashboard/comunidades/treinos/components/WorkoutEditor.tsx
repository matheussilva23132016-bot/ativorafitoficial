// app/components/dashboard/comunidades/treinos/components/WorkoutEditor.tsx
"use client";

import {
  ArrowLeft, Plus, Trash2, GripVertical, ChevronDown,
  ChevronUp, Save, Send, Link, Video, User,
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Treino, GrupoExercicios, Exercicio } from "../types";
import { FOCOS_LIST, DIAS } from "../constants";
import { novoExercicio, novoGrupo } from "../utils";

// ── Membro simplificado para seleção ─────────────────────────
export interface MembroSimples {
  id: string;
  nome: string;
}

interface Props {
  treino: Treino;
  membros?: MembroSimples[];   // ← NOVO
  onSave: (t: Treino) => void;
  onPublish: (t: Treino) => void;
  onClose: () => void;
}

export function WorkoutEditor({ treino: inicial, membros = [], onSave, onPublish, onClose }: Props) {
  const [t, setT] = useState<Treino>(JSON.parse(JSON.stringify(inicial)));
  const [gruposAbertos, setGruposAbertos] = useState<Record<string, boolean>>(
    Object.fromEntries(inicial.grupos.map(g => [g.id, true]))
  );
  const [buscaAluno, setBuscaAluno] = useState("");

  // ── helpers ────────────────────────────────────────────────
  const setField = <K extends keyof Treino>(k: K, v: Treino[K]) =>
    setT(p => ({ ...p, [k]: v }));

  const toggleGrupo = (id: string) =>
    setGruposAbertos(p => ({ ...p, [id]: !p[id] }));

  // ── Destinatário atual ─────────────────────────────────────
  const destinatario = t.paraTodos ? "todos" : t.paraAluno !== undefined ? "aluno" : "grupo";

  // ── Membros filtrados pela busca ───────────────────────────
  const membrosFiltrados = membros.filter(m =>
    m.nome.toLowerCase().includes(buscaAluno.toLowerCase())
  );

  // ── Grupos ─────────────────────────────────────────────────
  const addGrupo = () => {
    const g = novoGrupo();
    setT(p => ({ ...p, grupos: [...p.grupos, g] }));
    setGruposAbertos(p => ({ ...p, [g.id]: true }));
  };

  const removeGrupo = (id: string) =>
    setT(p => ({ ...p, grupos: p.grupos.filter(g => g.id !== id) }));

  const updateGrupo = (id: string, patch: Partial<GrupoExercicios>) =>
    setT(p => ({
      ...p,
      grupos: p.grupos.map(g => g.id === id ? { ...g, ...patch } : g),
    }));

  // ── Exercícios ─────────────────────────────────────────────
  const addExercicio = (grupoId: string) =>
    updateGrupo(grupoId, {
      exercicios: [
        ...(t.grupos.find(g => g.id === grupoId)?.exercicios ?? []),
        novoExercicio(),
      ],
    });

  const removeExercicio = (grupoId: string, exId: string) => {
    const grupo = t.grupos.find(g => g.id === grupoId);
    if (!grupo) return;
    updateGrupo(grupoId, {
      exercicios: grupo.exercicios.filter(e => e.id !== exId),
    });
  };

  const updateExercicio = (grupoId: string, exId: string, patch: Partial<Exercicio>) => {
    const grupo = t.grupos.find(g => g.id === grupoId);
    if (!grupo) return;
    updateGrupo(grupoId, {
      exercicios: grupo.exercicios.map(e =>
        e.id === exId ? { ...e, ...patch } : e
      ),
    });
  };

  // ── Cardio ─────────────────────────────────────────────────
  const toggleCardio = () =>
    setT(p => ({
      ...p,
      cardio: p.cardio
        ? undefined
        : { tipo: "Esteira", duracao: "20min", intensidade: "Moderada" },
    }));

  const inp = "w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-sm \
text-white/70 outline-none focus:border-sky-500/40 transition-all \
placeholder:text-white/15";

  // ── Nome do aluno selecionado ──────────────────────────────
  const alunoSelecionado = membros.find(m => m.id === t.paraAluno);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-[9px] font-black uppercase
            text-white/20 hover:text-white/60 transition-all">
          <ArrowLeft size={14} /> Voltar
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => onSave(t)}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10
              rounded-xl text-[9px] font-black uppercase text-white/40 hover:text-white
              hover:border-white/20 transition-all">
            <Save size={12} /> Salvar rascunho
          </button>
          <button
            onClick={() => onPublish({ ...t, status: "published" })}
            disabled={destinatario === "aluno" && !t.paraAluno}
            className="flex items-center gap-2 px-5 py-2 bg-emerald-500 text-black
              rounded-xl text-[9px] font-black uppercase hover:bg-emerald-400
              transition-all shadow-lg disabled:opacity-30 disabled:cursor-not-allowed">
            <Send size={12} /> Publicar
          </button>
        </div>
      </div>

      {/* Informações gerais */}
      <div className="bg-[#0a0e18] border border-white/5 rounded-[28px] p-6 space-y-5">
        <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20 italic">
          Informações Gerais
        </h3>

        {/* Título */}
        <input
          value={t.titulo}
          onChange={e => setField("titulo", e.target.value)}
          className={`${inp} text-base font-black italic uppercase`}
          placeholder="NOME DO TREINO..."
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Dia */}
          <div className="space-y-1.5">
            <label className="text-[8px] font-black uppercase text-white/20 tracking-widest">
              Dia
            </label>
            <select
              value={t.dia}
              onChange={e => setField("dia", e.target.value as Treino["dia"])}
              className={inp}>
              {DIAS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Letra */}
          <div className="space-y-1.5">
            <label className="text-[8px] font-black uppercase text-white/20 tracking-widest">
              Letra (A/B/C)
            </label>
            <input
              value={t.letra ?? ""}
              onChange={e => setField("letra", e.target.value.toUpperCase())}
              maxLength={2}
              className={inp}
              placeholder="A"
            />
          </div>

          {/* Destinatário — tipo */}
          <div className="col-span-2 space-y-1.5">
            <label className="text-[8px] font-black uppercase text-white/20 tracking-widest">
              Destinatário
            </label>
            <select
              value={destinatario}
              onChange={e => {
                const v = e.target.value;
                setBuscaAluno("");
                setT(p => ({
                  ...p,
                  paraTodos:  v === "todos",
                  paraAluno:  v === "aluno" ? "" : undefined,
                  paraGrupo:  v === "grupo" ? "" : undefined,
                }));
              }}
              className={inp}>
              <option value="todos">Todos os membros</option>
              <option value="aluno">Aluno específico</option>
              <option value="grupo">Grupo específico</option>
            </select>
          </div>
        </div>

        {/* ── Seleção de aluno específico ───────────────────── */}
        <AnimatePresence>
          {destinatario === "aluno" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden space-y-2">

              {/* Aluno já selecionado */}
              {alunoSelecionado ? (
                <div className="flex items-center justify-between px-4 py-3
                  bg-sky-500/10 border border-sky-500/20 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-sky-500/20 flex items-center
                      justify-center">
                      <User size={13} className="text-sky-400" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-white uppercase">
                        {alunoSelecionado.nome}
                      </p>
                      <p className="text-[8px] text-white/30 font-black uppercase
                        tracking-widest">
                        Aluno selecionado
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setField("paraAluno", ""); setBuscaAluno(""); }}
                    className="text-[8px] font-black uppercase text-white/20
                      hover:text-rose-400 transition-all">
                    Trocar
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Campo de busca */}
                  <div className="relative">
                    <User size={12} className="absolute left-3 top-1/2 -translate-y-1/2
                      text-white/20" />
                    <input
                      value={buscaAluno}
                      onChange={e => setBuscaAluno(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl
                        pl-8 pr-3 py-2.5 text-sm text-white/70 outline-none
                        focus:border-sky-500/40 transition-all placeholder:text-white/15"
                      placeholder="Buscar aluno pelo nome..."
                      autoFocus
                    />
                  </div>

                  {/* Lista de membros */}
                  {membros.length === 0 ? (
                    <p className="text-center text-[9px] font-black uppercase
                      text-white/20 tracking-widest py-4">
                      Nenhum membro encontrado
                    </p>
                  ) : membrosFiltrados.length === 0 ? (
                    <p className="text-center text-[9px] font-black uppercase
                      text-white/20 tracking-widest py-4">
                      Nenhum resultado para "{buscaAluno}"
                    </p>
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-1
                      scrollbar-thin scrollbar-thumb-white/10">
                      {membrosFiltrados.map(m => (
                        <button
                          key={m.id}
                          onClick={() => {
                            setField("paraAluno", m.id);
                            setBuscaAluno("");
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5
                            bg-white/5 hover:bg-sky-500/10 border border-transparent
                            hover:border-sky-500/20 rounded-xl transition-all text-left">
                          <div className="w-6 h-6 rounded-full bg-white/10 flex items-center
                            justify-center shrink-0">
                            <User size={11} className="text-white/30" />
                          </div>
                          <span className="text-xs font-black uppercase text-white/60
                            hover:text-white transition-colors">
                            {m.nome}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Foco */}
        <div className="space-y-2">
          <label className="text-[8px] font-black uppercase text-white/20 tracking-widest">
            Foco do Treino
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {FOCOS_LIST.map(f => (
              <button
                key={f.id}
                onClick={() => setField("foco", f.id)}
                className={`p-3 rounded-[14px] border transition-all text-left flex
                  items-center gap-2.5
                  ${t.foco === f.id
                    ? `${f.bg} ${f.border}`
                    : "bg-white/5 border-white/5 hover:border-white/10"}`}>
                <f.icon size={13} className={t.foco === f.id ? f.cor : "text-white/20"} />
                <span className={`text-[9px] font-black uppercase
                  ${t.foco === f.id ? f.cor : "text-white/30"}`}>
                  {f.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Observações */}
        <div className="space-y-1.5">
          <label className="text-[8px] font-black uppercase text-white/20 tracking-widest">
            Observações gerais
          </label>
          <textarea
            value={t.obs ?? ""}
            onChange={e => setField("obs", e.target.value)}
            rows={2}
            className={`${inp} resize-none`}
            placeholder="Instruções importantes, dicas de execução..."
          />
        </div>
      </div>

      {/* Grupos de exercícios */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20 italic">
            Grupos de Exercícios — {t.grupos.length}
          </p>
          <button
            onClick={addGrupo}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border
              border-white/10 rounded-xl text-[9px] font-black uppercase text-white/40
              hover:bg-sky-500 hover:text-black hover:border-transparent transition-all">
            <Plus size={11} /> Grupo
          </button>
        </div>

        <AnimatePresence>
          {t.grupos.map((grupo, gi) => (
            <motion.div
              key={grupo.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="bg-[#0a0e18] border border-white/5 rounded-[22px] overflow-hidden">

              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
                <GripVertical size={14} className="text-white/10 cursor-grab" />
                <span className="text-[9px] font-black text-white/20 w-5">{gi + 1}</span>
                <input
                  value={grupo.nome}
                  onChange={e => updateGrupo(grupo.id, { nome: e.target.value })}
                  className="flex-1 bg-transparent text-sm font-black italic uppercase
                    text-white/60 outline-none placeholder:text-white/15
                    focus:text-white transition-colors"
                  placeholder="NOME DO GRUPO (ex: Peito, Costas...)"
                />
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => toggleGrupo(grupo.id)}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-white/20
                      hover:text-white/60 transition-all">
                    {gruposAbertos[grupo.id]
                      ? <ChevronUp size={14} />
                      : <ChevronDown size={14} />}
                  </button>
                  <button
                    onClick={() => removeGrupo(grupo.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-500/10 text-white/10
                      hover:text-rose-400 transition-all">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {gruposAbertos[grupo.id] && (
                  <motion.div
                    initial={{ height: 0 }} animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden">
                    <div className="divide-y divide-white/5">
                      {grupo.exercicios.map((ex, ei) => (
                        <div key={ex.id} className="p-4 space-y-3">
                          <div className="flex items-center gap-3">
                            <span className="text-[8px] font-black text-white/15 w-4">
                              {ei + 1}
                            </span>
                            <input
                              value={ex.nome}
                              onChange={e => updateExercicio(grupo.id, ex.id, { nome: e.target.value })}
                              className="flex-1 bg-transparent text-sm font-black italic
                                uppercase text-white/60 outline-none
                                placeholder:text-white/15 focus:text-white transition-colors"
                              placeholder="Nome do exercício..."
                            />
                            <button
                              onClick={() => removeExercicio(grupo.id, ex.id)}
                              className="p-1.5 rounded-lg hover:bg-rose-500/10 text-white/10
                                hover:text-rose-400 transition-all shrink-0">
                              <Trash2 size={12} />
                            </button>
                          </div>

                          <div className="grid grid-cols-3 gap-2 pl-7">
                            {[
                              { label: "Séries",     key: "series" as const,     type: "number", val: String(ex.series) },
                              { label: "Repetições", key: "repeticoes" as const, type: "text",   val: ex.repeticoes },
                              { label: "Descanso",   key: "descanso" as const,   type: "text",   val: ex.descanso },
                            ].map(field => (
                              <div key={field.key} className="space-y-1">
                                <label className="text-[7px] font-black uppercase
                                  text-white/15 tracking-widest">
                                  {field.label}
                                </label>
                                <input
                                  type={field.type}
                                  value={field.val}
                                  onChange={e => updateExercicio(grupo.id, ex.id, {
                                    [field.key]: field.type === "number"
                                      ? Number(e.target.value)
                                      : e.target.value,
                                  })}
                                  className="w-full bg-white/5 border border-white/5
                                    rounded-lg px-2.5 py-1.5 text-xs text-white/60
                                    outline-none focus:border-sky-500/30 transition-all"
                                />
                              </div>
                            ))}
                          </div>

                          <div className="pl-7 space-y-2">
                            <input
                              value={ex.obs ?? ""}
                              onChange={e => updateExercicio(grupo.id, ex.id, { obs: e.target.value })}
                              className="w-full bg-white/5 border border-white/5 rounded-lg
                                px-2.5 py-1.5 text-xs text-white/40 outline-none
                                focus:border-sky-500/30 transition-all
                                placeholder:text-white/10"
                              placeholder="Observação (opcional)..."
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div className="relative">
                                <Video size={10} className="absolute left-2.5 top-1/2
                                  -translate-y-1/2 text-white/15" />
                                <input
                                  value={ex.videoUrl ?? ""}
                                  onChange={e => updateExercicio(grupo.id, ex.id, { videoUrl: e.target.value })}
                                  className="w-full bg-white/5 border border-white/5
                                    rounded-lg pl-7 pr-2.5 py-1.5 text-xs text-white/40
                                    outline-none focus:border-sky-500/30 transition-all
                                    placeholder:text-white/10"
                                  placeholder="URL vídeo próprio..."
                                />
                              </div>
                              <div className="relative">
                                <Link size={10} className="absolute left-2.5 top-1/2
                                  -translate-y-1/2 text-white/15" />
                                <input
                                  value={ex.linkExterno ?? ""}
                                  onChange={e => updateExercicio(grupo.id, ex.id, { linkExterno: e.target.value })}
                                  className="w-full bg-white/5 border border-white/5
                                    rounded-lg pl-7 pr-2.5 py-1.5 text-xs text-white/40
                                    outline-none focus:border-sky-500/30 transition-all
                                    placeholder:text-white/10"
                                  placeholder="Link externo (YouTube...)..."
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-3 border-t border-white/5">
                      <button
                        onClick={() => addExercicio(grupo.id)}
                        className="w-full py-2.5 rounded-xl border border-dashed
                          border-white/10 text-[9px] font-black uppercase text-white/20
                          hover:border-sky-500/30 hover:text-sky-400 transition-all
                          flex items-center justify-center gap-2">
                        <Plus size={11} /> Adicionar Exercício
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Cardio */}
      <div className="bg-[#0a0e18] border border-white/5 rounded-[22px] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20 italic">
            Cardio
          </p>
          <button
            onClick={toggleCardio}
            className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase
              transition-all border
              ${t.cardio
                ? "bg-orange-500/10 border-orange-500/20 text-orange-400"
                : "bg-white/5 border-white/5 text-white/20 hover:border-white/10"}`}>
            {t.cardio ? "Remover cardio" : "+ Adicionar cardio"}
          </button>
        </div>

        <AnimatePresence>
          {t.cardio && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-hidden">
              {[
                { label: "Tipo",        key: "tipo" as const,        val: t.cardio.tipo },
                { label: "Duração",     key: "duracao" as const,     val: t.cardio.duracao },
                { label: "Intensidade", key: "intensidade" as const, val: t.cardio.intensidade },
              ].map(f => (
                <div key={f.key} className="space-y-1.5">
                  <label className="text-[8px] font-black uppercase text-white/15 tracking-widest">
                    {f.label}
                  </label>
                  <input
                    value={f.val}
                    onChange={e => setT(p => ({
                      ...p,
                      cardio: p.cardio ? { ...p.cardio, [f.key]: e.target.value } : undefined,
                    }))}
                    className={inp}
                  />
                </div>
              ))}
              <div className="col-span-2 sm:col-span-3 space-y-1.5">
                <label className="text-[8px] font-black uppercase text-white/15 tracking-widest">
                  Observação
                </label>
                <input
                  value={t.cardio.obs ?? ""}
                  onChange={e => setT(p => ({
                    ...p,
                    cardio: p.cardio ? { ...p.cardio, obs: e.target.value } : undefined,
                  }))}
                  className={inp}
                  placeholder="Ex: Intervalado 1min forte / 1min leve"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
