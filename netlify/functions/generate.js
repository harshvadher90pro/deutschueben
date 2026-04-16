export default async (request) => {
  if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const GROQ_KEY = process.env.GROQ_API_KEY;
  const MODELS   = ["llama3-8b-8192","llama-3.3-70b-versatile","llama3-70b-8192","mixtral-8x7b-32768"];

  let prompt, max_tokens;
  try {
    const body = await request.json();
    prompt     = body.prompt;
    max_tokens = body.max_tokens || 2048;
  } catch { return new Response(JSON.stringify({error:'Invalid body'}),{status:400,headers:{'Content-Type':'application/json'}}); }
  if (!prompt) return new Response(JSON.stringify({error:'Missing prompt'}),{status:400,headers:{'Content-Type':'application/json'}});

  let lastError = null;
  for (const model of MODELS) {
    try {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_KEY}` },
        body: JSON.stringify({ model, messages:[{role:'user',content:prompt}], temperature:0.8, max_tokens })
      });
      if (!r.ok) { const e=await r.json().catch(()=>({})); throw new Error(e?.error?.message||`HTTP ${r.status}`); }
      const data = await r.json();
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    } catch(e) { lastError = e.message; console.error(`[${model}]`, e.message); }
  }
  return new Response(JSON.stringify({error: lastError||'All models failed'}),
    {status:502, headers:{'Content-Type':'application/json'}});
};
export const config = { path: '/api/generate' };
