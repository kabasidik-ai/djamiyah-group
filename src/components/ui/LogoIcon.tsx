'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'

// ─── Types publics ─────────────────────────────────────────────────────────────

export type LogoVariant = 'default' | 'white' | 'icon-only' | 'stacked'
export type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface LogoIconProps {
  variant?: LogoVariant
  size?: LogoSize
  showSubtitle?: boolean
  className?: string
}

// Tailles de l'image logo en px (plus réalistes pour le header)
const imageSizes: Record<LogoSize, { w: number; h: number }> = {
  xs: { w: 60, h: 36 },
  sm: { w: 80, h: 48 },
  md: { w: 100, h: 60 },
  lg: { w: 120, h: 72 },
  xl: { w: 160, h: 96 },
}

const textSizes: Record<LogoSize, { name: string; sub: string }> = {
  xs: { name: 'text-[12px]', sub: 'text-[7.5px]' },
  sm: { name: 'text-[14px]', sub: 'text-[8.5px]' },
  md: { name: 'text-[17px]', sub: 'text-[10px]' },
  lg: { name: 'text-[22px]', sub: 'text-[12px]' },
  xl: { name: 'text-[28px]', sub: 'text-[14px]' },
}

export function LogoIcon({
  variant = 'default',
  size = 'md',
  showSubtitle = true,
  className,
}: LogoIconProps) {
  const isWhite = variant === 'white'
  const isIconOnly = variant === 'icon-only'
  const isStacked = variant === 'stacked'

  const { w, h } = imageSizes[size]
  const { name: nameCls, sub: subCls } = textSizes[size]

  // Choisir le bon logo selon la variante
  const logoSrc = isWhite
    ? '/images/corporate/LOGOREACTFOOTER.svg'
    : '/images/corporate/LOGOREACTHEADER1.svg'

  if (isIconOnly) {
    return (
      <Image
        src={logoSrc}
        alt="Groupe Djamiyah"
        width={w}
        height={h}
        className={cn('object-contain', className)}
        priority
      />
    )
  }

  if (isStacked) {
    return (
      <div className={cn('flex flex-col items-center gap-1.5', className)}>
        <Image
          src={logoSrc}
          alt="Groupe Djamiyah"
          width={w}
          height={h}
          className="object-contain"
          priority
        />
        {showSubtitle && (
          <span
            className={cn(subCls, 'italic leading-tight')}
            style={{
              color: isWhite ? 'rgba(255,255,255,0.72)' : '#4b6061',
              fontFamily: 'Georgia, serif',
            }}
          >
            {'Plus qu\u2019un s\u00e9jour, une exp\u00e9rience.'}
          </span>
        )}
      </div>
    )
  }

  // default & white : logo seul (le texte est déjà dans le SVG)
  return (
    <div className={cn('flex items-center', className)}>
      <Image
        src={logoSrc}
        alt="Groupe Djamiyah"
        width={w}
        height={h}
        className="object-contain max-h-[60px] h-auto w-auto"
        priority
      />
    </div>
  )
}
