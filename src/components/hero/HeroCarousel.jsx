import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";
import { imgSrc } from "../../utils/media";

export default function HeroCarousel({ banners = [] }) {
  if (!banners.length) return null;

  return (
    <section className="relative w-full overflow-hidden">
      <Swiper
        modules={[Autoplay, Pagination, EffectFade]}
        slidesPerView={1}
        loop
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        effect="fade"
        pagination={{
          clickable: true,
          bulletClass:
            "swiper-pagination-bullet !bg-white/80 hover:!bg-blue-400 transition-all",
        }}
        className="h-[65vh] sm:h-[75vh] md:h-[90vh]"
      >
        {banners.map((b, idx) => {
          const desktopImg =
            b?.image_web ||
            imgSrc(b, `https://picsum.photos/seed/banner${idx}/1400/700`);
          const mobileImg =
            b?.image_mobile ||
            imgSrc(b, `https://picsum.photos/seed/banner${idx}-m/600/800`);
          const title = b?.title || "";
          const link = b?.link_url || "#";

          return (
            <SwiperSlide key={b?.id || idx}>
              <div className="relative w-full h-full">
                {/* Responsive image switching */}
                <picture>
                  <source
                    media="(max-width:768px)"
                    srcSet={mobileImg}
                    type="image/webp"
                  />
                  <img
                    src={desktopImg}
                    alt={title}
                    className="w-full h-full object-cover object-center"
                    loading="lazy"
                  />
                </picture>

                {/* Stronger gradient for text contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />

                {/* Content */}
                {title && (
                  <div className="absolute inset-x-0 bottom-16 sm:bottom-20 text-center text-white px-4 z-10">
                    <h2 className="text-3xl sm:text-5xl font-extrabold mb-4 drop-shadow-xl animate-fade-up">
                      {title}
                    </h2>
                    {link && link !== "#" && (
                      <a
                        href={link}
                        className="inline-flex items-center justify-center mt-3 px-6 py-2.5 bg-blue-600 text-white font-medium rounded-full text-sm sm:text-base hover:bg-blue-700 transition-all duration-300 shadow-lg"
                      >
                        Know More →
                      </a>
                    )}
                  </div>
                )}
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </section>
  );
}
