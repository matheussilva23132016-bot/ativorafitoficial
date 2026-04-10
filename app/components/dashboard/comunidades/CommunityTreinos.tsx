"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BrainCircuit,
  Check,
  CheckCircle2,
  Clock,
  Settings2,
  Sparkles,
  Users,
  X,
  ArrowLeft,
  Plus,
  AlertCircle,
  Send,
  ClipboardList,
  UserCheck,
  Target,
  Loader2,
  Save,
  Trash2,
  ArrowUp,
  ArrowDown,
  Zap,
  Award,
  ChevronLeft,
  ChevronRight,
  Timer,
  LayoutGrid,
  Flame
} from "lucide-react";

// ==========================================
// 🧬 INTERFACES
// ==========================================
interface IExercise {
  id: string | number;
  nome: string;
  series: number;
  reps: string;
  descanso: string;
  obs: string;
  concluido?: boolean;
}

interface IWorkout {
  tempId: string;
  titulo: string;
  foco: string;
  tempo: string;
  dia: string;
  sessao_numero: number;
  exercicios: IExercise[];
}

interface IStudent {
  id: string;
  name: string;
}

type RequestStatus = "pendente" | "em_analise" | "pronto";

interface IWorkoutRequest {
  id: string;
  studentId: string;
  studentName: string;
  foco: string;
  nivel: string;
  dias: number;
  sessoesPorDia: number;
  obs: string;
  status: RequestStatus;
  createdAt: string;
  communityId: string;
  assignedProfessionalName?: string;
  aiSuggested?: boolean;
}

// ==========================================
// 🧠 CONSTANTES
// ==========================================
const FOCOS_DISPONIVEIS = ["Emagrecimento", "Hipertrofia", "Resistência", "Definição", "Condicionamento", "Mobilidade"];
const DIAS_ORDEM = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];

export function CommunityTreinos({ currentUser, userTags, communityId = "comunidade_123" }: any) {
  // --- ESTADOS DE NAVEGAÇÃO ---
  const [view, setView] = useState<any>("dashboard");
  const [toasts, setToasts] = useState<any[]>([]);

  // --- ESTADOS DO ALUNO ---
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [requestForm, setRequestForm] = useState({ foco: "Hipertrofia", nivel: "Intermediário", dias: 5, sessoesPorDia: 1, obs: "" });

  // --- ESTADOS DO INSTRUTOR / IA ---
  const [workoutRequests, setWorkoutRequests] = useState<IWorkoutRequest[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<IStudent | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<IWorkoutRequest | null>(null);
  const [semanaGerada, setSemanaGerada] = useState<IWorkout[]>([]);
  const [showAIModal, setShowAIModal] = useState(false);
  const [isGeneratingIA, setIsGeneratingIA] = useState(false);
  const [aiPrompt, setAiPrompt] = useState({ foco: "Hipertrofia", dias: 5, sessoesPorDia: 1, nivel: "Intermediário", obs: "" });

  // --- ESTADOS DO PLAYER ---
  const [sessaoAtiva, setSessaoAtiva] = useState<IWorkout | null>(null);
  const [exercicioAtualIdx, setExercicioAtualIdx] = useState(0);
  const [restTime, setRestTime] = useState<number | null>(null);

  const isInstructor = userTags.some((tag: string) => ["Instrutor", "ADM", "Dono", "Personal"].includes(tag));

  // --- CÁLCULO DE PROGRESSO (CORREÇÃO DO ERRO) ---
  const progressoSessao = useMemo(() => {
    if (!sessaoAtiva || !sessaoAtiva.exercicios.length) return 0;
    const concluidos = sessaoAtiva.exercicios.filter(ex => ex.concluido).length;
    return Math.round((concluidos / sessaoAtiva.exercicios.length) * 100);
  }, [sessaoAtiva]);

  // ==========================================
  // ⚙️ LOGICA DE UTILIDADE
  // ==========================================

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const pendingRequestsCount = useMemo(() => 
    workoutRequests.filter(req => req.status !== "pronto").length, 
  [workoutRequests]);

  const handleGerarIA = async () => {
    if (!selectedStudent) return;
    setIsGeneratingIA(true);
    try {
      const res = await fetch("/api/ia/treinos/gerar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...aiPrompt, alunoNome: selectedStudent.name }),
      });
      const data = await res.json();
      if (data.success) {
        setSemanaGerada(data.plan.workouts.map((w: any, idx: number) => ({
          ...w,
          tempId: `${Date.now()}_${idx}`,
          tempo: w.tempo || "50 min"
        })));
        setView("preview_semana");
      }
    } catch { showToast("Erro na conexão com a OpenAI", "error"); }
    finally { setIsGeneratingIA(false); setShowAIModal(false); }
  };

  const handleUpdateExercise = (treinoIdx: number, exIdx: number, field: keyof IExercise, value: any) => {
    const copy = [...semanaGerada];
    const exList = [...copy[treinoIdx].exercicios];
    exList[exIdx] = { ...exList[exIdx], [field]: value };
    copy[treinoIdx].exercicios = exList;
    setSemanaGerada(copy);
  };

  const toggleStep = (exIdx: number) => {
    if (!sessaoAtiva) return;
    const newSessao = { ...sessaoAtiva };
    newSessao.exercicios[exIdx].concluido = !newSessao.exercicios[exIdx].concluido;
    if (newSessao.exercicios[exIdx].concluido) {
      setRestTime(parseInt(newSessao.exercicios[exIdx].descanso) || 60);
    }
    setSessaoAtiva(newSessao);
  };

  useEffect(() => {
    if (restTime !== null && restTime > 0) {
      const t = setInterval(() => setRestTime(prev => (prev ? prev - 1 : null)), 1000);
      return () => clearInterval(t);
    } else if (restTime === 0) {
      showToast("Descanso finalizado!", "info");
      setRestTime(null);
    }
  }, [restTime, showToast]);

  // ==========================================
  // 🖥️ COMPONENTES DE INTERFACE
  // ==========================================

  const ToastContainer = () => (
    <div className="fixed top-4 right-4 z-200 space-y-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div key={t.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className={`flex items-center gap-3 px-6 py-4 rounded-3xl border shadow-2xl backdrop-blur-xl ${t.type === 'success' ? 'bg-[#050B14]/90 border-emerald-500/30 text-emerald-400' : 'bg-[#050B14]/90 border-rose-500/30 text-rose-500'}`}>
            <CheckCircle2 size={20} />
            <p className="text-xs font-black uppercase tracking-widest">{t.message}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );

  const renderDashboard = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 text-left">
      <div className="flex justify-between items-end border-b border-white/5 pb-8">
        <div>
          <h2 className="text-4xl sm:text-5xl font-black italic uppercase text-white leading-none">Matriz de <span className="text-sky-500">Treino</span></h2>
          <p className="text-[10px] font-black uppercase text-white/20 mt-3 tracking-[0.4em]">Sessões Ativas</p>
        </div>
        {isInstructor && (
          <button onClick={() => setView("instrutor_panel")} className="relative p-4 bg-sky-500 text-black rounded-2xl shadow-neon">
            <Settings2 size={24} />
            {pendingRequestsCount > 0 && <span className="absolute -top-2 -right-2 bg-purple-500 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center">{pendingRequestsCount}</span>}
          </button>
        )}
      </div>

      {!isInstructor && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-linear-to-br from-[#0A1222] to-[#050B14] border border-white/10 rounded-[50px] p-10 relative overflow-hidden min-h-87.5 flex flex-col justify-between shadow-2xl">
             <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 blur-[120px] rounded-full" />
             <div className="relative z-10">
                <span className="px-4 py-1.5 bg-sky-500/10 text-sky-400 rounded-full text-[10px] font-black uppercase border border-sky-500/20 mb-6 inline-block">Sessão #01 - Hoje</span>
                <h3 className="text-5xl font-black uppercase italic text-white leading-none">Pronto para <br/> <span className="text-sky-500 text-6xl">Treinar?</span></h3>
             </div>
             <button onClick={() => { setSessaoAtiva({ titulo: "Base de Treino", dia: "Hoje", sessao_numero: 1, exercicios: [{ id: 1, nome: "Exercício Base", series: 4, reps: "12", descanso: "60s", obs: "" }] } as any); setView("execucao"); }} className="relative z-10 w-full py-6 bg-sky-500 text-black rounded-3xl font-black uppercase text-sm shadow-neon active:scale-95 transition-all">Engajar Protocolo</button>
          </div>
          <div className="bg-[#050B14] border border-white/5 rounded-[50px] p-10 flex flex-col justify-center items-center">
             <button onClick={() => setShowRequestModal(true)} className="flex items-center gap-3 px-8 py-5 bg-purple-500 text-black rounded-3xl font-black uppercase text-xs shadow-xl"><Send size={18}/> Solicitar Novo Plano</button>
          </div>
        </div>
      )}
    </motion.div>
  );

  const renderEditorSemana = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 pb-40 text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 sticky top-0 bg-[#010307]/90 backdrop-blur-xl z-50 py-6 border-b border-white/5">
        <div>
          <h2 className="text-3xl font-black uppercase italic text-white leading-none text-left">Editor de <span className="text-sky-500">Ciclo</span></h2>
          <p className="text-[10px] text-white/40 font-black uppercase mt-2 italic text-left tracking-widest">Ajuste técnico para: {selectedStudent?.name}</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button onClick={() => setView("instrutor_panel")} className="px-6 py-4 bg-white/5 text-white rounded-2xl text-[10px] font-black uppercase">Descartar</button>
          <button onClick={() => { showToast("Protocolo liberado!", "success"); setView("instrutor_panel"); }} className="px-8 py-4 bg-sky-500 text-black rounded-2xl text-[10px] font-black uppercase shadow-neon flex items-center gap-2"><Check size={18} /> Publicar Plano</button>
        </div>
      </div>

      <div className="space-y-12">
        {DIAS_ORDEM.map(dia => {
          const sessoes = semanaGerada.filter(w => w.dia.toLowerCase().includes(dia.toLowerCase().substring(0, 3)));
          if (sessoes.length === 0) return null;
          return (
            <div key={dia} className="space-y-6">
              <span className="text-sm font-black uppercase tracking-[0.5em] text-white/10 italic">{dia}</span>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {sessoes.map((treino) => {
                  const tIdx = semanaGerada.findIndex(x => x.tempId === treino.tempId);
                  return (
                    <div key={treino.tempId} className="bg-[#050B14] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl relative">
                      <div className="p-8 border-b border-white/5 bg-white/2 flex justify-between items-center">
                        <input value={treino.titulo} onChange={(e) => { const c = [...semanaGerada]; c[tIdx].titulo = e.target.value; setSemanaGerada(c); }} className="bg-transparent border-none text-2xl font-black uppercase italic text-white outline-none focus:text-sky-400 w-full" />
                      </div>
                      <div className="p-8 space-y-4 text-left">
                        {treino.exercicios.map((ex, eIdx) => (
                          <div key={eIdx} className="bg-[#010307] border border-white/5 rounded-3xl p-5 group/ex relative">
                            <button onClick={() => { const c = [...semanaGerada]; c[tIdx].exercicios.splice(eIdx, 1); setSemanaGerada(c); }} className="absolute -top-2 -right-2 w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/ex:opacity-100 z-10"><X size={14} /></button>
                            <input value={ex.nome} onChange={(e) => handleUpdateExercise(tIdx, eIdx, 'nome', e.target.value)} className="bg-transparent border-none text-sm font-black text-white uppercase italic outline-none w-full" />
                            <div className="grid grid-cols-3 gap-3 mt-4">
                              <input type="number" value={ex.series} onChange={(e) => handleUpdateExercise(tIdx, eIdx, 'series', parseInt(e.target.value))} className="bg-white/5 border border-white/10 rounded-xl py-2 text-center text-white text-xs" />
                              <input value={ex.reps} onChange={(e) => handleUpdateExercise(tIdx, eIdx, 'reps', e.target.value)} className="bg-white/5 border border-white/10 rounded-xl py-2 text-center text-white text-xs" />
                              <input value={ex.descanso} onChange={(e) => handleUpdateExercise(tIdx, eIdx, 'descanso', e.target.value)} className="bg-white/5 border border-white/10 rounded-xl py-2 text-center text-sky-400 text-[10px]" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );

  const renderPlayer = () => {
    if (!sessaoAtiva) return null;
    const ex = sessaoAtiva.exercicios[exercicioAtualIdx];
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-[#010307] z-200 flex flex-col">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#050B14]">
          <button onClick={() => setView("dashboard")} className="p-2 text-white/40"><X size={24} /></button>
          <div className="text-center"><h3 className="text-[10px] font-black uppercase tracking-widest text-sky-500">Executando Missão</h3><p className="text-sm font-bold text-white uppercase italic">{sessaoAtiva.titulo}</p></div>
          <div className="w-10 h-10 rounded-full border-2 border-white/5 flex items-center justify-center text-[10px] font-black text-white">{progressoSessao}%</div>
        </div>
        <div className="flex-1 overflow-y-auto p-10 flex flex-col justify-center">
           <div className="bg-linear-to-br from-[#0A1222] to-[#050B14] border border-white/10 rounded-[60px] p-12 shadow-2xl relative text-center">
              <span className="px-4 py-2 bg-sky-500/10 text-sky-400 rounded-full text-[10px] font-black uppercase mb-8 inline-block tracking-widest">Etapa {exercicioAtualIdx + 1} de {sessaoAtiva.exercicios.length}</span>
              <h2 className="text-5xl font-black uppercase italic text-white mb-6 leading-tight">{ex.nome}</h2>
              <div className="grid grid-cols-2 gap-4 mt-10">
                 <div className="bg-white/5 rounded-3xl p-6"><p className="text-[10px] font-black text-white/20 uppercase mb-2">Volume</p><p className="text-3xl font-black italic text-white">{ex.series} Séries</p></div>
                 <div className="bg-white/5 rounded-3xl p-6"><p className="text-[10px] font-black text-white/20 uppercase mb-2">Execução</p><p className="text-3xl font-black italic text-white">{ex.reps}</p></div>
              </div>
              {restTime !== null && (
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mt-8 p-8 bg-sky-500 rounded-[40px] flex justify-between items-center shadow-neon">
                   <div className="flex items-center gap-4 text-black"><Timer size={32} className="animate-pulse" /><span className="font-black uppercase text-sm tracking-widest">Descanso</span></div>
                   <span className="text-5xl font-black text-black font-mono">{restTime}s</span>
                </motion.div>
              )}
           </div>
        </div>
        <div className="p-8 border-t border-white/5 grid grid-cols-5 gap-4 bg-[#050B14] pb-12">
           <button onClick={() => setExercicioAtualIdx(p => Math.max(0, p-1))} className="col-span-1 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-white"><ChevronLeft size={32}/></button>
           <button onClick={() => toggleStep(exercicioAtualIdx)} className={`col-span-3 h-20 rounded-3xl font-black uppercase text-sm flex items-center justify-center gap-3 transition-all ${ex.concluido ? 'bg-emerald-500 text-black' : 'bg-sky-500 text-black shadow-neon'}`}>{ex.concluido ? <CheckCircle2 size={24}/> : <Zap size={24} fill="currentColor"/>} {ex.concluido ? 'Série Feita' : 'Concluir Passo'}</button>
           <button onClick={() => exercicioAtualIdx < sessaoAtiva.exercicios.length - 1 ? setExercicioAtualIdx(p => p+1) : setView("dashboard")} className="col-span-1 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-white"><ChevronRight size={32}/></button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="relative min-h-screen">
      <ToastContainer />
      
      <AnimatePresence>
        {showAIModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-150" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-[#050B14] border border-purple-500/20 rounded-[60px] p-16 z-160 shadow-3xl text-left">
              <div className="flex justify-between items-center mb-12 text-purple-400"><div className="flex items-center gap-4"><BrainCircuit size={48}/><h3 className="text-4xl font-black italic uppercase tracking-tighter leading-none">Ativora AI</h3></div><button onClick={() => setShowAIModal(false)} className="text-white/20 hover:text-white"><X size={32}/></button></div>
              {!isGeneratingIA ? (
                <div className="space-y-8">
                  <div className="space-y-3"><label className="text-[10px] font-black uppercase text-white/40 tracking-widest">Foco do Aluno:</label><input type="text" value={aiPrompt.foco} onChange={e => setAiPrompt({...aiPrompt, foco: e.target.value})} className="w-full bg-[#010307] border border-white/10 rounded-3xl py-8 px-10 text-xl text-white outline-none focus:border-purple-500/50" /></div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3"><label className="text-[10px] font-black uppercase text-white/40">Dias/Semana</label><select value={aiPrompt.dias} onChange={e => setAiPrompt({...aiPrompt, dias: parseInt(e.target.value)})} className="w-full bg-[#010307] border border-white/10 rounded-3xl py-6 px-10 text-sm text-white outline-none"><option value="3">3 sessões</option><option value="5">5 sessões</option><option value="7">7 sessões</option></select></div>
                    <div className="space-y-3"><label className="text-[10px] font-black uppercase text-white/40">Sessões/Dia (Max 20)</label><input type="number" max="20" min="1" value={aiPrompt.sessoesPorDia} onChange={e => setAiPrompt({...aiPrompt, sessoesPorDia: parseInt(e.target.value)})} className="w-full bg-[#010307] border border-white/10 rounded-3xl py-6 px-10 text-xl text-white outline-none" /></div>
                  </div>
                  <button onClick={handleGerarIA} className="w-full py-8 bg-purple-500 text-black font-black uppercase text-sm rounded-3xl shadow-neon transition-all hover:scale-102 flex items-center justify-center gap-4"><Sparkles size={28}/> Forjar Microciclo de Elite</button>
                </div>
              ) : <div className="py-24 text-center space-y-10"><div className="relative w-32 h-32 mx-auto"><div className="absolute inset-0 border-4 border-purple-500/10 rounded-full animate-pulse" /><div className="absolute inset-0 border-4 border-purple-500 rounded-full border-t-transparent animate-spin" /><BrainCircuit size={56} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-purple-400" /></div><h4 className="text-2xl font-black uppercase italic text-white animate-pulse">Periodizando...</h4></div>}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {view === "dashboard" && renderDashboard()}
        {view === "instrutor_panel" && (
          <div className="space-y-8 text-left">
            <button onClick={() => setView("dashboard")} className="flex items-center gap-2 text-white/40 text-[10px] font-black uppercase"><ArrowLeft size={16}/> Voltar</button>
            <div className="bg-[#050B14] border border-white/5 rounded-[60px] p-12 shadow-2xl">
              <h3 className="text-3xl font-black uppercase italic text-white mb-10">Atletas no <span className="text-sky-500">Clã</span></h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[{ id: '1', name: 'Roberto Almeida' }, { id: '2', name: 'Matheus Fit' }].map(aluno => (
                  <div key={aluno.id} className="p-8 bg-white/3 border border-white/5 rounded-4xl flex items-center justify-between group hover:border-purple-500/30 transition-all">
                    <div className="flex items-center gap-5"><div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center font-black">{aluno.name[0]}</div><h4 className="text-lg font-black text-white uppercase italic">{aluno.name}</h4></div>
                    <button onClick={() => { setSelectedStudent(aluno as any); setSelectedRequest({ id: '1' } as any); setShowAIModal(true); }} className="p-4 bg-purple-500 text-black rounded-2xl shadow-xl hover:scale-110"><BrainCircuit size={24}/></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {view === "preview_semana" && renderEditorSemana()}
        {view === "execucao" && renderPlayer()}
      </AnimatePresence>

      <AnimatePresence>
        {showRequestModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/95 z-150" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl bg-[#050B14] border border-sky-500/20 rounded-[60px] p-16 z-160 shadow-3xl text-left">
              <div className="flex justify-between items-center mb-10 text-sky-500"><h3 className="text-3xl font-black italic uppercase">Solicitar <span className="text-white">Protocolo</span></h3><button onClick={() => setShowRequestModal(false)}><X size={32}/></button></div>
              <div className="space-y-6">
                <select className="w-full bg-[#010307] border border-white/10 rounded-3xl py-6 px-8 text-white"><option>Hipertrofia</option><option>Emagrecimento</option></select>
                <textarea placeholder="Relato técnico (Ex: dor no joelho...)" className="w-full bg-[#010307] border border-white/10 rounded-3xl py-6 px-8 text-white h-32 resize-none outline-none focus:border-sky-500/50" />
                <button onClick={() => { showToast("Solicitação enviada!", "success"); setShowRequestModal(false); }} className="w-full py-6 bg-sky-500 text-black font-black uppercase rounded-3xl shadow-neon">Transmitir Pedido</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}