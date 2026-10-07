'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FaPlay } from 'react-icons/fa';

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
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const touchSwiped = useRef(false);

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
      onTouchStart={(event) => {
        const touch = event.touches[0];
        touchStart.current = { x: touch.clientX, y: touch.clientY };
      }}
      onTouchEnd={(event) => {
        if (!touchStart.current) return;
        const touch = event.changedTouches[0];
        const deltaX = touch.clientX - touchStart.current.x;
        const deltaY = touch.clientY - touchStart.current.y;
        touchStart.current = null;

        if (Math.abs(deltaX) < 40 || Math.abs(deltaX) < Math.abs(deltaY) * 1.2) return;
        touchSwiped.current = true;
        move(deltaX < 0 ? 1 : -1);
        window.setTimeout(() => {
          touchSwiped.current = false;
        }, 300);
      }}
      className={`relative isolate h-[190px] touch-pan-y overflow-hidden bg-black [perspective:1400px] sm:h-[320px] lg:h-[390px] ${className}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(54, 69, 79, 0.32),transparent_68%)]" />

      {visibleSlides.map(({ slide, index, offset }) => {
        const distance = Math.abs(offset);
        const isActive = offset === 0;
        const sideOffset = distance === 1 ? 24 : distance === 2 ? 40 : 56;
        const scale = isActive ? 1 : 0.9 - distance * 0.04;
        const opacity = isActive ? 1 : 0.86 - distance * 0.04;
        const rotation = 24 + (distance - 1) * 8;

        return (
          <motion.button
            key={`${slide.title}-${index}`}
            type="button"
            aria-label={`${isActive ? 'Open' : 'Select'} ${slide.title}`}
            onClick={(event) => {
              if (touchSwiped.current) {
                event.preventDefault();
                return;
              }
              if (isActive) onActivate(slide);
              else onChange(index);
            }}
            className="absolute top-1/2 h-[82%] overflow-visible rounded-2xl sm:h-[88%] sm:rounded-3xl"
            initial={false}
            animate={{
              left: `${50 + Math.sign(offset) * sideOffset}%`,
              width: isActive ? 'min(78%, 760px)' : 'min(58%, 560px)',
              x: '-50%',
              y: '-50%',
              scale,
              opacity,
              rotateY: offset === 0 ? 0 : offset < 0 ? rotation : -rotation,
            }}
            transition={{ type: 'spring', stiffness: 110, damping: 24, mass: 1.1 }}
            style={{
              left: '50%',
              zIndex: 30 - distance,
              transformStyle: 'preserve-3d',
              transformOrigin: 'center center',
            }}
          >
            <span className="absolute inset-x-0 top-0 z-10 h-full overflow-hidden rounded-2xl bg-[#000000] shadow-[0_18px_50px_rgba(0, 0, 0, 0.65)] sm:rounded-3xl">
              <Image
                src={slide.image || '/featured5.jpg'}
                alt={slide.title}
                fill
                sizes="(max-width: 640px) 78vw, 760px"
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
              className="absolute left-0 right-0 top-[96%] h-[28%] scale-y-[-1] overflow-hidden rounded-2xl opacity-25 [mask-image:linear-gradient(to_bottom,rgba(0, 0, 0, 0.5),transparent)] sm:rounded-3xl"
            >
              <Image src={slide.image || '/featured5.jpg'} alt="" fill sizes="(max-width: 640px) 78vw, 760px" className="object-cover" />
            </span>
          </motion.button>
        );
      })}

      <div className="absolute inset-x-0 bottom-2 z-30 flex justify-center gap-1.5 sm:bottom-3">
        {slides.map((slide, index) => (
          <button
            key={`${slide.title}-dot-${index}`}
            type="button"
            aria-label={`Go to banner ${index + 1}`}
            aria-current={index === activeIndex}
            onClick={(event) => {
              if (touchSwiped.current) {
                event.preventDefault();
                return;
              }
              onChange(index);
            }}
            className={`h-1.5 rounded-full transition-all ${
              index === activeIndex ? 'w-6 bg-purple/60' : 'w-1.5 bg-white/40 hover:bg-white/70'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
