import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center text-center px-4">
      <div>
        <div className="text-6xl font-bold text-gray-900">404</div>
        <p className="mt-2 text-gray-600">We couldn’t find the page you’re looking for.</p>
        <Link to="/" className="inline-flex mt-6 rounded-full bg-blue-600 text-white px-5 py-2">
          Go Home
        </Link>
      </div>
    </div>
  );
}