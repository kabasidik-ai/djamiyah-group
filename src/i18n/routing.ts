import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['fr', 'en'],
  defaultLocale: 'fr',
  localePrefix: 'as-needed', // /fr/rooms → /rooms, /en/rooms → /en/rooms
})

export type Locale = (typeof routing.locales)[number]
