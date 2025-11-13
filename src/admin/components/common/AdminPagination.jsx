import React from 'react';

export default function AdminPagination({ page = 1, totalPages = 1, onPage }) {
  if (totalPages <= 1) return null;
  const prev = () => onPage(Math.max(1, page - 1));
  const next = () => onPage(Math.min(totalPages, page + 1));
  return (
    <div className="mt-3 flex items-center gap-2">
      <button className="rounded-md border px-3 py-1 text-sm" onClick={prev} disabled={page <= 1}>Prev</button>
      <div className="text-sm text-gray-600">Page {page} of {totalPages}</div>
      <button className="rounded-md border px-3 py-1 text-sm" onClick={next} disabled={page >= totalPages}>Next</button>
    </div>
  );
}