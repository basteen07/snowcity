import React from 'react';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import store from './app/store';
import AppRouter from './router/AppRouter';

export default function App() {
  return (
    <Provider store={store}>
      <AppRouter />
      <Toaster position="top-right" />
    </Provider>
  );
}