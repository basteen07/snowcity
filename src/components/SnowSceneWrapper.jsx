import React, { useEffect, useRef } from "react";

/**
 * SnowSceneWrapper
 * - Provides continuous cinematic gradient background
 * - Canvas-based wind-driven snow (efficient)
 * - Liquid SVG wave at bottom with smooth infinite horizontal motion
 * - Wrap any section content with <SnowSceneWrapper> ... </SnowSceneWrapper>
 *
 * Props:
 *  - children
 *  - waveHeight (px) default 90
 *  - canvasHeight (px) default 260 (controls visible snow area)
 */
export default function SnowSceneWrapper({
  children,
  waveHeight = 90,
  canvasHeight = 260,
}) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });

    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = canvasHeight);

    const maxSnow = Math.min(140, Math.floor(W / 8)); // density scales with width
    const flakes = new Array(maxSnow).fill(0).map(() => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: 1 + Math.random() * 3.5,
      vx: (Math.random() - 0.3) * 1.5, // horizontal wind
      vy: 0.6 + Math.random() * 1.8,
      tilt: Math.random() * Math.PI * 2,
      swing: 0.5 + Math.random() * 1.2,
    }));

    function draw() {
      ctx.clearRect(0, 0, W, H);

      // soft glow backdrop for snow (subtle)
      // ctx.fillStyle = "rgba(255,255,255,0.01)";
      // ctx.fillRect(0, 0, W, H);

      flakes.forEach((f) => {
        const { x, y, r } = f;
        // draw slightly blurred circle
        const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
        g.addColorStop(0, "rgba(255,255,255,0.95)");
        g.addColorStop(0.4, "rgba(255,255,255,0.85)");
        g.addColorStop(1, "rgba(255,255,255,0.02)");

        ctx.beginPath();
        ctx.fillStyle = g;
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      });

      update();
      rafRef.current = requestAnimationFrame(draw);
    }

    function update() {
      flakes.forEach((f) => {
        // wind (perlin-like by using sin of tilt)
        const wind = Math.sin(f.tilt) * f.swing * 0.6;
        f.x += f.vx + wind;
        f.y += f.vy;

        f.tilt += 0.01 + Math.random() * 0.02;

        // reset when out of range
        if (f.y > H + 20 || f.x < -40 || f.x > W + 40) {
          // respawn from top or side for continuous wind feeling
          if (Math.random() < 0.2) {
            f.x = Math.random() * W;
            f.y = -10 - Math.random() * 100;
          } else if (Math.random() < 0.5) {
            f.x = -20;
            f.y = Math.random() * H;
          } else {
            f.x = W + 20;
            f.y = Math.random() * H;
          }
          f.vx = (Math.random() - 0.3) * 1.6;
          f.vy = 0.6 + Math.random() * 1.8;
          f.r = 1 + Math.random() * 3.5;
        }
      });
    }

    function onResize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = canvasHeight;
    }

    window.addEventListener("resize", onResize);
    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, [canvasHeight]);

  // Liquid wave SVG — we animate translateX to create moving liquid feel.
  // Use the same SVG for each section so shapes align visually.
  const waveSVG = (
    <svg
      viewBox="0 0 1440 160"
      preserveAspectRatio="none"
      className="w-full h-full"
      aria-hidden
    >
      <defs>
        <linearGradient id="waveGrad" x1="0" x2="1">
          <stop offset="0" stopColor="#e8f6ff" stopOpacity="1" />
          <stop offset="0.5" stopColor="#d9f0ff" stopOpacity="1" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="1" />
        </linearGradient>
        <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g opacity="0.98" filter="url(#soft)">
        <path
          d="M0,52 C180,120 360,6 720,56 C1080,106 1260,20 1440,64 L1440,160 L0,160 Z"
          fill="url(#waveGrad)"
        />
      </g>
    </svg>
  );

  return (
    <div className="relative overflow-hidden">
      {/* background gradient (mixed) */}
      <div
        className="absolute inset-0 -z-20"
        style={{
          background:
            "linear-gradient(180deg, #071226 0%, #072f52 26%, #0d4b7a 48%, #cfeefd 100%)",
          opacity: 1,
        }}
      />

      {/* subtle vignette */}
      <div
        className="absolute inset-0 pointer-events-none -z-10"
        style={{
          background:
            "radial-gradient(60% 40% at 50% 10%, rgba(255,255,255,0.03), transparent 20%), linear-gradient(180deg, rgba(0,0,0,0.18), rgba(0,0,0,0.4))",
        }}
      />

      {/* canvas snow */}
      <canvas
        ref={canvasRef}
        className="absolute inset-x-0 left-0 right-0 top-0 z-0 pointer-events-none"
        style={{ height: `${canvasHeight}px` }}
      />

      {/* children content sits above snow */}
      <div className="relative z-10">{children}</div>

      {/* Wave wrapper — placed at bottom of wrapper, so stacking multiple wrappers creates a seam */}
      <div
        className="absolute left-0 right-0 -bottom-[1px] z-10 overflow-hidden"
        style={{ height: `${waveHeight}px` }}
      >
        {/* two copies of the same SVG slide to create continuous liquid motion */}
        <div
          className="wave-track"
          style={{
            display: "flex",
            width: "200%",
            transform: "translate3d(0,0,0)",
          }}
        >
          <div
            style={{
              width: "50%",
              flex: "0 0 50%",
            }}
            className="wave-item"
          >
            {waveSVG}
          </div>
          <div
            style={{
              width: "50%",
              flex: "0 0 50%",
            }}
            className="wave-item"
          >
            {waveSVG}
          </div>
        </div>

        {/* styles for wave animation and small top highlight */}
        <style>{`
          .wave-track { 
            animation: waveScroll 14s linear infinite;
            will-change: transform;
          }
          @keyframes waveScroll {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
          }

          /* subtle gloss line over wave for premium look */
          .wave-item svg path {
            mix-blend-mode: screen;
            opacity: 0.98;
          }

          /* Ensure wrapper doesn't block events */
          .wave-track, .wave-item { pointer-events: none; }
        `}</style>
      </div>
    </div>
  );
}
