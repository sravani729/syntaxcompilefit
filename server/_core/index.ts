import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { publicPlatformScript } from "./publicConfig";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

const execFileAsync = promisify(execFile);
type ExecuteLanguage = "Python" | "Java" | "C++" | "C" | "JavaScript" | "Go" | "Rust";
const toolchainFor: Record<ExecuteLanguage, { file: string; args: string[]; source: string; binary?: string }> = {
  Python: { file: "python3", args: ["-m", "py_compile"], source: "solution.py" },
  Java: { file: "javac", args: ["-Xlint:all"], source: "Solution.java" },
  "C++": { file: "g++", args: ["-std=c++17", "-Wall", "-Wextra", "-O2"], source: "solution.cpp", binary: "solution" },
  C: { file: "gcc", args: ["-std=c11", "-Wall", "-Wextra", "-O2"], source: "solution.c", binary: "solution" },
  JavaScript: { file: "node", args: ["--check"], source: "solution.js" },
  Go: { file: "go", args: ["build"], source: "solution.go", binary: "solution" },
  Rust: { file: "rustc", args: ["--edition", "2021"], source: "solution.rs", binary: "solution" },
};
const executeWithLimit = async (file: string, args: string[], cwd: string) => {
  try {
    const result = await execFileAsync(file, args, { cwd, timeout: 4500, maxBuffer: 256 * 1024 });
    return { ok: true, stdout: result.stdout, stderr: result.stderr };
  } catch (error: any) {
    if (error.code === "ENOENT") return { ok: false, stdout: "", stderr: `Required compiler executable ${file} is not installed on the execution host.` };
    return { ok: false, stdout: error.stdout || "", stderr: error.stderr || error.message || "Process failed." };
  }
};

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.post("/api/execute", async (req, res) => {
    const { code, language, input = "" } = req.body ?? {};
    if (typeof code !== "string" || !code.trim()) return res.status(400).json({ ok: false, output: "", error: "Compilation error: your editor is empty.", compileError: "Compilation error: your editor is empty.", runtimeError: "", time: "0 ms", memory: "0 MB" });
    const toolchain = toolchainFor[language as ExecuteLanguage];
    if (!toolchain) return res.status(400).json({ ok: false, output: "", error: "Unsupported language.", compileError: "Unsupported language.", runtimeError: "", time: "0 ms", memory: "0 MB" });
    const dir = await mkdtemp(join(tmpdir(), "syntaxfit-"));
    const started = Date.now();
    try {
      const sourcePath = join(dir, toolchain.source);
      await writeFile(sourcePath, code, "utf8");
      const compileArgs = [...toolchain.args, toolchain.source, ...(toolchain.binary ? ["-o", toolchain.binary] : [])];
      const compiled = await executeWithLimit(toolchain.file, compileArgs, dir);
      const time = `${Date.now() - started} ms`;
      if (!compiled.ok) return res.json({ ok: false, output: "", error: compiled.stderr.trim() || "Compilation failed.", compileError: compiled.stderr.trim() || "Compilation failed.", runtimeError: "", time, memory: "—" });
      if (!toolchain.binary && language !== "Java" && language !== "Python" && language !== "JavaScript") return res.json({ ok: true, output: "Syntax check passed. No executable entry point was provided.", compileError: "", runtimeError: "", time, memory: "—" });
      if (language === "Java" && !/static\s+void\s+main\s*\(/.test(code)) return res.json({ ok: true, output: "Compiled successfully. Add a static void main method to run custom input.", compileError: "", runtimeError: "", time, memory: "—" });
      const executable = language === "Java" ? "java" : language === "Python" ? "python3" : language === "JavaScript" ? "node" : `./${toolchain.binary}`;
      const args = language === "Java" ? ["Solution"] : language === "Python" ? [toolchain.source] : language === "JavaScript" ? [toolchain.source] : [];
      const ran = await executeWithLimit(executable, args, dir);
      if (!ran.ok) return res.json({ ok: false, output: ran.stdout.trim(), error: ran.stderr.trim() || "Runtime error.", compileError: "", runtimeError: ran.stderr.trim() || "Runtime error.", time: `${Date.now() - started} ms`, memory: "—" });
      return res.json({ ok: true, output: ran.stdout.trim() || "Program finished with no output.", compileError: "", runtimeError: "", time: `${Date.now() - started} ms`, memory: "—" });
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
  app.post("/api/reference-solution", async (req, res) => {
    const { problem, statement, starterCode, language, constraints, expectedComplexity } = req.body ?? {};
    if (typeof problem !== "string" || typeof starterCode !== "string") return res.status(400).json({ error: "Problem context is required." });
    const apiUrl = process.env.MANUS_API_URL;
    const apiKey = process.env.MANUS_API_KEY;
    if (!apiUrl || !apiKey) return res.status(503).json({ error: "No reference generator is configured for this environment." });
    const prompt = `Create the interview-ready reference implementation for exactly this coding problem. Return JSON only with keys code, explanation, time, and space. The code must be complete, compile with the requested language, preserve the supplied class/method signature, contain no TODO or placeholder, and handle the stated edge cases. Do not add a main method unless the starter already has one.
Problem: ${problem}
Language: ${language}
Statement: ${statement}
Constraints: ${JSON.stringify(constraints)}
Expected complexity: ${expectedComplexity?.time} time, ${expectedComplexity?.space} space
Starter signature:
${starterCode}`;
    try {
      const upstream = await fetch(`${apiUrl.replace(/\/$/, "")}/v1/chat/completions`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ messages: [{ role: "system", content: "You are a meticulous competitive-programming engineer. Output only valid JSON." }, { role: "user", content: prompt }], response_format: { type: "json_object" } }) });
      const payload = await upstream.json() as { choices?: Array<{ message?: { content?: string } }>; error?: { message?: string } };
      if (!upstream.ok || payload.error) return res.status(502).json({ error: payload.error?.message || "Reference generator unavailable." });
      const content = payload.choices?.[0]?.message?.content?.trim() || "";
      const parsed = JSON.parse(content) as { code?: string; explanation?: string; time?: string; space?: string };
      if (!parsed.code || /TODO|implement the solution here|return new Array\(\)/i.test(parsed.code)) return res.status(502).json({ error: "Reference generator returned an incomplete implementation." });
      return res.json({ code: parsed.code, explanation: parsed.explanation || "Reference implementation for the stated constraints.", time: parsed.time || expectedComplexity?.time, space: parsed.space || expectedComplexity?.space });
    } catch (error) {
      console.error("Reference solution request failed:", error);
      return res.status(502).json({ error: "Reference generator unavailable." });
    }
  });
  app.post("/api/tutor", async (req, res) => {
    const { question, problem, topic, statement, complexity, submittedCode, language } = req.body ?? {};
    if (typeof question !== "string" || !question.trim()) return res.status(400).json({ error: "Ask a question first." });
    const apiUrl = process.env.MANUS_API_URL;
    const apiKey = process.env.MANUS_API_KEY;
    if (!apiUrl || !apiKey) return res.json({ answer: "I can still guide you locally: explain the invariant, walk through an example, then state the time and space complexity. Try asking about complexity, edge cases, or interview explanation." });
    const prompt = `You are a patient coding interview tutor inside SyntaxCompileFit. Give a concise, practical answer to the student's question. Do not solve an unrelated problem. Encourage the student to reason, and mention a trade-off or interview phrasing when useful.

Problem: ${problem}
Topic: ${topic}
Statement: ${statement}
Expected complexity: ${complexity?.time} time, ${complexity?.space} space
Language: ${language}
Submitted code:
${String(submittedCode || "").slice(0, 12000)}

Student question: ${question}`;
    try {
      const upstream = await fetch(`${apiUrl.replace(/\/$/, "")}/v1/chat/completions`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` }, body: JSON.stringify({ messages: [{ role: "system", content: "You are an encouraging senior software engineer and interview coach." }, { role: "user", content: prompt }] }) });
      const payload = await upstream.json() as { choices?: Array<{ message?: { content?: string } }>; error?: { message?: string } };
      if (!upstream.ok || payload.error) return res.status(502).json({ error: payload.error?.message || "Tutor service unavailable." });
      const answer = payload.choices?.[0]?.message?.content?.trim();
      if (!answer) return res.status(502).json({ error: "Tutor returned no answer." });
      return res.json({ answer });
    } catch (error) {
      console.error("Tutor request failed:", error);
      return res.status(502).json({ error: "Tutor service unavailable." });
    }
  });
  app.get("/api/platform/config.js", (_req, res) => {
    res.set("Cache-Control", "no-store").type("application/javascript").send(publicPlatformScript());
  });
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = Number(process.env.PORT || "3000");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid PORT");
  server.on("error", error => { console.error("Server failed:", error.message); process.exit(1); });
  server.listen(port, "0.0.0.0", () => console.log(`Server listening on port ${port}`));
}

startServer().catch(error => { console.error(error); process.exit(1); });
