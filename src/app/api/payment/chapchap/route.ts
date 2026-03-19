import { NextResponse } from "next/server";

type ChapChapPaymentMethod =
  | "paycard"
  | "orange_money"
  | "mtn_momo"
  | "visa_mastercard";

type CreateOperationRequest = {
  amount: number;
  currency?: "GNF";
  paymentMethod: ChapChapPaymentMethod;
  phoneNumber?: string;
  customerName: string;
  customerEmail: string;
  bookingReference?: string;
};

function getApiKey() {
  return process.env.CHAPCHAP_API_KEY_TEST || process.env.CHAPCHAP_API_KEY_PRODUCTION;
}

export async function POST(request: Request) {
  try {
    const apiKey = getApiKey();
    const baseUrl = process.env.CHAPCHAP_BASE_URL || "https://chapchappay.com/api";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    if (!apiKey) {
      return NextResponse.json(
        { message: "Clé API Chap Chap Pay manquante côté serveur." },
        { status: 500 }
      );
    }

    const body = (await request.json()) as CreateOperationRequest;
    const amount = Number(body.amount);

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { message: "Le montant du paiement est invalide." },
        { status: 400 }
      );
    }

    if (!body.customerName || !body.customerEmail) {
      return NextResponse.json(
        { message: "Les informations client sont incomplètes." },
        { status: 400 }
      );
    }

    if (
      (body.paymentMethod === "orange_money" || body.paymentMethod === "mtn_momo") &&
      !body.phoneNumber
    ) {
      return NextResponse.json(
        { message: "Le numéro Mobile Money est requis." },
        { status: 400 }
      );
    }

    const orderId = body.bookingReference || `MB-${crypto.randomUUID()}`;
    const notifyUrl = `${siteUrl.replace(/\/$/, "")}/api/payment/webhook`;

    const chapChapPayload = {
      amount,
      order_id: orderId,
      notify_url: notifyUrl,
      currency: body.currency || "GNF",
      payment_method: body.paymentMethod,
      customer: {
        name: body.customerName,
        email: body.customerEmail,
        phone: body.phoneNumber || null,
      },
      metadata: {
        source: "reservation-maison-blanche",
      },
    };

    const chapChapResponse = await fetch(`${baseUrl}/ecommerce/operation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "CCP-Api-Key": apiKey,
      },
      body: JSON.stringify(chapChapPayload),
    });

    const result = await chapChapResponse.json().catch(() => ({}));

    if (!chapChapResponse.ok) {
      return NextResponse.json(
        {
          message:
            result?.message ||
            result?.error ||
            "Impossible de créer l'opération de paiement Chap Chap Pay.",
          providerResponse: result,
        },
        { status: chapChapResponse.status }
      );
    }

    const checkoutUrl =
      result?.payment_url || result?.paymentUrl || result?.checkout_url || result?.checkoutUrl;

    if (!checkoutUrl) {
      return NextResponse.json(
        {
          message: "Opération créée mais lien de paiement introuvable dans la réponse Chap Chap Pay.",
          providerResponse: result,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId,
      checkoutUrl,
      providerResponse: result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Erreur serveur lors de l'initialisation du paiement Chap Chap Pay.",
        error: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 }
    );
  }
}
