const GROQ_KEY = process.env.GROQ_API_KEY;
const MODELS = [
  "llama3-8b-8192",
  "llama-3.3-70b-versatile",
  "llama3-70b-8192",
  "mixtral-8x7b-32768"
];

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { prompt, max_tokens } = req.body || {};
  if (!prompt) return res.status(400).json({ error: "Missing prompt" });

  let lastError = null;
  for (const model of MODELS) {
    try {
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_KEY}`
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.8,
          max_tokens: max_tokens || 2048
        })
      });

      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error(e?.error?.message || `HTTP ${r.status}`);
      }

      const data = await r.json();
      return res.status(200).json(data);
    } catch (err) {
      lastError = err.message;
      console.error(`[${model}]`, err.message);
    }
  }

  return res.status(502).json({ error: lastError || "All models failed" });
}
