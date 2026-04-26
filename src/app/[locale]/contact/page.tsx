'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  CalendarCheck,
  UtensilsCrossed,
  Presentation,
  MapPin,
  Phone,
  Mail,
  Clock,
} from 'lucide-react'
import { contactInfo } from '@/data/content'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Dans une application réelle, ceci se connecterait à une API de formulaire de contact
    alert('Merci pour votre message! Nous vous répondrons dans les 24 heures.')
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
    })
  }

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-80 flex items-center justify-center bg-gradient-to-r from-secondary to-primary">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">
            {contactInfo.title}
          </h1>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto">{contactInfo.description}</p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Colonne gauche : Infos de contact + Carte */}
              <div className="space-y-8">
                <h2 className="text-2xl font-serif font-bold text-gray-900">
                  Informations de contact
                </h2>

                <div className="space-y-5">
                  {/* Téléphone */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#F0F7F7] flex items-center justify-center">
                      <Phone className="w-5 h-5 text-[#0D3B3E]" strokeWidth={1.75} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                        Téléphone
                      </p>
                      <a
                        href="tel:+22461075900"
                        className="text-gray-800 font-medium hover:text-[#0D3B3E] transition-colors"
                      >
                        +224 610 75 90 90
                      </a>
                    </div>
                  </div>

                  {/* Adresse email */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#FFF4E6] flex items-center justify-center">
                      <Mail className="w-5 h-5 text-[#F9A03F]" strokeWidth={1.75} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                        Adresse email
                      </p>
                      <a
                        href="mailto:contact@djamiyah.com"
                        className="text-gray-800 font-medium hover:text-[#F9A03F] transition-colors break-all"
                      >
                        contact@djamiyah.com
                      </a>
                    </div>
                  </div>

                  {/* Adresse */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#F0F7F7] flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-[#0D3B3E]" strokeWidth={1.75} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                        Adresse
                      </p>
                      <p className="text-gray-800 font-medium">Coyah, Guinée</p>
                      <p className="text-gray-500 text-sm">Route Nationale</p>
                    </div>
                  </div>

                  {/* Heures de réception */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#FFF4E6] flex items-center justify-center">
                      <Clock className="w-5 h-5 text-[#F9A03F]" strokeWidth={1.75} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                        Heures de réception
                      </p>
                      <p className="text-gray-800 font-medium">24h/24 — 7j/7</p>
                      <p className="text-gray-500 text-sm">Disponible en permanence</p>
                    </div>
                  </div>
                </div>

                {/* ── CARTE GOOGLE MAPS — colonne gauche ── */}
                <div className="rounded-2xl overflow-hidden shadow-md border border-gray-100">
                  <div className="bg-[#0D3B3E] px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#F9A03F] flex-shrink-0" />
                      <p className="text-white font-semibold text-xs leading-tight">
                        La Maison Blanche de Coyah
                      </p>
                    </div>
                    <a
                      href="https://www.google.com/maps/place/La+Maison+Blanche+de+Coyah/@9.7016904,-13.4061795,17z"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 inline-flex items-center gap-1 text-[#F9A03F] hover:text-[#e8911e] text-xs font-medium transition-colors"
                    >
                      Ouvrir
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" y1="14" x2="21" y2="3" />
                      </svg>
                    </a>
                  </div>
                  <iframe
                    src="https://maps.google.com/maps?q=9.7016904,-13.4036046&z=17&hl=fr&output=embed"
                    width="100%"
                    height="260"
                    style={{ border: 0, display: 'block' }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="La Maison Blanche de Coyah — Google Maps"
                  />
                </div>
              </div>

              {/* Contact Form */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <h2 className="text-3xl font-serif font-bold text-gray-900 mb-6">
                    Envoyez-nous un message
                  </h2>
                  <p className="text-gray-600 mb-8">
                    Vous avez des questions sur notre hôtel, notre restaurant ou nos espaces
                    événementiels ? Remplissez le formulaire ci-dessous et nous vous répondrons au
                    plus vite.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">Nom complet *</label>
                        <input
                          type="text"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Votre nom"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Adresse email *</label>
                        <input
                          type="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="contact@djamiyah.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">Téléphone</label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="+224 XXX XXX XXX"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Sujet *</label>
                        <select
                          name="subject"
                          required
                          value={formData.subject}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="">Sélectionner un sujet</option>
                          <option value="reservation">Demande de réservation</option>
                          <option value="restaurant">Réservation restaurant</option>
                          <option value="conference">Conférences et événements</option>
                          <option value="feedback">Commentaires et suggestions</option>
                          <option value="general">Demande générale</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Message *</label>
                      <textarea
                        name="message"
                        required
                        value={formData.message}
                        onChange={handleChange}
                        rows={6}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Comment pouvons-nous vous aider ? Merci de préciser votre demande..."
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="newsletter"
                        className="h-4 w-4 text-primary focus:ring-primary"
                      />
                      <label htmlFor="newsletter" className="ml-2 text-sm text-gray-600">
                        Je souhaite recevoir les actualités et offres spéciales de l&apos;Hôtel
                        Maison Blanche
                      </label>
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        className="w-full bg-primary hover:bg-amber-600 text-white py-4 rounded-xl font-semibold text-lg transition-colors hover:shadow-lg"
                      >
                        Envoyer le message
                      </button>
                      <p className="text-gray-500 text-sm mt-3 text-center">
                        Nous répondons généralement sous 24 heures pendant les jours ouvrables.
                      </p>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Department Contacts */}
            <div className="mt-20">
              <h2 className="text-3xl font-serif font-bold text-center mb-12">
                Contacter un service spécifique
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    department: 'Réservations',
                    description: 'Pour les réservations de chambres, modifications et annulations',
                    email: 'contact@djamiyah.com',
                    phone: '+224 610 75 90 90',
                    icon: <CalendarCheck className="w-6 h-6 text-[#0D3B3E]" strokeWidth={1.5} />,
                    iconContainerClass:
                      'w-12 h-12 rounded-xl bg-[#F0F7F7] flex items-center justify-center mb-3',
                  },
                  {
                    department: 'Restaurant',
                    description: 'Pour les réservations de table et demandes de repas privés',
                    email: 'contact@djamiyah.com',
                    phone: '+224 610 75 90 90',
                    icon: <UtensilsCrossed className="w-6 h-6 text-[#F9A03F]" strokeWidth={1.5} />,
                    iconContainerClass:
                      'w-12 h-12 rounded-xl bg-[#FFF4E6] flex items-center justify-center mb-3',
                  },
                  {
                    department: 'Événements et conférences',
                    description: 'Pour les mariages, réunions et événements spéciaux',
                    email: 'contact@djamiyah.com',
                    phone: '+224 610 75 90 90',
                    icon: <Presentation className="w-6 h-6 text-[#0D3B3E]" strokeWidth={1.5} />,
                    iconContainerClass:
                      'w-12 h-12 rounded-xl bg-[#F0F7F7] flex items-center justify-center mb-3',
                  },
                ].map((dept, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <div className={dept.iconContainerClass}>{dept.icon}</div>
                    <h3 className="text-xl font-semibold mb-2">{dept.department}</h3>
                    <p className="text-gray-600 mb-4">{dept.description}</p>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <a href={`mailto:${dept.email}`} className="text-primary hover:underline">
                          {dept.email}
                        </a>
                      </div>
                      <div className="flex items-center text-sm">
                        <a href={`tel:${dept.phone}`} className="text-primary hover:underline">
                          {dept.phone}
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ Section */}
            <div className="mt-20">
              <h2 className="text-3xl font-serif font-bold text-center mb-12">
                Questions fréquentes
              </h2>
              <div className="space-y-6 max-w-3xl mx-auto">
                {[
                  {
                    question: "Quels sont les horaires d'arrivée et de départ ?",
                    answer:
                      "L'arrivée se fait à 15h00 et le départ à 11h00. Une arrivée anticipée ou un départ tardif peut être possible sur demande selon disponibilité.",
                  },
                  {
                    question: "Proposez-vous un transport depuis l'aéroport ?",
                    answer:
                      "Oui, nous proposons un service de transfert depuis l'aéroport international de Conakry. Merci de nous contacter à l'avance pour organiser votre prise en charge.",
                  },
                  {
                    question: "Le parking est-il disponible à l'hôtel ?",
                    answer:
                      "Oui, nous proposons un parking sécurisé gratuit pour tous les clients de l'hôtel.",
                  },
                  {
                    question: 'Prenez-vous en compte les régimes alimentaires spécifiques ?',
                    answer:
                      "Absolument. Notre restaurant peut s'adapter à différents besoins alimentaires, notamment végétarien, végan, sans gluten et halal. Merci de nous informer à l'avance.",
                  },
                  {
                    question: "Quelle est votre politique d'annulation ?",
                    answer:
                      "Les réservations peuvent être annulées sans frais jusqu'à 48 heures avant l'arrivée. En cas d'annulation tardive, une nuit peut être facturée.",
                  },
                ].map((faq, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.question}</h3>
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Back to Home */}
            <div className="text-center mt-12">
              <Link
                href="/"
                className="inline-flex items-center text-primary hover:text-amber-600 font-semibold text-lg"
              >
                ← Retour à l&apos;accueil
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
