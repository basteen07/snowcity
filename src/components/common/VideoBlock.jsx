import React from 'react';

export default function VideoBlock({ title = 'Experience Snowcity', src = 'https://www.youtube.com/embed/dQw4w9WgXcQ' }) {
  return (
    <section className="py-10 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-xl md:text-2xl font-semibold mb-6">{title}</h2>
        <div className="aspect-video w-full rounded-2xl overflow-hidden shadow">
          <iframe
            className="w-full h-full"
            src={src}
            title="Snowcity Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </section>
  );
}