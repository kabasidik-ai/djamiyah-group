-- ============================================================
-- INSERTION DES 5 CHAMBRES OFFICIELLES - HÔTEL MAISON BLANCHE
-- Table: public.rooms
-- ============================================================

insert into public.rooms (
  name,
  type,
  price_per_night,
  capacity,
  description,
  features,
  images,
  is_available
)
values
  (
    'Chambre Confort',
    'standard'::room_type_enum,
    20000,
    2,
    'Chambre confortable et élégante, idéale pour un séjour reposant avec les équipements essentiels de qualité.',
    '["Wi-Fi", "Climatisation", "TV écran plat", "Salle de bain privée", "Service en chambre"]'::jsonb,
    array['/images/maison-blanche/chambre-confort.jpg'],
    true
  ),
  (
    'Chambre Premium',
    'premium'::room_type_enum,
    720000,
    2,
    'Chambre premium spacieuse offrant un excellent niveau de confort avec des finitions haut de gamme.',
    '["Wi-Fi", "Climatisation", "TV écran plat", "Mini-bar", "Literie premium"]'::jsonb,
    array['/images/maison-blanche/chambre-premium.jpg'],
    true
  ),
  (
    'Double Premium',
    'premium'::room_type_enum,
    870000,
    4,
    'Grande chambre double premium adaptée aux couples et familles, avec espace généreux et confort supérieur.',
    '["Wi-Fi", "Climatisation", "TV écran plat", "Mini-bar", "Espace salon"]'::jsonb,
    array['/images/maison-blanche/double-premium.jpg'],
    true
  ),
  (
    'Suite Premium',
    'suite'::room_type_enum,
    1070000,
    4,
    'Suite premium raffinée avec espace salon séparé, pensée pour un séjour d''exception.',
    '["Wi-Fi", "Climatisation", "TV écran plat", "Salon séparé", "Service premium"]'::jsonb,
    array['/images/maison-blanche/suite-premium.jpg'],
    true
  ),
  (
    'Suite Prestige',
    'suite'::room_type_enum,
    1620000,
    6,
    'Suite prestige luxueuse avec grands volumes et prestations exclusives pour une expérience haut de gamme.',
    '["Wi-Fi", "Climatisation", "TV écran plat", "Salon séparé", "Prestations VIP"]'::jsonb,
    array['/images/maison-blanche/suite-prestige.jpg'],
    true
  )
on conflict (name)
do update set
  type = excluded.type,
  price_per_night = excluded.price_per_night,
  capacity = excluded.capacity,
  description = excluded.description,
  features = excluded.features,
  images = excluded.images,
  is_available = excluded.is_available,
  updated_at = now();
