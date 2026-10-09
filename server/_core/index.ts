import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { publicPlatformScript } from "./publicConfig";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
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
