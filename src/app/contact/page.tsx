"use client";

import { useState } from "react";
import Link from "next/link";
import { contactInfo, navigation } from "@/data/content";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Dans une application réelle, ceci se connecterait à une API de formulaire de contact
    alert("Merci pour votre message! Nous vous répondrons dans les 24 heures.");
    setFormData({
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    });
  };

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-80 flex items-center justify-center bg-gradient-to-r from-secondary to-primary">
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">
            {contactInfo.title}
          </h1>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto">
            {contactInfo.description}
          </p>
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
                        <span className="text-primary text-xl">
                          {detail.icon === "phone" ? "📞" : 
                           detail.icon === "email" ? "✉️" : 
                           detail.icon === "location" ? "📍" : "🕒"}
                        </span>
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
                  <div className="h-64 bg-gradient-to-br from-gray-300 to-gray-400 rounded-xl flex items-center justify-center">
                    <div className="text-center text-gray-700">
                      <div className="text-5xl mb-4">🗺️</div>
                      <p className="text-lg font-medium">Coyah, Guinée</p>
                      <p className="text-sm mt-2">À venir : Intégration Google Maps</p>
                      <p className="text-xs text-gray-600 mt-1">
                        <a 
                          href={navigation.contact.googleMapsLink}
                          className="underline hover:text-primary"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Ouvrir dans Google Maps →
                        </a>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Social Media */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Connectez-vous avec nous</h3>
                  <div className="flex space-x-4">
                    {[
                      { icon: "📘", label: "Facebook", href: "#" },
                      { icon: "📷", label: "Instagram", href: "#" },
                      { icon: "🐦", label: "Twitter", href: "#" },
                      { icon: "💼", label: "LinkedIn", href: "#" },
                    ].map((social, idx) => (
                      <a
                        key={idx}
                        href={social.href}
                        className="h-12 w-12 rounded-full bg-gray-100 hover:bg-primary hover:text-white flex items-center justify-center transition-colors"
                        aria-label={social.label}
                      >
                        <span className="text-xl">{social.icon}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <h2 className="text-3xl font-serif font-bold text-gray-900 mb-6">
                    Envoyez-nous un message
                  </h2>
                  <p className="text-gray-600 mb-8">
                    Vous avez des questions sur notre hôtel, notre restaurant ou nos espaces événementiels ?
                    Remplissez le formulaire ci-dessous et nous vous répondrons au plus vite.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Nom complet *
                        </label>
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
                        <label className="block text-sm font-medium mb-2">
                          Adresse email *
                        </label>
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
                        <label className="block text-sm font-medium mb-2">
                          Téléphone
                        </label>
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
                        <label className="block text-sm font-medium mb-2">
                          Sujet *
                        </label>
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
                      <label className="block text-sm font-medium mb-2">
                        Message *
                      </label>
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
                        Je souhaite recevoir les actualités et offres spéciales de l&apos;Hôtel Maison Blanche
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
                    department: "Réservations",
                    description: "Pour les réservations de chambres, modifications et annulations",
                    email: "contact@djamiyah.com",
                    phone: "+224 123 456 789",
                    icon: "🏨",
                  },
                  {
                    department: "Restaurant",
                    description: "Pour les réservations de table et demandes de repas privés",
                    email: "contact@djamiyah.com",
                    phone: "+224 123 456 780",
                    icon: "🍽️",
                  },
                  {
                    department: "Événements et conférences",
                    description: "Pour les mariages, réunions et événements spéciaux",
                    email: "contact@djamiyah.com",
                    phone: "+224 123 456 781",
                    icon: "🎤",
                  },
                ].map((dept, idx) => (
                  <div key={idx} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                    <div className="text-5xl mb-4">{dept.icon}</div>
                    <h3 className="text-xl font-semibold mb-2">{dept.department}</h3>
                    <p className="text-gray-600 mb-4">{dept.description}</p>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm">
                        <span className="text-gray-500 mr-2">📧</span>
                        <a
                          href={`mailto:${dept.email}`}
                          className="text-primary hover:underline"
                        >
                          {dept.email}
                        </a>
                      </div>
                      <div className="flex items-center text-sm">
                        <span className="text-gray-500 mr-2">📞</span>
                        <a
                          href={`tel:${dept.phone}`}
                          className="text-primary hover:underline"
                        >
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
                    answer: "L'arrivée se fait à 15h00 et le départ à 11h00. Une arrivée anticipée ou un départ tardif peut être possible sur demande selon disponibilité.",
                  },
                  {
                    question: "Proposez-vous un transport depuis l'aéroport ?",
                    answer: "Oui, nous proposons un service de transfert depuis l'aéroport international de Conakry. Merci de nous contacter à l'avance pour organiser votre prise en charge.",
                  },
                  {
                    question: "Le parking est-il disponible à l'hôtel ?",
                    answer: "Oui, nous proposons un parking sécurisé gratuit pour tous les clients de l'hôtel.",
                  },
                  {
                    question: "Prenez-vous en compte les régimes alimentaires spécifiques ?",
                    answer: "Absolument. Notre restaurant peut s'adapter à différents besoins alimentaires, notamment végétarien, végan, sans gluten et halal. Merci de nous informer à l'avance.",
                  },
                  {
                    question: "Quelle est votre politique d'annulation ?",
                    answer: "Les réservations peuvent être annulées sans frais jusqu'à 48 heures avant l'arrivée. En cas d'annulation tardive, une nuit peut être facturée.",
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
  );
}