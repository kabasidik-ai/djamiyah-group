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
      {/* ── Bande supérieure accent ── */}
      <div className="h-[3px] bg-gradient-to-r from-transparent via-[#F9A03F] to-transparent opacity-70" />

      <div className="container mx-auto px-6 lg:px-10 pt-12 pb-6">
        {/* ── Section logo — pleine largeur, lisible ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pb-10 border-b border-white/10">
          {/* Logo grand format : max 360px, hauteur auto proprtionnelle */}
          <div
            className="relative overflow-hidden flex-shrink-0"
            style={{ width: 'min(360px, 80vw)', height: '130px' }}
          >
            <Image
              src="/images/logos/logo-footer.svg"
              alt="Groupe Djamiyah"
              fill
              className="object-contain object-left"
              priority
            />
          </div>

          {/* Description + réseaux sociaux */}
          <div className="flex-1 space-y-4">
            <p className="text-white/60 text-sm leading-relaxed max-w-sm">
              {footerContent.description}
            </p>
            <div className="flex items-center gap-3">
              {footerContent.social.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target={social.href !== '#' ? '_blank' : undefined}
                  rel={social.href !== '#' ? 'noopener noreferrer' : undefined}
                  className="group w-10 h-10 rounded-full border border-white/20 bg-white/5 hover:bg-[#F9A03F]/12 hover:border-[#F9A03F]/60 flex items-center justify-center transition-all duration-300 hover:-translate-y-0.5"
                  aria-label={social.name}
                  title={social.name}
                >
                  {(() => {
                    const Icon = socialIcons[social.icon as keyof typeof socialIcons]
                    return Icon ? (
                      <Icon className="w-4 h-4 text-white/80 group-hover:text-[#F9A03F] transition-colors duration-300" />
                    ) : null
                  })()}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ── Grille 3 colonnes : Navigation | Informations | Contact ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 py-10">
          {/* Colonne 1 : Navigation */}
          <div>
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#F9A03F] mb-5">
              Navigation
            </h3>
            <ul className="space-y-2.5">
              {navigation.main.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-white/65 hover:text-white text-sm transition-colors duration-150 hover:translate-x-0.5 inline-block"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Colonne 2 : Informations */}
          <div>
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#F9A03F] mb-5">
              Informations
            </h3>
            <ul className="space-y-2.5">
              {footerContent.quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-white/65 hover:text-white text-sm transition-colors duration-150"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Colonne 3 : Contact */}
          <div>
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#F9A03F] mb-5">
              Contactez-nous
            </h3>
            <address className="not-italic space-y-3">
              <p className="text-white/65 text-sm leading-relaxed">{siteConfig.location}</p>
              <p className="text-sm">
                <a
                  href={`tel:${navigation.contact.phone}`}
                  className="text-white/65 hover:text-white transition-colors"
                >
                  {navigation.contact.phone}
                </a>
              </p>
              <p className="text-sm">
                <a
                  href={`mailto:${navigation.contact.email}`}
                  className="text-white/65 hover:text-white transition-colors break-all"
                >
                  {navigation.contact.email}
                </a>
              </p>
            </address>
            <Link
              href="/reservation"
              className="
                inline-flex items-center gap-2 mt-6
                bg-[#F9A03F] hover:bg-[#e8911e]
                text-white text-[13px] font-semibold
                px-5 py-2.5 rounded-full
                shadow-[0_2px_12px_rgba(249,160,63,0.30)]
                hover:shadow-[0_4px_18px_rgba(249,160,63,0.45)]
                transition-all duration-200
              "
            >
              Réserver une chambre
            </Link>
          </div>
        </div>

        {/* ── Bas de page ── */}
        <div className="border-t border-white/10 pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-white/40 text-xs">
            <p>{footerContent.copyright}</p>
            <p>Hôtel Maison Blanche · Coyah, Guinée</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
