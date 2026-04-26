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
      {/* ── Bande supérieure accent ── */}
      <div className="h-[3px] bg-gradient-to-r from-transparent via-[#F9A03F] to-transparent opacity-70" />

      <div className="container mx-auto px-6 lg:px-10 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* ── Colonne 1 : Brand ── */}
          <div className="space-y-5">
            <LogoIcon variant="white" size="md" showSubtitle={true} />
            <p className="text-white/60 text-sm leading-relaxed">{footerContent.description}</p>

            {/* Social links */}
            <div className="pt-1">
              <p className="text-[12px] uppercase tracking-[0.1em] text-white/70 mb-3">
                Connectez-vous avec nous
              </p>
              <div className="flex items-center justify-center md:justify-start gap-3">
                {footerContent.social.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target={social.href !== '#' ? '_blank' : undefined}
                    rel={social.href !== '#' ? 'noopener noreferrer' : undefined}
                    className="group relative w-11 h-11 rounded-full border border-white/20 bg-white/5 hover:bg-[#F9A03F]/12 hover:border-[#F9A03F]/60 flex items-center justify-center transition-all duration-300 hover:-translate-y-0.5"
                    aria-label={social.name}
                    title={social.name}
                  >
                    {(() => {
                      const Icon = socialIcons[social.icon as keyof typeof socialIcons]
                      return Icon ? (
                        <Icon className="w-5 h-5 text-white/80 group-hover:text-[#F9A03F] transition-colors duration-300" />
                      ) : null
                    })()}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* ── Colonne 2 : Liens rapides ── */}
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

          {/* ── Colonne 3 : Informations ── */}
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

          {/* ── Colonne 4 : Contact ── */}
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

            {/* CTA réservation */}
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

        {/* ── Séparateur ── */}
        <div className="border-t border-white/10 mt-12 pt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-white/40 text-xs">
            <p>{footerContent.copyright}</p>
            <p>Hôtel Maison Blanche · Coyah, Guinée</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
