// Vercel serverless function. The API key lives in the GROQ_API_KEY
// environment variable, so visitors never see or enter a key.
const persona = require('../lib/persona');

const MODEL = process.env.MODEL || 'llama-3.3-70b-versatile';

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const key = process.env.GROQ_API_KEY;
  if (!key) {
    return res.status(500).json({ error: 'The server is missing its API key setting (GROQ_API_KEY).' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (_) { body = {}; }
  }

  // Keep the last few turns, trimmed, with only valid roles.
  const messages = (Array.isArray(body && body.messages) ? body.messages : [])
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map(m => ({ role: m.role, content: m.content.slice(0, 600) }))
    .slice(-8);

  if (!messages.length || messages[messages.length - 1].role !== 'user') {
    return res.status(400).json({ error: 'Please ask a question first.' });
  }

  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + key,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.6,
        max_tokens: 260,
        messages: [{ role: 'system', content: persona }, ...messages],
      }),
    });

    if (r.status === 429) {
      return res.status(429).json({ error: 'Lots of people are talking to me right now. Please try again in a few seconds.' });
    }
    if (!r.ok) {
      return res.status(502).json({ error: 'The AI service had a problem. Please try again.' });
    }

    const data = await r.json();
    const reply = data && data.choices && data.choices[0] && data.choices[0].message
      ? String(data.choices[0].message.content || '').trim()
      : '';
    if (!reply) {
      return res.status(502).json({ error: 'I did not get an answer back. Please try again.' });
    }
    return res.status(200).json({ reply });
  } catch (_) {
    return res.status(502).json({ error: 'Could not reach the AI service. Please try again.' });
  }
};
