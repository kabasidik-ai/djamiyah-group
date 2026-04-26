import Link from 'next/link'
import { footerContent, navigation, siteConfig } from '@/data/content'
import { LogoIcon } from '@/components/ui/LogoIcon'
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
      {/* Bande accent orange — charte Djamiyah */}
      <div className="h-[3px] bg-gradient-to-r from-transparent via-[#F9A03F] to-transparent opacity-70" />

      <div className="container mx-auto px-6 lg:px-12 pt-12 pb-8">
        {/* ── ZONE BRAND : logo blanc + slogan + réseaux ── */}
        <div className="flex flex-col items-center text-center mb-10 pb-10 border-b border-white/10 gap-4">
          {/* Logo en blanc — charte foncée */}
          <LogoIcon variant="white" size="xl" />

          {/* Slogan dans les couleurs charte */}
          <p className="text-[#F9A03F]/80 text-[13px] italic tracking-wide">
            Plus qu&apos;un séjour, une expérience.
          </p>

          {/* Description */}
          <p className="text-white/60 text-[14px] leading-relaxed max-w-md mx-auto">
            {footerContent.description}
          </p>

          {/* Réseaux sociaux */}
          <div className="flex items-center justify-center gap-3 pt-1">
            {footerContent.social.map((social) => (
              <a
                key={social.name}
                href={social.href}
                target={social.href !== '#' ? '_blank' : undefined}
                rel={social.href !== '#' ? 'noopener noreferrer' : undefined}
                className="group w-10 h-10 rounded-full border border-white/20 bg-white/5 hover:bg-[#F9A03F]/20 hover:border-[#F9A03F]/60 flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5"
                aria-label={social.name}
                title={social.name}
              >
                {(() => {
                  const Icon = socialIcons[social.icon as keyof typeof socialIcons]
                  return Icon ? (
                    <Icon className="w-4.5 h-4.5 text-white/60 group-hover:text-[#F9A03F] transition-colors duration-200" />
                  ) : null
                })()}
              </a>
            ))}
          </div>
        </div>

        {/* ── GRILLE LIENS : 2 col mobile → 3 col desktop ── */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {/* Navigation */}
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#F9A03F] mb-4">
              Navigation
            </h3>
            <ul className="space-y-2.5">
              {navigation.main.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-white/55 hover:text-white text-[13px] transition-colors duration-150"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Informations */}
          <div>
            <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#F9A03F] mb-4">
              Informations
            </h3>
            <ul className="space-y-2.5">
              {footerContent.quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-white/55 hover:text-white text-[13px] transition-colors duration-150"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact — col-span-2 mobile, centré, bouton pleine largeur */}
          <div className="col-span-2 lg:col-span-1">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-[#F9A03F] mb-4 text-center lg:text-left">
              Contactez-nous
            </h3>
            <div className="flex flex-col items-center lg:items-start gap-3 text-center lg:text-left">
              <address className="not-italic space-y-2 text-[13px] text-white/55 w-full">
                <p>{siteConfig.location}</p>
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
              {/* CTA bouton orange — charte Djamiyah */}
              <Link
                href="/reservation"
                className="w-full lg:w-auto mt-2 flex items-center justify-center bg-[#F9A03F] hover:bg-[#e8911e] text-white text-[14px] font-semibold px-6 py-3 rounded-full shadow-[0_2px_12px_rgba(249,160,63,0.25)] hover:shadow-[0_4px_18px_rgba(249,160,63,0.40)] transition-all duration-200 hover:scale-[1.02]"
              >
                Réserver une chambre
              </Link>
            </div>
          </div>
        </div>

        {/* ── BAS DE PAGE ── */}
        <div className="border-t border-white/10 pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-white/30 text-xs text-center sm:text-left">
            <p>{footerContent.copyright}</p>
            <p className="hidden sm:block">Hôtel Maison Blanche · Coyah, Guinée</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
