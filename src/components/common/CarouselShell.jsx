import React from 'react';
import { Swiper } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// Get effective slidesPerView for current width using the provided breakpoints
function useEffectiveSPV(defaultSpv, breakpoints) {
  const [spv, setSpv] = React.useState(defaultSpv);
  React.useEffect(() => {
    const calc = () => {
      const w = window.innerWidth || 1024;
      const keys = Object.keys(breakpoints || {}).map((k) => Number(k)).sort((a, b) => a - b);
      let eff = defaultSpv;
      for (const k of keys) {
        if (w >= k) eff = breakpoints[k]?.slidesPerView ?? eff;
      }
      setSpv(eff || defaultSpv);
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, [defaultSpv, breakpoints]);
  return spv;
}

export default function CarouselShell({
  children,
  className = '',
  autoplay = { delay: 3500, disableOnInteraction: false },
  loop = false,
  spaceBetween = 16,
  slidesPerView = 3,
  breakpoints = {
    0: { slidesPerView: 2, spaceBetween: 12 },
    768: { slidesPerView: 3, spaceBetween: 16 }
  },
  withNav = true,
  withPagination = false
}) {
  const count = React.Children.count(children);
  const effSpv = useEffectiveSPV(slidesPerView, breakpoints);

  // If not enough slides, disable loop and autoplay to avoid Swiper warnings
  const canLoop = loop && count > effSpv;
  const auto = canLoop ? autoplay : false;

  return (
    <Swiper
      className={className}
      modules={[Navigation, Pagination, Autoplay]}
      spaceBetween={spaceBetween}
      slidesPerView={slidesPerView}
      loop={canLoop}
      autoplay={auto}
      navigation={withNav}
      pagination={withPagination ? { clickable: true } : false}
      breakpoints={breakpoints}
    >
      {children}
    </Swiper>
  );
}