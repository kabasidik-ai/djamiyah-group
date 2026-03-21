"use client";

import { useMemo, useState } from "react";
import { z } from "zod";

type ChapChapPaymentMethod =
  | "orange_money"
  | "mtn_momo"
  | "card";

export type ChapChapPayPayload = {
  amount: number;
  currency: "GNF";
  paymentMethod: ChapChapPaymentMethod;
  phoneNumber?: string;
  customerName: string;
  customerEmail: string;
  bookingReference?: string;
  reservationId?: string;
};

type ChapChapPayProps = {
  amount: number;
  nights: number;
  roomName?: string;
  orderId?: string;
  customerName?: string;
  customerEmail?: string;
  bookingReference?: string;
  reservationId?: string;
  onSuccess?: (data: unknown) => void;
  onError?: (message: string) => void;
};

const methodLabels: Record<ChapChapPaymentMethod, string> = {
  orange_money: "Orange Money",
  mtn_momo: "MTN Mobile Money",
  card: "Carte bancaire (Visa / Mastercard)",
};

const paymentSchema = z
  .object({
    amount: z.number().int().positive(),
    customerName: z.string().trim().min(2).max(120),
    customerEmail: z.string().trim().email().max(190),
    paymentMethod: z.enum(["orange_money", "mtn_momo", "card"]),
    phoneNumber: z.string().trim().min(8).max(30).optional(),
  })
  .superRefine((value, ctx) => {
    const isMobileMoney =
      value.paymentMethod === "orange_money" || value.paymentMethod === "mtn_momo";
    if (isMobileMoney && !value.phoneNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["phoneNumber"],
        message: "Le numéro Mobile Money est requis.",
      });
    }
  });

function sanitizeInput(value: string, maxLength: number): string {
  return value
    .normalize("NFKC")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);
}

export default function ChapChapPay({
  amount,
  nights,
  roomName,
  orderId,
  customerName = "",
  customerEmail = "",
  bookingReference,
  reservationId,
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

    const safeName = sanitizeInput(fullName, 120);
    const safeEmail = sanitizeInput(email, 190).toLowerCase();
    const safePhone = isMobileMoney ? sanitizeInput(phoneNumber, 30) : undefined;

    const parsed = paymentSchema.safeParse({
      amount,
      customerName: safeName,
      customerEmail: safeEmail,
      paymentMethod,
      phoneNumber: safePhone,
    });

    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || "Les données de paiement sont invalides.";
      setErrorMessage(message);
      onError?.(message);
      return;
    }

    const payload: ChapChapPayPayload = {
      amount: parsed.data.amount,
      currency: "GNF",
      paymentMethod: parsed.data.paymentMethod,
      phoneNumber: parsed.data.phoneNumber,
      customerName: parsed.data.customerName,
      customerEmail: parsed.data.customerEmail,
      bookingReference: bookingReference || orderId,
      reservationId,
    };

    try {
      setIsSubmitting(true);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30_000);

      const response = await fetch("/api/payment/chapchap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const data = await response.json();

      if (!response.ok) {
        const message = data?.message || "Le paiement a échoué. Veuillez réessayer.";
        setErrorMessage(message);
        onError?.(message);
        return;
      }

      onSuccess?.(data);

      const redirectUrl =
        (data?.payment_url as string | undefined) ||
        (data?.paymentUrl as string | undefined) ||
        (data?.checkout_url as string | undefined) ||
        (data?.checkoutUrl as string | undefined);

      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        const message = "URL de redirection de paiement introuvable.";
        setErrorMessage(message);
        onError?.(message);
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        const message = "Le service de paiement met trop de temps à répondre.";
        setErrorMessage(message);
        onError?.(message);
        return;
      }
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
            <p className="mt-1 text-xs text-gray-500">
              Exemple: +224 6XX XX XX XX
            </p>
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
