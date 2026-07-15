import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import StartScreen from './components/StartScreen';
import QuizScreen from './components/QuizScreen';
import ResultsScreen from './components/ResultsScreen';
import { questions as QUESTION_BANK } from './data/questions';
import { initialState, quizReducer } from './quizReducer';
import type { QuestionPack } from './types';
import { buildQuiz, type QuizConfig } from './utils';
import {
  deletePack as removePack,
  getActivePackId,
  loadPacks,
  savePack,
  setActivePackId,
} from './lib/packDb';

const QUESTION_SECONDS = 30;

/** The default cartridge — the built-in 500-question biochemistry bank. */
const BUILTIN_PACK: QuestionPack = {
  id: 'builtin',
  name: "Ena's BioChem Arena",
  description: 'The built-in biochemistry bank',
  builtin: true,
  createdAt: 0,
  questions: QUESTION_BANK,
};

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export default function App() {
  const [state, dispatch] = useReducer(quizReducer, initialState);
  const [timerEnabled, setTimerEnabled] = useState(true);

  // Question-pack library (built-in + user-imported). User packs live in Supabase.
  const [userPacks, setUserPacks] = useState<QuestionPack[]>([]);
  const [activeId, setActiveId] = useState<string>(() => getActivePackId() ?? BUILTIN_PACK.id);
  const [dbError, setDbError] = useState<string | null>(null);

  // Load the imported packs from the database on first mount.
  useEffect(() => {
    let cancelled = false;
    loadPacks()
      .then((packs) => {
        if (!cancelled) setUserPacks(packs);
      })
      .catch((e) => {
        if (!cancelled) setDbError(`Couldn't load your packs from the database: ${errMsg(e)}`);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const packs = useMemo(() => [BUILTIN_PACK, ...userPacks], [userPacks]);
  const activePack = useMemo(
    () => packs.find((p) => p.id === activeId) ?? BUILTIN_PACK,
    [packs, activeId],
  );

  const selectPack = (id: string) => {
    setActiveId(id);
    setActivePackId(id);
  };

  // Optimistically add the pack, then persist every question to Supabase.
  const importPack = async (pack: QuestionPack) => {
    setDbError(null);
    setUserPacks((prev) => [pack, ...prev.filter((p) => p.id !== pack.id)]);
    selectPack(pack.id);
    try {
      await savePack(pack);
    } catch (e) {
      setDbError(`Couldn't save "${pack.name}" to the database: ${errMsg(e)}`);
      setUserPacks((prev) => prev.filter((p) => p.id !== pack.id));
      selectPack(BUILTIN_PACK.id);
    }
  };

  const deletePack = async (id: string) => {
    setDbError(null);
    const previous = userPacks;
    setUserPacks((prev) => prev.filter((p) => p.id !== id));
    if (activeId === id) selectPack(BUILTIN_PACK.id);
    try {
      await removePack(id);
    } catch (e) {
      setDbError(`Couldn't delete that pack from the database: ${errMsg(e)}`);
      setUserPacks(previous); // restore on failure
    }
  };

  // Remember the last config so "Retry" can rebuild a freshly shuffled quiz.
  const lastConfig = useRef<QuizConfig | null>(null);

  const start = (config: QuizConfig, timer: boolean) => {
    lastConfig.current = config;
    setTimerEnabled(timer);
    dispatch({ type: 'START', questions: buildQuiz(activePack.questions, config) });
  };

  const retry = () => {
    const config = lastConfig.current;
    if (!config) return dispatch({ type: 'HOME' });
    dispatch({ type: 'START', questions: buildQuiz(activePack.questions, config) });
  };

  const home = () => dispatch({ type: 'HOME' });

  return (
    <>
      <AnimatePresence>
        {dbError && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="fixed inset-x-0 top-0 z-[60] flex justify-center px-4 py-3"
          >
            <div className="flex w-full max-w-lg items-start gap-3 rounded-2xl border border-rose-400/30 bg-rose-500/15 px-4 py-3 text-sm text-rose-100 shadow-card backdrop-blur">
              <span className="flex-1">{dbError}</span>
              <button
                onClick={() => setDbError(null)}
                aria-label="Dismiss"
                className="flex-none rounded-lg px-2 text-rose-200/70 transition hover:text-white"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.main
          key={state.status}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="min-h-[100dvh]"
        >
          {state.status === 'idle' && (
            <StartScreen
              bank={activePack.questions}
              packs={packs}
              activeId={activeId}
              onSelectPack={selectPack}
              onDeletePack={deletePack}
              onImportPack={importPack}
              onStart={start}
            />
          )}

          {state.status === 'active' && (
            <QuizScreen
              state={state}
              dispatch={dispatch}
              timerEnabled={timerEnabled}
              questionSeconds={QUESTION_SECONDS}
              onQuit={home}
            />
          )}

          {state.status === 'finished' && <ResultsScreen state={state} onRetry={retry} onHome={home} />}
        </motion.main>
      </AnimatePresence>
    </>
  );
}
