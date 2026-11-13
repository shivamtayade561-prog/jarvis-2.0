

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));
app.use(express.static(__dirname));

const MODELS = [
  'gemini-3.8-flash',
  'gemini-3.6-flash'
];

let genAI;

async function getGemini() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('Gemini API key is missing.');
  }

  if (!genAI) {
    const { GoogleGenAI } = await import('@google/genai');
    genAI = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });
  }

  return genAI;
}

function getErrorStatus(error) {
  return Number(
    error.status || error.code || 0
  ) || null;
}

async function generateWithRetry(ai, model, message) {
  return await ai.models.generateContent({
    model,
    contents: message,
    config: {
      systemInstruction:
        'You are JARVIS 2.0, the central AI business assistant. ' +
        'Respond in simple Hinglish when appropriate. ' +
        'Help with business strategy, research, website development, ' +
        'marketing, client acquisition and project management. ' +
        'Be honest. Never invent clients, results or completed actions. ' +
        'The owner makes all final decisions. ' +
        'Never ask the user to reveal API keys or passwords.'
    }
  });
}

app.get('/api/health', (_req, res) => {
  res.json({
    app: 'JARVIS 2.0',
    status: 'online',
    aiProvider: process.env.GEMINI_API_KEY
      ? 'configured'
      : 'not_connected',
    aiConnection: 'not_verified',
    models: MODELS
  });
});

app.post('/api/assistant', async (req, res) => {
  const message = String(
    req.body?.message || ''
  ).trim();

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

  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({
      error: 'Gemini API key is missing in Render Environment.',
      aiConnected: false
    });
  }

  try {
    const ai = await getGemini();
    let lastError;

    for (const model of MODELS) {
      try {
        console.log('Trying Gemini model:', model);

        const response = await generateWithRetry(
          ai,
          model,
          message
        );

        const reply = response.text;

        if (!reply) {
          throw new Error('Empty AI response.');
        }

        console.log(
          'Gemini connected successfully:',
          model
        );

        return res.json({
          reply,
          mode: model,
          aiConnected: true
        });

      } catch (error) {
        lastError = error;

        console.error(
          'Gemini model failed:',
          model,
          'Status:',
          getErrorStatus(error) || 'unknown',
          'Message:',
          String(error.message || 'Unknown error').slice(0, 300)
        );
      }
    }

    throw lastError || new Error('All Gemini models failed.');

  } catch (error) {
    const status = getErrorStatus(error);

    console.error(
      'JARVIS AI connection failed:',
      status || 'unknown',
      String(error.message || '').slice(0, 300)
    );

    let userMessage =
      'Gemini is temporarily unavailable. Please try again later.';

    if (status === 400) {
      userMessage =
        'Gemini rejected the request. Check model settings.';
    }

    if (status === 401 || status === 403) {
      userMessage =
        'Gemini authentication failed. Check API key permissions.';
    }

    return res.status(503).json({
      error: userMessage,
      aiConnected: false,
      errorStatus: status || 'network_or_unknown'
    });
  }
});

app.get('*', (_req, res) => {
  res.sendFile(
    path.join(__dirname, 'index.html')
  );
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(
    'JARVIS 2.0 running on port ' + PORT
  );
});
