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
          const uniqueKey = b?.banner_id ?? b?.id ?? b?.uuid ?? b?.slug ?? idx;

          return (
            <SwiperSlide key={uniqueKey}>
              <div className="relative w-full h-full">
                <div className="absolute inset-0" data-swiper-parallax="-20%">
                  <picture>
                    <source media="(max-width: 767px)" srcSet={mobileImg} />
                    <img
                      src={desktopImg}
                      alt={title || "Banner"}
                      className="w-full h-full object-cover object-center will-change-transform animate-kenburns"
                      loading={idx === 0 ? "eager" : "lazy"}
                      fetchPriority={idx === 0 ? "high" : "auto"}
                      decoding="async"
                      sizes="100vw"
                    />
                  </picture>
                </div>

                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/80" />

                <div
                  className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 sm:px-8 z-10 gap-4"
                  data-swiper-parallax="-200"
                >
                  {title ? (
                    <h2 className="text-yellow-300 text-3xl sm:text-4xl md:text-5xl font-black tracking-tight drop-shadow-xl animate-fade-title">
                      {title}
                    </h2>
                  ) : null}
                  {subtitle ? (
                    <p className="text-white/90 text-lg md:text-2xl max-w-3xl animate-fade-sub">{subtitle}</p>
                  ) : null}

                  {href ? (
                    <a
                      href={href}
                      className="inline-flex items-center gap-2 mt-4 px-6 py-3 rounded-full border border-white/40 bg-white/10 text-white text-sm md:text-base font-semibold hover:bg-white/20 transition-all backdrop-blur-lg shadow-[0_8px_30px_rgba(0,0,0,0.35)]"
                    >
                      Explore Now
                      <span aria-hidden="true">→</span>
                    </a>
                  ) : null}
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
      `}</style>
    </section>
  );
}
