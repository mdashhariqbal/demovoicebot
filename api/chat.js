// Vercel serverless function. The API key lives in the GROQ_API_KEY
// environment variable, so visitors never see or enter a key.
const persona = require('../lib/persona');

// Tries the preferred model first, then fallbacks if Groq no longer serves it.
const MODELS = [process.env.MODEL, 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'openai/gpt-oss-20b']
  .filter(Boolean)
  .filter((m, i, a) => a.indexOf(m) === i);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const key = (process.env.GROQ_API_KEY || '').trim();
  if (!key) {
    return res.status(500).json({ error: 'The server is missing its API key setting (GROQ_API_KEY).' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (_) { body = {}; }
  }

  const messages = (Array.isArray(body && body.messages) ? body.messages : [])
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map(m => ({ role: m.role, content: m.content.slice(0, 600) }))
    .slice(-8);

  if (!messages.length || messages[messages.length - 1].role !== 'user') {
    return res.status(400).json({ error: 'Please ask a question first.' });
  }

  try {
    for (const model of MODELS) {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key },
        body: JSON.stringify({
          model,
          temperature: 0.6,
          max_tokens: 260,
          messages: [{ role: 'system', content: persona }, ...messages],
        }),
      });

      if (r.ok) {
        const data = await r.json();
        const reply = data && data.choices && data.choices[0] && data.choices[0].message
          ? String(data.choices[0].message.content || '').trim()
          : '';
        if (reply) return res.status(200).json({ reply });
        continue;
      }

      const detail = await r.text().catch(() => '');
      console.error('Groq error', r.status, model, detail.slice(0, 300));

      if (r.status === 401 || r.status === 403) {
        return res.status(502).json({ error: 'The AI key was rejected (' + r.status + '). Check GROQ_API_KEY in Vercel and redeploy.' });
      }
      if (r.status === 429) {
        return res.status(429).json({ error: 'Lots of people are talking to me right now. Please try again in a few seconds.' });
      }
      // 400/404 usually means this model name is unavailable: try the next one.
    }
    return res.status(502).json({ error: 'The AI service had a problem. Please try again.' });
  } catch (e) {
    console.error('Fetch failed', e && e.message);
    return res.status(502).json({ error: 'Could not reach the AI service. Please try again.' });
  }
};
