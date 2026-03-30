import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

// Locale-aware versions of Next.js navigation hooks & components.
// Use these instead of next/navigation and next/link throughout the app.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)
