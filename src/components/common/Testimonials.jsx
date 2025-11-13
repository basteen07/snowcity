import React from 'react';

export default function Testimonials() {
  const items = [
    { name: 'Aarav', text: 'Amazing snow experience! Kids loved it.' },
    { name: 'Diya', text: 'Clean, safe, and super fun. Will visit again.' },
    { name: 'Rahul', text: 'Great staff and well organized slots.' }
  ];
  return (
    <section className="py-10 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-xl md:text-2xl font-semibold mb-6">What visitors say</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {items.map((t, idx) => (
            <div key={idx} className="rounded-xl border p-5 shadow-sm bg-white">
              <p className="text-gray-700">“{t.text}”</p>
              <div className="mt-3 text-sm text-gray-500">— {t.name}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}