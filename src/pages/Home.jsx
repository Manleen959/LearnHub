import React from "react";
import HeroCarousel from "../components/HeroCarousel";
import CourseCards from "../components/CourseCards";
import { Award, Laptop, Clock, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Carousel */}
      <HeroCarousel />

      {/* Feature Value Props Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-[#5624d0] flex items-center justify-center shrink-0">
              <Laptop className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">220,000+ Courses</h4>
              <p className="text-xs text-gray-500">Explore fresh topics daily</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-[#5624d0] flex items-center justify-center shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">Expert Instructors</h4>
              <p className="text-xs text-gray-500">Find the right instructor for you</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-[#5624d0] flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">Lifetime Access</h4>
              <p className="text-xs text-gray-500">Learn on your schedule</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-[#5624d0] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">Certificates</h4>
              <p className="text-xs text-gray-500">Earn verified credentials</p>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Selection Grid */}
      <CourseCards />

      {/* Become an Instructor Callout */}
      <section className="bg-gray-50 py-16 border-t border-gray-200 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-12 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-xl">
              <span className="text-[#5624d0] font-bold text-sm uppercase tracking-wider">Become an Instructor</span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-2 mb-3">
                Teach the world online with LearnHub
              </h3>
              <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                Create an online video course, reach students across the globe, and earn money while teaching what you love. Sign up as a Teacher today.
              </p>
            </div>
            <Link
              to="/signup"
              className="bg-[#5624d0] hover:bg-[#401b9c] text-white px-8 py-3.5 rounded-lg font-bold text-sm transition shadow-sm hover:shadow-md whitespace-nowrap active:scale-95 flex items-center gap-2"
            >
              <span>Apply as Teacher</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8 text-sm">
            <div>
              <h5 className="font-bold text-white mb-3">About LearnHub</h5>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition">About Us</a></li>
                <li><a href="#" className="hover:text-white transition">Careers</a></li>
                <li><a href="#" className="hover:text-white transition">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold text-white mb-3">Discover</h5>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition">Web Development</a></li>
                <li><a href="#" className="hover:text-white transition">Cloud Computing</a></li>
                <li><a href="#" className="hover:text-white transition">Artificial Intelligence</a></li>
                <li><a href="#" className="hover:text-white transition">Data Science</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold text-white mb-3">Community</h5>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition">Learners</a></li>
                <li><a href="#" className="hover:text-white transition">Partners</a></li>
                <li><a href="#" className="hover:text-white transition">Instructors</a></li>
                <li><a href="#" className="hover:text-white transition">Help & Support</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-bold text-white mb-3">Legal</h5>
              <ul className="space-y-2">
                <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition">Cookie Settings</a></li>
                <li><a href="#" className="hover:text-white transition">Accessibility</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 gap-4">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-white">Learn<span className="text-[#a435f0]">Hub</span></span>
              <span>© 2026 LearnHub, Inc. All rights reserved.</span>
            </div>
            <p>Digital Learning & Training Management System</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
