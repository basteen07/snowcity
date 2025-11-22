import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout, setCredentials } from "../../features/auth/authSlice";
import api from "../../services/apiClient";
import endpoints from "../../services/endpoints";
import { getAttrId } from "../../utils/ids";
import Logo from "../../assets/images/Logo.webp";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COUNTRY_CODES = [
  { code: "+91", label: "India (+91)" },
  { code: "+1", label: "USA (+1)" },
  { code: "+971", label: "UAE (+971)" },
  { code: "+44", label: "UK (+44)" },
  { code: "+65", label: "Singapore (+65)" },
];

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
  const userName = (user?.name || user?.full_name || user?.email || 'Guest').trim();
  const userEmail = user?.email || 'Not provided';
  const userPhone = user?.phone || user?.mobile || 'Not provided';

  const [menuOpen, setMenuOpen] = React.useState(null);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [authModalOpen, setAuthModalOpen] = React.useState(false);
  const [authForm, setAuthForm] = React.useState({ name: "", email: "", phone: "" });
  const [authCountryCode, setAuthCountryCode] = React.useState("+91");
  const [authPhoneLocal, setAuthPhoneLocal] = React.useState("");
  const [authErrors, setAuthErrors] = React.useState({});
  const [authOtp, setAuthOtp] = React.useState({ sent: false, code: "", userId: null, debug: "", status: "idle", error: null });

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
  useLockBodyScroll(mobileOpen || authModalOpen);

  const navLinkBase = "px-3 py-2 rounded-full text-sm font-semibold tracking-wide transition-colors duration-200";
  const navLinkTone = transparent
    ? "text-white drop-shadow-[0_2px_14px_rgba(255,255,255,0.75)] hover:bg-white/15 hover:text-white"
    : "text-slate-800 hover:bg-slate-100";
  const navLinkClass = `${navLinkBase} ${navLinkTone}`;

  const signInButtonClass = transparent
    ? "inline-flex items-center rounded-full border border-white/70 px-4 py-2 text-white font-semibold shadow-[0_10px_30px_rgba(255,255,255,0.35)] hover:bg-white/15"
    : "inline-flex items-center rounded-full border border-blue-600 px-4 py-2 text-blue-600 font-semibold hover:bg-blue-50";

  const bookTicketButtonClass = `inline-flex items-center rounded-full px-5 py-2.5 text-sm font-semibold shadow-lg transition ${
    transparent
      ? 'bg-white text-slate-900 hover:bg-amber-50 shadow-[0_18px_45px_rgba(255,255,255,0.45)]'
      : 'bg-gray-900 text-white hover:bg-black'
  }`;

  const resetAuthState = React.useCallback(() => {
    setAuthForm({ name: "", email: "", phone: "" });
    setAuthCountryCode("+91");
    setAuthPhoneLocal("");
    setAuthErrors({});
    setAuthOtp({ sent: false, code: "", userId: null, debug: "", status: "idle", error: null });
  }, []);

  const openAuthModal = React.useCallback(() => {
    resetAuthState();
    setAuthModalOpen(true);
  }, [resetAuthState]);

  const closeAuthModal = React.useCallback(() => {
    setAuthModalOpen(false);
    resetAuthState();
  }, [resetAuthState]);

  const normalizePhone = (s = "") => s.replace(/[^\d+]/g, "");

  const combinedNavPhone = React.useMemo(() => {
    if (!authPhoneLocal) return "";
    return `${authCountryCode}${authPhoneLocal}`;
  }, [authCountryCode, authPhoneLocal]);

  const handleAuthPhoneChange = React.useCallback((value) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    setAuthPhoneLocal(digits);
    setAuthErrors((prev) => ({ ...prev, phone: undefined }));
  }, []);

  const sendNavOtp = React.useCallback(async () => {
    const name = authForm.name.trim() || "Guest";
    const email = authForm.email.trim();
    const errors = {};
    if (!EMAIL_REGEX.test(email)) {
      errors.email = "Enter a valid email";
    }
    if (authPhoneLocal.length !== 10) {
      errors.phone = "Enter 10 digit mobile number";
    }
    if (Object.keys(errors).length) {
      setAuthErrors(errors);
      setAuthOtp((prev) => ({ ...prev, error: null }));
      return;
    }
    const phone = normalizePhone(combinedNavPhone);
    try {
      setAuthOtp((prev) => ({ ...prev, status: "sending", error: null }));
      const payload = {
        name,
        channel: "sms",
        createIfNotExists: true,
      };
      if (email) payload.email = email;
      if (phone) payload.phone = phone;
      const res = await api.post(endpoints.auth.otpSend(), payload);
      setAuthOtp({
        sent: true,
        code: res?.otp || "",
        userId: res?.user_id || null,
        debug: res?.otp || "",
        status: "sent",
        error: null,
      });
    } catch (err) {
      setAuthOtp((prev) => ({ ...prev, status: "idle", error: err?.message || "Failed to send OTP" }));
    }
  }, [authForm]);

  const verifyNavOtp = React.useCallback(async () => {
    const code = (authOtp.code || "").trim();
    if (!code) {
      setAuthOtp((prev) => ({ ...prev, error: "Enter OTP" }));
      return;
    }
    try {
      setAuthOtp((prev) => ({ ...prev, status: "verifying", error: null }));
      const payload = { otp: code };
      if (authOtp.userId) payload.user_id = authOtp.userId;
      const email = authForm.email.trim();
      const phone = normalizePhone(combinedNavPhone);
      if (!authOtp.userId) {
        if (email) payload.email = email;
        if (phone) payload.phone = phone;
      }
      const res = await api.post(endpoints.auth.otpVerify(), payload);
      if (res?.token) {
        dispatch(setCredentials({ user: res.user || null, token: res.token, expires_at: res?.expires_at || null }));
        closeAuthModal();
      } else {
        setAuthOtp((prev) => ({ ...prev, status: "idle", error: "Verification failed" }));
      }
    } catch (err) {
      setAuthOtp((prev) => ({ ...prev, status: "idle", error: err?.message || "OTP verification failed" }));
    }
  }, [authOtp, authForm, closeAuthModal, dispatch]);

  const authModal = authModalOpen ? (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={closeAuthModal} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 z-[140] max-h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Sign in to SnowCity</h3>
          <button className="p-2 rounded-full bg-gray-100 text-gray-500" onClick={closeAuthModal}>
            ✕
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Enter your details once. We&apos;ll create or find your profile and send an OTP (testing code 123456).
        </p>
        <div className="space-y-3">
          <input
            className="w-full p-3 rounded-xl border border-gray-200 focus:border-blue-500 outline-none"
            placeholder="Full Name"
            value={authForm.name}
            onChange={(e) => setAuthForm((prev) => ({ ...prev, name: e.target.value }))}
          />
          <input
            className={`w-full p-3 rounded-xl border focus:border-blue-500 outline-none ${
              authErrors?.email ? "border-red-300" : "border-gray-200"
            }`}
            placeholder="Email"
            type="email"
            value={authForm.email}
            onChange={(e) => {
              setAuthForm((prev) => ({ ...prev, email: e.target.value }));
              if (authErrors.email) setAuthErrors((prev) => ({ ...prev, email: undefined }));
            }}
          />
          {authErrors.email && (
            <p className="text-xs text-red-500">{authErrors.email}</p>
          )}
          <div className="flex gap-3">
            <div className="relative w-32">
              <select
                className="w-full pl-3 pr-8 p-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-blue-500 outline-none appearance-none text-sm font-medium"
                value={authCountryCode}
                onChange={(e) => setAuthCountryCode(e.target.value)}
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">▾</span>
            </div>
            <input
              className={`flex-1 p-3 rounded-xl border focus:border-blue-500 outline-none tracking-wide ${
                authErrors?.phone ? "border-red-300" : "border-gray-200"
              }`}
              placeholder="98765 43210"
              type="tel"
              maxLength={10}
              value={authPhoneLocal}
              onChange={(e) => handleAuthPhoneChange(e.target.value)}
            />
          </div>
          {authErrors.phone && <p className="text-xs text-red-500">{authErrors.phone}</p>}
          <button
            className="w-full py-3 rounded-xl bg-gray-900 text-white font-semibold hover:bg-black disabled:opacity-60"
            onClick={sendNavOtp}
            disabled={authOtp.status === "sending"}
          >
            {authOtp.status === "sending" ? "Sending..." : authOtp.sent ? "Resend OTP" : "Send OTP"}
          </button>
          {authOtp.sent && (
            <div className="flex gap-3 items-center">
              <input
                className="flex-1 p-3 rounded-xl border border-blue-200 focus:border-blue-500 outline-none text-center tracking-widest font-mono"
                maxLength={6}
                value={authOtp.code}
                onChange={(e) => setAuthOtp((prev) => ({ ...prev, code: e.target.value }))}
              />
              <button
                className="px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700"
                onClick={verifyNavOtp}
                disabled={authOtp.status === "verifying"}
              >
                {authOtp.status === "verifying" ? "Verifying..." : "Verify"}
              </button>
            </div>
          )}
          {authOtp.debug && (
            <div className="text-xs text-green-700 bg-green-50 border border-green-100 rounded-xl p-2">
              Testing OTP: <span className="font-mono font-semibold">{authOtp.debug}</span>
            </div>
          )}
          {authOtp.error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl p-2">
              {authOtp.error}
            </div>
          )}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <nav
        ref={navRef}
        className="fixed top-4 left-1/2 -translate-x-1/2 w-[94%] max-w-[1400px] z-[120] transition-all duration-300"
      >
      {/* ------------------- DESKTOP NAV -------------------- */}
      <div
        className={`hidden md:flex items-center justify-between gap-6 px-8 py-4 border rounded-[30px] shadow-2xl transition-all duration-300 ${
          transparent
            ? "bg-transparent border-transparent text-white shadow-none"
            : "bg-white text-gray-900 border-gray-200 backdrop-blur-xl"
        }`}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img
            src={Logo}
            alt="SnowCity Logo"
            className={`h-8 w-auto object-contain ${transparent ? "brightness-200" : "brightness-125"}`}
          />
        </Link>

        {/* MENU ITEMS */}
        <div className="flex items-center gap-3 text-sm font-medium">
          <Link to="/" className={navLinkClass}>
            Home
          </Link>

          {/* Attractions */}
          <div className="relative">
            <button
              className={navLinkClass}
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
              className={navLinkClass}
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
              className={navLinkClass}
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

          <Link to="/contact" className={navLinkClass}>
            Contact Us
          </Link>
          <Link to="/blogs" className={navLinkClass}>
            Blogs
          </Link>

          {!token && (
            <button
              className={signInButtonClass}
              onClick={openAuthModal}
            >
              🔐 Sign In
            </button>
          )}
          <button
            className={bookTicketButtonClass}
            onClick={() => navigate("/booking")}
          >
            🎟️ Book Tickets
          </button>

          {token && (
            <div className="relative">
              <button
                className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold transition ${
                  transparent ? "bg-white/25 text-white shadow-[0_8px_24px_rgba(255,255,255,0.35)]" : "bg-gray-900 text-white"
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
                  <div className="px-3 py-2 rounded-md bg-gray-50 border border-gray-100 text-xs text-gray-600">
                    <p className="font-semibold text-gray-700 text-sm mb-1">Settings</p>
                    <p className="leading-tight"><span className="font-medium">Name:</span> {userName || 'Guest'}</p>
                    <p className="leading-tight"><span className="font-medium">Phone:</span> {userPhone}</p>
                    <p className="leading-tight"><span className="font-medium">Email:</span> {userEmail}</p>
                  </div>

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
        className={`md:hidden px-4 py-3 flex items-center justify-between rounded-[26px] border transition-all ${
          transparent
            ? "bg-transparent border-transparent text-white shadow-none"
            : "bg-white border-gray-200 text-gray-900 shadow-lg"
        }`}
      >
        <button
          className={`p-2 rounded-full transition ${
            transparent ? "bg-transparent text-white" : "bg-gray-200 text-gray-800"
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
            className={`h-8 transition ${transparent ? "brightness-200" : "brightness-125"}`}
          />
        </Link>

        <div className="relative">
          {token ? (
            <>
              <button
                className={`h-9 w-9 rounded-full transition ${
                  transparent ? "bg-white/25 text-white shadow-[0_8px_24px_rgba(255,255,255,0.35)]" : "bg-gray-900 text-white"
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
                  <div className="px-3 py-2 mt-1 rounded-md bg-gray-50 border border-gray-100 text-xs text-gray-600">
                    <p className="font-semibold text-gray-700 text-sm mb-1">Settings</p>
                    <p className="leading-tight"><span className="font-medium">Name:</span> {userName || 'Guest'}</p>
                    <p className="leading-tight"><span className="font-medium">Phone:</span> {userPhone}</p>
                    <p className="leading-tight"><span className="font-medium">Email:</span> {userEmail}</p>
                  </div>

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
            top-[4.25rem]
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
          <Link to="/blogs" className="block py-2 text-gray-800 hover:text-blue-600" onClick={() => setMobileOpen(false)}>
            Blogs
          </Link>

          {!token && (
            <button
              className="w-full py-2 border border-blue-600 text-blue-600 rounded-full hover:bg-blue-50"
              onClick={() => {
                setMobileOpen(false);
                openAuthModal();
              }}
            >
              🔐 Sign In
            </button>
          )}
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
      {authModal}
    </>
  );
}