import React from 'react';

export default function ErrorState({ message = 'Something went wrong', onRetry }) {
  return (
    <div className="w-full py-8 text-center">
      <p className="text-sm text-red-600">{typeof message === 'string' ? message : 'Error'}</p>
      {onRetry ? (
        <button
          onClick={onRetry}
          className="mt-3 inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-white text-sm hover:bg-blue-700"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}