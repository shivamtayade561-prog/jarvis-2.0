
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));
app.use(express.static(__dirname));

let genAI;

async function getGemini() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Gemini API key is not configured.');
  }

  if (!genAI) {
    const { GoogleGenAI } = await import('@google/genai');
    genAI = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });
  }

  return genAI;
}

app.get('/api/health', (_req, res) => {
  res.json({
    app: 'JARVIS 2.0',
    status: 'online',
    aiProvider: process.env.GEMINI_API_KEY
      ? 'configured'
      : 'not_connected',
    message: process.env.GEMINI_API_KEY
      ? 'Gemini API key is configured.'
      : 'Gemini API key is missing.'
  });
});

app.post('/api/assistant', async (req, res) => {
  const message = String(req.body?.message || '').trim();

  if (!message) {
    return res.status(400).json({
      error: 'Message is required.'
    });
  }

  if (message.length > 10000) {
    return res.status(400).json({
      error: 'Message is too long.'
    });
  }

  try {
    const ai = await getGemini();

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: message,
      config: {
        systemInstruction:
          'You are JARVIS 2.0, a helpful AI business assistant. ' +
          'Respond clearly, honestly and practically. ' +
          'Never claim an action was completed unless it really was.'
      }
    });

    res.json({
      reply: response.text || 'I could not generate a response.',
      mode: 'gemini_live',
      aiConnected: true
    });
  } catch (error) {
    console.error('Gemini API error:', error.message);

    res.status(500).json({
      error: 'JARVIS could not connect to Gemini. Please try again.',
      aiConnected: false
    });
  }
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`JARVIS 2.0 running on port ${PORT}`);
});

