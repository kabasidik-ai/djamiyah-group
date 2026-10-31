-- Test-only prerequisites missing from the historical baseline. Commit enum
-- additions before migration 003 uses them. No production migration is changed.
ALTER TYPE public.reservation_status_enum ADD VALUE IF NOT EXISTS 'pending';
ALTER TYPE public.reservation_status_enum ADD VALUE IF NOT EXISTS 'awaiting_confirmation';
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS room_id uuid REFERENCES public.rooms(id);
