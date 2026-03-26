import { z } from "zod";
import { createServiceRoleClient } from "@/lib/supabase";
import type { Database } from "@/types/database";
import {
  checkRateLimit,
  ensureSameOrigin,
  fetchWithTimeout,
  getClientIp,
  sanitizeText,
  secureJson,
} from "@/lib/chapchap";

export const runtime = "nodejs";

type ChapChapPaymentMethod =
  | "orange_money"
  | "mtn_momo"
  | "card"
  | "paycard"
  | "cc";

type CreateOperationRequest = {
  amount: number;
  currency?: "GNF";
  paymentMethod: ChapChapPaymentMethod;
  phoneNumber?: string;
  customerName: string;
  customerEmail: string;
  orderId?: string;
  notifyUrl?: string;
  returnUrl?: string;
  bookingReference?: string;
  reservationId?: string;
};

const createOperationSchema = z.object({
  amount: z.number().int().positive(),
  currency: z.literal("GNF").optional(),
  paymentMethod: z.enum(["orange_money", "mtn_momo", "card", "paycard", "cc"]),
  phoneNumber: z.string().trim().min(8).max(30).optional(),
  customerName: z.string().trim().min(2).max(120),
  customerEmail: z.string().trim().email().max(190),
  orderId: z.string().trim().max(120).optional(),
  notifyUrl: z.string().url().optional(),
  returnUrl: z.string().url().optional(),
  bookingReference: z.string().trim().max(120).optional(),
  reservationId: z.string().trim().uuid().optional(),
});

function mapPaymentMethod(
  method: ChapChapPaymentMethod
): Database["public"]["Enums"]["payment_method_enum"] {
  if (method === "orange_money") return "orange_money";
  if (method === "mtn_momo") return "mtn_momo";
  return "card";
}

function getApiKey() {
  return process.env.CHAPCHAP_API_KEY_TEST || process.env.CHAPCHAP_API_KEY_PRODUCTION;
}

function buildUrl(base: string | undefined, fallbackPath: string, siteUrl: string) {
  if (base && /^https?:\/\//i.test(base)) return base;
  return `${siteUrl.replace(/\/$/, "")}${fallbackPath}`;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

export function OPTIONS() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return secureJson({}, siteUrl, { status: 204 });
}

export async function POST(request: Request) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  try {
    const ip = getClientIp(request);
    const rate = checkRateLimit("chapchap-create", ip, 100, 60 * 60 * 1000);
    if (!rate.allowed) {
      return secureJson(
        { message: "Trop de requêtes. Veuillez réessayer plus tard." },
        siteUrl,
        { status: 429 }
      );
    }

    if (!ensureSameOrigin(request, siteUrl)) {
      return secureJson({ message: "Requête non autorisée." }, siteUrl, { status: 403 });
    }

    const apiKey = getApiKey();
    const baseUrl = process.env.CHAPCHAP_BASE_URL || "https://chapchappay.com/api";

    if (!apiKey) {
      return secureJson({ message: "Service de paiement indisponible." }, siteUrl, { status: 500 });
    }

    const rawBody = (await request.json()) as CreateOperationRequest;
    const parsed = createOperationSchema.safeParse(rawBody);
    if (!parsed.success) {
      return secureJson({ message: "Données de paiement invalides." }, siteUrl, { status: 400 });
    }

    const body = parsed.data;
    const amount = body.amount;

    const sanitizedName = sanitizeText(body.customerName, 120);
    const sanitizedEmail = sanitizeText(body.customerEmail, 190).toLowerCase();
    const sanitizedPhone = body.phoneNumber ? sanitizeText(body.phoneNumber, 30) : undefined;

    if (
      (body.paymentMethod === "orange_money" || body.paymentMethod === "mtn_momo") &&
      !sanitizedPhone
    ) {
      return secureJson({ message: "Le numéro Mobile Money est requis." }, siteUrl, { status: 400 });
    }

    const orderId = sanitizeText(body.orderId || body.bookingReference || `MB-${crypto.randomUUID()}`, 120);
    const notifyUrl =
      body.notifyUrl ||
      buildUrl(process.env.CHAPCHAP_NOTIFY_URL, "/api/payment/webhook", siteUrl);
    const returnUrl =
      body.returnUrl ||
      buildUrl(process.env.CHAPCHAP_RETURN_URL, "/reservation/success", siteUrl);
    const paymentMethod = mapPaymentMethod(body.paymentMethod);

    if (body.reservationId) {
      const supabase = createServiceRoleClient();
      const { error } = await supabase
        .from("reservations")
        .update({ payment_method: paymentMethod, payment_status: "pending" })
        .eq("id", body.reservationId);

      if (error) {
        console.error("[chapchap] reservation update error", { reservationId: body.reservationId });
      }
    }

    const chapChapPayload = {
      amount,
      order_id: orderId,
      notify_url: notifyUrl,
      return_url: returnUrl,
      currency: body.currency || "GNF",
      payment_method: body.paymentMethod,
      customer: {
        name: sanitizedName,
        email: sanitizedEmail,
        phone: sanitizedPhone || null,
      },
    };

    const payloadString = JSON.stringify(chapChapPayload);

    const chapChapResponse = await fetchWithTimeout(
      `${baseUrl}/ecommerce/create`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "CCP-Api-Key": apiKey,
        },
        body: payloadString,
      },
      30_000
    );

    // Lire le body une seule fois
    const responseText = await chapChapResponse.text().catch(() => "{}");
    let result: Record<string, unknown> = {};
    try {
      result = JSON.parse(responseText) as Record<string, unknown>;
    } catch {
      result = {};
    }

    if (!chapChapResponse.ok) {
      console.error("[chapchap] provider create operation failed", {
        status: chapChapResponse.status,
        body: responseText,
        payload: chapChapPayload,
      });
      return secureJson(
        { message: "Impossible de démarrer le paiement pour le moment." },
        siteUrl,
        { status: 502 }
      );
    }

    const checkoutUrl =
      result?.payment_url || result?.paymentUrl || result?.checkout_url || result?.checkoutUrl;

    if (!checkoutUrl) {
      console.error("[chapchap] provider missing checkout url", { orderId });
      return secureJson(
        { message: "Paiement indisponible. Veuillez réessayer." },
        siteUrl,
        { status: 502 }
      );
    }

    return secureJson({
      success: true,
      order_id: orderId,
      payment_url: checkoutUrl,
    }, siteUrl);
  } catch (error) {
    if (isAbortError(error)) {
      return secureJson(
        { message: "Le service de paiement met trop de temps à répondre." },
        siteUrl,
        { status: 504 }
      );
    }
    console.error("[chapchap] internal error during create operation");
    return secureJson(
      { message: "Erreur serveur lors de l'initialisation du paiement." },
      siteUrl,
      { status: 500 }
    );
  }
}
