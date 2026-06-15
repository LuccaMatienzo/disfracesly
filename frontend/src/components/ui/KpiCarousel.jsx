import { useState, useRef, Children } from 'react';

export default function KpiCarousel({ children, className = '' }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef(null);

  const arrayChildren = Children.toArray(children).filter(Boolean);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    // Calculate index based on scroll position
    const index = Math.round(scrollLeft / clientWidth);
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  return (
    <>
      <style>{`
        .hide-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      
      {/* ── Vista Desktop (Grid Normal) ─────────────────────────── */}
      <div className={`hidden sm:grid ${className}`}>
        {arrayChildren}
      </div>

      {/* ── Vista Mobile (Carousel) ─────────────────────────────── */}
      <div className="sm:hidden relative w-full mb-6">
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory hide-scroll w-full gap-4 pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {arrayChildren.map((child, i) => (
            <div key={i} className="w-full h-[144px] shrink-0 snap-center relative">
              {child}
            </div>
          ))}
        </div>

        {/* ── Dots ───────────────────────── */}
        {arrayChildren.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none">
            {arrayChildren.map((_, i) => (
              <div 
                key={i} 
                className={`transition-all duration-300 rounded-full ${i === activeIndex ? 'bg-primary size-2' : 'border border-primary/50 bg-transparent size-2'}`} 
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
