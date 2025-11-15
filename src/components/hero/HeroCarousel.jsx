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
    <section id="hero" className="relative w-full overflow-hidden">
      {/* Bottom sentinel so navbar knows when hero ends */}
      <span id="hero-sentinel" className="pointer-events-none absolute bottom-0 left-0 h-px w-px" />

      {/* SWIPER */}
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
            "swiper-pagination-bullet !bg-white/80 hover:!bg-blue-400 !w-2.5 !h-2.5 !opacity-100 transition-all",
        }}
        className="
          h-[100vh]      /* full mobile height */
          sm:h-[80vh]
          md:h-[90vh]
          relative
        "
      >
        {banners.map((b, idx) => {
          const desktopImg = getWebImage(b, `https://picsum.photos/seed/banner${idx}/1400/700`);
          const mobileImg = getMobileImage(b, `https://picsum.photos/seed/banner${idx}-m/600/800`);
          const title = b?.title || b?.name || "";
          const href = deriveHref(b);

          return (
            <SwiperSlide key={b?.id || b?.banner_id || idx}>
              <div className="relative w-full h-full">
                {/* BACKGROUND IMAGE */}
                <div className="absolute inset-0" data-swiper-parallax="-20%">
                  <picture>
                    <source media="(max-width: 767px)" srcSet={mobileImg} />
                    <img
                      src={desktopImg}
                      alt={title || "Banner"}
                      className="
                        w-full h-full object-cover object-center
                        will-change-transform animate-kenburns
                        brightness-110 contrast-110 saturate-110
                      "
                      loading={idx === 0 ? "eager" : "lazy"}
                      fetchPriority={idx === 0 ? "high" : "auto"}
                      decoding="async"
                      sizes="100vw"
                    />
                  </picture>
                </div>

                {/* OVERLAY GRADIENT */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/25 to-transparent" />

                {/* TITLE BLOCK */}
                {title ? (
                  <div
                    className="absolute inset-x-0 bottom-24 text-center text-white px-4 z-10"
                    data-swiper-parallax="-200"
                  >
                    <h2 className="text-3xl sm:text-5xl font-extrabold mb-4 drop-shadow-2xl">
                      {title}
                    </h2>

                    {href ? (
                      <a
                        href={href}
                        className="
                          inline-flex items-center justify-center
                          mt-2 px-6 py-3
                          text-white text-base font-semibold
                          rounded-full
                          bg-white/10 backdrop-blur-md border border-white/30
                          hover:bg-white/20
                          shadow-xl transition-all
                          animate-cta
                        "
                      >
                        Explore Now →
                      </a>
                    ) : null}
                  </div>
                ) : null}

                {/* CLICKABLE WHOLE SLIDE (behind CTA) */}
                {href ? <a href={href} className="absolute inset-0 z-0" aria-label={title || "Banner"} /> : null}
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>

      {/* Layered wave footer blending into next section */}
      <div className="absolute -bottom-px inset-x-0 h-24 pointer-events-none z-[30]">
        {/* soft gradient merge */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to bottom, rgba(0,0,0,0) 0%, ${waveColor} 85%)`,
          }}
        />

        {/* Back wave */}
        <svg
          className="absolute bottom-0 left-0 w-full h-16 opacity-70 animate-wave-slow"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path
            fill={waveColor}
            d="
              M0,256
              C240,280 480,270 720,240
              C960,210 1200,150 1440,160
              V320H0Z
            "
          />
        </svg>

        {/* Front wave */}
        <svg
          className="absolute bottom-0 left-0 w-full h-18 animate-wave"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path
            fill={waveColor}
            d="
              M0,240
              C200,270 400,260 600,230
              C800,200 1000,140 1200,160
              C1350,180 1440,230 1440,260
              V320H0Z
            "
          />
        </svg>
      </div>

      {/* ANIMATIONS */}
      <style>{`
        /* Kenburns slow zoom */
        @keyframes kenburns {
          0% { transform: scale(1); }
          100% { transform: scale(1.08); }
        }
        .animate-kenburns {
          animation: kenburns 14s ease-out forwards;
        }

        /* CTA gentle float */
        @keyframes floatY {
          0% { transform: translateY(0); }
          50% { transform: translateY(2px); }
          100% { transform: translateY(0); }
        }
        .animate-cta {
          animation: floatY 3.5s ease-in-out infinite;
        }

    `}</style>
    </section>
  );
}