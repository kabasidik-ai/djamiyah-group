import Link from "next/link";
import Image from "next/image";
import { footerContent, navigation, siteConfig } from "@/data/content";

export default function Footer() {
  return (
    <footer className="bg-secondary text-white mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand & Description */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 flex items-center justify-center">
                <Image 
                  src="/images/corporate/logo-maison-blanche.svg" 
                  alt="Groupe Djamiyah Logo"
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
                    className="h-10 w-10 rounded-full bg-white/10 hover:bg-primary flex items-center justify-center transition-colors"
                    aria-label={social.name}
                  >
                    <span className="text-sm font-medium">{social.icon.charAt(0)}</span>
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
          <p className="mt-2">
            Designed with ❤️ for {siteConfig.groupName}
          </p>
        </div>
      </div>
    </footer>
  );
}