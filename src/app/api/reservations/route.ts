import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";
import type { ReservationInsert } from "@/types/database";

type CreateReservationBody = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  checkIn?: string;
  checkOut?: string;
  adults?: number | string;
  children?: number | string;
  roomType?: string;
  totalPrice?: number;
  hotelName?: string;
};

function toPositiveInt(value: number | string | undefined, fallback = 0): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return fallback;
  return Math.floor(parsed);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateReservationBody;

    const firstName = body.firstName?.trim();
    const lastName = body.lastName?.trim();
    const email = body.email?.trim();
    const roomType = body.roomType?.trim();
    const phone = body.phone?.trim() || null;
    const hotelName = body.hotelName?.trim() || "Hôtel Maison Blanche";
    const checkIn = body.checkIn;
    const checkOut = body.checkOut;

    if (!firstName || !lastName || !email || !roomType || !checkIn || !checkOut) {
      return NextResponse.json(
        { message: "Informations de réservation incomplètes." },
        { status: 400 }
      );
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (Number.isNaN(checkInDate.getTime()) || Number.isNaN(checkOutDate.getTime())) {
      return NextResponse.json(
        { message: "Dates de réservation invalides." },
        { status: 400 }
      );
    }

    if (checkOutDate <= checkInDate) {
      return NextResponse.json(
        { message: "La date de départ doit être après la date d'arrivée." },
        { status: 400 }
      );
    }

    const adults = toPositiveInt(body.adults, 1);
    const children = toPositiveInt(body.children, 0);
    const guests = adults + children;

    if (guests <= 0) {
      return NextResponse.json(
        { message: "Le nombre de voyageurs est invalide." },
        { status: 400 }
      );
    }

    const totalPrice = Number(body.totalPrice ?? 0);
    const safeTotalPrice = Number.isFinite(totalPrice) && totalPrice >= 0 ? Math.floor(totalPrice) : 0;

    const reservationData: ReservationInsert = {
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      hotel_name: hotelName,
      room_type: roomType,
      check_in: checkIn,
      check_out: checkOut,
      guests,
      total_price: safeTotalPrice,
      currency: "GNF",
      payment_status: "pending",
      payment_method: null,
      status: "confirmed",
    };

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("reservations")
      .insert(reservationData)
      .select("id")
      .single();

    if (error) {
      return NextResponse.json(
        {
          message: "Impossible d'enregistrer la réservation.",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      reservationId: data.id,
      message: "Demande de réservation enregistrée avec succès.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: "Erreur serveur lors de l'enregistrement de la réservation.",
        error: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 }
    );
  }
}