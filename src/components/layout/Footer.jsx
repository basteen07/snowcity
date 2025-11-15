import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Logo from "../../assets/images/Logo.webp";
import Snowman from "../../assets/images/loading.png"; // ✅ Your snowman

export default function Footer() {
  const canvasRef = useRef(null);

  /** REALISTIC WIND-DRIVEN SNOW (Canvas High FPS) */
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = 260);

    const maxSnow = 90;
    const flakes = [];

    for (let i = 0; i < maxSnow; i++) {
      flakes.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 1 + Math.random() * 3,
        d: Math.random() + 1,
        speedX: 0.5 + Math.random() * 1.5, // wind
        speedY: 0.8 + Math.random() * 1.6, // gravity
      });
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "white";

      flakes.forEach((f) => {
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      });

      update();
    }

    function update() {
      flakes.forEach((f) => {
        // wind + fall
        f.x += f.speedX;
        f.y += f.speedY;

        // sway motion
        f.x += Math.sin(f.y * 0.02) * 0.4;

        // reset when leaving screen
        if (f.y > H || f.x > W + 20) {
          f.x = Math.random() * W;
          f.y = -10;
        }
      });
    }

    function loop() {
      draw();
      requestAnimationFrame(loop);
    }

    loop();

    window.addEventListener("resize", () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = 260;
    });
  }, []);

  return (
    <footer className="relative bg-gradient-to-b from-[#04111d] via-[#06131b] to-[#00060a] text-gray-300 mt-10 overflow-hidden">

      {/* Wave Top Border */}
      <div className="absolute -top-[2px] left-0 right-0 z-10 pointer-events-none">
        <svg
          viewBox="0 0 1440 120"
          className="w-full h-[80px] animate-waveSlow opacity-30"
          preserveAspectRatio="none"
        >
          <path
            d="M0,40 C240,120 480,0 720,50 C960,100 1200,20 1440,60 L1440,0 L0,0 Z"
            fill="white"
          />
        </svg>
      </div>

      {/* Canvas Snow */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-[260px] z-10 pointer-events-none"
      ></canvas>

      {/* Snowman (Your PNG) */}
      <div className="absolute right-4 bottom-6 z-20">
        <img
          src={Snowman}
          alt="Snowman"
          className="w-24 h-auto drop-shadow-lg animate-floatSnowman"
        />
      </div>

      {/* FOOTER CONTENT */}
      <div className="relative z-30 max-w-6xl mx-auto px-5 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <img src={Logo} alt="SnowCity" className="h-12 w-auto object-contain" />
            </div>
            <p className="text-gray-300/80 text-sm leading-relaxed max-w-sm">
              Experience the magic of snow and fun in the city’s coolest attraction.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Explore</h4>
            <ul className="space-y-2 text-sm text-gray-300/85">
              <li><Link to="/" className="hover:text-white">Home</Link></li>
              <li><Link to="/attractions" className="hover:text-white">Attractions</Link></li>
              <li><Link to="/offers" className="hover:text-white">Offers</Link></li>
              <li><Link to="/booking" className="hover:text-white">Book Tickets</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Visitor Guide</h4>
            <ul className="space-y-2 text-sm text-gray-300/85">
              <li><Link to="/page/faq" className="hover:text-white">FAQs</Link></li>
              <li><Link to="/page/safety" className="hover:text-white">Safety Rules</Link></li>
              <li><Link to="/page/dresscode" className="hover:text-white">Dress Code</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Information</h4>
            <ul className="space-y-2 text-sm text-gray-300/85">
              <li><Link to="/page/about-us" className="hover:text-white">About Us</Link></li>
              <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
              <li><Link to="/page/privacy-policy" className="hover:text-white">Privacy Policy</Link></li>
              <li><Link to="/page/terms-and-conditions" className="hover:text-white">Terms & Conditions</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between text-sm text-gray-400">
          <div>© {new Date().getFullYear()} SnowCity. All rights reserved.</div>
          <div className="flex gap-4 mt-3 md:mt-0">
            <Link to="/page/privacy-policy" className="hover:text-white">Privacy</Link>
            <Link to="/page/terms-and-conditions" className="hover:text-white">Terms</Link>
          </div>
        </div>
      </div>

      {/* EXTRA STYLES */}
      <style>{`
        /* Wave animation */
        @keyframes waveMove {
          0% { transform: translateX(0); }
          100% { transform: translateX(-8%); }
        }
        .animate-waveSlow {
          animation: waveMove 12s linear infinite;
        }

        /* Snowman float */
        @keyframes floatSnow {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .animate-floatSnowman {
          animation: floatSnow 4s ease-in-out infinite;
        }
      `}</style>
    </footer>
  );
}
