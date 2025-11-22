import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, EffectFade, Parallax } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";
import { imgSrc } from "../../utils/media";

/* ---------------- HELPERS ---------------- */

const getWebImage = (b, fallback) =>
  imgSrc(
    b?.web_image ||
      b?.image_web ||
      b?.webImage ||
      b?.desktop_image ||
      b?.image_url ||
      b?.image ||
      fallback
  );

const getMobileImage = (b, fallback) =>
  imgSrc(
    b?.mobile_image ||
      b?.image_mobile ||
      b?.mobileImage ||
      b?.mobile ||
      b?.image_url_mobile ||
      fallback
  );

function deriveHref(b) {
  const link = b?.link_url || b?.url || b?.href;
  if (link && link !== "#") return link;

  const attSlug = b?.attraction_slug || b?.linked_attraction_slug || b?.attraction?.slug;
  const attId = b?.linked_attraction_id || b?.attraction_id || b?.attraction?.id;
  if (attSlug) return `/attractions/${attSlug}`;
  if (attId) return `/attractions/${attId}`;

  const offerSlug = b?.offer_slug || b?.linked_offer_slug;
  const offerId = b?.linked_offer_id || b?.offer_id;
  if (offerSlug) return `/offers/${offerSlug}`;
  if (offerId) return `/offers/${offerId}`;

  const comboId = b?.combo_id || b?.linked_combo_id;
  if (comboId) return `/combos/${comboId}`;

  return null;
}

/* ---------------- COMPONENT ---------------- */

export default function HeroCarousel({ banners = [], waveColor = "#0b1a33" }) {
  if (!banners.length) return null;

  return (
    <section id="hero" className="relative w-full overflow-hidden h-[80vh] min-h-[600px]">
      <span id="hero-sentinel" className="pointer-events-none absolute bottom-0 left-0 h-px w-px" />

      <Swiper
        modules={[Autoplay, Pagination, EffectFade, Parallax]}
        slidesPerView={1}
        loop
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        effect="fade"
        parallax
        speed={900}
        pagination={{
          clickable: true,
          bulletClass:
            "swiper-pagination-bullet !bg-white/50 !opacity-100 !w-2 !h-2 rounded-full",
          bulletActiveClass: "!bg-yellow-400 !w-8 transition-all",
        }}
        className="h-full"
      >
        {banners.map((b, idx) => {
          const desktopImg = getWebImage(b, `https://picsum.photos/seed/banner${idx}/1400/700`);
          const mobileImg = getMobileImage(b, `https://picsum.photos/seed/banner${idx}-m/600/800`);
          const title = b?.title || b?.name || "";
          const subtitle = b?.subtitle || b?.description || b?.caption || "";
          const href = deriveHref(b);
          const highlight = b?.tagline || b?.label || b?.category || "Everlasting Winter";
          const ctaText = b?.cta_text || "Book Your Snow Day";
          const uniqueKey = b?.banner_id ?? b?.id ?? b?.uuid ?? b?.slug ?? idx;
          const ticketButton = {
            label: ctaText,
            sub: b?.cta_subtitle || "Skip the queue & reserve",
            href: href || "/booking",
            accent: "from-amber-200 via-yellow-300 to-white",
            textClass: "text-slate-900",
          };

          return (
            <SwiperSlide key={uniqueKey}>
              <div className="relative w-full h-full">
                <div className="absolute inset-0" data-swiper-parallax="-20%">
                  <picture>
                    <source media="(max-width: 767px)" srcSet={mobileImg} />
                    <img
                      src={desktopImg}
                      alt={title || "Banner"}
                      className="w-full h-full object-cover object-center will-change-transform animate-kenburns brightness-[1.12] contrast-[1.18] saturate-125"
                      loading={idx === 0 ? "eager" : "lazy"}
                      fetchPriority={idx === 0 ? "high" : "auto"}
                      decoding="async"
                      sizes="100vw"
                    />
                  </picture>
                </div>

                <div className="absolute inset-0 bg-gradient-to-br from-[#020617]/85 via-[#0f172a]/45 to-transparent mix-blend-screen" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a]/80 via-transparent to-transparent" />

                <div
                  className="absolute inset-0 flex flex-col justify-center px-4 sm:px-10 z-10 text-left"
                  data-swiper-parallax="-200"
                >
                  <div className="max-w-4xl space-y-4">
                    <span className="text-xs sm:text-sm font-semibold tracking-[0.35em] uppercase text-white/75">
                      {highlight}
                    </span>
                    {title ? (
                      <h2 className="text-white text-3xl sm:text-5xl font-black leading-tight drop-shadow-[0_15px_35px_rgba(0,0,0,0.6)]">
                        {title}
                      </h2>
                    ) : null}
                    {subtitle ? (
                      <p className="text-white/80 text-base md:text-xl max-w-2xl">
                        {subtitle}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="absolute right-4 sm:right-10 bottom-8 sm:bottom-12 z-10" data-swiper-parallax="-350">
                  <a
                    key={`${uniqueKey}-ticket-primary`}
                    href={ticketButton.href}
                    className="book-ticket-btn"
                  >
                    <img
                      src="https://cdn-icons-png.flaticon.com/512/9068/9068678.png"
                      alt="ticket"
                      className="w-8 h-8"
                    />
                    <span>{ticketButton.label}</span>
                  </a>
                </div>

                {href ? (
                  <a href={href} className="absolute inset-0 z-0" aria-label={title || "Banner"} />
                ) : null}
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>


      <style>{`
        @keyframes kenburns {
          0% { transform: scale(1); }
          100% { transform: scale(1.06); }
        }
        .animate-kenburns {
          animation: kenburns 18s ease-out forwards;
        }
        .animate-fade-title {
          animation: fadeIn 1s ease-out forwards;
        }
        .animate-fade-sub {
          animation: fadeIn 1.3s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes floatTicket {
          0% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
          100% { transform: translateY(0); }
        }
        .book-ticket-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: linear-gradient(135deg, #ff48dc, #b23bff);
          color: #fff;
          padding: 0.65rem 1.1rem;
          border-radius: 999px;
          font-size: 0.9rem;
          font-weight: 700;
          box-shadow: 0 6px 16px rgba(178, 59, 255, 0.6);
          transition: all 0.25s ease;
          animation: floatTicket 3s ease-in-out infinite;
        }
        .book-ticket-btn img {
          filter: drop-shadow(0 3px 4px rgba(0,0,0,0.2));
        }
        .book-ticket-btn:hover {
          transform: scale(1.08) translateY(-3px);
          box-shadow: 0 10px 22px rgba(178, 59, 255, 0.7);
        }
        .book-ticket-btn:active {
          transform: scale(0.96);
        }
      `}</style>
    </section>
  );
}
