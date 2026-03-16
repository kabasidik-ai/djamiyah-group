"use client";

import { useState } from "react";
import Link from "next/link";
import { navigation } from "@/data/content";

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-sm border-b border-primary/20 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
            {/* Logo - Placeholder SVG pour Groupe Djamiyah */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2">
                <div className="h-10 w-10 flex items-center justify-center">
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="20" cy="20" r="18" fill="#0D3B3E"/>
                    <circle cx="20" cy="20" r="10" fill="#F9A03F"/>
                    <path d="M20 10 L20 30 M10 20 L30 20" stroke="white" strokeWidth="2"/>
                  </svg>
                </div>
                <div className="hidden md:block">
                  <h1 className="text-xl font-serif font-bold text-gray-900">
                    Groupe Djamiyah
                  </h1>
                  <p className="text-xs text-gray-500">Hôtel Maison Blanche</p>
                </div>
              </Link>
            </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.main.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-700 hover:text-primary font-medium transition-colors relative group"
              >
                {item.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300"></span>
              </Link>
            ))}
            <Link
              href="/reservation"
              className="bg-secondary hover:bg-orange-500 text-white px-6 py-2.5 rounded-full font-medium transition-all hover:shadow-lg"
            >
              Réserver
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-primary p-2"
              aria-label="Toggle menu"
            >
              <div className="w-6 h-6 flex flex-col justify-center items-center">
                <span
                  className={`block h-0.5 w-6 bg-current transform transition-transform duration-300 ${
                    isMenuOpen ? "rotate-45 translate-y-1.5" : "-translate-y-1"
                  }`}
                ></span>
                <span
                  className={`block h-0.5 w-6 bg-current transition-opacity duration-300 ${
                    isMenuOpen ? "opacity-0" : "opacity-100"
                  }`}
                ></span>
                <span
                  className={`block h-0.5 w-6 bg-current transform transition-transform duration-300 ${
                    isMenuOpen ? "-rotate-45 -translate-y-1.5" : "translate-y-1"
                  }`}
                ></span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ${
            isMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="py-4 space-y-4 border-t border-gray-100">
            {navigation.main.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block px-4 py-3 text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <Link
              href="/reservation"
              className="block mx-4 bg-secondary hover:bg-orange-500 text-white px-6 py-3 rounded-full font-medium text-center transition-all"
              onClick={() => setIsMenuOpen(false)}
            >
              Réserver
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}