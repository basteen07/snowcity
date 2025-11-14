import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../features/auth/authSlice";
import { getAttrId } from "../../utils/ids";
import Logo from "../../assets/images/Logo.webp";

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

export default function FloatingNavBar() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const attractions = useSelector((s) => s.attractions.items || []);
  const offers = useSelector((s) => s.offers.items || []);
  const combos = useSelector((s) => s.combos.items || []);
  const pages = useSelector((s) => s.pages.items || []);
  const user = useSelector((s) => s.auth?.user);
  const token = useSelector((s) => s.auth?.token);

  const [menuOpen, setMenuOpen] = React.useState(null); // 'attr' | 'offers' | 'guide' | null
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
  const topPromos = [...(combos || []), ...(offers || [])].slice(0, 6);
  const guidePages = pages.slice(0, 10);

  return (
    <nav className="fixed left-2 right-2 top-2 z-50" ref={navRef}>
      {/* Layered rounded container: background -> snowfall -> content */}
      <div className="relative mx-auto max-w-6xl">
        {/* Background layer */}
        <div className="absolute inset-0 z-0 rounded-full border border-white/20 bg-white/85 backdrop-blur-md shadow-lg" />
        {/* Snow layer (between bg and content) */}
        <div className="absolute inset-0 z-[1] pointer-events-none">
          <div className="snowfall-light absolute inset-0" />
        </div>

        {/* CONTENT */}
        <div className="relative z-[2] rounded-full">
          {/* DESKTOP: logo left, everything else right in same row */}
          <div className="hidden md:flex items-center justify-between px-5 h-14">
            {/* Left: logo */}
            <Link to="/" className="flex items-center gap-2">
              <img src={Logo} alt="SnowCity Logo" className="h-8 w-auto object-contain" width={510} height={135} decoding="async" />
            </Link>

            {/* Right: full menu */}
            <div className="flex items-center gap-2">
              <Link to="/" className="px-3 py-2 text-sm hover:text-blue-600">
                Home
              </Link>

              {/* Attractions */}
              <div className="relative">
                <button
                  className="px-3 py-2 text-sm hover:text-blue-600"
                  onClick={() => toggleMenu("attr")}
                  aria-expanded={menuOpen === "attr"}
                >
                  Attractions ▾
                </button>
                {menuOpen === "attr" && (
                  <div className="absolute right-0 top-full mt-2 w-60 rounded-xl border bg-white shadow-2xl p-2 z-50">
                    <div className="max-h-72 overflow-y-auto">
                      {topAttractions.map((a, idx) => {
                        const attrId = getAttrId(a);
                        const label = a?.name || a?.title || "Attraction";
                        const key = String(attrId || `${label}-${idx}`);
                        if (!attrId)
                          return (
                            <div key={key} className="block px-3 py-2 text-sm text-gray-400">
                              {label}
                            </div>
                          );
                        return (
                          <Link
                            key={key}
                            to={`/attractions/${attrId}`}
                            className="block px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
                            onClick={() => setMenuOpen(null)}
                          >
                            {label}
                          </Link>
                        );
                      })}
                      <Link
                        to="/attractions"
                        className="block px-3 py-2 text-blue-600 hover:bg-blue-50 text-sm font-medium rounded-md"
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
                  className="px-3 py-2 text-sm hover:text-blue-600"
                  onClick={() => toggleMenu("offers")}
                  aria-expanded={menuOpen === "offers"}
                >
                  Offers ▾
                </button>
                {menuOpen === "offers" && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border bg-white shadow-2xl p-2 z-50">
                    <Link
                      to="/offers"
                      className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                      onClick={() => setMenuOpen(null)}
                    >
                      All Offers
                    </Link>
                    <Link
                      to="/combos"
                      className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                      onClick={() => setMenuOpen(null)}
                    >
                      Combo Deals
                    </Link>
                    <div className="border-t my-2" />
                    {topPromos.map((x, i) => (
                      <div
                        key={`promo-${x?.id || x?.combo_id || x?.title || i}`}
                        className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                      >
                        {x.name || x.title}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Visitor Guide */}
              <div className="relative">
                <button
                  className="px-3 py-2 text-sm hover:text-blue-600"
                  onClick={() => toggleMenu("guide")}
                  aria-expanded={menuOpen === "guide"}
                >
                  Visitor Guide ▾
                </button>
                {menuOpen === "guide" && (
                  <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border bg-white shadow-2xl p-2 z-50">
                    <Link
                      to="/visitor-guide/pages"
                      className="block px-3 py-2 text-sm text-blue-600 font-medium hover:bg-blue-50 rounded-md"
                      onClick={() => setMenuOpen(null)}
                    >
                      Essential Visitor Pages →
                    </Link>
                    <Link
                      to="/visitor-guide/blogs"
                      className="block px-3 py-2 text-sm text-blue-600 font-medium hover:bg-blue-50 rounded-md"
                      onClick={() => setMenuOpen(null)}
                    >
                      Visitor Blogs & Stories →
                    </Link>
                    <Link
                      to="/gallery"
                      className="block px-3 py-2 text-sm text-blue-600 font-medium hover:bg-blue-50 rounded-md"
                      onClick={() => setMenuOpen(null)}
                    >
                      Gallery Highlights →
                    </Link>
                    <div className="border-t my-2" />
                    {guidePages.map((p, idx) => (
                      <Link
                        key={`page-${p?.slug || p?.id || idx}`}
                        to={`/page/${p.slug || p.id}`}
                        className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                        onClick={() => setMenuOpen(null)}
                      >
                        {p.title || p.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <Link to="/contact" className="px-3 py-2 text-sm hover:text-blue-600">
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
                    className="h-9 w-9 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-semibold"
                    onClick={() => setProfileOpen((v) => !v)}
                  >
                    {initial}
                  </button>
                  {profileOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border bg-white shadow-xl p-2 z-50">
                      <Link
                        to="/my-bookings"
                        className="block px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setProfileOpen(false)}
                      >
                        My Bookings
                      </Link>
                      <button
                        className="w-full text-left px-3 py-2 rounded-md text-sm text-red-600 hover:bg-gray-100"
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

          {/* MOBILE: 3-col header (menu | logo | profile), menu below */}
          <div className="md:hidden px-3 h-14 flex items-center justify-between">
            {/* Left: hamburger */}
            <button
              className="p-2 rounded-full hover:bg-gray-200"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menu"
            >
              {mobileOpen ? <span className="text-xl">✕</span> : <span className="text-xl">☰</span>}
            </button>

            {/* Center: logo */}
            <Link to="/" className="flex items-center gap-2">
              <img src={Logo} alt="SnowCity Logo" className="h-8 w-auto object-contain" width={510} height={135} decoding="async" />
            </Link>

            {/* Right: profile (no sign in on mobile) */}
            <div className="relative">
              {token ? (
                <>
                  <button
                    className="h-9 w-9 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-semibold"
                    onClick={() => setProfileOpen((v) => !v)}
                    aria-expanded={profileOpen}
                  >
                    {initial}
                  </button>
                  {profileOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border bg-white shadow-xl p-2 z-50">
                      <Link
                        to="/my-bookings"
                        className="block px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => {
                          setProfileOpen(false);
                          setMobileOpen(false);
                        }}
                      >
                        My Bookings
                      </Link>
                      <button
                        className="w-full text-left px-3 py-2 rounded-md text-sm text-red-600 hover:bg-gray-100"
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
                <div className="h-9 w-9" /> /* keep space aligned if not logged in */
              )}
            </div>
          </div>

          {/* Mobile Menu (accordion) */}
          {mobileOpen && (
            <div className="md:hidden bg-white border-t border-gray-200 shadow-md rounded-b-2xl px-4 py-3 space-y-2 animate-fade-down">
              <Link
                to="/"
                className="block py-2 text-gray-800 hover:text-blue-600"
                onClick={() => setMobileOpen(false)}
              >
                Home
              </Link>

              <details>
                <summary className="cursor-pointer py-2 text-gray-800 hover:text-blue-600">
                  Attractions
                </summary>
                <div className="pl-4">
                  {topAttractions.slice(0, 8).map((a, idx) => (
                    <Link
                      key={`m-attr-${getAttrId(a) || idx}`}
                      to={`/attractions/${getAttrId(a)}`}
                      className="block py-1 text-gray-700 hover:text-blue-600"
                      onClick={() => setMobileOpen(false)}
                    >
                      {a.name || a.title}
                    </Link>
                  ))}
                  <Link
                    to="/attractions"
                    className="block py-1 text-blue-600 hover:underline"
                    onClick={() => setMobileOpen(false)}
                  >
                    View All →
                  </Link>
                </div>
              </details>

              <details>
                <summary className="cursor-pointer py-2 text-gray-800 hover:text-blue-600">
                  Offers
                </summary>
                <div className="pl-4">
                  <Link
                    to="/offers"
                    className="block py-1 text-gray-700 hover:text-blue-600"
                    onClick={() => setMobileOpen(false)}
                  >
                    All Offers
                  </Link>
                  <Link
                    to="/combos"
                    className="block py-1 text-gray-700 hover:text-blue-600"
                    onClick={() => setMobileOpen(false)}
                  >
                    Combo Deals
                  </Link>
                </div>
              </details>

              <details>
                <summary className="cursor-pointer py-2 text-gray-800 hover:text-blue-600">
                  Visitor Guide
                </summary>
                <div className="pl-4 space-y-1">
                  <Link
                    to="/visitor-guide/pages"
                    className="block py-1 text-blue-600 hover:underline"
                    onClick={() => setMobileOpen(false)}
                  >
                    Essential Pages
                  </Link>
                  <Link
                    to="/visitor-guide/blogs"
                    className="block py-1 text-blue-600 hover:underline"
                    onClick={() => setMobileOpen(false)}
                  >
                    Blogs & Stories
                  </Link>
                  <Link
                    to="/gallery"
                    className="block py-1 text-blue-600 hover:underline"
                    onClick={() => setMobileOpen(false)}
                  >
                    Gallery
                  </Link>
                  <div className="border-t my-2" />
                  {guidePages.map((p, idx) => (
                    <Link
                      key={`m-page-${p?.slug || p?.id || idx}`}
                      to={`/page/${p.slug || p.id}`}
                      className="block py-1 text-gray-700 hover:text-blue-600"
                      onClick={() => setMobileOpen(false)}
                    >
                      {p.title || p.name}
                    </Link>
                  ))}
                </div>
              </details>

              <Link
                to="/contact"
                className="block py-2 text-gray-800 hover:text-blue-600"
                onClick={() => setMobileOpen(false)}
              >
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
        </div>
      </div>

      {/* Light snow CSS */}
      <style>{`
        .snowfall-light {
          --c1: rgba(255,255,255,0.85);
          --c2: rgba(255,255,255,0.6);
          --c3: rgba(255,255,255,0.4);
          background-image:
            radial-gradient(2px 2px at 20px 30px, var(--c1), transparent),
            radial-gradient(3px 3px at 100px 150px, var(--c2), transparent),
            radial-gradient(2px 2px at 200px 80px, var(--c3), transparent),
            radial-gradient(2px 2px at 300px 120px, var(--c2), transparent),
            radial-gradient(3px 3px at 250px 20px, var(--c1), transparent),
            radial-gradient(2px 2px at 150px 100px, var(--c3), transparent);
          background-size: 300px 300px;
          animation: snowFall 14s linear infinite;
          opacity: 0.8;
        }
        @keyframes snowFall {
          from { background-position: 0 0, 0 0, 0 0, 0 0, 0 0, 0 0; }
          to   { background-position: 0 900px, 0 600px, 0 750px, 0 500px, 0 800px, 0 650px; }
        }
      `}</style>
    </nav>
  );
}