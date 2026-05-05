import { useState, useRef, useEffect } from 'react';
import api from '../services/api';

const SESSION_KEY = 'usport_chat_session';

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', content: '👋 Hi! I\'m the U-SPORT Assistant. Ask me about sports availability, booking, or equipment!', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => localStorage.getItem(SESSION_KEY) || Math.random().toString(36).substring(2));
  const bottomRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(SESSION_KEY, sessionId);
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await api.post('/chat', { message: userMsg.content, sessionId });
      setMessages(prev => [...prev, { role: 'bot', content: res.data.data.reply, timestamp: new Date() }]);
    } catch {
      setMessages(prev => [...prev, { role: 'bot', content: '❌ Sorry, I encountered an error. Please try again.', timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const quickReplies = ['Show all sports', 'How to book?', 'Maintenance time', 'Equipment info'];

  // Format markdown-like bold text
  const formatText = (text) => {
    return text.split('\n').map((line, i) => (
      <span key={i}>
        {line.split(/\*\*(.*?)\*\*/g).map((part, j) =>
          j % 2 === 1 ? <strong key={j} className="text-white font-semibold">{part}</strong> : part
        )}
        {i < text.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  return (
    <>
      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-20 right-4 z-50 w-80 sm:w-96 flex flex-col card border-slate-700 shadow-2xl shadow-black/50 overflow-hidden"
          style={{ height: '480px' }}>
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-indigo-600 border-b border-indigo-500">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-base">🤖</div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-white">U-SPORT Assistant</div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-slow" />
                <span className="text-xs text-indigo-200">Online</span>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition-colors">✕</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex chat-bubble ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'bot' && (
                  <div className="w-6 h-6 rounded-full bg-indigo-600/40 border border-indigo-500/40 flex items-center justify-center text-xs mr-2 mt-1 flex-shrink-0">🤖</div>
                )}
                <div className={`max-w-[80%] px-3 py-2.5 rounded-2xl text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-sm'
                    : 'bg-slate-800 text-slate-300 border border-slate-700 rounded-tl-sm'
                }`}>
                  {msg.role === 'bot' ? formatText(msg.content) : msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="w-6 h-6 rounded-full bg-indigo-600/40 border border-indigo-500/40 flex items-center justify-center text-xs mr-2">🤖</div>
                <div className="bg-slate-800 border border-slate-700 px-4 py-3 rounded-2xl rounded-tl-sm">
                  <div className="flex gap-1">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies */}
          <div className="px-3 pb-2 flex gap-1.5 flex-wrap">
            {quickReplies.map(q => (
              <button key={q} onClick={() => { setInput(q); }}
                className="text-xs px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/50 transition-all">
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-slate-800 flex gap-2">
            <input
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              placeholder="Type a message..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
            />
            <button onClick={sendMessage} disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all text-white text-sm">
              ➤
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button onClick={() => setOpen(!open)}
        className="fixed bottom-4 right-4 z-50 w-12 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-500/30 flex items-center justify-center text-xl transition-all duration-300 hover:scale-110 active:scale-95">
        {open ? '✕' : '🤖'}
      </button>
    </>
  );
}
