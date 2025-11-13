import React from 'react';

export default function InstagramFeed() {
  // Placeholder grid
  const items = Array.from({ length: 6 }).map((_, i) => `https://picsum.photos/seed/ig${i}/400/400`);
  return (
    <section className="py-10 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-xl md:text-2xl font-semibold mb-6">Instagram</h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {items.map((src, i) => (
            <img
              key={i}
              src={src}
              alt="Instagram"
              className="rounded-lg object-cover w-full h-24 md:h-32"
              loading="lazy"
            />
          ))}
        </div>
      </div>
    </section>
  );
}