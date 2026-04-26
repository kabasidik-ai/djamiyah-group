import Image from 'next/image'
import Link from 'next/link'
import { footerContent, navigation, siteConfig } from '@/data/content'
import { Facebook, Instagram, Linkedin, Twitter } from 'lucide-react'

const socialIcons = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  linkedin: Linkedin,
} as const

export default function Footer() {
  return (
    <footer className="bg-[#0D3B3E] text-white mt-auto">
      {/* Bande accent dorée */}
      <div className="h-[3px] bg-gradient-to-r from-transparent via-[#F9A03F] to-transparent opacity-70" />

      <div className="container mx-auto px-6 lg:px-12 pt-14 pb-8">
        {/* ── ZONE BRAND : logo pleine largeur + description + social ── */}
        <div className="mb-10 pb-10 border-b border-white/10">
          {/* Logo — prend tout l'espace disponible jusqu'à 560px */}
          <div
            className="relative overflow-hidden mb-6"
            style={{ width: 'min(560px, 100%)', height: '200px' }}
          >
            <Image
              src="/images/logos/logo-footer.svg"
              alt="Groupe Djamiyah"
              fill
              className="object-contain object-left"
              priority
            />
          </div>

          {/* Description + réseaux — côte à côte sur md+ */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <p className="text-white/65 text-[15px] leading-relaxed max-w-lg">
              {footerContent.description}
            </p>

            {/* Réseaux sociaux */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {footerContent.social.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target={social.href !== '#' ? '_blank' : undefined}
                  rel={social.href !== '#' ? 'noopener noreferrer' : undefined}
                  className="group w-11 h-11 rounded-full border border-white/20 bg-white/5 hover:bg-[#F9A03F]/20 hover:border-[#F9A03F]/70 flex items-center justify-center transition-all duration-300 hover:-translate-y-0.5"
                  aria-label={social.name}
                  title={social.name}
                >
                  {(() => {
                    const Icon = socialIcons[social.icon as keyof typeof socialIcons]
                    return Icon ? (
                      <Icon className="w-5 h-5 text-white/70 group-hover:text-[#F9A03F] transition-colors duration-300" />
                    ) : null
                  })()}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ── GRILLE 3 COLONNES ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 mb-12">
          {/* Navigation */}
          <div>
            <h3 className="text-[12px] font-bold uppercase tracking-[0.15em] text-[#F9A03F] mb-5">
              Navigation
            </h3>
            <ul className="space-y-3">
              {navigation.main.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-white/60 hover:text-white text-sm transition-colors duration-150 hover:translate-x-1 inline-flex items-center gap-1.5 group"
                  >
                    <span className="h-px w-3 bg-white/20 group-hover:w-5 group-hover:bg-[#F9A03F] transition-all duration-200" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Informations */}
          <div>
            <h3 className="text-[12px] font-bold uppercase tracking-[0.15em] text-[#F9A03F] mb-5">
              Informations
            </h3>
            <ul className="space-y-3">
              {footerContent.quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-white/60 hover:text-white text-sm transition-colors duration-150 hover:translate-x-1 inline-flex items-center gap-1.5 group"
                  >
                    <span className="h-px w-3 bg-white/20 group-hover:w-5 group-hover:bg-[#F9A03F] transition-all duration-200" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-[12px] font-bold uppercase tracking-[0.15em] text-[#F9A03F] mb-5">
              Contactez-nous
            </h3>
            <address className="not-italic space-y-3 text-sm text-white/60">
              <p className="leading-relaxed">{siteConfig.location}</p>
              <p>
                <a
                  href={`tel:${navigation.contact.phone}`}
                  className="hover:text-white transition-colors"
                >
                  {navigation.contact.phone}
                </a>
              </p>
              <p>
                <a
                  href={`mailto:${navigation.contact.email}`}
                  className="hover:text-white transition-colors break-all"
                >
                  {navigation.contact.email}
                </a>
              </p>
            </address>
            <Link
              href="/reservation"
              className="inline-flex items-center gap-2 mt-6 bg-[#F9A03F] hover:bg-[#e8911e] text-white text-[13px] font-semibold px-5 py-2.5 rounded-full shadow-[0_2px_12px_rgba(249,160,63,0.30)] hover:shadow-[0_4px_18px_rgba(249,160,63,0.45)] transition-all duration-200 hover:scale-[1.02]"
            >
              Réserver une chambre
            </Link>
          </div>
        </div>

        {/* ── BAS DE PAGE ── */}
        <div className="border-t border-white/10 pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-white/35 text-xs">
            <p>{footerContent.copyright}</p>
            <p>Hôtel Maison Blanche · Coyah, Guinée</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
