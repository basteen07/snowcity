import React from 'react';

/**
 * Auto-scrolling marquee using requestAnimationFrame.
 * - Duplicates content to create an infinite scroll effect.
 */
export default function Marquee({ items = [], speed = 0.5, pauseOnHover = true }) {
  const ref = React.useRef(null);
  const animRef = React.useRef(null);
  const pausedRef = React.useRef(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const step = () => {
      if (!pausedRef.current) {
        el.scrollLeft += speed;
        if (el.scrollLeft >= el.scrollWidth / 2) {
          el.scrollLeft = 0;
        }
      }
      animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animRef.current);
  }, [speed, items.length]);

  return (
    <div
      ref={ref}
      className="relative w-full overflow-x-hidden whitespace-nowrap bg-blue-50 text-blue-700 py-3"
      onMouseEnter={() => { if (pauseOnHover) pausedRef.current = true; }}
      onMouseLeave={() => { if (pauseOnHover) pausedRef.current = false; }}
    >
      <div className="inline-block px-4">
        {items.concat(items).map((txt, i) => (
          <span key={i} className="mx-6 text-sm md:text-base font-medium">
            {txt}
          </span>
        ))}
      </div>
    </div>
  );
}