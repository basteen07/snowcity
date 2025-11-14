import React from 'react';

function getYouTubeId(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    // handle /embed/{id}
    const parts = u.pathname.split('/').filter(Boolean);
    const idx = parts.indexOf('embed');
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    // handle watch?v=
    const v = u.searchParams.get('v');
    return v || null;
  } catch {
    return null;
  }
}

export default function VideoBlock({ title = 'Experience Snowcity', src = 'https://www.youtube.com/embed/dQw4w9WgXcQ' }) {
  const [play, setPlay] = React.useState(false);
  const ytId = getYouTubeId(src);
  const poster = ytId ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` : null;
  const iframeSrc = play
    ? `${src}${src.includes('?') ? '&' : '?'}autoplay=1&rel=0`
    : undefined;

  return (
    <section className="py-10 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-xl md:text-2xl font-semibold mb-6">{title}</h2>
        <div className="aspect-video w-full rounded-2xl overflow-hidden shadow relative bg-black">
          {play ? (
            <iframe
              className="w-full h-full"
              src={iframeSrc}
              title="Snowcity Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <button
              type="button"
              className="absolute inset-0 w-full h-full group"
              onClick={() => setPlay(true)}
              aria-label="Play video"
            >
              {poster ? (
                <img
                  src={poster}
                  alt="Video preview"
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              ) : null}
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="h-16 w-16 rounded-full bg-white/90 text-red-600 shadow flex items-center justify-center">
                  ▶
                </span>
              </div>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}