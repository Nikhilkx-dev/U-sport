const ChatLog = require('../models/ChatLog');
const chatbotService = require('../services/chatbotService');

const generateSessionId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

// POST /api/chat
const sendMessage = async (req, res, next) => {
  try {
    const { message, sessionId } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message is required.' });

    const sid = sessionId || generateSessionId();
    const botReply = await chatbotService(message, req.user?._id);

    // Save to DB
    let chatLog = await ChatLog.findOne({ sessionId: sid });
    if (!chatLog) {
      chatLog = new ChatLog({ userId: req.user?._id || null, sessionId: sid, messages: [] });
    }
    chatLog.messages.push({ role: 'user', content: message });
    chatLog.messages.push({ role: 'bot', content: botReply });
    await chatLog.save();

    res.json({ success: true, data: { reply: botReply, sessionId: sid } });
  } catch (error) {
    next(error);
  }
};

// GET /api/chat/history
const getChatHistory = async (req, res, next) => {
  try {
    const { sessionId } = req.query;
    if (!sessionId) return res.status(400).json({ success: false, message: 'sessionId is required.' });

    const chatLog = await ChatLog.findOne({ sessionId });
    res.json({ success: true, data: chatLog?.messages || [] });
  } catch (error) {
    next(error);
  }
};

module.exports = { sendMessage, getChatHistory };
