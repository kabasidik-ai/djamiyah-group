"use client";

import { useMemo, useState } from "react";

type ChapChapPaymentMethod =
  | "paycard"
  | "orange_money"
  | "mtn_momo"
  | "visa_mastercard";

export type ChapChapPayPayload = {
  amount: number;
  currency: "GNF";
  paymentMethod: ChapChapPaymentMethod;
  phoneNumber?: string;
  customerName: string;
  customerEmail: string;
  bookingReference?: string;
};

type ChapChapPayProps = {
  amount: number;
  nights: number;
  roomName?: string;
  customerName?: string;
  customerEmail?: string;
  bookingReference?: string;
  onSuccess?: (data: unknown) => void;
  onError?: (message: string) => void;
};

const methodLabels: Record<ChapChapPaymentMethod, string> = {
  paycard: "PayCard",
  orange_money: "Orange Money",
  mtn_momo: "MTN MoMo",
  visa_mastercard: "Visa / Mastercard",
};

export default function ChapChapPay({
  amount,
  nights,
  roomName,
  customerName = "",
  customerEmail = "",
  bookingReference,
  onSuccess,
  onError,
}: ChapChapPayProps) {
  const [paymentMethod, setPaymentMethod] = useState<ChapChapPaymentMethod>("orange_money");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [fullName, setFullName] = useState(customerName);
  const [email, setEmail] = useState(customerEmail);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const formattedAmount = useMemo(() => amount.toLocaleString("fr-FR"), [amount]);
  const isMobileMoney = paymentMethod === "orange_money" || paymentMethod === "mtn_momo";

  const handlePayment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage("");

    if (isMobileMoney && !phoneNumber.trim()) {
      const message = "Veuillez renseigner un numéro Mobile Money valide.";
      setErrorMessage(message);
      onError?.(message);
      return;
    }

    if (!fullName.trim() || !email.trim()) {
      const message = "Veuillez renseigner le nom complet et l'adresse email.";
      setErrorMessage(message);
      onError?.(message);
      return;
    }

    const payload: ChapChapPayPayload = {
      amount,
      currency: "GNF",
      paymentMethod,
      phoneNumber: isMobileMoney ? phoneNumber.trim() : undefined,
      customerName: fullName.trim(),
      customerEmail: email.trim(),
      bookingReference,
    };

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/payment/chapchap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = data?.message || "Le paiement a échoué. Veuillez réessayer.";
        setErrorMessage(message);
        onError?.(message);
        return;
      }

      onSuccess?.(data);

      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl as string;
      }
    } catch {
      const message = "Impossible d'initialiser le paiement pour le moment.";
      setErrorMessage(message);
      onError?.(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-2xl font-serif font-bold text-gray-900">Paiement sécurisé</h3>
      <p className="mt-2 text-sm text-gray-600">
        Finalisez votre réservation avec <span className="font-semibold">Chap Chap Pay</span>.
      </p>

      <div className="mt-5 rounded-xl bg-gray-50 p-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Chambre</span>
          <span className="font-medium text-gray-900">{roomName || "Non sélectionnée"}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
          <span>Nombre de nuits</span>
          <span className="font-medium text-gray-900">{nights}</span>
        </div>
        <div className="mt-3 border-t border-gray-200 pt-3 flex items-center justify-between">
          <span className="text-gray-700 font-medium">Total à payer</span>
          <span className="text-xl font-bold text-primary">{formattedAmount} GNF</span>
        </div>
      </div>

      <form onSubmit={handlePayment} className="mt-6 space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Nom complet</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Votre nom"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Adresse email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="contact@djamiyah.com"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Mode de paiement</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as ChapChapPaymentMethod)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {Object.entries(methodLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {isMobileMoney && (
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Numéro Mobile Money</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="+224 XXX XX XX XX"
              required
            />
          </div>
        )}

        {errorMessage && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting || amount <= 0}
          className="w-full rounded-xl bg-primary px-5 py-3.5 text-white font-semibold transition-colors hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Initialisation du paiement..." : "Payer maintenant"}
        </button>
      </form>
    </div>
  );
}
