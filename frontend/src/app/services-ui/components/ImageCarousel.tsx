'use client';

// Image carousel for the public service detail page. Renders a main slide
// with arrow + keyboard navigation, pagination dots, and an optional
// thumbnail strip below. Falls back to the placeholder background when no
// images are supplied so the layout never collapses.

import * as React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Keyboard, Navigation, Pagination, A11y } from 'swiper/modules';
import type { Swiper as SwiperInstance } from 'swiper';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export interface ImageCarouselProps {
  images: string[];
  alt?: string;
  height?: number;
  thumbnails?: boolean;
}

export function ImageCarousel({
  images, alt = '', height = 360, thumbnails = true,
}: ImageCarouselProps) {
  const [active, setActive] = React.useState(0);
  const swiperRef = React.useRef<SwiperInstance | null>(null);

  if (images.length === 0) {
    return (
      <div
        role="img"
        aria-label={alt || 'No image available'}
        style={{ height, borderRadius: 16, background: 'var(--bg-image-ph)' }}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        className="vj-carousel"
        style={{
          position: 'relative',
          borderRadius: 16,
          overflow: 'hidden',
          background: 'var(--bg-image-ph)',
        }}
      >
        <Swiper
          modules={[Navigation, Pagination, Keyboard, A11y]}
          navigation={images.length > 1}
          pagination={images.length > 1 ? { clickable: true } : false}
          keyboard={{ enabled: true }}
          a11y={{ enabled: true }}
          spaceBetween={0}
          slidesPerView={1}
          onSwiper={s => { swiperRef.current = s; }}
          onSlideChange={s => setActive(s.activeIndex)}
          style={{ height }}
        >
          {images.map((src, i) => (
            <SwiperSlide key={src}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={alt ? `${alt} (image ${i + 1} of ${images.length})` : `Image ${i + 1} of ${images.length}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {thumbnails && images.length > 1 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
            gap: 10,
            marginTop: 4,
          }}
        >
          {images.map((src, i) => {
            const isActive = i === active;
            return (
              <button
                key={src}
                type="button"
                onClick={() => swiperRef.current?.slideTo(i)}
                aria-label={`Show image ${i + 1}`}
                aria-current={isActive}
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '4 / 3',
                  borderRadius: 10,
                  overflow: 'hidden',
                  border: `2px solid ${isActive ? 'var(--brand, var(--client-primary))' : 'var(--border-2, transparent)'}`,
                  padding: 0,
                  cursor: 'pointer',
                  background: 'var(--bg-image-ph)',
                  transition: 'border-color 120ms var(--ease-out), transform 120ms var(--ease-out)',
                  outline: 'none',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                    opacity: isActive ? 1 : 0.85,
                    transition: 'opacity 120ms var(--ease-out)',
                  }}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
