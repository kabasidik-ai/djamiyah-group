'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Users, ChevronDown, ChevronUp } from 'lucide-react'
import { rooms, ramaRooms, roomImages, type Room } from '@/data/content'

// ── Types locaux (aucun `any`) ──────────────────────────────────
type Hotel = 'Maison Blanche' | 'Hôtel Rama'
type RoomKind = 'chambre' | 'suite'

type CatalogRoom = Room & {
  hotel: Hotel
  kind: RoomKind
}

type FilterKey = 'all' | 'maison-blanche' | 'rama' | 'chambres' | 'suites'

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Tous' },
  { key: 'maison-blanche', label: 'Maison Blanche' },
  { key: 'rama', label: 'Hôtel Rama' },
  { key: 'chambres', label: 'Chambres' },
  { key: 'suites', label: 'Suites' },
]

const CATALOG: CatalogRoom[] = [
  ...rooms.map((r) => ({
    ...r,
    hotel: 'Maison Blanche' as Hotel,
    kind: (r.slug.startsWith('suite') ? 'suite' : 'chambre') as RoomKind,
  })),
  ...ramaRooms.map((r) => ({
    ...r,
    hotel: 'Hôtel Rama' as Hotel,
    kind: (r.slug.startsWith('suite') ? 'suite' : 'chambre') as RoomKind,
  })),
]

const formatPrice = (price: number) => price.toLocaleString('fr-FR')

// ── Carte chambre ───────────────────────────────────────────────
function RoomCard({ room }: { room: CatalogRoom }) {
  const [expanded, setExpanded] = useState(false)
  const images = roomImages[room.slug] ?? []
  const image = images[0]
  const reserveHref = room.hotel === 'Hôtel Rama' ? '/reservation?hotel=rama' : '/reservation'
  const displayName = room.name.replace('Rama — ', '')

  return (
    <article className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition-shadow duration-300 hover:shadow-xl">
      {/* Image ratio stable 4:3 */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#0D3B3E]/10">
        {image ? (
          <Image
            src={image}
            alt={room.imageAlt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-[#0D3B3E]/50">
            Image à venir
          </div>
        )}

        {/* Badge hôtel */}
        <span
          className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${
            room.hotel === 'Hôtel Rama' ? 'bg-[#F9A03F] text-white' : 'bg-[#0D3B3E] text-white'
          }`}
        >
          {room.hotel === 'Hôtel Rama' ? 'Hôtel Rama' : 'Maison Blanche'}
        </span>

        {/* Compteur images */}
        {images.length > 1 && (
          <span className="absolute right-3 top-3 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white">
            {images.length} photos
          </span>
        )}
      </div>

      {/* Contenu */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="font-serif text-lg font-bold leading-snug text-[#0D3B3E]">
            {displayName}
          </h3>
          <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-[#0D3B3E]/50">
            {room.hotel === 'Hôtel Rama' ? 'Hôtel Rama · Kissidougou' : 'Maison Blanche · Coyah'}
          </p>
        </div>

        {/* Prix */}
        <div className="flex flex-wrap items-baseline gap-1">
          <span className="text-xs text-[#0D3B3E]/60">À partir de</span>
          <span className="font-sans text-xl font-bold text-[#F9A03F]">
            {formatPrice(room.price)} GNF
          </span>
          <span className="text-xs text-[#0D3B3E]/60">/nuit</span>
        </div>

        {/* Description */}
        <p className="line-clamp-2 text-sm text-[#0D3B3E]/70">{room.description}</p>

        {/* Disponibilité */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-[#0D3B3E]/70">
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {room.totalUnits} {room.totalUnits > 1 ? 'unités' : 'unité'}
          </span>
        </div>

        {/* Équipements clés */}
        {room.features.slice(0, 3).length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {room.features.slice(0, 3).map((f) => (
              <li
                key={f}
                className="rounded-full border border-[#0D3B3E]/15 bg-[#F0F6F6] px-2.5 py-1 text-[11px] text-[#0D3B3E]/80"
              >
                {f}
              </li>
            ))}
          </ul>
        )}

        {/* Équipements détaillés (dépliage) */}
        {expanded && room.features.length > 3 && (
          <ul className="grid grid-cols-1 gap-1.5 text-xs text-[#0D3B3E]/70">
            {room.features.slice(3).map((f) => (
              <li key={f} className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#F9A03F]" />
                {f}
              </li>
            ))}
          </ul>
        )}

        {/* Actions */}
        <div className="mt-auto pt-2">
          <Link
            href={reserveHref}
            className="block w-full rounded-xl bg-[#F9A03F] px-4 py-3 text-center text-sm font-bold text-white shadow-md transition-colors hover:bg-[#e28a1f]"
          >
            Réserver
          </Link>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-lg border border-[#0D3B3E]/15 py-2 text-sm font-semibold text-[#0D3B3E] transition-colors hover:border-[#F9A03F] hover:text-[#F9A03F]"
          >
            {expanded ? (
              <>
                Masquer les détails <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                Voir les détails <ChevronDown className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  )
}

// ── Catalogue avec filtres ──────────────────────────────────────
export function RoomCatalog() {
  const [filter, setFilter] = useState<FilterKey>('all')

  const filtered = useMemo(() => {
    switch (filter) {
      case 'maison-blanche':
        return CATALOG.filter((r) => r.hotel === 'Maison Blanche')
      case 'rama':
        return CATALOG.filter((r) => r.hotel === 'Hôtel Rama')
      case 'chambres':
        return CATALOG.filter((r) => r.kind === 'chambre')
      case 'suites':
        return CATALOG.filter((r) => r.kind === 'suite')
      default:
        return CATALOG
    }
  }, [filter])

  return (
    <section>
      {/* Barre de filtres */}
      <div className="flex flex-wrap items-center justify-center gap-2 pb-2">
        {FILTERS.map((f) => {
          const active = filter === f.key
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                active
                  ? 'bg-[#0D3B3E] text-white shadow-sm'
                  : 'border border-[#0D3B3E]/15 bg-white text-[#0D3B3E]/70 hover:border-[#0D3B3E]/40 hover:text-[#0D3B3E]'
              }`}
            >
              {f.label}
            </button>
          )
        })}
      </div>

      {/* Grille responsive : 1 / 2 / 3 cartes */}
      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((room) => (
          <RoomCard key={room.slug} room={room} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-8 text-center text-[#0D3B3E]/60">
          Aucune chambre dans cette catégorie pour le moment.
        </p>
      )}
    </section>
  )
}
