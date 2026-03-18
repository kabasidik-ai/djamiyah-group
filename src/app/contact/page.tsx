"use client";

import { useState } from "react";
import Link from "next/link";
import { contactInfo, navigation, siteConfig } from "@/data/content";

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
    // In a real application, this would connect to a contact form API
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
                    Send Us a Message
                  </h2>
                  <p className="text-gray-600 mb-8">
                    Have questions about our hotel, restaurant, or event facilities? 
                    Fill out the form below and we'll respond as soon as possible.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Phone Number
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
                          Subject *
                        </label>
                        <select
                          name="subject"
                          required
                          value={formData.subject}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="">Select a subject</option>
                          <option value="reservation">Reservation Inquiry</option>
                          <option value="restaurant">Restaurant Booking</option>
                          <option value="conference">Conference & Events</option>
                          <option value="feedback">Feedback & Suggestions</option>
                          <option value="general">General Inquiry</option>
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
                        placeholder="How can we help you? Please provide details about your inquiry..."
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="newsletter"
                        className="h-4 w-4 text-primary focus:ring-primary"
                      />
                      <label htmlFor="newsletter" className="ml-2 text-sm text-gray-600">
                        I'd like to receive news and special offers from Hotel Maison Blanche
                      </label>
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        className="w-full bg-primary hover:bg-amber-600 text-white py-4 rounded-xl font-semibold text-lg transition-colors hover:shadow-lg"
                      >
                        Send Message
                      </button>
                      <p className="text-gray-500 text-sm mt-3 text-center">
                        We typically respond to inquiries within 24 hours during business days.
                      </p>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Department Contacts */}
            <div className="mt-20">
              <h2 className="text-3xl font-serif font-bold text-center mb-12">
                Contact Specific Departments
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    department: "Reservations",
                    description: "For room bookings, modifications, and cancellations",
                    email: "reservations@maisonblanche.coyah.gn",
                    phone: "+224 123 456 789",
                    icon: "🏨",
                  },
                  {
                    department: "Restaurant",
                    description: "For table reservations and private dining inquiries",
                    email: "restaurant@maisonblanche.coyah.gn",
                    phone: "+224 123 456 780",
                    icon: "🍽️",
                  },
                  {
                    department: "Events & Conferences",
                    description: "For weddings, meetings, and special events",
                    email: "events@maisonblanche.coyah.gn",
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
                Frequently Asked Questions
              </h2>
              <div className="space-y-6 max-w-3xl mx-auto">
                {[
                  {
                    question: "What are your check-in and check-out times?",
                    answer: "Check-in is at 3:00 PM and check-out is at 11:00 AM. Early check-in and late check-out may be available upon request and subject to availability.",
                  },
                  {
                    question: "Do you offer airport transportation?",
                    answer: "Yes, we provide airport transportation services from Conakry International Airport. Please contact our concierge in advance to arrange pickup.",
                  },
                  {
                    question: "Is parking available at the hotel?",
                    answer: "Yes, we offer complimentary secured parking for all hotel guests. Valet parking service is also available.",
                  },
                  {
                    question: "Do you accommodate special dietary requirements?",
                    answer: "Absolutely. Our restaurant can accommodate various dietary needs including vegetarian, vegan, gluten-free, and halal options. Please inform us in advance.",
                  },
                  {
                    question: "What is your cancellation policy?",
                    answer: "Reservations can be cancelled free of charge up to 48 hours before arrival. Late cancellations may incur a one-night charge.",
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
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}