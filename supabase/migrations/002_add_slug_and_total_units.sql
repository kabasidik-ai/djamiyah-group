-- ============================================================
-- MIGRATION 002: Ajout des colonnes slug et total_units
-- ============================================================
-- Date: 2026-04-06
-- Description: Ajoute les colonnes slug (pour URLs) et total_units (nombre d'unités disponibles) à la table rooms
-- ============================================================

begin;

-- Ajouter la colonne slug (nullable temporairement pour migration)
alter table public.rooms
  add column if not exists slug text;

-- Ajouter la colonne total_units avec valeur par défaut
alter table public.rooms
  add column if not exists total_units integer not null default 1 check (total_units > 0);

-- Mettre à jour les slugs pour les chambres existantes
update public.rooms set slug = 'chambre-confort' where name = 'Chambre Confort';
update public.rooms set slug = 'chambre-premium' where name = 'Chambre Premium';
update public.rooms set slug = 'double-premium' where name = 'Double Premium';
update public.rooms set slug = 'suite-premium' where name = 'Suite Premium';
update public.rooms set slug = 'suite-prestige' where name = 'Suite Prestige';

-- Mettre à jour les total_units pour les chambres existantes
-- (valeurs à ajuster selon l'inventaire réel de l'hôtel)
update public.rooms set total_units = 8 where name = 'Chambre Confort';
update public.rooms set total_units = 5 where name = 'Chambre Premium';
update public.rooms set total_units = 13 where name = 'Double Premium';
update public.rooms set total_units = 3 where name = 'Suite Premium';
update public.rooms set total_units = 2 where name = 'Suite Prestige';

-- Maintenant que les données sont migrées, rendre slug NOT NULL et UNIQUE
alter table public.rooms
  alter column slug set not null;

alter table public.rooms
  add constraint rooms_slug_unique unique (slug);

-- Ajouter un index pour améliorer les performances de recherche par slug
create index if not exists idx_rooms_slug on public.rooms(slug);

commit;

-- ============================================================
-- VÉRIFICATION
-- ============================================================

select
  name,
  slug,
  type,
  price_per_night,
  total_units,
  is_available
from public.rooms
order by price_per_night asc;

-- ============================================================
-- FIN DE LA MIGRATION
-- ============================================================
