'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CalendarCheck, UtensilsCrossed, Presentation, MapPin } from 'lucide-react'
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
              {/* Contact Information */}
              <div className="space-y-8">
                <h2 className="text-2xl font-serif font-bold text-gray-900">
                  Informations de contact
                </h2>

                <div className="space-y-6">
                  {contactInfo.details.map((detail, idx) => (
                    <div key={idx} className="flex items-start space-x-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary text-xl" aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{detail.title}</h3>
                        {detail.link ? (
                          <a
                            href={detail.link}
                            className="text-gray-600 hover:text-primary transition-colors"
                          >
                            {detail.value}
                          </a>
                        ) : (
                          <p className="text-gray-600">{detail.value}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Map Placeholder */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Notre emplacement</h3>
                  <a
                    href="https://www.google.com/maps/place/Coyah,+Guinea"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block relative rounded-xl overflow-hidden bg-[#F0F7F7] p-8 text-center group hover:bg-[#E8F0F0] transition-colors duration-300"
                  >
                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <MapPin className="w-8 h-8 text-[#0D3B3E]" />
                    </div>
                    <h3 className="font-serif text-xl font-semibold text-[#0D3B3E] mb-1">
                      Coyah, Guinée
                    </h3>
                    <p className="text-gray-500 text-sm mb-4">Route Nationale, Coyah</p>
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-[#F9A03F] group-hover:gap-3 transition-all">
                      Voir sur Google Maps
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
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
                    </span>
                  </a>
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
