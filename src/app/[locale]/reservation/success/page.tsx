import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Paiement confirmé — Hôtel Maison Blanche",
  description: "Votre réservation a été reçue. Nous vous contacterons sous peu.",
};

export default function ReservationSuccessPage({
  searchParams,
}: {
  searchParams?: { order_id?: string; operation_id?: string };
}) {
  const orderId = searchParams?.order_id || searchParams?.operation_id;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-16">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center">
        {/* Icône succès */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <svg
            className="h-10 w-10 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Paiement reçu !
        </h1>
        <p className="text-gray-600 mb-1">
          Merci pour votre réservation à l&apos;Hôtel Maison Blanche.
        </p>
        <p className="text-gray-500 text-sm mb-6">
          Notre équipe vous contactera dans les plus brefs délais pour confirmer
          votre séjour.
        </p>

        {orderId && (
          <div className="bg-gray-50 rounded-lg px-4 py-3 mb-6 text-left">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">
              Référence de paiement
            </p>
            <p className="text-sm font-mono text-gray-800 break-all">{orderId}</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Link
            href="/"
            className="block w-full rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 px-6 transition-colors"
          >
            Retour à l&apos;accueil
          </Link>
          <Link
            href="/contact"
            className="block w-full rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium py-3 px-6 transition-colors"
          >
            Nous contacter
          </Link>
        </div>
      </div>

      {/* Logo hôtel */}
      <p className="mt-8 text-xs text-gray-400">
        Hôtel Maison Blanche — Groupe Djamiyah
      </p>
    </main>
  );
}
