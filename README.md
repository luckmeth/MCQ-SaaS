# 🧬 BioChem Arena

An animated, game-like **MCQ quiz web app** for biochemistry, built from the
lecture material in this repository. It ships with **500 questions** (medium,
hard and expert difficulty — no easy questions) across nine topics, and every
run reshuffles for a fresh challenge.

## ✨ Features

- **Start screen** — pick the number of questions (10 / 20 / 30 / 50), filter by
  topic and difficulty, and toggle the 30-second timer.
- **Quiz screen** — one question at a time with:
  - an animated progress bar (`Question 3 of 10`)
  - question cards that slide/fade between questions (`AnimatePresence`)
  - four spring-animated answer cards
  - answers **locked on selection** and **auto-advance after 600 ms**
  - correct/wrong is **never revealed during play**
  - an optional animated 30-second countdown ring that **auto-skips** on timeout
- **Results screen**
  - a circular score ring that **counts up** to the final percentage
  - stat tiles: correct / wrong / skipped / time taken
  - a full **review list** with staggered entrance — correct answers in green
    with a ✓, wrong answers in red with a ✕ and the correct option shown below,
    plus a short explanation for every question
  - **confetti** celebration when you score ≥ 80 %
  - **Retry** (reshuffles) and **Home** buttons

## 🧠 Question bank

`src/data/questions.ts` holds all 500 questions. Each question is typed:

```ts
interface Question {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  difficulty: 'medium' | 'hard' | 'expert';
  topic: Topic;
  explanation?: string;
}
```

The bank is a plain local array, so it can be swapped for an API call later
without touching the UI. Topic coverage:

| Topic | Questions |
| --- | --- |
| Carbohydrates | 70 |
| Enzymes | 70 |
| Protein Structure | 56 |
| DNA & RNA | 55 |
| Proteins (amino acids & peptides) | 55 |
| Lipids | 54 |
| Glycolysis | 50 |
| Genome Structure | 45 |
| Gluconeogenesis & Glycogen | 45 |

## 🛠 Tech stack

- **Vite + React + TypeScript**
- **Tailwind CSS** for styling (dark theme, `rounded-2xl` cards, glow shadows)
- **Framer Motion** for all animations
- No backend — questions live in a local file

Quiz state is managed with a single `useReducer` (`status`, `currentIndex`,
`answers[]`, `startTime`, `endTime`).

## 🚀 Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check + production build
npm run preview  # preview the production build
```

## 🗂 Component structure

```
src/
├── App.tsx                 # screen orchestration (useReducer)
├── quizReducer.ts          # quiz state machine
├── types.ts                # Question / Topic / Difficulty types
├── utils.ts                # shuffle, buildQuiz, formatting
├── data/questions.ts       # 500-question bank
├── hooks/useCountUp.ts     # score count-up animation
└── components/
    ├── StartScreen.tsx
    ├── QuizScreen.tsx
    ├── QuestionCard.tsx
    ├── ProgressBar.tsx
    ├── TimerRing.tsx
    ├── ResultsScreen.tsx
    ├── ReviewItem.tsx
    ├── ScoreRing.tsx
    └── Confetti.tsx
```

The source PDFs the questions were derived from remain in the repository root.
