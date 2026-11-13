
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));

// Serve website files from the repository root
app.use(express.static(__dirname));

app.get('/api/health', (_req, res) => {
  res.json({
    app: 'JARVIS 2.0',
    status: 'online',
    aiProvider: process.env.GEMINI_API_KEY ? 'configured' : 'not_connected',
    message: process.env.GEMINI_API_KEY
      ? 'AI key is configured; provider integration can be enabled.'
      : 'Workspace is running. AI provider is not connected yet.'
  });
});

app.post('/api/assistant', async (req, res) => {
  const message = String(req.body?.message || '').trim();

  if (!message) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  res.json({
    reply: `JARVIS received your instruction: "${message}". AI provider status: ${process.env.GEMINI_API_KEY ? 'key configured; provider integration pending verification' : 'not connected'}.`,
    mode: 'workspace_assistant',
    aiConnected: false
  });
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`JARVIS 2.0 running on port ${PORT}`);
});
