import React, { useEffect, useState, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Loader, AlertCircle } from 'lucide-react';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function PaymentReturn() {
  const query = useQuery();
  const [uiState, setUiState] = useState('processing'); // processing, success, failed

  // Backend redirects here with these params after processing
  const orderRef = query.get('order') || query.get('booking') || 'Unknown';
  const status = query.get('status');

  useEffect(() => {
    if (status === 'success') {
      setUiState('success');
    } else if (status === 'failed' || status === 'error') {
      setUiState('failed');
    } else if (status === 'pending') {
      setUiState('pending');
    } else {
      setUiState('processing');
    }
  }, [status]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 bg-gray-50/50">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full text-center">
        
        {/* --- SUCCESS STATE --- */}
        {uiState === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
              <CheckCircle size={32} strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
            <p className="text-gray-600 mb-6 text-sm">
              Thank you for your purchase. Your order <span className="font-mono font-medium text-gray-800 bg-gray-100 px-1 rounded">#{orderRef}</span> has been processed successfully.
            </p>
          </>
        )}

        {/* --- FAILED STATE --- */}
        {uiState === 'failed' && (
          <>
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
              <XCircle size={32} strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
            <p className="text-gray-600 mb-6 text-sm">
              We couldn't complete your transaction for order <span className="font-mono font-medium text-gray-800 bg-gray-100 px-1 rounded">#{orderRef}</span>. Please try again.
            </p>
          </>
        )}

        {/* --- PROCESSING / PENDING STATE --- */}
        {(uiState === 'processing' || uiState === 'pending') && (
          <>
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              {uiState === 'pending' ? <AlertCircle size={32} /> : <Loader size={32} className="animate-spin" />}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {uiState === 'pending' ? 'Payment Pending' : 'Verifying...'}
            </h1>
            <p className="text-gray-600 mb-6 text-sm">
              Please wait while we check the status of your order <span className="font-mono font-medium text-gray-800">#{orderRef}</span>.
            </p>
          </>
        )}

        {/* --- ACTIONS --- */}
        <div className="space-y-3">
          <Link 
            to="/my-bookings" 
            className="block w-full bg-blue-600 text-white font-semibold py-3.5 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            View Ticket & Orders
          </Link>
          
          {uiState === 'failed' && (
            <Link 
              to="/book" 
              className="block w-full bg-white border border-gray-200 text-gray-700 font-medium py-3.5 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Try Booking Again
            </Link>
          )}

          <Link 
            to="/" 
            className="block w-full text-gray-400 font-medium py-2 text-sm hover:text-gray-600 transition-colors"
          >
            Back to Home
          </Link>
        </div>

      </div>
    </div>
  );
}