-- Migration: Création de la RPC atomique reserve_room
-- À appliquer manuellement dans Supabase SQL Editor
-- NE PAS exécuter automatiquement

CREATE OR REPLACE FUNCTION public.reserve_room(
  p_room_name     text,
  p_first_name    text,
  p_last_name     text,
  p_email         text,
  p_phone         text,
  p_hotel_name    text,
  p_check_in      date,
  p_check_out     date,
  p_guests        integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room          record;
  v_nights        integer;
  v_total_price   integer;
  v_active_count  integer;
  v_reservation   record;
BEGIN
  -- 1. Valider check_in < check_out
  IF p_check_in >= p_check_out THEN
    RETURN jsonb_build_object(
      'ok', false,
      'code', 'INVALID_DATES',
      'message', 'La date de départ doit être après la date d''arrivée.'
    );
  END IF;

  -- 2. Valider check_in >= aujourd'hui
  IF p_check_in < CURRENT_DATE THEN
    RETURN jsonb_build_object(
      'ok', false,
      'code', 'PAST_DATE',
      'message', 'La date d''arrivée ne peut pas être dans le passé.'
    );
  END IF;

  -- 3. Trouver la chambre et verrouiller la ligne (FOR UPDATE)
  SELECT id, name, price_per_night, total_units
    INTO v_room
    FROM rooms
   WHERE name = p_room_name
     AND is_available = true
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'ok', false,
      'code', 'ROOM_NOT_FOUND',
      'message', 'Catégorie de chambre introuvable ou indisponible.'
    );
  END IF;

  -- 4. Calculer le nombre de nuits et le prix total
  v_nights := p_check_out - p_check_in;  -- soustraction de dates = nombre de jours
  v_total_price := v_room.price_per_night * v_nights;

  -- 5. Compter les réservations actives qui chevauchent l'intervalle demandé
  --    Chevauchement : existing.check_in < p_check_out AND existing.check_out > p_check_in
  --    Exclure cancelled et completed
  SELECT count(*)
    INTO v_active_count
    FROM reservations
   WHERE room_type = p_room_name
     AND status NOT IN ('cancelled', 'completed')
     AND check_in::date < p_check_out
     AND check_out::date > p_check_in;

  -- 6. Vérifier la disponibilité
  IF v_active_count >= v_room.total_units THEN
    RETURN jsonb_build_object(
      'ok', false,
      'code', 'NO_AVAILABILITY',
      'message', 'Aucune chambre disponible pour cette catégorie sur les dates sélectionnées.',
      'active_count', v_active_count,
      'total_units', v_room.total_units
    );
  END IF;

  -- 7. Insérer la réservation
  INSERT INTO reservations (
    first_name, last_name, email, phone,
    hotel_name, room_type, room_id,
    check_in, check_out, guests,
    total_price, currency,
    payment_status, payment_method, status
  ) VALUES (
    p_first_name, p_last_name, p_email, p_phone,
    p_hotel_name, p_room_name, v_room.id,
    p_check_in, p_check_out, p_guests,
    v_total_price, 'GNF',
    'pending', NULL, 'confirmed'
  )
  RETURNING id, total_price, currency, status, created_at
  INTO v_reservation;

  -- 8. Retourner le succès
  RETURN jsonb_build_object(
    'ok', true,
    'reservation_id', v_reservation.id,
    'total_price', v_reservation.total_price,
    'currency', v_reservation.currency,
    'status', v_reservation.status,
    'nights', v_nights,
    'price_per_night', v_room.price_per_night,
    'room_name', v_room.name,
    'created_at', v_reservation.created_at
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'ok', false,
      'code', 'INTERNAL_ERROR',
      'message', 'Erreur serveur lors de la réservation.'
    );
END;
$$;

-- Accès : seul le service_role peut appeler cette RPC
-- (les appels viennent du backend Next.js via createServiceRoleClient)
REVOKE ALL ON FUNCTION public.reserve_room FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reserve_room FROM anon;
REVOKE ALL ON FUNCTION public.reserve_room FROM authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_room TO service_role;
