-- ============================================================
-- MIGRATION: Ajouter total_units aux chambres
-- Groupe Djamiyah - Hôtel Maison Blanche
-- ============================================================

begin;

-- ─── Ajouter colonne total_units ───────────────────────────────────

alter table public.rooms
add column if not exists total_units integer not null default 1 check (total_units > 0);

-- ─── Mettre à jour les chambres avec les bonnes unités ───────────

-- Chambre Éco Confort (8 unités)
update public.rooms
set 
  total_units = 8,
  description = 'Chambre économique et confortable avec climatisation, TV écran plat et Wi-Fi. Idéal pour les voyageurs soucieux de leur budget.'
where name = 'Chambre Éco Confort';

-- Chambre Confort Jardin (8 unités) - Renommer si nécessaire
update public.rooms
set 
  total_units = 8,
  description = 'Chambre confortable avec vue sur jardin, climatisation et équipements de qualité. Profitez d''un séjour reposant dans un cadre verdoyant.'
where name = 'Chambre Confort';

-- Chambre Premium VIP (5 unités)
update public.rooms
set 
  total_units = 5,
  description = 'Chambre spacieuse premium VIP avec équipements haut de gamme et service personnalisé pour un séjour d''exception.'
where name = 'Chambre Premium';

-- Double Premium (13 unités)
update public.rooms
set 
  total_units = 13,
  description = 'Grande chambre double avec espace généreux, idéale pour couples ou familles. Capacité jusqu''à 4 personnes.'
where name = 'Double Premium';

-- Grande Suite Prestige (3 unités)
update public.rooms
set 
  total_units = 3,
  description = 'Notre suite la plus luxueuse avec grands volumes, salon séparé et services exclusifs. L''expérience ultime du luxe.'
where name = 'Suite Prestige';

-- ─── Vérification ─────────────────────────────────────────────────

select 
  name,
  type,
  price_per_night,
  capacity,
  total_units,
  is_available
from public.rooms
order by price_per_night asc;

commit;

-- ============================================================
-- FIN DE LA MIGRATION
-- ============================================================
