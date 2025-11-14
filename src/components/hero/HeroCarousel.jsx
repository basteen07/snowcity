import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, EffectFade, Parallax } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";
import { imgSrc } from "../../utils/media";

// Robust field getters so your API can use multiple names
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

// Link derivation: explicit link > attraction > offer > combo
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

export default function HeroCarousel({ banners = [] }) {
  if (!banners.length) return null;

  return (
    <section className="relative w-full overflow-hidden">
      <Swiper
        modules={[Autoplay, Pagination, EffectFade, Parallax]}
        slidesPerView={1}
        loop
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        effect="fade"
        parallax={true}
        speed={900}
        pagination={{
          clickable: true,
          bulletClass:
            "swiper-pagination-bullet !bg-white/90 hover:!bg-blue-500 !w-2.5 !h-2.5 !opacity-100 transition-all",
        }}
        className="h-[65vh] sm:h-[75vh] md:h-[90vh]"
      >
        {banners.map((b, idx) => {
          const desktopImg = getWebImage(
            b,
            `https://picsum.photos/seed/banner${idx}/1400/700`
          );
          const mobileImg = getMobileImage(
            b,
            `https://picsum.photos/seed/banner${idx}-m/600/800`
          );
          const title = b?.title || b?.name || "";
          const href = deriveHref(b);

          return (
            <SwiperSlide key={b?.id || b?.banner_id || idx}>
              <div className="relative w-full h-full">
                {/* Image layer with parallax + Ken Burns + boosted color */}
                <div
                  className="absolute inset-0"
                  data-swiper-parallax="-20%"
                  data-swiper-parallax-opacity="0.9"
                >
                  <picture>
                    {/* Mobile first */}
                    <source media="(max-width: 767px)" srcSet={mobileImg} />
                    {/* Default desktop */}
                    <img
                      src={desktopImg}
                      alt={title || "Banner"}
                      className="w-full h-full object-cover object-center will-change-transform animate-kenburns brightness-110 contrast-110 saturate-115"
                      loading={idx === 0 ? "eager" : "lazy"}
                      draggable="false"
                    />
                  </picture>
                </div>

                {/* Lighter gradient overlay (no faded look) */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/10 to-transparent pointer-events-none" />

                {/* Title/CTA layer with stronger drop-shadow for readability */}
                {title ? (
                  <div
                    className="absolute inset-x-0 bottom-14 sm:bottom-20 text-center text-white px-4 z-10"
                    data-swiper-parallax="-250"
                  >
                    <h2 className="text-3xl sm:text-5xl font-extrabold mb-3 [text-shadow:_0_2px_12px_rgba(0,0,0,0.55)] drop-shadow-2xl">
                      {title}
                    </h2>
                    {href ? (
                      <a
                        href={href}
                        className="inline-flex items-center justify-center mt-2 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-full text-sm sm:text-base hover:bg-blue-700 transition-all duration-300 shadow-xl [box-shadow:0_10px_24px_rgba(37,99,235,0.35)]"
                      >
                        Discover More →
                      </a>
                    ) : null}
                  </div>
                ) : null}

                {/* Make whole slide clickable if href exists */}
                {href ? (
                  <a
                    href={href}
                    aria-label={title || "View"}
                    className="absolute inset-0 z-0"
                  />
                ) : null}
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>

      {/* Ken Burns + extra styles */}
      <style>{`
        @keyframes kenburns {
          0%   { transform: scale(1) translate3d(0,0,0); }
          100% { transform: scale(1.08) translate3d(0,0,0); }
        }
        .animate-kenburns {
          animation: kenburns 14s ease-in-out infinite alternate;
        }
      `}</style>
    </section>
  );
}