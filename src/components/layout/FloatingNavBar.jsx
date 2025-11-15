import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../features/auth/authSlice";
import { getAttrId } from "../../utils/ids";
import Logo from "../../assets/images/Logo.webp";

/* ---------------- HOOKS ---------------- */

function useClickOutside(ref, onOutside) {
  React.useEffect(() => {
    function handler(e) {
      if (!ref.current || ref.current.contains(e.target)) return;
      onOutside?.();
    }
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [ref, onOutside]);
}

// Transparent only while the hero sentinel is visible
function useHeroTransparent({ sentinelId = "hero-sentinel", fallbackOffset = 240 } = {}) {
  const [transparent, setTransparent] = React.useState(false);

  React.useEffect(() => {
    const el = document.getElementById(sentinelId);
    if (!el) {
      // Fallback: transparent at very top only
      const onScroll = () => setTransparent(window.scrollY < fallbackOffset);
      onScroll();
      window.addEventListener("scroll", onScroll);
      return () => window.removeEventListener("scroll", onScroll);
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        // If the bottom sentinel is still visible, stay transparent
        setTransparent(entry.isIntersecting);
      },
      {
        // Trigger a bit earlier before the hero completely leaves
        root: null,
        rootMargin: "-56px 0px 0px 0px", // account for navbar height
        threshold: 0,
      }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [sentinelId, fallbackOffset]);

  return transparent;
}

function useLockBodyScroll(lock) {
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    if (lock) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [lock]);
}

/* ---------------- COMPONENT ---------------- */

export default function FloatingNavBar() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const attractions = useSelector((s) => s.attractions.items || []);
  const offers = useSelector((s) => s.offers.items || []);
  const combos = useSelector((s) => s.combos.items || []);
  const pages = useSelector((s) => s.pages.items || []);
  const user = useSelector((s) => s.auth?.user);
  const token = useSelector((s) => s.auth?.token);

  const [menuOpen, setMenuOpen] = React.useState(null);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);

  const initial = (user?.name || user?.email || "U").trim().charAt(0).toUpperCase();

  const navRef = React.useRef(null);
  useClickOutside(navRef, () => {
    setMenuOpen(null);
    setProfileOpen(false);
  });

  React.useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const toggleMenu = (key) => setMenuOpen((cur) => (cur === key ? null : key));

  const topAttractions = attractions.slice(0, 12);
  const guidePages = pages.slice(0, 10);

  // Transparent only while hero sentinel is visible
  const transparent = useHeroTransparent({ sentinelId: "hero-sentinel", fallbackOffset: 240 });

  // Prevent background scroll when mobile menu is open
  useLockBodyScroll(mobileOpen);

  return (
    <nav
      ref={navRef}
      className="fixed left-2 right-2 top-2 z-[100] isolate transition-all duration-300"
    >
      {/* ------------------- DESKTOP NAV -------------------- */}
      <div
        className={`hidden md:flex items-center justify-between px-6 h-14 transition-all duration-300 ${
          transparent
            ? "bg-white/15 backdrop-blur-md border border-white/30 shadow-lg rounded-full text-white"
            : "bg-white/95 backdrop-blur-xl border border-gray-200 shadow-lg rounded-2xl text-gray-900"
        }`}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img
            src={Logo}
            alt="SnowCity Logo"
            className={`h-8 w-auto object-contain ${transparent ? "brightness-200" : "brightness-100"}`}
          />
        </Link>

        {/* MENU ITEMS */}
        <div className="flex items-center gap-2">
          <Link to="/" className="px-3 py-2 text-sm hover:text-blue-500">
            Home
          </Link>

          {/* Attractions */}
          <div className="relative">
            <button
              className="px-3 py-2 text-sm hover:text-blue-500"
              onClick={() => toggleMenu("attr")}
            >
              Attractions ▾
            </button>
            {menuOpen === "attr" && (
              <div className="absolute right-0 top-full mt-2 w-60 rounded-xl border bg-white text-gray-800 shadow-2xl p-2 z-[110]">
                <div className="max-h-72 overflow-y-auto">
                  {topAttractions.map((a, idx) => {
                    const attrId = getAttrId(a);
                    const label = a?.name || a?.title || "Attraction";
                    return (
                      <Link
                        key={idx}
                        to={`/attractions/${attrId}`}
                        className="block px-3 py-2 text-sm hover:bg-gray-100 rounded-md"
                        onClick={() => setMenuOpen(null)}
                      >
                        {label}
                      </Link>
                    );
                  })}
                  <Link
                    to="/attractions"
                    className="block px-3 py-2 text-blue-600 text-sm hover:bg-blue-50 rounded-md"
                    onClick={() => setMenuOpen(null)}
                  >
                    View All →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Offers */}
          <div className="relative">
            <button
              className="px-3 py-2 text-sm hover:text-blue-500"
              onClick={() => toggleMenu("offers")}
            >
              Offers ▾
            </button>
            {menuOpen === "offers" && (
              <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border bg-white text-gray-800 shadow-2xl p-2 z-[110]">
                <Link
                  to="/offers"
                  className="block px-3 py-2 text-sm hover:bg-gray-100 rounded-md"
                  onClick={() => setMenuOpen(null)}
                >
                  All Offers
                </Link>
                <Link
                  to="/combos"
                  className="block px-3 py-2 text-sm hover:bg-gray-100 rounded-md"
                  onClick={() => setMenuOpen(null)}
                >
                  Combo Deals
                </Link>
              </div>
            )}
          </div>

          {/* Visitor Guide */}
          <div className="relative">
            <button
              className="px-3 py-2 text-sm hover:text-blue-500"
              onClick={() => toggleMenu("guide")}
            >
              Visitor Guide ▾
            </button>
            {menuOpen === "guide" && (
              <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border bg-white text-gray-800 shadow-2xl p-2 z-[110]">
                {guidePages.map((p, idx) => (
                  <Link
                    key={idx}
                    to={`/page/${p.slug || p.id}`}
                    className="block px-3 py-2 text-sm hover:bg-gray-100 rounded-md"
                    onClick={() => setMenuOpen(null)}
                  >
                    {p.title || p.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <Link to="/contact" className="px-3 py-2 text-sm hover:text-blue-500">
            Contact Us
          </Link>

          <button
            className="inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-white text-sm hover:bg-blue-700"
            onClick={() => navigate("/booking")}
          >
            🎟️ Book Tickets
          </button>

          {token && (
            <div className="relative">
              <button
                className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold transition ${
                  transparent ? "bg-white/20 text-white" : "bg-gray-900 text-white"
                }`}
                onClick={() => setProfileOpen((v) => !v)}
              >
                {initial}
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl p-2 border z-[110]">
                  <Link
                    to="/my-bookings"
                    className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md text-sm"
                    onClick={() => setProfileOpen(false)}
                  >
                    My Bookings
                  </Link>

                  <button
                    className="w-full px-3 py-2 text-red-600 hover:bg-gray-100 rounded-md text-sm"
                    onClick={() => {
                      dispatch(logout());
                      setProfileOpen(false);
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ------------------- MOBILE NAV BAR -------------------- */}
      <div
        className={`md:hidden px-3 h-14 flex items-center justify-between transition-all ${
          transparent
            ? "bg-white/10 backdrop-blur-md border border-white/30 text-white rounded-full"
            : "bg-white/95 border border-gray-200 text-gray-900 rounded-2xl shadow"
        }`}
      >
        <button
          className={`p-2 rounded-full transition ${
            transparent ? "bg-white/10 text-white" : "bg-gray-200 text-gray-800"
          }`}
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
          aria-label="Open menu"
        >
          {mobileOpen ? "✕" : "☰"}
        </button>

        <Link to="/" aria-label="Home">
          <img
            src={Logo}
            alt="SnowCity Logo"
            className={`h-8 transition ${transparent ? "brightness-200" : "brightness-100"}`}
          />
        </Link>

        <div className="relative">
          {token ? (
            <>
              <button
                className={`h-9 w-9 rounded-full transition ${
                  transparent ? "bg-white/20 text-white" : "bg-gray-900 text-white"
                }`}
                onClick={() => setProfileOpen((v) => !v)}
                aria-expanded={profileOpen}
                aria-label="Account menu"
              >
                {initial}
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl p-2 border z-[110]">
                  <Link
                    to="/my-bookings"
                    className="block px-3 py-2 text-gray-700 text-sm hover:bg-gray-100 rounded-md"
                    onClick={() => {
                      setProfileOpen(false);
                      setMobileOpen(false);
                    }}
                  >
                    My Bookings
                  </Link>

                  <button
                    className="w-full px-3 py-2 text-red-600 hover:bg-gray-100 text-sm rounded-md"
                    onClick={() => {
                      dispatch(logout());
                      setProfileOpen(false);
                      setMobileOpen(false);
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="h-9 w-9" />
          )}
        </div>
      </div>

      {/* ------------------- MOBILE MENU PANEL -------------------- */}
      {mobileOpen && (
        <div
          className="
            md:hidden fixed left-2 right-2
            top-[4.25rem]   /* below the navbar */
            z-[120]
            bg-white border border-gray-200 shadow-xl rounded-2xl
            px-4 py-3 space-y-2
            max-h-[calc(100vh-6rem)] overflow-y-auto
          "
        >
          <Link to="/" className="block py-2 text-gray-800 hover:text-blue-600" onClick={() => setMobileOpen(false)}>
            Home
          </Link>

          <details>
            <summary className="cursor-pointer py-2 text-gray-800 hover:text-blue-600">Attractions</summary>
            <div className="pl-4 space-y-1">
              {topAttractions.slice(0, 8).map((a, idx) => (
                <Link
                  key={idx}
                  to={`/attractions/${getAttrId(a)}`}
                  className="block py-1 text-gray-700 hover:text-blue-600"
                  onClick={() => setMobileOpen(false)}
                >
                  {a.name || a.title}
                </Link>
              ))}
              <Link
                to="/attractions"
                className="block py-1 text-blue-600"
                onClick={() => setMobileOpen(false)}
              >
                View All →
              </Link>
            </div>
          </details>

          <details>
            <summary className="cursor-pointer py-2 text-gray-800 hover:text-blue-600">Offers</summary>
            <div className="pl-4 space-y-1">
              <Link to="/offers" className="block py-1 text-gray-700 hover:text-blue-600" onClick={() => setMobileOpen(false)}>
                All Offers
              </Link>
              <Link to="/combos" className="block py-1 text-gray-700 hover:text-blue-600" onClick={() => setMobileOpen(false)}>
                Combo Deals
              </Link>
            </div>
          </details>

          <details>
            <summary className="cursor-pointer py-2 text-gray-800 hover:text-blue-600">Visitor Guide</summary>
            <div className="pl-4 space-y-1">
              {guidePages.map((p, idx) => (
                <Link
                  key={idx}
                  to={`/page/${p.slug || p.id}`}
                  className="block py-1 text-gray-700 hover:text-blue-600"
                  onClick={() => setMobileOpen(false)}
                >
                  {p.title || p.name}
                </Link>
              ))}
            </div>
          </details>

          <Link to="/contact" className="block py-2 text-gray-800 hover:text-blue-600" onClick={() => setMobileOpen(false)}>
            Contact Us
          </Link>

          <button
            className="w-full py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
            onClick={() => {
              setMobileOpen(false);
              navigate("/booking");
            }}
          >
            🎟️ Book Tickets
          </button>
        </div>
      )}
    </nav>
  );
}