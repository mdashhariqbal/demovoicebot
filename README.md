# Ashhar voice bot

[🔗 Try the Live Demo](https://demovoicebot.vercel.app)

Tap a button, ask a question out loud, hear the answer. Visitors need no account, no install and no API key.

## Deploy in about 5 minutes (free)

1. **Get a free AI key.** Sign up at https://console.groq.com (no card needed), open API Keys, create a key.
2. **Put this folder on GitHub.** Create a new repository and upload everything in this folder.
3. **Deploy on Vercel.** At https://vercel.com choose Add New > Project, import the repository, then open Environment Variables and add:
   - Name: `GROQ_API_KEY`
   - Value: the key from step 1
   Click Deploy.
4. **Test it.** Open your live deployment URL ([https://demovoicebot.vercel.app](https://demovoicebot.vercel.app)) in Chrome on desktop and on your phone, and tap each example question. That URL is what you submit.

No GitHub? Run `npx vercel --prod` inside this folder, then `npx vercel env add GROQ_API_KEY production` and redeploy.

## Make the answers yours

Edit `lib/persona.js` (the lines marked EDIT), commit, and Vercel redeploys automatically.

## Notes

- Voice input works in Chrome, Edge and Safari. Firefox can still use the question buttons and the text box; answers are always spoken.
- The key is only read on the server (`api/chat.js`), never sent to the browser.
- To use another free model, change the `MODEL` environment variable (default `llama-3.3-70b-versatile`).
