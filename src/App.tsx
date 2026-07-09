import { AnimatePresence, motion } from 'framer-motion';
import { useReducer, useRef, useState } from 'react';
import StartScreen from './components/StartScreen';
import QuizScreen from './components/QuizScreen';
import ResultsScreen from './components/ResultsScreen';
import { questions as QUESTION_BANK } from './data/questions';
import { initialState, quizReducer } from './quizReducer';
import { buildQuiz, type QuizConfig } from './utils';

const QUESTION_SECONDS = 30;

export default function App() {
  const [state, dispatch] = useReducer(quizReducer, initialState);
  const [timerEnabled, setTimerEnabled] = useState(true);

  // Remember the last config so "Retry" can rebuild a freshly shuffled quiz.
  const lastConfig = useRef<QuizConfig | null>(null);

  const start = (config: QuizConfig, timer: boolean) => {
    lastConfig.current = config;
    setTimerEnabled(timer);
    dispatch({ type: 'START', questions: buildQuiz(QUESTION_BANK, config) });
  };

  const retry = () => {
    const config = lastConfig.current;
    if (!config) return dispatch({ type: 'HOME' });
    dispatch({ type: 'START', questions: buildQuiz(QUESTION_BANK, config) });
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
        {state.status === 'idle' && <StartScreen bank={QUESTION_BANK} onStart={start} />}

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
