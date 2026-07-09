# Ena's BioChem Arena

An animated, game-like **MCQ quiz web app** for biomedical science, built from the
lecture material in this repository. It ships with **500 questions** (medium,
hard and expert difficulty — no easy questions) across nine topics, and every
run reshuffles for a fresh challenge.

## Features

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
  - a full **review list** with staggered entrance — correct answers in green,
    wrong answers in red with the correct option shown below, plus a short
    explanation for every question
  - **confetti** celebration when you score >= 80 %
  - **Retry** (reshuffles) and **Home** buttons

## Importable question packs (the "cartridge" system)

The app is a reusable **console**; each question set is a swappable **cartridge**.
The built-in biochemistry bank is just the default pack — you can generate more
with any AI and import them at runtime, no rebuild required. Imported packs are
saved to a **browser library** you can switch between and delete like game discs.

**Workflow**

1. On the start screen, open **Import new pack**.
2. Click **Copy AI prompt**, paste it into any AI, and tell it your subject.
3. Paste the AI's JSON into the importer (or **Upload .json file**), **Validate**,
   then **Import**. The pack joins your library and becomes active.

**Pack format** — a JSON object (a bare array of questions is also accepted):

```json
{
  "name": "Anatomy — Midterm 1",
  "description": "optional",
  "author": "optional",
  "questions": [
    {
      "question": "Which is the largest bone in the human body?",
      "options": ["Femur", "Tibia", "Humerus", "Fibula"],
      "correctIndex": 0,
      "difficulty": "medium",
      "topic": "Skeletal System",
      "explanation": "optional — shown on the review screen"
    }
  ]
}
```

The importer is lenient: `difficulty` (defaults to `medium`), `topic` (defaults
to `General`) and `explanation` are optional; the correct answer may be given as
`correctIndex`, an option letter (`"A"`), or the exact option text; ids are
assigned automatically. Invalid questions are skipped with a reported reason
instead of failing the whole import. Use **Download sample** in the importer for a
ready-made template.

## Question bank

`src/data/questions.ts` holds the built-in 500 questions. Each question is typed:

```ts
interface Question {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  difficulty: 'medium' | 'hard' | 'expert';
  topic: string;
  explanation?: string;
}
```

The bank is a plain local array wrapped as the default `QuestionPack`. Built-in
topic coverage:

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

## Tech stack

- **Vite + React + TypeScript**
- **Tailwind CSS** for styling (dark theme, `rounded-2xl` cards, glow shadows)
- **Framer Motion** for all animations
- No backend — questions live in a local file

Quiz state is managed with a single `useReducer` (`status`, `currentIndex`,
`answers[]`, `startTime`, `endTime`).

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check + production build
npm run preview  # preview the production build
```

## Component structure

```
src/
├── App.tsx                 # screen orchestration + pack library state
├── quizReducer.ts          # quiz state machine
├── types.ts                # Question / QuestionPack / Difficulty types
├── utils.ts                # shuffle, buildQuiz, difficulty meta, formatting
├── data/questions.ts       # built-in 500-question bank
├── hooks/useCountUp.ts     # score count-up animation
├── lib/
│   ├── packImport.ts       # lenient JSON pack parser / normaliser
│   ├── packStorage.ts      # localStorage-backed pack library
│   └── aiPrompt.ts         # AI prompt, sample pack, download helpers
└── components/
    ├── StartScreen.tsx
    ├── PackLibrary.tsx      # the "shelf of cartridges"
    ├── ImportPackModal.tsx  # paste / upload + AI helper
    ├── QuizScreen.tsx
    ├── QuestionCard.tsx
    ├── ProgressBar.tsx
    ├── TimerRing.tsx
    ├── ResultsScreen.tsx
    ├── ReviewItem.tsx
    ├── ScoreRing.tsx
    ├── Credit.tsx
    ├── icons.tsx            # biomedical SVG icon set
    └── Confetti.tsx
```

The source PDFs the questions were derived from remain in the repository root.
