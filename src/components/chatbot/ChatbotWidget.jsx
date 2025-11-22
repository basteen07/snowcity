import React from 'react';
import { Send, X, Loader2, Settings2, Ticket } from 'lucide-react';
import { useChatbot } from '../../context/ChatbotContext';

function formatTime(ts) {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(ts);
  } catch {
    return '';
  }
}

export default function ChatbotWidget() {
  const {
    isOpen,
    setOpen,
    toggle,
    messages,
    status,
    error,
    temperature,
    setTemperature,
    sendMessage,
  } = useChatbot();

  const [input, setInput] = React.useState('');
  const [showTemp, setShowTemp] = React.useState(false);
  const textareaRef = React.useRef(null);
  const bottomRef = React.useRef(null);

  React.useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput('');
    sendMessage(text);
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-[140] bg-black/20 backdrop-blur-sm md:bg-transparent md:backdrop-blur-0"
          aria-hidden="true"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="fixed bottom-6 right-6 z-[150] flex flex-col items-end gap-3">
        <button
          type="button"
          onClick={toggle}
          className="relative flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-500 px-5 py-3 text-white shadow-2xl hover:scale-[1.02] transition"
          aria-expanded={isOpen}
        >
          <Ticket className="h-5 w-5" />
          <span className="font-semibold">Set Ticket</span>
          {status === 'thinking' && (
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-amber-300 animate-pulse" />
          )}
        </button>

        <div
          className={`w-[92vw] max-w-[420px] rounded-3xl border border-slate-200 bg-white shadow-2xl transition-all duration-300 overflow-hidden ${
            isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 pointer-events-none translate-y-4'
          }`}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
            <div>
              <p className="text-sm font-semibold text-slate-900">SnowCity Concierge</p>
              <p className="text-xs text-slate-500">LLM-powered assistant for questions & booking help</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className={`rounded-full p-2 text-slate-500 hover:text-slate-900 ${showTemp ? 'bg-white shadow' : ''}`}
                onClick={() => setShowTemp((v) => !v)}
                aria-label="Adjust creativity"
              >
                <Settings2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="rounded-full p-2 text-slate-500 hover:text-slate-900"
                onClick={() => setOpen(false)}
                aria-label="Close chatbot"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {showTemp && (
            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
              <label className="flex items-center justify-between text-xs font-medium text-slate-600">
                Response Creativity (temperature)
                <span className="font-semibold text-slate-900">{temperature.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="mt-2 w-full accent-blue-600"
              />
            </div>
          )}

          <div className="max-h-[50vh] overflow-y-auto px-4 py-3 space-y-3 text-sm">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-slate-100 text-slate-900 rounded-bl-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  <span
                    className={`mt-1 block text-[10px] ${msg.role === 'user' ? 'text-blue-100' : 'text-slate-500'}`}
                  >
                    {formatTime(msg.ts)}
                  </span>
                </div>
              </div>
            ))}
            {status === 'thinking' && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                SnowBot is thinking…
              </div>
            )}
            {error ? (
              <div className="rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700 border border-rose-100">
                {error}
              </div>
            ) : null}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white">
            <textarea
              ref={textareaRef}
              className="w-full resize-none border-none px-4 py-3 text-sm outline-none focus:ring-0"
              placeholder="Ask about attractions, combos, or booking assistance..."
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={status === 'thinking'}
            />
            <div className="flex items-center justify-between px-4 pb-3 text-xs text-slate-500">
              <span>Agent can guide you to the booking form when ready.</span>
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-4 py-1.5 text-white text-sm font-semibold hover:bg-blue-500 disabled:opacity-50"
                disabled={status === 'thinking'}
              >
                Send
                {status === 'thinking' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
