'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { FaChevronLeft, FaChevronRight, FaPlay } from 'react-icons/fa';

interface HeroSlide {
  title: string;
  subtitle?: string;
  image: string;
  href?: string;
  primaryAction?: () => void;
}

interface HeroBannerCarouselProps {
  slides: HeroSlide[];
  activeIndex: number;
  onChange: (index: number) => void;
  onActivate: (slide: HeroSlide) => void;
  className?: string;
}

export default function HeroBannerCarousel({
  slides,
  activeIndex,
  onChange,
  onActivate,
  className = '',
}: HeroBannerCarouselProps) {
  if (slides.length === 0) return null;

  const move = (direction: number) => {
    onChange((activeIndex + direction + slides.length) % slides.length);
  };

  const visibleSlides = slides
    .map((slide, index) => {
      const rawOffset = index - activeIndex;
      const offset =
        rawOffset > slides.length / 2
          ? rawOffset - slides.length
          : rawOffset < -slides.length / 2
            ? rawOffset + slides.length
            : rawOffset;
      return { slide, index, offset };
    })
    .filter(({ offset }) => Math.abs(offset) <= 3);

  return (
    <section
      aria-label="Featured banners"
      className={`relative isolate h-[190px] overflow-hidden bg-black sm:h-[320px] lg:h-[390px] ${className}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(83,35,112,0.32),transparent_68%)]" />

      {visibleSlides.map(({ slide, index, offset }) => {
        const distance = Math.abs(offset);
        const isActive = offset === 0;
        const scale = distance === 0 ? 1 : distance === 1 ? 0.78 : distance === 2 ? 0.62 : 0.48;
        const opacity = distance === 0 ? 1 : distance === 1 ? 0.82 : distance === 2 ? 0.55 : 0.3;

        return (
          <motion.button
            key={`${slide.title}-${index}`}
            type="button"
            aria-label={`${isActive ? 'Open' : 'Select'} ${slide.title}`}
            onClick={() => (isActive ? onActivate(slide) : onChange(index))}
            className="absolute top-1/2 h-[88%] w-[64%] overflow-visible rounded-xl sm:w-[36%] sm:rounded-2xl"
            initial={false}
            animate={{
              x: '-50%',
              y: '-50%',
              scale,
              opacity,
            }}
            transition={{ type: 'spring', stiffness: 150, damping: 24 }}
            style={{ left: `calc(50% + ${offset * 22}%)`, zIndex: 20 - distance }}
          >
            <span className="absolute inset-x-0 top-0 z-10 h-full overflow-hidden rounded-xl bg-[#111] shadow-[0_18px_50px_rgba(0,0,0,0.65)] sm:rounded-2xl">
              <Image
                src={slide.image || '/featured5.jpg'}
                alt={slide.title}
                fill
                sizes="(max-width: 640px) 64vw, 36vw"
                className="object-cover"
                priority={distance === 0}
              />
              <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/5 to-black/10" />
              {isActive && (
                <>
                  <span className="absolute inset-x-4 bottom-5 z-10 text-left sm:inset-x-6 sm:bottom-7">
                    <span className="block truncate text-base font-bold text-white drop-shadow-lg sm:text-2xl">
                      {slide.title}
                    </span>
                    <span className="mt-1 block truncate text-xs text-white/75 sm:text-sm">
                      {slide.subtitle}
                    </span>
                  </span>
                  <span className="absolute left-1/2 top-1/2 z-10 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-black/25 text-white backdrop-blur-sm sm:h-14 sm:w-14">
                    <FaPlay className="ml-0.5 text-sm sm:text-base" />
                  </span>
                </>
              )}
            </span>
            <span
              aria-hidden="true"
              className="absolute left-0 right-0 top-[96%] h-[28%] scale-y-[-1] overflow-hidden rounded-xl opacity-25 [mask-image:linear-gradient(to_bottom,rgba(0,0,0,0.5),transparent)] sm:rounded-2xl"
            >
              <Image src={slide.image || '/featured5.jpg'} alt="" fill sizes="(max-width: 640px) 64vw, 36vw" className="object-cover" />
            </span>
          </motion.button>
        );
      })}

      <button
        type="button"
        aria-label="Previous banner"
        onClick={() => move(-1)}
        className="absolute left-2 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white transition hover:bg-purple-600 sm:left-5 sm:h-11 sm:w-11"
      >
        <FaChevronLeft />
      </button>
      <button
        type="button"
        aria-label="Next banner"
        onClick={() => move(1)}
        className="absolute right-2 top-1/2 z-30 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white transition hover:bg-purple-600 sm:right-5 sm:h-11 sm:w-11"
      >
        <FaChevronRight />
      </button>

      <div className="absolute inset-x-0 bottom-2 z-30 flex justify-center gap-1.5 sm:bottom-3">
        {slides.map((slide, index) => (
          <button
            key={`${slide.title}-dot-${index}`}
            type="button"
            aria-label={`Go to banner ${index + 1}`}
            aria-current={index === activeIndex}
            onClick={() => onChange(index)}
            className={`h-1.5 rounded-full transition-all ${
              index === activeIndex ? 'w-6 bg-purple-400' : 'w-1.5 bg-white/40 hover:bg-white/70'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
