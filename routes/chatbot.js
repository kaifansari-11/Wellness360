const express = require('express');
const router = express.Router();
const db = require('../models/db');
require('dotenv').config();


const Groq = require('groq-sdk');

// GET /chat page - This part remains the same
router.get('/chat', (req, res) => {
  if (!req.session.userId) return res.redirect('/login');

  // Load the last 12 messages from the DATABASE
  const sql = 'SELECT role, content FROM chat_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 12';
  db.query(sql, [req.session.userId], (err, messages) => {
    if (err) throw err;
    
    
    const recentMessages = messages.reverse();

    res.render('chat', {
      recentMessages: recentMessages
    });
  });
});


// ✅ UPDATED POST /chat to use Groq and the Llama 3 model
router.post('/chat', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });

  const userMessage = (req.body.message || '').trim();
  if (!userMessage) return res.status(400).json({ error: 'Empty message' });

  const userId = req.session.userId;

  db.query('INSERT INTO chat_history (user_id, role, content) VALUES (?, ?, ?)', [userId, 'user', userMessage]);

  const mood = (req.session.mood || 'neutral').toLowerCase();
  const moodStyles = {
    happy: "be upbeat, playful and encouraging.",
    excited: "be energetic and celebratory.",
    calm: "be soothing, gentle, and mindful.",
    sad: "be compassionate, patient, and supportive.",
    anxious: "be calming and grounding, give short breathing cues.",
    angry: "be calm, non-judgmental, and de-escalating.",
    neutral: "be friendly and helpful."
  };
  const styleInstruction = moodStyles[mood] || moodStyles['neutral'];
  const systemMessage = `You are Wellness360's friendly virtual companion. ${styleInstruction} Keep replies short, give one actionable tip when possible, and respond empathetically.`;

  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY is not defined in your .env file.");

    const groq = new Groq({ apiKey });

    const chatCompletion = await groq.chat.completions.create({
      // The messages array is the standard way to send a conversation
      messages: [
        {
          role: "system",
          content: systemMessage,
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
      // This is a popular, high-performance model. It's very fast on Groq.
      model: "llama-3.1-8b-instant",
    });

    let aiReply = chatCompletion.choices[0]?.message?.content?.trim();
    if (!aiReply) aiReply = "Sorry, I couldn't form a response.";

    db.query('INSERT INTO chat_history (user_id, role, content) VALUES (?, ?, ?)', [userId, 'assistant', aiReply]);
    
    res.json({ reply: aiReply });

  } catch (err) {
    console.error("Groq API error:", err);
    res.status(500).json({ error: err.message || "An error occurred connecting to the AI service." });
  }
});

module.exports = router;