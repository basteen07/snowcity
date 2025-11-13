import React, { Suspense } from 'react';
import { Provider } from 'react-redux';
import adminStore from './app/adminStore';
import AdminRouter from './router/AdminRouter';
import ErrorBoundary from './components/common/ErrorBoundary';

export default function AdminApp() {
  return (
    <Provider store={adminStore}>
      <ErrorBoundary>
        <Suspense fallback={<div className="p-6">Loading admin…</div>}>
          <AdminRouter />
        </Suspense>
      </ErrorBoundary>
    </Provider>
  );
}