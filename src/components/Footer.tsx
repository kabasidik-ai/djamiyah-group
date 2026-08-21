import { Link } from '@/i18n/navigation'
import { footerContent, navigation } from '@/data/content'
import { Facebook, Instagram, Linkedin, Twitter, MapPin } from 'lucide-react'

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

      <div className="container mx-auto px-6 lg:px-12 pt-14 pb-10">
        {/* ── GRILLE PRINCIPALE : 1 col mobile → 2 col tablette → 4 col desktop ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 mb-12">
          {/* ─── COL 1 : Groupe Djamiyah ─── */}
          <div className="sm:col-span-2 lg:col-span-1">
            {/* Logo */}
            <div className="w-[160px] h-[160px] flex-shrink-0 mb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/logo-footer-green.svg"
                alt="Groupe Djamiyah"
                width={160}
                height={160}
                className="w-full h-full object-contain"
                loading="eager"
              />
            </div>

            <h2 className="text-lg font-serif font-bold text-white tracking-wide mb-1">
              Groupe Djamiyah
            </h2>
            <p className="text-[#F9A03F]/90 text-sm italic mb-4">
              Plus qu&apos;un séjour, une expérience.
            </p>

            <p className="text-white/65 text-[15px] leading-relaxed mb-5 max-w-sm">
              {footerContent.description}
            </p>

            {/* Réseaux sociaux */}
            <div className="flex items-center gap-3">
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
                      <Icon className="w-[18px] h-[18px] text-white/60 group-hover:text-[#F9A03F] transition-colors duration-200" />
                    ) : null
                  })()}
                </a>
              ))}
            </div>
          </div>

          {/* ─── COL 2 : Navigation ─── */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-[#F9A03F] mb-5">
              Navigation
            </h3>
            <ul className="space-y-3">
              {navigation.main.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-white/60 hover:text-white text-[15px] transition-colors duration-150"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ─── COL 3 : Nos établissements ─── */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-[#F9A03F] mb-5">
              Nos établissements
            </h3>
            <ul className="space-y-5">
              {footerContent.establishments.map((establishment) => (
                <li key={establishment.name}>
                  <Link
                    href={establishment.href}
                    className="group block transition-colors duration-150"
                  >
                    <span className="text-white/90 group-hover:text-white text-[15px] font-semibold block">
                      {establishment.name}
                    </span>
                    <span className="text-white/50 group-hover:text-white/70 text-sm flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      {establishment.location}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ─── COL 4 : Contact + CTA ─── */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-[#F9A03F] mb-5">
              Contact
            </h3>
            <address className="not-italic space-y-3 text-[15px] text-white/60 mb-6">
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
              <p>{navigation.contact.address}</p>
            </address>

            {/* CTA — universel */}
            <Link
              href="/reservation"
              className="w-full sm:w-auto inline-flex items-center justify-center bg-[#F9A03F] hover:bg-[#e8911e] text-white text-[15px] font-semibold px-7 py-3 rounded-full shadow-[0_2px_12px_rgba(249,160,63,0.25)] hover:shadow-[0_4px_18px_rgba(249,160,63,0.40)] transition-all duration-200 hover:scale-[1.02]"
            >
              Faire une réservation
            </Link>
          </div>
        </div>

        {/* ── SOUS-FOOTER ── */}
        <div className="border-t border-white/10 pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <p className="text-white/40 text-sm">{footerContent.copyright}</p>
            <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
              {footerContent.quickLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-white/40 hover:text-white/70 text-sm transition-colors duration-150"
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </footer>
  )
}
