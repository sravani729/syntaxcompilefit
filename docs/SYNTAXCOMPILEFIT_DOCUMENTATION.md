# SyntaxCompileFit — Complete Project Documentation

## 1. Project summary

**SyntaxCompileFit** is an intelligent coding and interview-preparation platform for students and early-career developers. It combines a DSA problem catalog, an in-browser coding workspace, real compiler execution, progress tracking, analytics, solution comparison, interview questions, and an AI tutor.

The product is designed around one learning loop:

1. The learner chooses a problem.
2. The learner reads the statement, examples, constraints, and hints.
3. The learner writes code in a selected programming language.
4. The learner runs or submits the code.
5. The platform reports compiler/runtime results and records the attempt.
6. If accepted, the learner receives a solution-analysis page.
7. The learner compares brute-force, submitted, and optimal approaches.
8. The learner practices problem-specific interview questions.
9. The learner asks the AI tutor about complexity, edge cases, correctness, or interview communication.
10. The dashboard and analytics update from the learner’s real activity.

A short way to describe the project in an interview is:

> “I built SyntaxCompileFit as a React and Express coding-preparation platform. It gives users a persistent problem-solving workspace, executes code through real language toolchains on the server, records problem-level progress in browser storage, and turns each accepted submission into an interview review with complexity analysis, solution comparison, questions, and an AI tutor.”

---

## 2. Main product capabilities

### 2.1 Landing page

The public landing page introduces the product and explains the practice workflow. It includes:

- SyntaxCompileFit branding and product positioning.
- A call to create an account or log in.
- A visual explanation of the practice loop.
- Product feature highlights.
- Light/dark theme switching.
- Navigation into authentication pages.

The landing page is intended for unauthenticated users. After login, the user enters the authenticated workspace rather than remaining on the public marketing page.

### 2.2 Signup and login

The authentication UI supports:

- Full name during signup.
- Username during signup.
- Email during signup.
- Password and password confirmation during signup.
- Login using either email or username.
- Password validation with a minimum length of six characters.
- Password confirmation validation.
- Error messages for missing fields, mismatched passwords, and invalid credentials.
- Persistent login session in browser `localStorage`.
- Logout from the workspace sidebar and user profile area.
- Navigation back to the landing page after logout.

The current prototype stores the demo account locally in the browser. This is suitable for a prototype and local demonstration, but it is **not production-grade authentication** because the password is stored in `localStorage`. A production version should replace this with server-side authentication, hashed passwords, secure HTTP-only cookies, session expiry, password reset, and database-backed users.

### 2.3 Authenticated workspace navigation

After login, the application uses a workspace shell with:

- Sidebar navigation.
- Dashboard.
- Problems catalog.
- Practice room.
- Analytics.
- Submission history.
- Home/dashboard shortcut.
- Logout.
- User initials/avatar.
- Current user name and email.
- Light/dark mode control.
- Responsive mobile navigation.

The application uses a lightweight SPA-style view system. The `View` type contains:

```ts
"home" | "login" | "signup" | "dashboard" | "problems" |
"practice" | "analysis" | "analytics" | "history"
```

The `go()` helper updates the browser URL with `history.pushState()` and changes the active view without a full page reload.

### 2.4 Problem catalog

The catalog contains the original base problems plus imported and expanded problem data. The project includes more than 300 problem records; the imported dataset alone contains 251 entries, and the complete catalog is assembled from the base, expansion, and imported sources.

Each problem is represented with information such as:

- Title.
- Topic.
- Difficulty: Easy, Medium, or Hard.
- Solved state.
- Attempt count.
- Best recorded execution time.
- Problem statement.
- Input and output examples.
- Constraints.
- Interview lens.
- Starter code.
- Language templates.
- Hints.
- Brute-force explanation.
- Optimal approach explanation.
- Expected time complexity.
- Expected space complexity.
- Interview questions and model answers.

The main data sources are:

| File | Responsibility |
|---|---|
| `client/src/App.tsx` | Base problems and core problem-detail records. |
| `client/src/catalogExpansion.ts` | Additional advanced problems and reusable detail helpers. |
| `client/src/catalogImported.ts` | Imported problem dataset with statements, constraints, templates, and questions. |
| `client/src/referenceSolutions.ts` | Checked-in reference implementations for supported core problems. |

The catalog page supports:

- Search by problem title.
- Difficulty filtering.
- Topic filtering.
- Solved/unsolved filtering.
- Attempts and best time display.
- Green solved indicator after an accepted submission.
- Opening a problem directly in the practice room.

### 2.5 Practice room

The practice room is the main coding workspace. It contains two major areas.

#### Problem side

The problem side displays:

- Topic label.
- Problem title.
- Difficulty badge.
- Estimated practice time.
- Problem statement.
- Examples.
- Input/output/why explanation.
- Constraints.
- Smart hints.
- Interview lens.

Hints are problem-aware. If a problem has explicit hints, those are used. If it does not, the application generates a fallback set from the problem’s lens, brute-force explanation, and optimal explanation.

#### Editor side

The editor side contains:

- Language selector.
- Starter code for the selected language.
- Line numbers.
- Editable code textarea.
- Reset button.
- Run button.
- Submit button.
- Console tabs.

Supported languages are:

```ts
Python
Java
C++
C
JavaScript
Go
Rust
```

The language selector loads the problem’s language-specific template when available. If a language-specific template is not available, the application creates a safe starter template for that language.

### 2.6 Run versus Submit

The coding workspace has two related but different actions.

#### Run

Run executes the current code and displays the result in the console. It does not navigate to the analysis page.

#### Submit

Submit executes the current code and then records the attempt. If the execution result is accepted:

- The problem becomes solved for the current user.
- The attempt count increases.
- The execution time is stored.
- The submitted code and language are stored.
- A submission-history record is created.
- The user is navigated to the analysis page.

If execution fails, the attempt is recorded as **Needs review**, and the user remains in the practice room so they can correct the code.

### 2.7 Real compiler and execution service

The frontend sends code to:

```text
POST /api/execute
```

The request contains:

```json
{
  "code": "source code",
  "language": "Java",
  "input": "problem sample input"
}
```

The Express server creates a temporary directory for every request, writes the submitted source into an appropriate file, compiles or checks it, optionally executes it, returns diagnostics, and deletes the temporary directory.

The implementation uses Node’s `child_process.execFile()` through a promisified helper. Each process has:

- A 4.5-second timeout.
- A 256 KB output buffer.
- Compiler stderr captured as compilation diagnostics.
- Runtime stderr captured as runtime diagnostics.
- Temporary-directory cleanup in a `finally` block.

Toolchain mapping:

| Language | Validation/compiler command | Source file |
|---|---|---|
| Python | `python3 -m py_compile` | `solution.py` |
| Java | `javac -Xlint:all` | `Solution.java` |
| C++ | `g++ -std=c++17 -Wall -Wextra -O2` | `solution.cpp` |
| C | `gcc -std=c11 -Wall -Wextra -O2` | `solution.c` |
| JavaScript | `node --check` followed by Node execution | `solution.js` |
| Go | `go build` | `solution.go` |
| Rust | `rustc --edition 2021` | `solution.rs` |

The response contains fields such as:

```ts
{
  ok: boolean;
  output: string;
  error?: string;
  compileError?: string;
  runtimeError?: string;
  time: string;
  memory: string;
}
```

Important behavior:

- Empty code returns a compilation error.
- Unsupported languages return an unsupported-language error.
- Missing compiler binaries return a clear setup diagnostic.
- Java class code can compile without a `main` method, but the server explains that a `main` method is needed to run custom input.
- Syntax-only cases return a successful syntax-check message when there is no executable entry point.
- Runtime errors are separated from compilation errors.
- The current memory field is reported as `—` by the real endpoint because the service does not yet measure operating-system memory usage. The UI preserves the memory field for future instrumentation.

This is a real compiler/toolchain workflow, not a simulated “always accepted” evaluator.

### 2.8 Solution analysis page

After an accepted submission, the user sees a guided review page containing:

- Accepted status.
- Submission number and recent timing.
- Test-case summary.
- Execution-time summary.
- Memory summary.
- Submitted language and topic.
- Time complexity.
- Space complexity.
- Submitted code.
- “What your code does” explanation.
- Strengths to explain in an interview.
- Coach prompt.
- Three-way code comparison.
- Baseline approach.
- Interview-ready approach.
- Comparison table.
- AI tutor.
- Ten interview questions with model answers.

The analysis page is designed to change a successful coding attempt into a communication and interview-preparation session.

### 2.9 Three-way code comparison

The comparison area shows three versions side by side:

1. **Brute force** — the simplest baseline strategy.
2. **Your submitted code** — the code the learner actually submitted.
3. **Optimal approach** — the target implementation for the selected problem and language.

The application first checks the static `referenceSolutions` catalog. If a checked-in reference implementation is unavailable, it calls:

```text
POST /api/reference-solution
```

The reference-generation request includes:

- Problem title.
- Statement.
- Starter code.
- Language.
- Constraints.
- Expected time complexity.
- Expected space complexity.

The server asks the configured platform LLM for JSON containing:

```json
{
  "code": "complete implementation",
  "explanation": "approach explanation",
  "time": "time complexity",
  "space": "space complexity"
}
```

The server rejects incomplete generated code containing common placeholder patterns such as `TODO`, “implement the solution here,” or an empty array placeholder.

The important design goal is that the optimal solution is problem-specific rather than a generic baseline snippet.

### 2.10 Interview questions

Each problem exposes ten interview questions. Some questions are explicitly stored in the problem data, and the application adds additional questions when necessary so the displayed list reaches ten.

Typical generated question categories include:

- Core idea.
- Example interpretation.
- Constraint-driven design.
- Brute-force approach.
- Edge cases.
- Correctness proof.
- Testing strategy.
- Complexity target.
- Follow-up requirements.
- Interview explanation.

Each question includes a model answer. The goal is not only to solve the problem but also to rehearse how to explain it clearly.

### 2.11 AI interview tutor

The AI tutor is available from the solution-analysis page. It receives context about:

- Problem title.
- Topic.
- Problem statement.
- Expected time complexity.
- Expected space complexity.
- Programming language.
- Submitted code.
- Student question.

The frontend sends the question to:

```text
POST /api/tutor
```

The server proxies the request to the configured platform LLM and returns:

```json
{
  "answer": "tutor response"
}
```

The tutor is instructed to behave like a patient senior software engineer and interview coach. It should answer the current problem, encourage reasoning, and mention trade-offs or interview phrasing when useful.

If the LLM configuration is unavailable, the server returns a local fallback answer that still guides the student toward:

- The invariant.
- An example walkthrough.
- Time complexity.
- Space complexity.
- Edge cases.

The tutor interface includes:

- Blue-violet coaching panel.
- Online status indicator.
- Assistant and user message bubbles.
- Prompt shortcuts for complexity, edge cases, and code improvement.
- Animated thinking dots.
- Structured message rendering.
- Preserved blank lines and indentation.
- Heading treatment.
- Bulleted and numbered list treatment.
- Code-line styling.
- Dark-mode support.

The `TutorMessageBody` component converts plain tutor text into readable line-by-line UI instead of placing the entire answer inside one unformatted paragraph.

### 2.12 Dashboard

The dashboard summarizes the user’s current learning activity. It uses the current user’s stored progress to calculate:

- Solved problem count.
- Attempt count.
- Recent submissions.
- Problems to continue.
- Topic and difficulty information.
- Cumulative progress visualizations.
- Weekly activity.
- Current learning state.

The dashboard is data-driven from the progress object rather than from hard-coded “three solved today” style values.

### 2.13 Analytics

The analytics page presents progress trends from stored submissions and solved-problem data. It includes:

- Weekly activity.
- Topic-level progress.
- Solved and attempted counts.
- Readiness-style summary.
- Cumulative progress graphic.
- Focus areas based on current activity.

The weekly activity helper calculates the last seven calendar days and counts timestamped submissions per day. This makes the activity chart respond to actual user attempts.

### 2.14 Submission history

The history page displays previously recorded attempts. Each record includes:

- Problem title.
- Language.
- Execution time.
- Date.
- Status: Accepted or Needs review.

The application keeps the most recent 50 submissions for the current local profile.

### 2.15 Persistent dark mode

The theme is stored under:

```text
syntaxfit-theme
```

The application writes either `dark` or `light` to `localStorage` and mirrors the value onto:

```html
<html data-theme="dark">
```

The stylesheet uses theme-specific selectors such as:

```css
:root[data-theme="dark"] .selector { ... }
```

The theme affects:

- Landing page.
- Authentication pages.
- Workspace shell.
- Problem catalog.
- Practice room.
- Console.
- Analysis cards.
- Comparison cards.
- AI tutor.
- Analytics and history.

The logged-in analysis supporting copy was specifically adjusted so light mode uses stronger near-black text while dark mode keeps a readable light tone.

---

## 3. Technology stack

### Frontend

- **React 19** — component-based user interface.
- **TypeScript** — typed application logic and UI contracts.
- **Vite** — frontend development server and production bundler.
- **React hooks** — `useState`, `useEffect`, and `useMemo` for state, side effects, and derived data.
- **Wouter** — included in the dependency stack for lightweight routing support; the current main flow uses the app’s own view/path helper.
- **Lucide React** — icons throughout the interface.
- **Tailwind/Vite integration** — available in the project toolchain alongside the custom stylesheet.
- **Custom CSS** — visual system, responsive layout, animation, light mode, and dark mode.

### Backend

- **Node.js** — server runtime.
- **Express** — HTTP server and API endpoints.
- **tsx** — TypeScript execution for development.
- **Vite middleware mode** — serves the React app through the Express server in development.
- **Node `child_process`** — invokes the actual compiler/runtime toolchains.
- **Temporary filesystem APIs** — safely isolate submitted source files per execution request.

### AI and platform integration

- Platform LLM proxy through server-side environment variables.
- `/api/tutor` for contextual interview tutoring.
- `/api/reference-solution` for on-demand problem-specific reference implementations.
- Public runtime configuration exposed through `/api/platform/config.js` without exposing private keys.
- Private API credentials remain server-side.

### Data and persistence

The current prototype uses browser `localStorage` for fast, per-user persistence:

| Key pattern | Stored information |
|---|---|
| `syntaxcompilefit-user` | Local signup profile. |
| `syntaxcompilefit-session` | Current logged-in session. |
| `syntaxfit-progress-{email}` | Solved problems, attempts, submissions, and last code. |
| `syntaxfit-theme` | Light/dark theme selection. |

The codebase also contains the standard database, Drizzle, tRPC, OAuth, storage, and platform starter modules. The current SyntaxCompileFit feature flow primarily uses the custom React state and Express endpoints described above.

### Development and delivery

- `pnpm dev` — starts the Express/Vite development server.
- `pnpm check` — runs TypeScript diagnostics.
- `pnpm build` — builds the frontend and bundles the server.
- `pnpm start` — runs the production bundle.
- `pnpm test` — runs Vitest tests.
- `pnpm db:migrate` — applies checked-in database migrations.
- `pnpm db:push` — generates and applies schema changes.
- GitHub repository: `sravani729/syntaxcompilefit`.

---

## 4. Project structure

```text
syntaxfit/
├── client/
│   ├── index.html
│   └── src/
│       ├── App.tsx                    Main product UI and application flow
│       ├── index.css                  Global design system and themes
│       ├── main.tsx                   React entry point
│       ├── catalogExpansion.ts        Expanded problem data
│       ├── catalogImported.ts         Imported problem catalog
│       ├── referenceSolutions.ts      Static reference implementations
│       ├── components/                Reusable UI/platform components
│       ├── contexts/                  Shared React contexts, including theme
│       ├── hooks/                     Reusable React hooks
│       ├── lib/                       Client utilities and tRPC setup
│       └── pages/                     Additional page components
├── server/
│   ├── _core/
│   │   ├── index.ts                   Express entry point and custom APIs
│   │   ├── vite.ts                    Vite middleware and HMR configuration
│   │   ├── llm.ts                     Platform LLM helpers
│   │   ├── context.ts                 Request context
│   │   ├── trpc.ts                    tRPC server setup
│   │   ├── systemRouter.ts             Platform/system routes
│   │   ├── publicConfig.ts             Safe browser-facing configuration
│   │   └── ...                         OAuth, storage, notifications, DB helpers
│   ├── routers.ts                     Application tRPC router
│   ├── db.ts                           Database helper
│   └── *.test.ts                       Server tests
├── shared/                             Shared types and constants
├── public/                             Public runtime assets/routes
├── drizzle/                            Database schema/migrations
├── patches/                            Dependency patches
├── Dockerfile                          Container build configuration
├── package.json                        Scripts and dependencies
├── pnpm-lock.yaml                      Locked dependency versions
├── pnpm-workspace.yaml                 Workspace and build permissions
├── vite.config.ts                      Vite configuration
├── tsconfig.json                       TypeScript configuration
└── docs/
    └── SYNTAXCOMPILEFIT_DOCUMENTATION.md
```

---

## 5. Important frontend data flow

### 5.1 Application startup

1. `main.tsx` mounts the React application.
2. `App()` reads the current URL and stored theme.
3. `readStoredSession()` checks whether a local session exists.
4. `readProgress()` loads the current user’s progress record.
5. `useEffect()` applies `data-theme` to the document root.
6. The selected view renders the appropriate page.

### 5.2 Authentication flow

```text
Signup form
   ↓
Validate fields and password
   ↓
Save profile to syntaxcompilefit-user
   ↓
Save current session to syntaxcompilefit-session
   ↓
Load syntaxfit-progress-{email}
   ↓
Navigate to dashboard
```

Login follows the same session path after matching the entered email/username and password against the locally stored profile.

### 5.3 Problem selection flow

```text
Problems page
   ↓
User selects a problem
   ↓
selectedProblem is updated
   ↓
Last saved code is loaded if it exists
   ↓
Language is restored if it exists
   ↓
Navigate to practice
```

### 5.4 Submission flow

```text
Submit button
   ↓
executeCode()
   ↓
POST /api/execute
   ↓
Temporary source file created
   ↓
Compiler/checker runs
   ↓
Optional executable runs
   ↓
Temporary directory removed
   ↓
ExecutionResult returned
   ↓
recordSubmission()
   ↓
Progress and history stored in localStorage
   ↓
Accepted → analysis page
Failed → practice console diagnostics
```

### 5.5 Analysis flow

```text
Accepted submission
   ↓
Analysis receives problem, submitted code, and language
   ↓
Static reference solution checked
   ↓
Fallback API reference generation used when necessary
   ↓
Brute/submitted/optimal cards rendered
   ↓
Interview questions displayed
   ↓
Tutor receives contextual questions
```

---

## 6. API reference

### `GET /api/health`

Health check used by Preview and deployment readiness checks.

Response:

```json
{
  "status": "ok"
}
```

### `POST /api/execute`

Compiles/checks and optionally runs submitted source code.

Request:

```json
{
  "code": "...",
  "language": "Python",
  "input": "..."
}
```

Possible outcomes:

- Successful execution.
- Successful syntax check.
- Compilation error.
- Runtime error.
- Empty editor error.
- Unsupported language error.
- Missing toolchain error.

### `POST /api/reference-solution`

Generates a problem-specific reference solution when a static implementation is not available.

The endpoint is server-side because the LLM API key must not be sent to the browser.

### `POST /api/tutor`

Generates a contextual interview-tutor response. The server sends the problem context and submitted code to the platform LLM, then returns only the tutor answer to the browser.

### `GET /api/platform/config.js`

Returns the safe, named public runtime configuration. Secrets are not included.

### `POST /api/trpc/*`

The project retains the standard tRPC server integration for platform/application routes. The current coding workflow uses the custom Express endpoints above for execution, tutor, and reference-solution generation.

---

## 7. How to run the project locally

### Requirements

Install:

- Node.js.
- pnpm 10.18.0 or a compatible pnpm version.
- Python 3.
- Java/Javac.
- GCC/G++.
- Go.
- Rust/rustc.

The application can still start without every compiler installed, but the relevant language will return a clear missing-toolchain message.

### Installation

```bash
cd syntaxfit
pnpm install --frozen-lockfile
```

### Development

```bash
pnpm dev
```

The server listens on port `3000` by default. A different port can be provided with `PORT`.

### Type checking

```bash
pnpm check
```

### Production build

```bash
pnpm build
```

### Production start

```bash
pnpm start
```

### Tests

```bash
pnpm test
```

---

## 8. How to explain the project in an interview

### 30-second answer

> “SyntaxCompileFit is a React and Express platform for DSA and interview preparation. Users can create a local profile, browse a 300-plus problem catalog, write solutions in seven languages, run code through real server-side compiler toolchains, and submit attempts. Accepted submissions open an analysis page with complexity, brute-force versus submitted versus optimal code, ten interview questions, and a contextual AI tutor. I used TypeScript for type safety, Vite for the frontend build, Express for APIs, Node child processes for compiler execution, and localStorage for per-user prototype persistence.”

### 1-minute answer

> “The core design is a learning loop. The problem catalog gives each problem its own statement, examples, constraints, starter templates, hints, brute-force explanation, optimal explanation, and interview questions. The practice room supports Python, Java, C++, C, JavaScript, Go, and Rust. When the user runs code, the frontend posts it to Express. The server writes it to a temporary directory, invokes the matching compiler or runtime with a timeout and output limit, returns compile/runtime diagnostics, and removes the temporary files. On submit, I record the attempt, solution state, execution time, language, and last code per user in localStorage. An accepted solution navigates to an analysis page where the user can compare three approaches and ask an AI tutor questions grounded in the exact problem and submission.”

### 2-minute technical answer

> “The frontend is a typed React SPA built with Vite. I keep the core application flow in `App.tsx`, with a typed `Problem`, `ProblemDetail`, `ProgressData`, and `ExecutionResult` model. The app derives the visible problem list from the full catalog and the current user’s progress, so solved state, attempts, and time are not hard-coded. Authentication and progress persistence are intentionally local for the prototype, using separate storage keys for the profile, session, theme, and email-scoped progress. The Express server provides health, code execution, tutor, and reference-solution endpoints. Code execution is isolated in a temporary folder and uses `execFile` with a 4.5-second timeout. Compilation diagnostics and runtime diagnostics are returned separately. For the AI features, the browser calls our server, not the model provider directly, so private credentials stay server-side. The solution-analysis page uses static reference implementations where available and requests a structured generated implementation only as a fallback. I also added a custom tutor message renderer so answers are displayed line by line with indentation, lists, headings, and code styling.”

---

## 9. Design decisions and reasoning

### Why React?

React makes the product easy to divide into focused interactive areas: authentication, catalog, practice room, analysis, tutor, analytics, and history. Hooks make local state and derived progress calculations straightforward.

### Why TypeScript?

The product has many related data shapes: problems, details, languages, submissions, execution results, and interview questions. TypeScript catches mismatched fields early and makes frontend/backend contracts easier to understand.

### Why Express?

Express provides a simple server layer for the custom execution and AI proxy endpoints. It also integrates cleanly with Vite middleware during development.

### Why execute code on the server?

Browser JavaScript cannot safely or consistently execute arbitrary Java, C++, C, Go, or Rust code. The server can use installed language toolchains, apply timeouts, collect compiler diagnostics, and clean temporary files.

### Why use temporary directories?

Each submission receives an isolated working directory. This prevents source files from different requests from colliding and makes cleanup predictable.

### Why keep AI calls server-side?

The platform LLM key is private. A server-side proxy prevents the browser bundle from exposing the credential and allows the application to attach trusted problem context.

### Why use localStorage for the prototype?

It makes the prototype immediately usable without database setup. The user can sign up, log out, return, and see progress in the same browser. For production, the same data model can move to a database with authenticated server APIs.

### Why have both static and generated reference solutions?

Static solutions are more predictable and reviewable for core problems. On-demand generation increases coverage for the larger imported catalog. The server validates generated output to reduce the chance of displaying an incomplete placeholder implementation.

### Why separate Run and Submit?

Run supports experimentation without changing the user’s solved state. Submit is the intentional progress event that records the attempt and can open the interview-analysis flow.

---

## 10. Current limitations and future improvements

The current prototype is functional, but these are important points to communicate honestly:

1. **Authentication is local-only.** Replace browser-stored passwords with a real user table, password hashing, secure sessions, and HTTP-only cookies.
2. **Progress is browser-specific.** Move progress and submissions to a database for multi-device access.
3. **The compiler runs trusted server tools.** Production deployment should add stronger sandboxing, CPU/memory limits, process isolation, network restrictions, and container-level security.
4. **Memory is not measured yet.** The API returns a placeholder memory value. Add OS-level or container-level resource measurement.
5. **Problem validation is lightweight.** The current execution endpoint compiles and runs code, but a production judge should run hidden test cases with language-specific adapters and compare normalized outputs.
6. **Generated solutions need review.** Static verified reference implementations should be expanded to cover the complete catalog.
7. **The imported catalog has generic fallback metadata in some entries.** The next data-quality pass should replace generic complexity, brute-force, optimal, and question text with fully verified problem-specific content.
8. **The analysis submission identifier is currently presentation-oriented.** A production system should use a real database-generated submission ID.
9. **LLM answers are not guaranteed to be formally correct.** The tutor should be treated as an assistant, with the problem statement and compiler behavior remaining authoritative.
10. **The current app has starter platform modules.** Unused or lightly used tRPC/database modules can either be integrated into the product or removed during a focused production cleanup.

Recommended next production steps:

- Add a real database schema for users, problems, submissions, progress, and generated references.
- Implement secure authentication.
- Add a dedicated sandbox runner service.
- Create hidden tests for every problem.
- Verify every reference solution in every supported language.
- Add submission IDs, verdicts, test-case counts, and memory metrics.
- Add rate limits to execution and AI endpoints.
- Add automated tests for auth, execution, progress, and tutor fallback behavior.
- Add observability and structured server logs.
- Add role-based administration for catalog editing.

---

## 11. Suggested project demonstration sequence

When showing the project to someone else, use this order:

1. Open the landing page and explain the product goal.
2. Create a new account.
3. Show the personalized dashboard with no solved problems initially.
4. Open the Problems page and demonstrate search/filtering.
5. Select Two Sum or another known problem.
6. Show the problem statement, examples, constraints, and hints.
7. Change the language and show the starter template changing.
8. Run code with a valid program.
9. Intentionally introduce a syntax error and show compiler diagnostics.
10. Restore the solution and submit it.
11. Show the accepted analysis page.
12. Compare brute force, submitted, and optimal code.
13. Open one interview question and explain the model answer.
14. Ask the AI tutor a complexity or edge-case question.
15. Return to the dashboard and show updated solved state and activity.
16. Open analytics and history.
17. Toggle dark mode.
18. Log out and log back in to demonstrate persistence.

This sequence proves the complete product story from authentication through coding, execution, analysis, AI tutoring, persistence, and analytics.

---

## 12. File-by-file quick reference

### `client/src/App.tsx`

The main product file. It defines the core types, catalog merge, authentication UI, app shell, dashboard, problem list, practice room, execution call, submission recording, analysis page, comparison cards, tutor, interview questions, analytics, and history.

### `client/src/index.css`

The global visual system. It contains design tokens, layout rules, responsive breakpoints, animations, light/dark theme selectors, analysis cards, console styles, code comparison cards, tutor styles, and contrast improvements.

### `client/src/catalogExpansion.ts`

Additional problem records and detail helpers used to expand the catalog beyond the base set.

### `client/src/catalogImported.ts`

The large imported problem dataset, including problem-specific statement data, constraints, examples, language templates, and metadata.

### `client/src/referenceSolutions.ts`

Static reference implementation map indexed by problem and language. The analysis page uses this before requesting an on-demand generated reference.

### `server/_core/index.ts`

The Express entry point. It creates the HTTP server, registers health, execution, reference-solution, tutor, public-config, OAuth, and tRPC routes, then attaches Vite or static serving.

### `server/_core/vite.ts`

Development integration between Express and Vite. It also configures managed Preview HMR to use secure WebSockets when required by the hosted environment.

### `vite.config.ts`

Vite plugins, aliases, frontend root, build output, allowed hosts, public configuration, and debug collection setup.

### `package.json`

Development/build scripts and the React, Express, Vite, TypeScript, icon, AI/platform, database, and tooling dependencies.

### `Dockerfile`

Production container setup, including the language toolchains needed by the compiler endpoint.

---

## 13. Final one-line description

> SyntaxCompileFit is a full-stack, student-friendly coding and interview-preparation workspace that turns real code submissions into measurable progress, compiler feedback, solution comparisons, interview practice, and AI-guided learning.
