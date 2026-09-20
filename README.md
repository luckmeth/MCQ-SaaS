# Ena's BioChem Arena

An animated, game-like **MCQ quiz web app** for biomedical science, built from the
lecture material in this repository. It ships with **500 questions** (medium,
hard and expert difficulty — no easy questions) across nine topics, and every
run reshuffles for a fresh challenge.

## Features

- **Start screen** — enter your name, pick the number of questions (10 / 20 / 30 / 50),
  filter by topic and difficulty, and toggle the 30-second timer.
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
- **Results history** — every completed quiz (name, pack, score, time taken,
  when it happened) is saved to the database. A password-gated **Results
  history** button on the start screen lists every student's attempts.

## Importable question packs (the "cartridge" system)

The app is a reusable **console**; each question set is a swappable **cartridge**.
The built-in biochemistry bank is just the default pack — you can generate more
with any AI and import them at runtime, no rebuild required. Imported packs are
saved to a **Neon Postgres database** (a shared library) you can switch between and
delete like game discs. See [Database setup](#database-setup-neon) below.

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
      "explanation": "optional — shown on the review screen",
      "image": "optional — an https:// or data: image URI shown above the options",
      "imageAlt": "optional — a short caption / alt text for the image"
    }
  ]
}
```

The importer is lenient: `difficulty` (defaults to `medium`), `topic` (defaults
to `General`), `explanation` and `image`/`imageAlt` are all optional; the correct
answer may be given as `correctIndex`, an option letter (`"A"`), or the exact
option text; ids are assigned automatically. Invalid questions are skipped with a
reported reason instead of failing the whole import. Use **Download sample** in the
importer for a ready-made template.

**Illustrated questions** — a question may carry an optional `image` (a diagram,
micrograph, etc.) rendered above the answer options in both the quiz and the
review screen. Only real image sources are accepted (an `https://` URL or a
`data:image/...` URI); a bare filename or relative path is dropped so the UI never
shows a broken image. Packs whose figures are embedded as `data:` URIs are fully
self-contained and need no network access to display.

## Ready-made illustrated packs

The [`packs/`](packs) directory ships eight self-contained, image-rich anatomy &
physiology cartridges built from the lecture slides — every figure is embedded as
a `data:` URI, so they import and display with no external requests. Import any of
them with **Import new pack → Upload .json file**.

| Pack file | Questions | Figures |
| --- | --- | --- |
| `cell.json` — The Cell: structure & organelles | 40 | 14 |
| `tissues.json` — Tissues & organ systems | 40 | 11 |
| `circulatory.json` — Cardiovascular system: blood & heart | 40 | 12 |
| `respiratory.json` — Respiratory system | 40 | 14 |
| `digestive.json` — Digestive system | 40 | 15 |
| `histology.json` — Introduction to histology | 20 | 5 |
| `fertilization.json` — Fertilization & early development | 20 | 6 |
| `celldivision.json` — Cell division: mitosis & meiosis | 20 | 10 |

## Database setup (Neon)

Imported packs and every completed quiz attempt are persisted to a [Neon](https://neon.tech) Postgres database, so nothing lives only in your browser. The browser talks to the local server API under `/api`; `DATABASE_URL` stays server-side.

**One-time setup**

1. Link the project to Neon and apply the schema:

   ```bash
   neon link --project-id <project-id> --branch production -y
   npm run db:schema
   ```

   This creates the `packs`, `questions` and `attempts` tables. The schema is safe to re-run later; every statement is idempotent and won't touch existing rows.
2. Copy `.env.example` to `.env` and fill in your project values:

   ```bash
   DATABASE_URL=postgresql://USER:PASSWORD@HOST/neondb?sslmode=require&channel_binding=require
   VITE_RESULTS_PASSWORD=<pick a password for the results-history screen>
   ```

   `DATABASE_URL` is a server-side secret. Do not add a `VITE_` prefix and do not reference it from browser code. Restart `npm run dev` after editing `.env`.

**Data model**

| Table | Columns |
| --- | --- |
| `packs` | `id`, `name`, `description`, `author`, `builtin`, `created_at` |
| `questions` | `id`, `pack_id` -> `packs.id`, `position`, `question`, `options` (jsonb), `correct_index`, `difficulty`, `topic`, `explanation`, `image`, `image_alt` |
| `attempts` | `id`, `student_name`, `pack_id`, `pack_name`, `total`, `correct`, `wrong`, `skipped`, `percentage`, `duration_seconds`, `created_at` |

The app has no login, so the pack library and results history are **shared**: anyone using your deployment reads and writes the same data through the server API. If `.env` is missing the app still runs against the built-in bank; imports and attempts just aren't saved. The built-in biochemistry bank is never written to the database.

`VITE_RESULTS_PASSWORD` gates the **Results history** button. Because it ships inside the client bundle, treat it as a casual deterrent (keeps casual students out), not real authentication; anyone who reads the page source can recover it.

## Deploying to Vercel

The same API runs three ways from one implementation in `server/api.mjs`: as Vite
middleware during `npm run dev`, inside `server.mjs` for `npm run preview`, and as
a Vercel serverless function through the catch-all in `api/[...path].mjs`.

**Environment variables** — set these in *Project -> Settings -> Environment
Variables*, ticked for **Production**, **Preview** and **Development**:

| Name | Value | Notes |
| --- | --- | --- |
| `DATABASE_URL` | your Neon **pooled** connection string | Server-side secret. No `VITE_` prefix — that would publish it in the browser bundle. |
| `VITE_RESULTS_PASSWORD` | password for the results screen | Baked into the client bundle at build time, so changing it needs a redeploy. |

Use the pooled host (the one containing `-pooler`). Serverless functions open a
new connection per invocation, and the pooler is what keeps that from exhausting
Neon's connection limit.

Vercel reads environment variables **at build time**, so after adding or changing
one you must redeploy — an existing deployment will not pick it up.

Paste the connection string **bare** — no surrounding quotes, no line breaks. A
`.env` file uses `DATABASE_URL='postgres://...'` because quotes are that format's
syntax, but a dashboard field stores them as part of the value. The server strips
quotes, stray whitespace and an accidental `DATABASE_URL=` prefix defensively,
but it is worth getting right.

**Checking a deployment** — `https://<your-app>.vercel.app/api/health` runs a real
query and returns `{"ok":true,"database":"connected"}`. Anything else names the
problem:

| Response | Meaning |
| --- | --- |
| `{"ok":true,"database":"connected"}` | Working. |
| `404` | The `api/` directory wasn't deployed. |
| `"DATABASE_URL is not set..."` | The variable is missing, or you added it without redeploying. |
| `"DATABASE_URL is not a valid connection string..."` | Quotes or a line break got pasted into the value. |
| `password authentication failed` | The credentials are wrong or have been rotated. |

**Request size** — Vercel rejects a request body over 4.5 MB. Packs with embedded
base64 figures exceed that, so `savePack` splits large packs across one `PUT
/api/packs` plus as many `POST /api/packs/:id/questions` appends as needed.

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
  image?: string;      // optional figure (https:// or data: URI)
  imageAlt?: string;   // optional caption / alt text
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
- **Neon Postgres** stores imported question packs and every quiz attempt behind a small server API
- The built-in 500-question bank still lives in a local file

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
api/[...path].mjs           # Vercel serverless entry for every /api/* route
server/api.mjs              # the API itself: routing + SQL (shared by all hosts)
server.mjs                  # static file server + API for `npm run preview`
neon/schema.sql             # packs / questions / attempts tables

src/
├── App.tsx                 # screen orchestration + pack library state
├── quizReducer.ts          # quiz state machine
├── types.ts                # Question / QuestionPack / Difficulty types
├── utils.ts                # shuffle, buildQuiz, difficulty meta, formatting
├── data/questions.ts       # built-in 500-question bank
├── hooks/useCountUp.ts     # score count-up animation
├── lib/
│   ├── packImport.ts       # lenient JSON pack parser / normaliser
│   ├── apiClient.ts        # shared browser API helper
│   ├── packDb.ts           # Neon-backed pack library (load/save/delete)
│   ├── resultsDb.ts        # Neon-backed results history (save/load attempts)
│   └── aiPrompt.ts         # AI prompt, sample pack, download helpers
└── components/
    ├── StartScreen.tsx
    ├── PackLibrary.tsx        # the "shelf of cartridges"
    ├── ImportPackModal.tsx    # paste / upload + AI helper
    ├── ResultsHistoryModal.tsx # password-gated results history
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
