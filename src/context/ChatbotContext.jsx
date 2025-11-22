import React from 'react';
import api from '../services/apiClient';
import endpoints from '../services/endpoints';

const ChatbotContext = React.createContext(null);

function mapToHistory(messages) {
  return messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({ role: m.role, content: m.content }));
}

export function ChatbotProvider({ children }) {
  const [isOpen, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState([{
    id: 'welcome',
    role: 'assistant',
    content: 'Hi! I\'m SnowCity\'s virtual concierge. Ask me anything about attractions, combos, timings, or booking help.',
    ts: Date.now(),
  }]);
  const [status, setStatus] = React.useState('idle');
  const [error, setError] = React.useState('');
  const [temperature, setTemperature] = React.useState(0.4);

  const sendMessage = React.useCallback(async (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setError('');
    const userEntry = { id: `u-${Date.now()}`, role: 'user', content: trimmed, ts: Date.now() };
    setMessages((prev) => [...prev, userEntry]);
    setStatus('thinking');
    try {
      const { data } = await api.post(endpoints.chatbot.chat(), {
        message: trimmed,
        history: mapToHistory(messages.concat(userEntry)),
        temperature,
      });
      const reply = data?.reply?.trim() || 'Sorry, I did not understand that. Could you rephrase?';
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: 'assistant', content: reply, ts: Date.now(), meta: data?.usage || null },
      ]);
    } catch (err) {
      const message = err?.response?.data?.error || err?.message || 'Failed to reach the assistant. Please try again.';
      setError(message);
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: 'I\'m having trouble connecting right now. Please try again in a moment.',
          ts: Date.now(),
        },
      ]);
    } finally {
      setStatus('idle');
    }
  }, [messages, temperature]);

  const value = React.useMemo(() => ({
    isOpen,
    setOpen,
    toggle: () => setOpen((v) => !v),
    messages,
    status,
    error,
    temperature,
    setTemperature,
    sendMessage,
  }), [isOpen, messages, status, error, temperature, sendMessage]);

  return (
    <ChatbotContext.Provider value={value}>
      {children}
    </ChatbotContext.Provider>
  );
}

export function useChatbot() {
  const ctx = React.useContext(ChatbotContext);
  if (!ctx) {
    throw new Error('useChatbot must be used within ChatbotProvider');
  }
  return ctx;
}
