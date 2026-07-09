import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useReducer, useRef, useState } from 'react';
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
} from './lib/packStorage';

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

export default function App() {
  const [state, dispatch] = useReducer(quizReducer, initialState);
  const [timerEnabled, setTimerEnabled] = useState(true);

  // Question-pack library (built-in + user-imported), persisted to localStorage.
  const [userPacks, setUserPacks] = useState<QuestionPack[]>(() => loadPacks());
  const [activeId, setActiveId] = useState<string>(() => getActivePackId() ?? BUILTIN_PACK.id);

  const packs = useMemo(() => [BUILTIN_PACK, ...userPacks], [userPacks]);
  const activePack = useMemo(
    () => packs.find((p) => p.id === activeId) ?? BUILTIN_PACK,
    [packs, activeId],
  );

  const selectPack = (id: string) => {
    setActiveId(id);
    setActivePackId(id);
  };

  const importPack = (pack: QuestionPack) => {
    setUserPacks(savePack(pack).filter((p) => p.id !== BUILTIN_PACK.id));
    selectPack(pack.id);
  };

  const deletePack = (id: string) => {
    setUserPacks(removePack(id).filter((p) => p.id !== BUILTIN_PACK.id));
    if (activeId === id) selectPack(BUILTIN_PACK.id);
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
  );
}
