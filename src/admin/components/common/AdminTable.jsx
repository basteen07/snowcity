import React from 'react';

export default function AdminTable({ columns = [], rows = [], keyField = 'id', empty = 'No data', onRowClick }) {
  return (
    <div className="overflow-x-auto rounded-lg border bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 dark:bg-neutral-800 text-gray-600 dark:text-neutral-300">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={`px-3 py-2 text-left ${c.thClass || ''}`}>{c.title}</th>
            ))}
          </tr>
        </thead>
        <tbody className="text-gray-800 dark:text-neutral-200">
          {rows.length ? rows.map((r, i) => (
            <tr
              key={r[keyField] ?? i}
              className="border-t border-gray-200 dark:border-neutral-800 hover:bg-gray-50 dark:hover:bg-neutral-800 cursor-pointer"
              onClick={() => onRowClick && onRowClick(r)}
            >
              {columns.map((c) => (
                <td key={c.key} className={`px-3 py-2 ${c.tdClass || ''}`}>{c.render ? c.render(r) : r[c.key]}</td>
              ))}
            </tr>
          )) : (
            <tr>
              <td className="px-3 py-6 text-center text-gray-500 dark:text-neutral-400" colSpan={columns.length}>
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}