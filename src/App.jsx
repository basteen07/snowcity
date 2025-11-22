import React from 'react';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import store from './app/store';
import AppRouter from './router/AppRouter';
import { ChatbotProvider } from './context/ChatbotContext';

export default function App() {
  return (
    <Provider store={store}>
      <ChatbotProvider>
        <AppRouter />
        <Toaster position="top-right" />
      </ChatbotProvider>
    </Provider>
  );
}