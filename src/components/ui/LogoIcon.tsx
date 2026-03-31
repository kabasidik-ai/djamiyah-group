'use client'

import { cn } from '@/lib/utils'

// ─── Couleurs de marque ────────────────────────────────────────────────────────
const TEAL   = '#0D3B3E'
const ORANGE = '#F9A03F'

// ─── Emblème SVG ─────────────────────────────────────────────────────────────
// viewBox "0 0 200 190"
// Composition fidèle au logo source :
//   • Maison teal : cheminée gauche + toit avec avant-toit + corps
//   • Personne blanche : tête (cercle) + corps en œuf/téardrope, sans bras
//   • Main orange : silhouette organique unique — paume ouverte courbée avec pouce gauche

interface IconMarkProps {
  houseColor?:  string
  personColor?: string
  handColor?:   string
  className?:   string
  width?:       number
  height?:      number
}

function IconMark({
  houseColor  = TEAL,
  personColor = 'white',
  handColor   = ORANGE,
  className,
  width  = 48,
  height = 46,
}: IconMarkProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 190"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* ── Cheminée (côté gauche du toit) ── */}
      <rect x="56" y="8" width="16" height="30" rx="3" fill={houseColor} />

      {/* ── Corps de la maison avec avant-toit en saillie ── */}
      {/* Avant-toit : plus large que les murs (eave-left=16, eave-right=184)  */}
      {/* Murs : x=32 à x=168                                                 */}
      <path
        d="M100 32 L184 74 L168 74 L168 150 L32 150 L32 74 L16 74 Z"
        fill={houseColor}
      />

      {/* ── Personne : tête + corps en forme d'œuf, sans bras ── */}
      <circle cx="100" cy="92" r="13" fill={personColor} />
      {/* Corps téardrope : étroit en haut (nuque ≈ y=105), s'élargit vers les hanches */}
      <path
        d="M100 105 C85 108 78 120 78 133 C78 146 88 152 100 152 C112 152 122 146 122 133 C122 120 115 108 100 105 Z"
        fill={personColor}
      />

      {/* ── Main organique unique (paume ouverte portant la maison) ── */}
      {/* Tracé horaire depuis le poignet (bas-gauche) :                        */}
      {/*   gauche ↑ → pouce (bosse arrondie) → paume (arc large) → droite ↓  */}
      <path
        d="
          M 14 182
          C 6 176 3 162 8 148
          C 11 137 19 128 27 124
          C 20 118 17 106 24 98
          C 31 90 49 89 55 100
          C 60 109 61 120 67 126
          C 86 120 136 118 163 123
          C 176 126 185 138 185 152
          C 185 164 178 174 167 179
          C 148 185 88 187 42 185
          Z
        "
        fill={handColor}
      />
    </svg>
  )
}

// ─── Types publics ─────────────────────────────────────────────────────────────

export type LogoVariant = 'default' | 'white' | 'icon-only' | 'stacked'
export type LogoSize    = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface LogoIconProps {
  variant?:     LogoVariant
  size?:        LogoSize
  showSubtitle?: boolean
  className?:   string
}

// Tailles de l'icône (w × h en px) — ratio 200:190 ≈ 1.053
const iconSizes: Record<LogoSize, { w: number; h: number }> = {
  xs: { w: 28, h: 27 },
  sm: { w: 36, h: 34 },
  md: { w: 48, h: 46 },
  lg: { w: 64, h: 61 },
  xl: { w: 80, h: 76 },
}

const textSizes: Record<LogoSize, { name: string; sub: string }> = {
  xs: { name: 'text-[12px]', sub: 'text-[7.5px]' },
  sm: { name: 'text-[14px]', sub: 'text-[8.5px]' },
  md: { name: 'text-[17px]', sub: 'text-[10px]'  },
  lg: { name: 'text-[22px]', sub: 'text-[12px]'  },
  xl: { name: 'text-[28px]', sub: 'text-[14px]'  },
}

export function LogoIcon({
  variant      = 'default',
  size         = 'md',
  showSubtitle = true,
  className,
}: LogoIconProps) {
  const isWhite    = variant === 'white'
  const isIconOnly = variant === 'icon-only'
  const isStacked  = variant === 'stacked'

  const { w, h } = iconSizes[size]
  const { name: nameCls, sub: subCls } = textSizes[size]

  const houseColor  = isWhite ? 'white'  : TEAL
  const personColor = isWhite ? TEAL     : 'white'
  const handColor   = isWhite ? 'rgba(255,255,255,0.88)' : ORANGE

  if (isIconOnly) {
    return (
      <IconMark
        houseColor={houseColor}
        personColor={personColor}
        handColor={handColor}
        width={w}
        height={h}
        className={className}
      />
    )
  }

  if (isStacked) {
    return (
      <div className={cn('flex flex-col items-center gap-1.5', className)}>
        <IconMark
          houseColor={houseColor}
          personColor={personColor}
          handColor={handColor}
          width={w}
          height={h}
        />
        <div className="flex flex-col items-center gap-0.5">
          <span
            className={cn(nameCls, 'font-black tracking-widest leading-none uppercase')}
            style={{ color: isWhite ? 'white' : TEAL, fontFamily: "'Arial Black', 'Arial', sans-serif" }}
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

  // default & white : disposition horizontale
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <IconMark
        houseColor={houseColor}
        personColor={personColor}
        handColor={handColor}
        width={w}
        height={h}
      />
      <div className="flex flex-col justify-center leading-tight">
        <span
          className={cn(nameCls, 'font-black tracking-wider leading-none uppercase')}
          style={{ color: isWhite ? 'white' : TEAL, fontFamily: "'Arial Black', 'Arial', sans-serif" }}
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
