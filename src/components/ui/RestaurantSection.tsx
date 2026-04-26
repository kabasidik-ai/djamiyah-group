'use client'

import { useState } from 'react'
import Link from 'next/link'
import { restaurantMenu, beverages, MenuItem } from '@/data/menu'

interface BadgeProps {
  type: 'populaire' | 'recommande' | 'specialite'
}

function Badge({ type }: BadgeProps) {
  const styles = {
    populaire: 'bg-amber-100 text-amber-700',
    recommande: 'bg-emerald-100 text-emerald-700',
    specialite: 'bg-primary/10 text-primary',
  }

  const labels = {
    populaire: 'Populaire',
    recommande: 'Recommandé',
    specialite: 'Spécialité',
  }

  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[type]}`}>
      {labels[type]}
    </span>
  )
}

interface MenuItemCardProps {
  item: MenuItem
}

function MenuItemCard({ item }: MenuItemCardProps) {
  return (
    <div className="group p-5 rounded-2xl border border-transparent hover:border-[#ECEAE6] hover:bg-[#FAF9F7] transition-all duration-300">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-lg font-semibold text-gray-900">{item.name}</h4>
            {item.badge && <Badge type={item.badge} />}
          </div>
          <p className="text-[#6B7280] text-sm mt-1 leading-relaxed">{item.description}</p>
        </div>
        <div className="text-primary font-bold text-lg whitespace-nowrap">{item.price}</div>
      </div>
    </div>
  )
}

interface CategoryAccordionProps {
  category: (typeof restaurantMenu)[number]
  isActive: boolean
  onToggle: () => void
}

function CategoryAccordion({ category, isActive, onToggle }: CategoryAccordionProps) {
  return (
    <div className="border-b border-[#ECEAE6] last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-6 text-left group"
        aria-expanded={isActive}
      >
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-serif font-semibold text-gray-900 group-hover:text-primary transition-colors">
            {category.category}
          </h3>
          <span className="text-sm text-[#6B7280]">({category.items.length} plats)</span>
        </div>
        <span className="text-xl text-[#6B7280] leading-none">{isActive ? '−' : '+'}</span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isActive ? 'max-h-[1000px] pb-6' : 'max-h-0'
        }`}
      >
        <div className="space-y-1">
          {category.items.map((item, idx) => (
            <MenuItemCard key={idx} item={item} />
          ))}
        </div>
      </div>
    </div>
  )
}

export function RestaurantSection() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [showAllCategories, setShowAllCategories] = useState(false)

  const visibleCategories = showAllCategories ? restaurantMenu : restaurantMenu.slice(0, 4)

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-primary/70 text-sm font-medium uppercase tracking-wider">
            Hôtel Maison Blanche
          </span>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 mt-2 mb-4">
            Notre Restaurant
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Une cuisine raffinee melant saveurs guineennes et internationales, preparee avec des
            ingredients frais et locaux. Ambiance elegante, service attentionne.
          </p>
        </div>

        {/* Menu Accordion */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-serif font-bold text-gray-900">La carte</h3>
            <button
              onClick={() => setShowAllCategories(!showAllCategories)}
              className="text-primary hover:text-primary/80 font-medium text-sm flex items-center gap-1"
            >
              {showAllCategories ? 'Voir moins' : 'Voir toute la carte'}
              <span className="text-base leading-none">{showAllCategories ? '−' : '+'}</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-[#EDEBE7] p-5 md:p-7 shadow-[0_8px_24px_rgba(17,24,39,0.05)]">
            {visibleCategories.map((category) => (
              <CategoryAccordion
                key={category.category}
                category={category}
                isActive={activeCategory === category.category}
                onToggle={() =>
                  setActiveCategory(activeCategory === category.category ? null : category.category)
                }
              />
            ))}
          </div>
        </div>

        {/* Beverages */}
        <div className="mb-12 bg-[#FAF9F7] rounded-3xl p-8 border border-[#ECEAE6]">
          <h3 className="text-lg font-serif font-bold text-gray-900 mb-4">Boissons</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {beverages.map((bev, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center p-4 bg-white rounded-xl border border-[#ECEAE6]"
              >
                <span className="text-[#6B7280] text-sm">{bev.name}</span>
                <span className="text-primary font-semibold text-sm">{bev.price}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <a
            href="/carte-restaurant.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3.5 rounded-full font-semibold transition-colors"
          >
            Telecharger la carte (PDF)
          </a>
          <Link
            href="/reservation"
            className="inline-flex items-center justify-center bg-white border-2 border-primary text-primary hover:bg-primary hover:text-white px-6 py-3.5 rounded-full font-semibold transition-colors"
          >
            Reserver une table
          </Link>
        </div>

        {/* Hours */}
        <div className="text-center">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Horaires du restaurant</h4>
          <p className="text-gray-600 text-sm">
            Petit-dejeuner: 6h30 - 10h | Dejeuner: 12h00 - 15h | Diner: 19h00 - 22h00
          </p>
          <p className="text-amber-600 text-sm mt-2 font-medium">
            Reservation recommandee pour le diner
          </p>
        </div>
      </div>
    </section>
  )
}
