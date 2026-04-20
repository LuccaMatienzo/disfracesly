import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function PublicNavbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#fafaeb]/90 backdrop-blur-md shadow-editorial'
          : 'bg-[#fafaeb]/75 backdrop-blur-sm'
      }`}
    >
      <div className="flex justify-between items-center px-6 md:px-10 py-4 max-w-screen-2xl mx-auto">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <img
            src="/logo_svg_verdelima.svg"
            alt="Disfracesly logo"
            className="h-16 w-auto object-contain"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <span className="font-headline text-4xl font-black text-[#fe7e4f] tracking-tight group-hover:opacity-80 transition-opacity">
            Disfracesly
          </span>
        </Link>
      </div>
    </nav>
  );
}
