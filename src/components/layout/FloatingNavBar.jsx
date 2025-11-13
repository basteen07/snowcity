import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../features/auth/authSlice";
import { getAttrId } from "../../utils/ids";
import Logo from "../../assets/images/Logo.webp";

export default function FloatingNavBar() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const attractions = useSelector((s) => s.attractions.items);
  const offers = useSelector((s) => s.offers.items);
  const combos = useSelector((s) => s.combos.items);
  const pages = useSelector((s) => s.pages.items);
  const user = useSelector((s) => s.auth?.user);
  const token = useSelector((s) => s.auth?.token);

  const [openMenu, setOpenMenu] = React.useState(null);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);

  const initial = (user?.name || user?.email || "U")
    .trim()
    .charAt(0)
    .toUpperCase();

  React.useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Keeps dropdown open while hovering inside
  const handleMouseEnter = (menu) => setOpenMenu(menu);
  const handleMouseLeave = () => setOpenMenu(null);

  return (
    <nav className="fixed left-2 right-2 top-2 z-50">
      <div className="rounded-full border border-white/20 bg-white/85 backdrop-blur-md shadow-lg mx-auto max-w-6xl">
        <div className="flex items-center justify-between px-3 md:px-5 h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img
              src={Logo}
              alt="SnowCity Logo"
              className="h-8 w-auto object-contain"
            />
           
          </Link>

          {/* Mobile Toggle */}
          <button
            className="md:hidden p-2 rounded-full hover:bg-gray-200"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
          >
            {mobileOpen ? (
              <span className="text-xl">✕</span>
            ) : (
              <span className="text-xl">☰</span>
            )}
          </button>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-2 relative">
            <Link to="/" className="px-3 py-2 text-sm hover:text-blue-600">
              Home
            </Link>

            {/* Attractions */}
            <div
              className="relative"
              onMouseEnter={() => handleMouseEnter("attr")}
              onMouseLeave={handleMouseLeave}
            >
              <button className="px-3 py-2 text-sm hover:text-blue-600">
                Attractions ▾
              </button>
              {openMenu === "attr" && (
                <div className="absolute left-0 top-full mt-2 w-60 rounded-xl border bg-white shadow-2xl p-2 z-50">
                  <div className="max-h-72 overflow-y-auto">
                    {attractions?.slice(0, 12).map((a, idx) => {
                      const attrId = getAttrId(a);
                      const label = a?.name || a?.title || "Attraction";
                      if (!attrId)
                        return (
                          <div
                            key={idx}
                            className="block px-3 py-2 text-sm text-gray-400"
                          >
                            {label}
                          </div>
                        );
                      return (
                        <div key={idx} className="relative group">
                          <Link
                            to={`/attractions/${attrId}`}
                            className="block px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-100"
                          >
                            {label}
                          </Link>

                          {/* Example nested sub-menu */}
                          {a.subAttractions && a.subAttractions.length > 0 && (
                            <div className="absolute left-full top-0 ml-1 hidden group-hover:block w-52 bg-white border shadow-lg rounded-lg p-2">
                              {a.subAttractions.map((sub, i) => (
                                <Link
                                  key={i}
                                  to={`/attractions/${getAttrId(sub)}`}
                                  className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                                >
                                  {sub.name || sub.title}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <Link
                      to="/attractions"
                      className="block px-3 py-2 text-blue-600 hover:bg-blue-50 text-sm font-medium rounded-md"
                    >
                      View All →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Offers */}
            <div
              className="relative"
              onMouseEnter={() => handleMouseEnter("offers")}
              onMouseLeave={handleMouseLeave}
            >
              <button className="px-3 py-2 text-sm hover:text-blue-600">
                Offers ▾
              </button>
              {openMenu === "offers" && (
                <div className="absolute left-0 top-full mt-2 w-56 rounded-xl border bg-white shadow-2xl p-2 z-50">
                  <Link
                    to="/offers"
                    className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    All Offers
                  </Link>
                  <Link
                    to="/combos"
                    className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                  >
                    Combo Deals
                  </Link>
                  <div className="border-t my-2" />
                  {[...(combos || []), ...(offers || [])]
                    .slice(0, 6)
                    .map((x, i) => (
                      <div
                        key={i}
                        className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                      >
                        {x.name || x.title}
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Visitor Guide */}
            <div
              className="relative"
              onMouseEnter={() => handleMouseEnter("guide")}
              onMouseLeave={handleMouseLeave}
            >
              <button className="px-3 py-2 text-sm hover:text-blue-600">
                Visitor Guide ▾
              </button>
              {openMenu === "guide" && (
                <div className="absolute left-0 top-full mt-2 w-64 rounded-xl border bg-white shadow-2xl p-2 z-50">
                  <Link
                    to="/visitor-guide/pages"
                    className="block px-3 py-2 text-sm text-blue-600 font-medium hover:bg-blue-50 rounded-md"
                  >
                    Essential Visitor Pages →
                  </Link>
                  <Link
                    to="/visitor-guide/blogs"
                    className="block px-3 py-2 text-sm text-blue-600 font-medium hover:bg-blue-50 rounded-md"
                  >
                    Visitor Blogs & Stories →
                  </Link>
                  <Link
                    to="/gallery"
                    className="block px-3 py-2 text-sm text-blue-600 font-medium hover:bg-blue-50 rounded-md"
                  >
                    Gallery Highlights →
                  </Link>
                  <div className="border-t my-2" />
                  {pages?.slice(0, 10).map((p, idx) => (
                    <Link
                      key={idx}
                      to={`/page/${p.slug || p.id}`}
                      className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
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
              className="ml-2 inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-white text-sm hover:bg-blue-700"
              onClick={() => navigate("/booking")}
            >
              🎟️ Book Tickets
            </button>

            {/* Profile */}
            {token && (
              <div className="relative ml-2">
                <button
                  className="h-9 w-9 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-semibold"
                  onClick={() => setProfileOpen((v) => !v)}
                >
                  {initial}
                </button>
                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border bg-white shadow-xl p-2">
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

        {/* Mobile Menu */}
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
                {attractions?.slice(0, 8).map((a, idx) => (
                  <Link
                    key={idx}
                    to={`/attractions/${getAttrId(a)}`}
                    className="block py-1 text-gray-700 hover:text-blue-600"
                    onClick={() => setMobileOpen(false)}
                  >
                    {a.name || a.title}
                  </Link>
                ))}
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
                {pages?.slice(0, 10).map((p, idx) => (
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
    </nav>
  );
}
