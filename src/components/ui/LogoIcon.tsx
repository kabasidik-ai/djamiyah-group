import { cn } from '@/lib/utils'

// ─── Brand colors ──────────────────────────────────────────────────────────────
const TEAL = '#0D3B3E'
const ORANGE = '#F9A03F'

// ─── Icon SVG — viewBox 0 0 200 178 ──────────────────────────────────────────
// Composition : maison (cheminée + avant-toit) · personne (tête + corps œuf)
//               main organique (5 doigts courbés + paume)

interface IconMarkProps {
  houseColor?: string
  personColor?: string
  handColor?: string
  className?: string
  width?: number
  height?: number
}

function IconMark({
  houseColor = TEAL,
  personColor = 'white',
  handColor = ORANGE,
  className,
  width = 48,
  height = 57,
}: IconMarkProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 200 178"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* ── Cheminée (gauche du toit) ── */}
      <rect x="60" y="14" width="13" height="27" rx="2" fill={houseColor} />

      {/* ── Maison avec avant-toit légèrement en saillie ── */}
      <path
        d="M100 32 L181 72 L167 72 L167 144 L33 144 L33 72 L19 72 Z"
        fill={houseColor}
      />

      {/* ── Personne : tête + corps en œuf (pas de bras) ── */}
      <circle cx="100" cy="85" r="11" fill={personColor} />
      {/* Corps en forme d'œuf : étroit en haut (nuque), s'élargit vers les hanches */}
      <path
        d="M100 96 C87 99 81 110 81 120 C81 132 89 138 100 138 C111 138 119 132 119 120 C119 110 113 99 100 96 Z"
        fill={personColor}
      />

      {/* ── Main organique (hospitalité) ── */}
      {/* Auriculaire */}
      <path
        d="M42 152 C40 144 41 133 44 128 C47 122 53 121 57 126 C59 130 58 141 57 152 Z"
        fill={handColor}
      />
      {/* Annulaire */}
      <path
        d="M59 152 C57 142 58 128 62 122 C65 116 72 115 76 120 C79 125 78 140 76 152 Z"
        fill={handColor}
      />
      {/* Majeur */}
      <path
        d="M78 152 C76 140 78 124 83 118 C87 112 95 111 98 117 C101 123 100 139 99 152 Z"
        fill={handColor}
      />
      {/* Index */}
      <path
        d="M101 152 C100 140 102 124 107 118 C111 112 119 112 122 118 C125 124 124 140 123 152 Z"
        fill={handColor}
      />
      {/* Pouce (plus court) */}
      <path
        d="M125 152 C124 144 126 135 130 130 C134 125 141 124 143 130 C146 136 145 145 143 152 Z"
        fill={handColor}
      />
      {/* Paume */}
      <path
        d="M34 152 C30 162 32 173 50 176 C70 178 130 178 150 176 C168 173 170 162 166 152 Z"
        fill={handColor}
      />
    </svg>
  )
}

// ─── Public component ──────────────────────────────────────────────────────────

export type LogoVariant = 'default' | 'white' | 'icon-only' | 'stacked'
export type LogoSize = 'xs' | 'sm' | 'md' | 'lg'

interface LogoIconProps {
  variant?: LogoVariant
  size?: LogoSize
  showSubtitle?: boolean
  className?: string
}

const iconSizes: Record<LogoSize, { w: number; h: number }> = {
  xs: { w: 28, h: 33 },
  sm: { w: 36, h: 43 },
  md: { w: 48, h: 57 },
  lg: { w: 64, h: 76 },
}

const textSizes: Record<LogoSize, { name: string; sub: string }> = {
  xs: { name: 'text-[13px]', sub: 'text-[8px]' },
  sm: { name: 'text-[15px]', sub: 'text-[9px]' },
  md: { name: 'text-[17px]', sub: 'text-[10px]' },
  lg: { name: 'text-[22px]', sub: 'text-[12px]' },
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

  const { w, h } = iconSizes[size]
  const { name: nameCls, sub: subCls } = textSizes[size]

  const houseColor = isWhite ? 'white' : TEAL
  const personColor = isWhite ? TEAL : 'white'
  const handColor = isWhite ? 'rgba(255,255,255,0.85)' : ORANGE

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
      <div className={cn('flex flex-col items-center gap-1', className)}>
        <IconMark
          houseColor={houseColor}
          personColor={personColor}
          handColor={handColor}
          width={w}
          height={h}
        />
        <div className="flex flex-col items-center gap-0.5">
          <span
            className={cn(nameCls, 'font-black tracking-widest leading-tight')}
            style={{ color: isWhite ? 'white' : TEAL, fontFamily: "'Arial Black', Arial, sans-serif" }}
          >
            GROUPE DJAMIYAH
          </span>
          {showSubtitle && (
            <span
              className={cn(subCls, 'italic leading-tight')}
              style={{
                color: isWhite ? 'rgba(255,255,255,0.7)' : '#6b7280',
                fontFamily: 'Georgia, serif',
              }}
            >
              Hôtel Maison Blanche – Coyah
            </span>
          )}
        </div>
      </div>
    )
  }

  // Default & white : disposition horizontale
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <IconMark
        houseColor={houseColor}
        personColor={personColor}
        handColor={handColor}
        width={w}
        height={h}
      />
      <div className="flex flex-col justify-center">
        <span
          className={cn(nameCls, 'font-black tracking-wider leading-tight')}
          style={{ color: isWhite ? 'white' : TEAL, fontFamily: "'Arial Black', Arial, sans-serif" }}
        >
          GROUPE DJAMIYAH
        </span>
        {showSubtitle && (
          <span
            className={cn(subCls, 'italic leading-snug')}
            style={{
              color: isWhite ? 'rgba(255,255,255,0.65)' : '#6b7280',
              fontFamily: 'Georgia, serif',
            }}
          >
            Hôtel Maison Blanche – Coyah
          </span>
        )}
      </div>
    </div>
  )
}
