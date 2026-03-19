"use client";

import { useState } from "react";
import Link from "next/link";
import { rooms } from "@/data/content";

export default function ReservationPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    checkIn: "",
    checkOut: "",
    adults: "1",
    children: "0",
    roomType: "",
    specialRequests: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Dans une application réelle, ceci se connecterait à une API de réservation
    alert("Merci pour votre demande de réservation ! Notre équipe vous contactera rapidement pour confirmer votre réservation.");
  };

  const calculateNights = () => {
    if (!formData.checkIn || !formData.checkOut) return 0;
    const checkIn = new Date(formData.checkIn);
    const checkOut = new Date(formData.checkOut);
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const nights = calculateNights();
  const selectedRoom = rooms.find(room => room.name === formData.roomType);
  const estimatedTotal = selectedRoom && nights > 0 ? selectedRoom.price * nights : 0;

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-[35vh] min-h-[300px] flex items-center justify-center overflow-hidden">
        <img
          src="/images/heroevent.png"
          alt="Hôtel Maison Blanche"
          className="absolute inset-0 w-full h-full object-cover object-[50%_50%]"
        />
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative z-10 text-center">
          <h1 className="text-4xl font-serif font-bold text-white mb-4">
            Réservez votre séjour
          </h1>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            Réservez votre escapade idéale à l&apos;Hôtel Maison Blanche
          </p>
        </div>
      </section>

      {/* Reservation Form & Details */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Booking Form */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <h2 className="text-3xl font-serif font-bold text-gray-900 mb-8">
                    Détails de la réservation
                  </h2>

                  <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Personal Information */}
                    <div>
                      <h3 className="text-xl font-semibold mb-6 text-gray-900 border-b pb-2">
                        Informations personnelles
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Prénom *
                          </label>
                          <input
                            type="text"
                            name="firstName"
                            required
                            value={formData.firstName}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Prénom"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Nom *
                          </label>
                          <input
                            type="text"
                            name="lastName"
                            required
                            value={formData.lastName}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Nom"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
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
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Téléphone *
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            required
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="+224 XXX XXX XXX"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Stay Details */}
                    <div>
                      <h3 className="text-xl font-semibold mb-6 text-gray-900 border-b pb-2">
                        Détails du séjour
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Date d&apos;arrivée *
                          </label>
                          <input
                            type="date"
                            name="checkIn"
                            required
                            value={formData.checkIn}
                            onChange={handleChange}
                            min={new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Date de départ *
                          </label>
                          <input
                            type="date"
                            name="checkOut"
                            required
                            value={formData.checkOut}
                            onChange={handleChange}
                            min={formData.checkIn || new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Adultes *
                          </label>
                          <select
                            name="adults"
                            value={formData.adults}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            {[1, 2, 3, 4].map(num => (
                              <option key={num} value={num}>{num} adulte{num !== 1 ? 's' : ''}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Enfants
                          </label>
                          <select
                            name="children"
                            value={formData.children}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            {[0, 1, 2, 3, 4].map(num => (
                              <option key={num} value={num}>{num} enfant{num !== 1 ? 's' : ''}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Room Selection */}
                    <div>
                      <h3 className="text-xl font-semibold mb-6 text-gray-900 border-b pb-2">
                        Sélection de la chambre
                      </h3>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Type de chambre *
                        </label>
                        <select
                          name="roomType"
                          required
                          value={formData.roomType}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="">Sélectionner une chambre</option>
                          {rooms.map(room => (
                            <option key={room.id} value={room.name}>
                              {room.name} - {room.price.toLocaleString("fr-FR")} GNF/nuit
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Special Requests */}
                    <div>
                      <h3 className="text-xl font-semibold mb-6 text-gray-900 border-b pb-2">
                        Demandes particulières
                      </h3>
                      <div>
                        <textarea
                          name="specialRequests"
                          value={formData.specialRequests}
                          onChange={handleChange}
                          rows={4}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Indiquez vos besoins particuliers, restrictions alimentaires ou demandes spécifiques..."
                        />
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-6">
                      <button
                        type="submit"
                        className="w-full bg-primary hover:bg-amber-600 text-white py-4 rounded-xl font-semibold text-lg transition-colors hover:shadow-lg"
                      >
                        Envoyer la demande de réservation
                      </button>
                      <p className="text-gray-500 text-sm mt-4 text-center">
                        Vous recevrez une confirmation par email sous 24 heures.
                        Note : ceci est une demande de réservation. Votre réservation sera confirmée
                        après vérification de la disponibilité des chambres.
                      </p>
                    </div>
                  </form>
                </div>
              </div>

              {/* Booking Summary */}
              <div>
                <div className="bg-gray-50 rounded-2xl p-6 sticky top-6">
                  <h3 className="text-2xl font-serif font-bold text-gray-900 mb-6">
                    Récapitulatif
                  </h3>

                  {selectedRoom ? (
                    <div className="space-y-6">
                      {/* Room Details */}
                      <div className="bg-white p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-2">{selectedRoom.name}</h4>
                        <p className="text-gray-600 text-sm mb-3">{selectedRoom.description}</p>
                        <div className="text-primary font-bold text-lg">
                          {selectedRoom.price.toLocaleString("fr-FR")} GNF <span className="text-gray-500 text-sm">/nuit</span>
                        </div>
                      </div>

                      {/* Stay Duration */}
                      <div className="bg-white p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-3">Durée du séjour</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Arrivée :</span>
                            <span className="font-medium">{formData.checkIn || "Sélectionner une date"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Départ :</span>
                            <span className="font-medium">{formData.checkOut || "Sélectionner une date"}</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t">
                            <span className="text-gray-600">Total nuits :</span>
                            <span className="font-medium">{nights} nuit{nights !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>

                      {/* Guest Count */}
                      <div className="bg-white p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-3">Voyageurs</h4>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Adultes :</span>
                            <span className="font-medium">{formData.adults}</span>
                          </div>
                          {formData.children !== "0" && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Enfants :</span>
                              <span className="font-medium">{formData.children}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Estimated Total */}
                      {nights > 0 && estimatedTotal > 0 && (
                        <div className="bg-gradient-to-r from-primary to-accent p-4 rounded-lg text-white">
                          <h4 className="font-semibold mb-3">Total estimé</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Tarif chambre :</span>
                              <span>{selectedRoom.price.toLocaleString("fr-FR")} GNF × {nights} nuit{nights !== 1 ? 's' : ''}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold pt-2 border-t border-white/20">
                              <span>Total :</span>
                              <span>{estimatedTotal.toLocaleString("fr-FR")} GNF</span>
                            </div>
                          </div>
                          <p className="text-sm text-white/80 mt-3">
                            * Taxes et frais de service seront calculés lors de la confirmation
                          </p>
                        </div>
                      )}

                      {/* Notes */}
                      <div className="text-gray-500 text-sm space-y-2">
                        <p>✓ Annulation gratuite jusqu&apos;à 48h avant l&apos;arrivée</p>
                        <p>✓ Pas de prépaiement requis - paiement à l&apos;hôtel</p>
                        <p>✓ Wi-Fi gratuit et petit-déjeuner inclus</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">🏨</div>
                      <p className="text-gray-600">
                        Sélectionnez une chambre et des dates pour voir votre récapitulatif
                      </p>
                    </div>
                  )}
                </div>

                {/* Contact Info */}
                <div className="mt-6 bg-secondary text-white rounded-2xl p-6">
                  <h4 className="font-semibold mb-4">Besoin d&apos;aide ?</h4>
                  <p className="text-sm mb-4">
                    Notre équipe de réservation est disponible 24h/24 et 7j/7 pour vous aider.
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm">📞 +224 123 456 789</p>
                    <p className="text-sm">✉️ contact@djamiyah.com</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Why Book With Us */}
            <div className="mt-16">
              <h2 className="text-3xl font-serif font-bold text-center mb-12">
                Pourquoi réserver en direct chez nous
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    icon: "🎯",
                    title: "Meilleur prix garanti",
                    description: "Nous garantissons les meilleurs tarifs en réservant directement chez nous.",
                  },
                  {
                    icon: "✨",
                    title: "Avantages exclusifs",
                    description: "Profitez de surclassements, départ tardif et boissons de bienvenue.",
                  },
                  {
                    icon: "🤝",
                    title: "Service personnalisé",
                    description: "Notre équipe prend en charge toutes vos demandes et préférences.",
                  },
                ].map((benefit, idx) => (
                  <div key={idx} className="text-center">
                    <div className="text-5xl mb-4">{benefit.icon}</div>
                    <h3 className="text-xl font-semibold mb-3">{benefit.title}</h3>
                    <p className="text-gray-600">{benefit.description}</p>
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