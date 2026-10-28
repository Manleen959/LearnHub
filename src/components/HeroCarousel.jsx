import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const slides = [
  {
    id: 1,
    title: "Skills that drive you forward",
    description:
      "Technology and the world of work change fast — with LearnHub, you're faster. Gain top tier skills in AI, Web Development, Cloud & Management.",
    buttonText: "Explore Courses",
    buttonLink: "#courses",
    badge: "Trending in 2026",
    image:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=80",
    alt: "Students learning and collaborating together",
  },
  {
    id: 2,
    title: "Unlock your career potential with certified training",
    description:
      "Study real-world case studies designed by industry leaders. Learn at your own pace with lifetime access and verified certificates.",
    buttonText: "Start Learning Today",
    buttonLink: "/signup",
    badge: "New Courses Added",
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1600&q=80",
    alt: "Online learning laptop technology",
  },
  {
    id: 3,
    title: "Inspire millions. Become an instructor today.",
    description:
      "Share your passion, build your student community, and earn revenue by publishing digital courses on LearnHub.",
    buttonText: "Teach on LearnHub",
    buttonLink: "/signup",
    badge: "For Educators",
    image:
      "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1600&q=80",
    alt: "Educator teaching and presenting",
  },
];

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);

  const prevSlide = () => {
    setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 7000);
    return () => clearInterval(timer);
  }, [current]);

  const slide = slides[current];

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 sm:mt-6">
      <div className="relative h-[420px] sm:h-[460px] md:h-[480px] rounded-2xl overflow-hidden shadow-lg bg-gray-900 group">
        
        {/* Background Image with subtle smooth transition */}
        <img
          key={slide.id}
          src={slide.image}
          alt={slide.alt}
          className="w-full h-full object-cover object-center brightness-95 animate-fadeIn transition-all duration-700"
        />

        {/* Gradient overlay for contrast on smaller screens */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent sm:from-transparent"></div>

        {/* Floating White Card Overlaid on the Left (Udemy Signature style) */}
        <div className="absolute top-1/2 -translate-y-1/2 left-4 sm:left-10 md:left-14 max-w-lg bg-white/95 backdrop-blur-md p-6 sm:p-8 rounded-xl shadow-2xl border border-white/60">
          <div className="inline-block px-3 py-1 bg-purple-100 text-[#5624d0] font-bold text-xs uppercase tracking-wider rounded-full mb-3">
            {slide.badge}
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight mb-3">
            {slide.title}
          </h1>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-6">
            {slide.description}
          </p>
          <div className="flex items-center gap-3">
            <Link
              to={slide.buttonLink}
              className="inline-flex items-center gap-2 bg-[#5624d0] hover:bg-[#401b9c] text-white px-6 py-3 rounded-lg font-bold text-sm transition shadow-md hover:shadow-lg active:scale-95"
            >
              <span>{slide.buttonText}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Left Arrow Button */}
        <button
          onClick={prevSlide}
          aria-label="Previous slide"
          className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 hover:bg-white text-gray-800 flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95 focus:outline-none"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Right Arrow Button */}
        <button
          onClick={nextSlide}
          aria-label="Next slide"
          className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/90 hover:bg-white text-gray-800 flex items-center justify-center shadow-lg transition-all hover:scale-110 active:scale-95 focus:outline-none"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Dot Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
          {slides.map((s, index) => (
            <button
              key={s.id}
              onClick={() => setCurrent(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                index === current ? "w-8 bg-[#5624d0]" : "w-2.5 bg-white/70 hover:bg-white"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
