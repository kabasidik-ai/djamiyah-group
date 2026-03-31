'use client'
import { cn } from '@/lib/utils'

// ─── Types publics ─────────────────────────────────────────────────────────────
export type LogoVariant = 'default' | 'white' | 'icon-only' | 'stacked'
export type LogoSize    = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface LogoIconProps {
  variant?:      LogoVariant
  size?:         LogoSize
  showSubtitle?: boolean
  className?:    string
}

// Tailles icône (w × h en px)
const iconSizes: Record<LogoSize, { w: number; h: number }> = {
  xs: { w: 28,  h: 27 },
  sm: { w: 36,  h: 34 },
  md: { w: 48,  h: 46 },
  lg: { w: 64,  h: 61 },
  xl: { w: 80,  h: 76 },
}

const textSizes: Record<LogoSize, { name: string; sub: string }> = {
  xs: { name: 'text-[12px]', sub: 'text-[7.5px]' },
  sm: { name: 'text-[14px]', sub: 'text-[8.5px]' },
  md: { name: 'text-[17px]', sub: 'text-[10px]'  },
  lg: { name: 'text-[22px]', sub: 'text-[12px]'  },
  xl: { name: 'text-[28px]', sub: 'text-[14px]'  },
}

const TEAL = '#0D3B3E'

export function LogoIcon({
  variant      = 'default',
  size         = 'md',
  showSubtitle = true,
  className,
}: LogoIconProps) {
  const isWhite    = variant === 'white'
  const isIconOnly = variant === 'icon-only'
  const isStacked  = variant === 'stacked'

  const { w, h }                    = iconSizes[size]
  const { name: nameCls, sub: subCls } = textSizes[size]

  // Sélection du fichier SVG selon le contexte (clair ou blanc/footer)
  const logoSrc = isWhite
    ? '/images/logos/LOGOREACTFOOTER.svg'
    : '/images/logos/LOGOREACTHEADER1.svg'

  // ── Icône seule ────────────────────────────────────────────────────────────
  if (isIconOnly) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoSrc}
        width={w}
        height={h}
        alt="Logo Groupe Djamiyah"
        style={{ objectFit: 'contain' }}
        className={className}
      />
    )
  }

  // ── Empilé (stacked) ──────────────────────────────────────────────────────
  if (isStacked) {
    return (
      <div className={cn('flex flex-col items-center gap-1.5', className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={w} height={h} alt="Logo Groupe Djamiyah" style={{ objectFit: 'contain' }} />
        <div className="flex flex-col items-center gap-0.5">
          <span
            className={cn(nameCls, 'font-black tracking-widest leading-none uppercase')}
            style={{ color: isWhite ? 'white' : TEAL, fontFamily: "'Cinzel', serif" }}
          >
            GROUPE DJAMIYAH
          </span>
          {showSubtitle && (
            <span
              className={cn(subCls, 'italic leading-tight')}
              style={{ color: isWhite ? 'rgba(255,255,255,0.72)' : '#4b6061', fontFamily: 'Georgia, serif' }}
            >
              Plus qu&apos;un séjour, une expérience.
            </span>
          )}
        </div>
      </div>
    )
  }

  // ── Horizontal : default & white ─────────────────────────────────────────
  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logoSrc} width={w} height={h} alt="Logo Groupe Djamiyah" style={{ objectFit: 'contain' }} />
      <div className="flex flex-col justify-center leading-tight">
        <span
          className={cn(nameCls, 'font-black tracking-wider leading-none uppercase')}
          style={{ color: isWhite ? 'white' : TEAL, fontFamily: "'Cinzel', serif" }}
        >
          GROUPE DJAMIYAH
        </span>
        {showSubtitle && (
          <span
            className={cn(subCls, 'italic leading-snug mt-0.5')}
            style={{ color: isWhite ? 'rgba(255,255,255,0.68)' : '#4b6061', fontFamily: 'Georgia, serif' }}
          >
            Plus qu&apos;un séjour, une expérience.
          </span>
        )}
      </div>
    </div>
  )
}
