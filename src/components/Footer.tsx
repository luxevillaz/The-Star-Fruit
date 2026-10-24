"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef, useEffect, useState } from "react";

const WATERMARK = "LUXEVILLAZ".split("");

export default function Footer() {
  const footerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = footerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style>{`
        .wm-letter { 
          font-size: clamp(38px, 11.5vw, 220px); 
          letter-spacing: -0.06em;
        }
        @media (min-width: 768px) { 
          .wm-letter { 
            font-size: clamp(60px, 11vw, 150px); 
            letter-spacing: -0.04em;
          } 
        }
        @media (min-width: 1024px) { 
          .wm-letter { 
            font-size: clamp(80px, 18vw, 220px); 
            letter-spacing: -0.02em;
          } 
        }
      `}</style>
      <footer className="px-4 md:px-8 pb-8" ref={footerRef}>
        <div
          className="relative rounded-3xl overflow-hidden"
          style={{ background: '#1C1F26' }}
        >
          {/* Giant animated watermark */}
          <div
            className="absolute bottom-0 left-0 right-0 leading-none select-none pointer-events-none overflow-hidden flex justify-between w-full"
            aria-hidden="true"
          >
            {WATERMARK.map((letter, i) => (
              <span
                key={i}
                className="wm-letter font-black uppercase"
                style={{
                  lineHeight: 0.85,
                  color: 'rgba(255, 255, 255, 0.06)',
                  display: 'inline-block',
                  transform: inView ? 'translateY(0)' : 'translateY(60px)',
                  opacity: inView ? 1 : 0,
                  transition: `transform 0.8s cubic-bezier(0.22,1,0.36,1), opacity 0.8s ease`,
                  transitionDelay: `${i * 60}ms`,
                }}
              >
                {letter}
              </span>
            ))}
          </div>

          {/* Main content */}
          <div className="relative z-10 px-8 md:px-16 pt-36 pb-24 md:pb-44">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12 md:gap-16">

              {/* Column 1: Brand */}
              <div className="col-span-2 md:col-span-1 max-w-xs">
                <Link href="/" className="inline-block mb-5">
                  <Image
                    src="/images/footerlogo.webp"
                    alt="LuxeVillaz"
                    width={160}
                    height={40}
                    className="h-10 md:h-12 w-auto object-contain"
                    unoptimized />
                </Link>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Exceptional stays, thoughtfully curated since 2022. Luxury, privacy, and local charm in every destination.
                </p>
              </div>

              {/* Column 2: Quick Links */}
              <div className="col-span-1">
                <h3 className="text-[#EC5B13] font-bold text-sm uppercase tracking-wider mb-5">
                  Quick Links
                </h3>
                <ul className="space-y-3">
                  {[
                    { name: "Home", href: "/" },
                    { name: "Villas", href: "/stays?type=Villa" },
                    { name: "Cruise", href: "/stays?type=Cruise" },
                    { name: "Stays", href: "/stays?type=Hotel,Apartment" },
                    { name: "Become a Host", href: "/host" }
                  ].map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="text-gray-300 text-sm hover:text-white transition-colors font-medium"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Column 3: Support */}
              <div className="col-span-1">
                <h3 className="text-[#EC5B13] font-bold text-sm uppercase tracking-wider mb-5">
                  Support
                </h3>
                <ul className="space-y-3">
                  {[
                    { name: "Contact Us", href: "/#contact" },
                    { name: "FAQs", href: "/#faq" },
                    { name: "Blogs", href: "/blogs" },
                    { name: "Terms of Service", href: "#" },
                    { name: "Privacy Policy", href: "#" }
                  ].map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="text-gray-300 text-sm hover:text-white transition-colors font-medium"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Column 4: Follow Us */}
              <div className="col-span-2 md:col-span-1">
                <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-5">
                  Follow Us
                </h3>
                <div className="flex items-center gap-3 mb-8">
                  {/* Instagram */}
                  <a href="https://www.instagram.com/luxevillaz/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#EC5B13] transition-colors flex items-center justify-center group">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:scale-110"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
                  </a>
                  {/* YouTube */}
                  <a href="https://www.youtube.com/@luxevillaz" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#EC5B13] transition-colors flex items-center justify-center group">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:scale-110"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.94 2c1.71.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2c.46-1.71.46-5.58.46-5.58s0-3.87-.46-5.58z" /><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" /></svg>
                  </a>
                  {/* Gmail (Email) */}
                  <a href="mailto:luxevillaz@gmail.com" aria-label="Email" className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#EC5B13] transition-colors flex items-center justify-center group">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:scale-110"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                  </a>
                  {/* Facebook */}
                  <a href="https://www.facebook.com/luxevillaz/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#EC5B13] transition-colors flex items-center justify-center group">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:scale-110"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" /></svg>
                  </a>
                </div>

                <p className="text-gray-500 text-xs">
                  © 2022 Luxevillaz Managed by Nosh N Shots
                </p>
              </div>

            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
