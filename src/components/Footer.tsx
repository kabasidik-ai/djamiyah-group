import Link from "next/link";
import Image from "next/image";
import { footerContent, navigation, siteConfig } from "@/data/content";

export default function Footer() {
  return (
    <footer className="bg-primary text-white mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand & Description */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 flex items-center justify-center">
                <Image 
                  src="/images/corporate/logo-maison-blanche.svg" 
                  alt="Logo Groupe Djamiyah"
                  width={48}
                  height={48}
                  className="h-12 w-auto"
                />
              </div>
              <div>
                <h2 className="text-xl font-serif font-bold">
                  {siteConfig.hotelName}
                </h2>
                <p className="text-sm text-gray-300">{siteConfig.groupName}</p>
                <p className="text-xs text-gray-300 italic mt-1">{siteConfig.tagline}</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              {footerContent.description}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Liens rapides</h3>
            <ul className="space-y-3">
              {navigation.main.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-gray-300 hover:text-primary hover:underline transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Additional Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Informations</h3>
            <ul className="space-y-3">
              {footerContent.quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-300 hover:text-primary hover:underline transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contactez-nous</h3>
            <address className="not-italic space-y-3">
              <div>
                <p className="text-gray-300 text-sm">{siteConfig.location}</p>
              </div>
              <div>
                <p className="text-gray-300 text-sm">
                  Tél:{" "}
                  <a
                    href={`tel:${navigation.contact.phone}`}
                    className="hover:text-primary transition-colors"
                  >
                    {navigation.contact.phone}
                  </a>
                </p>
              </div>
              <div>
                <p className="text-gray-300 text-sm">
                  Email:{" "}
                  <a
                    href={`mailto:${navigation.contact.email}`}
                    className="hover:text-primary transition-colors"
                  >
                    {navigation.contact.email}
                  </a>
                </p>
              </div>
            </address>

            {/* Social Links */}
            <div className="mt-6">
              <h4 className="text-sm font-semibold mb-3">Suivez-nous</h4>
              <div className="flex space-x-4">
                {footerContent.social.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target={social.href !== "#" ? "_blank" : undefined}
                    rel={social.href !== "#" ? "noopener noreferrer" : undefined}
                    className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/30 flex items-center justify-center transition-colors"
                    aria-label={social.name}
                  >
                    {social.icon === "facebook" && (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987H7.898V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
                      </svg>
                    )}
                    {social.icon === "instagram" && (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                      </svg>
                    )}
                    {social.icon === "twitter" && (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                    )}
                    {social.icon === "linkedin" && (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    )}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/20 my-8"></div>

        {/* Copyright */}
        <div className="text-center text-gray-300 text-sm">
          <p>{footerContent.copyright}</p>
        </div>
      </div>
    </footer>
  );
}