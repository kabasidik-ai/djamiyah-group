"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { rooms } from "@/data/content";
import ChapChapPay from "@/components/payment/ChapChapPay";

type PaymentContext = {
  reservationId: string;
  bookingReference: string;
  amount: number;
  nights: number;
  roomName: string;
  customerName: string;
  customerEmail: string;
};

// État du circuit de réservation
type ReservationStep = "form" | "payment" | "done";

export default function ReservationPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"chapchap" | "hotel">("hotel");
  const [step, setStep] = useState<ReservationStep>("form");
  const [submitMessage, setSubmitMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [paymentContext, setPaymentContext] = useState<PaymentContext | null>(null);

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

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const calculateNights = (checkIn = formData.checkIn, checkOut = formData.checkOut) => {
    if (!checkIn || !checkOut) return 0;
    const diffTime = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    if (diffTime <= 0) return 0;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const nights = calculateNights();
  const selectedRoom = rooms.find((room) => room.name === formData.roomType);
  const estimatedTotal =
    selectedRoom && nights > 0 ? selectedRoom.price * nights : 0;

  const isFormValid =
    formData.firstName.trim() !== "" &&
    formData.lastName.trim() !== "" &&
    formData.email.trim() !== "" &&
    formData.phone.trim() !== "" &&
    formData.checkIn !== "" &&
    formData.checkOut !== "" &&
    formData.roomType !== "" &&
    nights > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setSubmitMessage(null);
    setIsSubmitting(true);

    // Capturer les valeurs AVANT tout reset
    const snapshot = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      checkIn: formData.checkIn,
      checkOut: formData.checkOut,
      adults: formData.adults,
      children: formData.children,
      roomType: formData.roomType,
    };

    const currentNights = calculateNights(snapshot.checkIn, snapshot.checkOut);
    const currentRoom = rooms.find((r) => r.name === snapshot.roomType);
    const currentTotal =
      currentRoom && currentNights > 0 ? currentRoom.price * currentNights : 0;
    const wantsChapChap = paymentMethod === "chapchap";

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: snapshot.firstName,
          lastName: snapshot.lastName,
          email: snapshot.email,
          phone: snapshot.phone,
          checkIn: snapshot.checkIn,
          checkOut: snapshot.checkOut,
          adults: snapshot.adults,
          children: snapshot.children,
          roomType: snapshot.roomType,
          totalPrice: currentTotal,
          hotelName: "Hôtel Maison Blanche",
          paymentMethod,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        setSubmitMessage({
          type: "error",
          text:
            result?.message ||
            "Impossible d'envoyer votre demande. Veuillez réessayer.",
        });
        return;
      }

      if (wantsChapChap && result?.reservationId && currentRoom && currentTotal > 0) {
        // Paiement en ligne → afficher le widget ChapChap
        setPaymentContext({
          reservationId: String(result.reservationId),
          bookingReference: `MB-${String(result.reservationId)
            .slice(0, 8)
            .toUpperCase()}`,
          amount: currentTotal,
          nights: currentNights,
          roomName: currentRoom.name,
          customerName: `${snapshot.firstName} ${snapshot.lastName}`.trim(),
          customerEmail: snapshot.email,
        });
        setSubmitMessage({
          type: "success",
          text: "Réservation enregistrée ✓ Finalisez votre paiement ci-dessous.",
        });
        setStep("payment");
      } else {
        // Paiement à l'hôtel → terminé
        setSubmitMessage({
          type: "success",
          text: "Réservation enregistrée avec succès ! Vous paierez à l'hôtel lors de votre arrivée.",
        });
        setStep("done");
      }

      // Reset du formulaire seulement après avoir capturé tout ce dont on a besoin
      setFormData({
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
    } catch {
      setSubmitMessage({
        type: "error",
        text: "Erreur réseau. Vérifiez votre connexion puis réessayez.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChapChapClick = () => {
    if (!formRef.current) return;
    if (!formRef.current.reportValidity()) return;
    formRef.current.requestSubmit();
  };

  const handleNewReservation = () => {
    setStep("form");
    setPaymentContext(null);
    setSubmitMessage(null);
    setPaymentMethod("hotel");
  };

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-[35vh] min-h-[300px] flex items-center justify-center overflow-hidden">
        <Image
          src="/images/heroevent.png"
          alt="Hôtel Maison Blanche"
          fill
          priority
          sizes="100vw"
          className="absolute inset-0 w-full h-full object-cover object-[50%_50%]"
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 text-center">
          <h1 className="text-4xl font-serif font-extrabold text-white drop-shadow-[0_3px_10px_rgba(0,0,0,0.8)] mb-4">
            Réservez votre séjour
          </h1>
          <p className="text-lg text-white max-w-2xl mx-auto font-semibold drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] px-4">
            Réservez votre escapade idéale à l&apos;Hôtel Maison Blanche
          </p>
        </div>
      </section>

      {/* Reservation Form & Details */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">

            {/* ─── ÉTAPE PAIEMENT CHAPCHAP ─── */}
            {step === "payment" && paymentContext && (
              <div className="max-w-2xl mx-auto mb-12">
                {submitMessage && (
                  <div className="mb-6 rounded-lg px-4 py-3 text-sm bg-green-50 text-green-700 border border-green-200">
                    {submitMessage.text}
                  </div>
                )}
                <ChapChapPay
                  amount={paymentContext.amount}
                  nights={paymentContext.nights}
                  roomName={paymentContext.roomName}
                  customerName={paymentContext.customerName}
                  customerEmail={paymentContext.customerEmail}
                  bookingReference={paymentContext.bookingReference}
                  reservationId={paymentContext.reservationId}
                  onError={(message) =>
                    setSubmitMessage({ type: "error", text: message })
                  }
                />
                {submitMessage?.type === "error" && (
                  <div className="mt-4 rounded-lg px-4 py-3 text-sm bg-red-50 text-red-700 border border-red-200">
                    {submitMessage.text}
                  </div>
                )}
                <div className="mt-6 text-center">
                  <button
                    onClick={handleNewReservation}
                    className="text-sm text-gray-500 hover:text-primary underline"
                  >
                    ← Faire une nouvelle réservation
                  </button>
                </div>
              </div>
            )}

            {/* ─── ÉTAPE CONFIRMATION PAIEMENT HÔTEL ─── */}
            {step === "done" && (
              <div className="max-w-2xl mx-auto mb-12 text-center">
                <div className="bg-white rounded-2xl shadow-lg p-10">
                  <div className="text-6xl mb-4">✅</div>
                  <h2 className="text-2xl font-serif font-bold text-gray-900 mb-4">
                    Réservation confirmée !
                  </h2>
                  {submitMessage && (
                    <p className="text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm mb-6">
                      {submitMessage.text}
                    </p>
                  )}
                  <p className="text-gray-600 mb-8">
                    Vous recevrez une confirmation par email sous 24 heures.
                  </p>
                  <button
                    onClick={handleNewReservation}
                    className="bg-primary hover:bg-amber-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Faire une nouvelle réservation
                  </button>
                </div>
              </div>
            )}

            {/* ─── ÉTAPE FORMULAIRE ─── */}
            {step === "form" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Booking Form */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-2xl shadow-lg p-8">
                    <h2 className="text-3xl font-serif font-bold text-gray-900 mb-8">
                      Détails de la réservation
                    </h2>

                    {submitMessage && (
                      <div
                        className={`mb-6 rounded-lg px-4 py-3 text-sm ${
                          submitMessage.type === "success"
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-red-50 text-red-700 border border-red-200"
                        }`}
                      >
                        {submitMessage.text}
                      </div>
                    )}

                    <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
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
                              min={new Date().toISOString().split("T")[0]}
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
                              min={
                                formData.checkIn ||
                                new Date().toISOString().split("T")[0]
                              }
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
                              {[1, 2, 3, 4].map((num) => (
                                <option key={num} value={num}>
                                  {num} adulte{num !== 1 ? "s" : ""}
                                </option>
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
                              {[0, 1, 2, 3, 4].map((num) => (
                                <option key={num} value={num}>
                                  {num} enfant{num !== 1 ? "s" : ""}
                                </option>
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
                            {rooms.map((room) => (
                              <option key={room.id} value={room.name}>
                                {room.name} -{" "}
                                {room.price.toLocaleString("fr-FR")} GNF/nuit
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
                        <textarea
                          name="specialRequests"
                          value={formData.specialRequests}
                          onChange={handleChange}
                          rows={4}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Indiquez vos besoins particuliers, restrictions alimentaires ou demandes spécifiques..."
                        />
                      </div>

                      {/* Payment Method + Submit */}
                      <div className="pt-6">
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-700 mb-3">
                            Mode de paiement *
                          </label>
                          <div className="space-y-3">
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="radio"
                                name="paymentMethod"
                                value="chapchap"
                                checked={paymentMethod === "chapchap"}
                                onChange={() => setPaymentMethod("chapchap")}
                                className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500"
                              />
                              <span className="ml-3 text-gray-700">
                                <strong>Payer maintenant avec Chap Chap Pay</strong>
                                <span className="block text-sm text-gray-500">
                                  Paiement sécurisé par mobile money ou carte bancaire
                                </span>
                              </span>
                            </label>
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="radio"
                                name="paymentMethod"
                                value="hotel"
                                checked={paymentMethod === "hotel"}
                                onChange={() => setPaymentMethod("hotel")}
                                className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500"
                              />
                              <span className="ml-3 text-gray-700">
                                <strong>Payer à l&apos;hôtel</strong>
                                <span className="block text-sm text-gray-500">
                                  Paiement lors de votre arrivée
                                </span>
                              </span>
                            </label>
                          </div>
                        </div>

                        {/* Bouton selon le mode de paiement */}
                        {paymentMethod === "chapchap" ? (
                          <button
                            type="button"
                            onClick={handleChapChapClick}
                            disabled={isSubmitting || !isFormValid}
                            className="w-full bg-orange-500 text-white py-4 px-6 rounded-lg font-semibold hover:bg-orange-600 transition duration-300 disabled:bg-gray-300 disabled:cursor-not-allowed"
                          >
                            {isSubmitting
                              ? "Enregistrement en cours..."
                              : "Continuer vers le paiement →"}
                          </button>
                        ) : (
                          <button
                            type="submit"
                            disabled={isSubmitting || !isFormValid}
                            className="w-full bg-gray-700 text-white py-4 px-6 rounded-lg font-semibold hover:bg-gray-800 transition duration-300 disabled:bg-gray-300 disabled:cursor-not-allowed"
                          >
                            {isSubmitting
                              ? "Envoi en cours..."
                              : "Envoyer la demande de réservation"}
                          </button>
                        )}

                        {!isFormValid && (
                          <p className="text-amber-600 text-xs mt-2 text-center">
                            Veuillez remplir tous les champs obligatoires (*) pour continuer.
                          </p>
                        )}

                        <p className="text-gray-500 text-sm mt-4 text-center">
                          Vous recevrez une confirmation par email sous 24 heures.
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
                        <div className="bg-white p-4 rounded-lg">
                          <h4 className="font-semibold text-gray-900 mb-2">
                            {selectedRoom.name}
                          </h4>
                          <p className="text-gray-600 text-sm mb-3">
                            {selectedRoom.description}
                          </p>
                          <div className="text-primary font-bold text-lg">
                            {selectedRoom.price.toLocaleString("fr-FR")} GNF{" "}
                            <span className="text-gray-500 text-sm">/nuit</span>
                          </div>
                        </div>

                        <div className="bg-white p-4 rounded-lg">
                          <h4 className="font-semibold text-gray-900 mb-3">
                            Durée du séjour
                          </h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Arrivée :</span>
                              <span className="font-medium">
                                {formData.checkIn || "—"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Départ :</span>
                              <span className="font-medium">
                                {formData.checkOut || "—"}
                              </span>
                            </div>
                            <div className="flex justify-between pt-2 border-t">
                              <span className="text-gray-600">Total nuits :</span>
                              <span className="font-medium">
                                {nights} nuit{nights !== 1 ? "s" : ""}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white p-4 rounded-lg">
                          <h4 className="font-semibold text-gray-900 mb-3">
                            Voyageurs
                          </h4>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Adultes :</span>
                              <span className="font-medium">{formData.adults}</span>
                            </div>
                            {formData.children !== "0" && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Enfants :</span>
                                <span className="font-medium">
                                  {formData.children}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {nights > 0 && estimatedTotal > 0 && (
                          <div className="bg-gradient-to-r from-primary to-amber-500 p-4 rounded-lg text-white">
                            <h4 className="font-semibold mb-3">Total estimé</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>
                                  {selectedRoom.price.toLocaleString("fr-FR")} GNF
                                  × {nights} nuit{nights !== 1 ? "s" : ""}
                                </span>
                              </div>
                              <div className="flex justify-between text-lg font-bold pt-2 border-t border-white/20">
                                <span>Total :</span>
                                <span>
                                  {estimatedTotal.toLocaleString("fr-FR")} GNF
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-white/80 mt-3">
                              * Taxes calculées lors de la confirmation
                            </p>
                          </div>
                        )}

                        <div className="text-gray-500 text-sm space-y-2">
                          <p>✓ Annulation gratuite jusqu&apos;à 48h avant l&apos;arrivée</p>
                          <p>✓ Wi-Fi gratuit inclus</p>
                          <p>✓ Petit-déjeuner inclus</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-4">🏨</div>
                        <p className="text-gray-600">
                          Sélectionnez une chambre et des dates pour voir votre
                          récapitulatif
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 bg-secondary text-white rounded-2xl p-6">
                    <h4 className="font-semibold mb-4">Besoin d&apos;aide ?</h4>
                    <p className="text-sm mb-4">
                      Notre équipe est disponible 24h/24 et 7j/7.
                    </p>
                    <div className="space-y-2">
                      <p className="text-sm">📞 +224 610 75 90 90</p>
                      <p className="text-sm">✉️ contact@djamiyah.com</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                    description:
                      "Nous garantissons les meilleurs tarifs en réservant directement chez nous.",
                  },
                  {
                    icon: "✨",
                    title: "Avantages exclusifs",
                    description:
                      "Profitez de surclassements, départ tardif et boissons de bienvenue.",
                  },
                  {
                    icon: "🤝",
                    title: "Service personnalisé",
                    description:
                      "Notre équipe prend en charge toutes vos demandes et préférences.",
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
